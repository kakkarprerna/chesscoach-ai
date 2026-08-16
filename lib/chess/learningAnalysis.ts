"use client";

import { AnalyzedGame } from "@/lib/chess/gameHistory";
import {
  GamePattern,
  PuzzleCandidate,
  PatternReferencePosition,
} from "@/lib/chess/learningTypes";
import {
  analyzeGame,
  GameAnalysisResult,
} from "@/lib/chess/analyzeGame";

export interface LearningPuzzle
  extends PuzzleCandidate {
  gameId: string;
  gameLabel: string;
  gameDate: string;
}

export interface LearningPattern
  extends GamePattern {
  gameCount: number;
  gameCoverage: number;
}

export interface LearningAnalysisResult {
  gamesAnalyzed: number;
  puzzles: LearningPuzzle[];
  patterns: LearningPattern[];
}

function severityRank(
  severity: GamePattern["severity"]
): number {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

export async function analyzeLearningGames(
  games: AnalyzedGame[],
  depth = 8,
  onProgress?: (
    completed: number,
    total: number
  ) => void
): Promise<LearningAnalysisResult> {
  if (games.length === 0) {
    return {
      gamesAnalyzed: 0,
      puzzles: [],
      patterns: [],
    };
  }

  const allPuzzles: LearningPuzzle[] = [];

  const patternMap = new Map<
    string,
    LearningPattern & {
      gameIds: Set<string>;
      referencePositions: PatternReferencePosition[];
    }
  >();

  for (
    let gameIndex = 0;
    gameIndex < games.length;
    gameIndex++
  ) {
    const game = games[gameIndex];

    const gameResult: GameAnalysisResult =
      await analyzeGame(
        game.pgn,
        depth,
        (completed, total) => {
          const gameProgress =
            total > 0
              ? completed / total
              : 1;

          const overallProgress =
            ((gameIndex + gameProgress) /
              games.length) *
            100;

          onProgress?.(
            Math.round(overallProgress),
            100
          );
        }
      );

    /*
     * Collect puzzles from this game.
     */
    for (const puzzle of gameResult.puzzles) {
      allPuzzles.push({
        ...puzzle,
        id: `${game.id}-${puzzle.id}`,
        gameId: game.id,
        gameLabel: `${game.white} vs ${game.black}`,
        gameDate: game.date,
      });
    }

    /*
     * Build a lookup of the patterns detected in this game.
     *
     * patternEvidence contains the actual MoveEvaluation
     * that supports each pattern. This is what we use to
     * create real reference positions for the learner.
     */
    const evidenceByPattern = new Map<
      string,
      PatternReferencePosition[]
    >();

    for (const evidence of gameResult.patternEvidence) {
      const move = evidence.move;

      /*
       * Only error moves can be useful reference positions.
       * This also keeps the type aligned with
       * PatternReferencePosition.
       */
      if (
        move.classification !== "inaccuracy" &&
        move.classification !== "mistake" &&
        move.classification !== "blunder"
      ) {
        continue;
      }

      const referencePosition: PatternReferencePosition = {
        gameId: game.id,
        gameLabel: `${game.white} vs ${game.black}`,
        gameDate: game.date,
        moveNumber: move.moveNumber,
        color: move.color,
        fen: move.fenBefore,
        playedMove: move.move,
        bestMove: move.bestMove,
        evaluationLoss: move.evaluationLoss,
        classification: move.classification,
      };

      const existing =
        evidenceByPattern.get(
          evidence.patternId
        );

      if (existing) {
        existing.push(referencePosition);
      } else {
        evidenceByPattern.set(
          evidence.patternId,
          [referencePosition]
        );
      }
    }

    /*
     * Merge this game's detected patterns into the
     * cross-game pattern map.
     */
    for (const pattern of gameResult.patterns) {
      const gameReferences =
        evidenceByPattern.get(pattern.id) ?? [];

      const existing =
        patternMap.get(pattern.id);

      if (!existing) {
        patternMap.set(pattern.id, {
          ...pattern,
          gameCount: 1,
          gameCoverage:
            1 / games.length,
          gameIds: new Set([game.id]),
          referencePositions:
            [...gameReferences]
              .sort(
                (a, b) =>
                  b.evaluationLoss -
                  a.evaluationLoss
              )
              .slice(0, 1),
        });

        continue;
      }

      /*
       * Raw count can accumulate across games.
       */
      existing.count += pattern.count;

      /*
       * A game contributes only once to recurrence.
       */
      if (!existing.gameIds.has(game.id)) {
        existing.gameIds.add(game.id);

        /*
         * Keep the strongest representative position
         * from this newly recurring game.
         */
        const strongestGameReference =
          [...gameReferences].sort(
            (a, b) =>
              b.evaluationLoss -
              a.evaluationLoss
          )[0];

        if (strongestGameReference) {
          existing.referencePositions.push(
            strongestGameReference
          );
        }
      }

      existing.gameCount =
        existing.gameIds.size;

      existing.gameCoverage =
        existing.gameCount /
        games.length;

      /*
       * Preserve the strongest severity seen across
       * all games.
       */
      if (
        severityRank(pattern.severity) >
        severityRank(existing.severity)
      ) {
        existing.severity =
          pattern.severity;
      }
    }
  }

  /*
   * Keep the strongest learning puzzles overall.
   */
  const puzzles = allPuzzles
    .sort(
      (a, b) =>
        b.evaluationLoss -
        a.evaluationLoss
    )
    .slice(0, 8);

  /*
   * A recurring learning pattern should appear
   * across multiple games, not merely multiple moves.
   *
   * Small study sets:
   *   2+ games = recurring
   *
   * Larger study sets:
   *   approximately 20%+ of games = recurring
   */
  const minimumRecurringGames =
    games.length <= 5
      ? 2
      : Math.max(
          3,
          Math.ceil(games.length * 0.2)
        );

  const patterns = Array.from(
    patternMap.values()
  )
    .map(
      ({
        gameIds,
        referencePositions,
        ...pattern
      }) => ({
        ...pattern,
        gameCount: gameIds.size,
        gameCoverage:
          gameIds.size /
          games.length,
        referencePositions:
          referencePositions
            .sort(
              (a, b) =>
                b.evaluationLoss -
                a.evaluationLoss
            )
            .slice(0, 3),
      })
    )
    .filter(
      (pattern) =>
        pattern.gameCount >=
        minimumRecurringGames
    )
    .sort((a, b) => {
      /*
       * First prioritize recurrence across games.
       */
      if (
        b.gameCoverage !==
        a.gameCoverage
      ) {
        return (
          b.gameCoverage -
          a.gameCoverage
        );
      }

      /*
       * Then prioritize severity.
       */
      if (
        severityRank(b.severity) !==
        severityRank(a.severity)
      ) {
        return (
          severityRank(b.severity) -
          severityRank(a.severity)
        );
      }

      /*
       * Finally use supporting evidence.
       */
      return b.count - a.count;
    });

  return {
    gamesAnalyzed: games.length,
    puzzles,
    patterns,
  };
}

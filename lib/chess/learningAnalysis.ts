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
     * A pattern is counted once per game for recurrence
     * purposes, while reference positions come directly
     * from the detector's evidence for that pattern.
     */
    for (const pattern of gameResult.patterns) {
      const existing =
        patternMap.get(pattern.id);


      if (!existing) {
        patternMap.set(pattern.id, {
          ...pattern,
          gameCount: 1,
          gameCoverage:
            1 / games.length,
          gameIds: new Set([game.id]),
          referencePositions: [],
        });

        continue;
      }

      existing.count += pattern.count;

      if (!existing.gameIds.has(game.id)) {
        existing.gameIds.add(game.id);

        /*
         * Keep at most one representative position
         * from each game. This guarantees that the final
         * examples demonstrate recurrence across games.
         */
        // Reference positions will be populated once
        // pattern-specific evidence is exposed by the detector.
      }

      existing.gameCount =
        existing.gameIds.size;

      existing.gameCoverage =
        existing.gameCount /
        games.length;

      if (
        severityRank(pattern.severity) >
        severityRank(existing.severity)
      ) {
        existing.severity =
          pattern.severity;
      }

      /*
       * Reference positions are intentionally left empty
       * until pattern-specific evidence is available.
       */    }

  }

  const puzzles = allPuzzles
    .sort(
      (a, b) =>
        b.evaluationLoss -
        a.evaluationLoss
    )
    .slice(0, 8);

  /*
   * A recurring learning pattern should appear
   * across multiple games, not just multiple moves.
   *
   * For small study sets:
   *   2+ games = recurring
   *
   * For larger study sets:
   *   roughly 20%+ of games = recurring
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
       * This is more meaningful than raw move count.
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
       * If recurrence is similar, prioritize
       * severity.
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

"use client";

import { AnalyzedGame } from "@/lib/chess/gameHistory";
import {
  GamePattern,
  PuzzleCandidate,
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
    }
  >();

  for (
    let gameIndex = 0;
    gameIndex < games.length;
    gameIndex++
  ) {
    const game = games[gameIndex];

    let gameResult: GameAnalysisResult;

    gameResult = await analyzeGame(
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

    for (const pattern of gameResult.patterns) {
      const existing =
        patternMap.get(pattern.id);

      if (!existing) {
        patternMap.set(pattern.id, {
          ...pattern,
          gameCount: 1,
          gameIds: new Set([game.id]),
        });
        continue;
      }

      existing.count += pattern.count;
      existing.gameIds.add(game.id);

      if (
        severityRank(pattern.severity) >
        severityRank(existing.severity)
      ) {
        existing.severity =
          pattern.severity;
      }
    }
  }

  const puzzles = allPuzzles
    .sort(
      (a, b) =>
        b.evaluationLoss -
        a.evaluationLoss
    )
    .slice(0, 8);

  const patterns = Array.from(
    patternMap.values()
  )
    .map(
      ({
        gameIds,
        ...pattern
      }) => ({
        ...pattern,
        gameCount: gameIds.size,
      })
    )
    .sort((a, b) => {
      if (
        severityRank(b.severity) !==
        severityRank(a.severity)
      ) {
        return (
          severityRank(b.severity) -
          severityRank(a.severity)
        );
      }

      return b.gameCount - a.gameCount;
    });

  return {
    gamesAnalyzed: games.length,
    puzzles,
    patterns,
  };
}

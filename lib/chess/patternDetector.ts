import { MoveEvaluation } from "@/lib/chess/moveEvaluation";
import { GamePattern } from "@/lib/chess/learningTypes";

const ERROR_CLASSIFICATIONS = new Set([
  "inaccuracy",
  "mistake",
  "blunder",
]);

function isError(move: MoveEvaluation): boolean {
  return ERROR_CLASSIFICATIONS.has(
    move.classification
  );
}

export function detectGamePatterns(
  moves: MoveEvaluation[]
): GamePattern[] {
  const patterns: GamePattern[] = [];

  if (moves.length === 0) {
    return patterns;
  }

  /*
   * Basic classification counts
   */
  const inaccuracies = moves.filter(
    (move) =>
      move.classification === "inaccuracy"
  ).length;

  const mistakes = moves.filter(
    (move) =>
      move.classification === "mistake"
  ).length;

  const blunders = moves.filter(
    (move) =>
      move.classification === "blunder"
  ).length;

  /*
   * Existing broad patterns
   */
  if (inaccuracies >= 2) {
    patterns.push({
      id: "inaccuracies",
      title: "You had several close calls",
      description:
        "A few moves made your position a little harder than it needed to be.",
      count: inaccuracies,
      severity: "low",
    });
  }

  if (mistakes >= 2) {
    patterns.push({
      id: "mistakes",
      title: "Watch for missed opportunities",
      description:
        "You had multiple moments where a stronger move was available.",
      count: mistakes,
      severity: "medium",
    });
  }

  if (blunders >= 1) {
    patterns.push({
      id: "blunders",
      title: "Slow down before big moves",
      description:
        "At least one move significantly changed the position in your opponent's favour.",
      count: blunders,
      severity: "high",
    });
  }

  /*
   * Pattern 1:
   * Consecutive errors
   *
   * This looks for multiple problematic decisions
   * occurring close together in the game.
   *
   * We deliberately require 2+ consecutive errors
   * rather than treating isolated inaccuracies as a
   * meaningful pattern.
   */
  let currentErrorStreak = 0;
  let longestErrorStreak = 0;

  for (const move of moves) {
    if (isError(move)) {
      currentErrorStreak += 1;
      longestErrorStreak = Math.max(
        longestErrorStreak,
        currentErrorStreak
      );
    } else {
      currentErrorStreak = 0;
    }
  }

  if (longestErrorStreak >= 2) {
    patterns.push({
      id: "error-streak",
      title: "Errors came in clusters",
      description:
        "Several difficult decisions happened one after another. When a position becomes uncomfortable, slowing down and checking your opponent's threats can help prevent one mistake from leading to another.",
      count: longestErrorStreak,
      severity:
        longestErrorStreak >= 3
          ? "high"
          : "medium",
    });
  }

  /*
   * Pattern 2:
   * Opening errors
   *
   * The first 10 plies cover roughly the first
   * five moves for each side.
   */
  const openingMoves = moves.filter(
    (move) => move.moveNumber <= 5
  );

  const openingErrors = openingMoves.filter(
    isError
  ).length;

  if (
    openingMoves.length >= 4 &&
    openingErrors >= 2
  ) {
    patterns.push({
      id: "opening-errors",
      title: "The opening needs more attention",
      description:
        "Several inaccuracies or mistakes appeared early in the game. Reviewing your opening principles and the plans behind your first few moves could make these positions easier to handle.",
      count: openingErrors,
      severity:
        openingErrors >= 3
          ? "medium"
          : "low",
    });
  }

  /*
   * Pattern 3:
   * Late-game errors
   *
   * Move 30+ is treated as the late-game section.
   */
  const lateGameMoves = moves.filter(
    (move) => move.moveNumber >= 30
  );

  const lateGameErrors = lateGameMoves.filter(
    isError
  ).length;

  if (
    lateGameMoves.length >= 4 &&
    lateGameErrors >= 2
  ) {
    patterns.push({
      id: "late-game-errors",
      title: "Your accuracy dropped later in the game",
      description:
        "Several inaccuracies or mistakes appeared after move 30. Reviewing your decision-making in longer positions may help you stay precise as the game progresses.",
      count: lateGameErrors,
      severity:
        lateGameErrors >= 3
          ? "medium"
          : "low",
    });
  }

  return patterns;
}

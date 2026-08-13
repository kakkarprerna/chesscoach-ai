import { MoveEvaluation } from "@/lib/chess/moveEvaluation";
import { GamePattern } from "@/lib/chess/learningTypes";

export function detectGamePatterns(
  moves: MoveEvaluation[]
): GamePattern[] {
  const patterns: GamePattern[] = [];

  const inaccuracies = moves.filter(
    (move) => move.classification === "inaccuracy"
  ).length;

  const mistakes = moves.filter(
    (move) => move.classification === "mistake"
  ).length;

  const blunders = moves.filter(
    (move) => move.classification === "blunder"
  ).length;

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

  return patterns;
}

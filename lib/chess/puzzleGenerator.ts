import { MoveEvaluation } from "@/lib/chess/moveEvaluation";
import { PuzzleCandidate } from "@/lib/chess/learningTypes";

type PuzzleClassification =
  | "inaccuracy"
  | "mistake"
  | "blunder";

function isPuzzleMove(
  move: MoveEvaluation
): boolean {
  return (
    move.classification === "inaccuracy" ||
    move.classification === "mistake" ||
    move.classification === "blunder"
  );
}

function getPuzzleClassification(
  move: MoveEvaluation
): PuzzleClassification {
  if (
    move.classification !== "inaccuracy" &&
    move.classification !== "mistake" &&
    move.classification !== "blunder"
  ) {
    throw new Error("Move is not a puzzle candidate.");
  }

  return move.classification;
}

function getPuzzleQuestion(
  classification: PuzzleClassification
): string {
  if (classification === "blunder") {
    return "Can you find the move that keeps you out of trouble?";
  }

  if (classification === "mistake") {
    return "Can you find a stronger move here?";
  }

  return "Can you find a slightly better move?";
}

export function generatePuzzleCandidates(
  moves: MoveEvaluation[]
): PuzzleCandidate[] {
  const puzzleMoves = moves
    .filter(isPuzzleMove)
    .sort(
      (a, b) =>
        b.evaluationLoss - a.evaluationLoss
    )
    .slice(0, 5);

  return puzzleMoves.map(
    (move, index): PuzzleCandidate => ({
      id: `puzzle-${move.moveNumber}-${move.color}-${index}`,
      moveNumber: move.moveNumber,
      color: move.color,

      // IMPORTANT:
      // The puzzle starts before the child made the mistake.
      fen: move.fenBefore,

      playedMove: move.move,
      bestMove: move.bestMove,

      classification:
        getPuzzleClassification(move),

      evaluationLoss:
        move.evaluationLoss,

      question:
        getPuzzleQuestion(
          getPuzzleClassification(move)
        ),

      explanation:
        move.explanation,
    })
  );
}

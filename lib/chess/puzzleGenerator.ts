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
    throw new Error(
      "Move is not a puzzle candidate."
    );
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

function getWhyItMatters(
  classification: PuzzleClassification,
  playedMove: string,
  bestMove: string,
  evaluationLoss: number
): string {
  if (classification === "blunder") {
    return `${playedMove} caused a significant drop in position quality. The stronger ${bestMove} was worth finding because the difference was about ${evaluationLoss.toFixed(
      1
    )} evaluation points.`;
  }

  if (classification === "mistake") {
    return `${playedMove} noticeably reduced the quality of your position. Finding ${bestMove} would have kept more of the position's potential.`;
  }

  return `${playedMove} was playable, but ${bestMove} was more precise and preserved more of the position's potential.`;
}

function getCoachingLesson(
  classification: PuzzleClassification
): string {
  if (classification === "blunder") {
    return "Before committing to a move, slow down and check your opponent's forcing responses: checks, captures, and threats.";
  }

  if (classification === "mistake") {
    return "When a position feels playable, compare your first idea with your opponent's strongest response before committing.";
  }

  return "When you have a choice between several playable moves, look for the move that is most active, precise, and resilient to your opponent's reply.";
}

/**
 * Build a short continuation from the moves that
 * actually followed this position in the game.
 *
 * We include the coach's recommended move first,
 * followed by up to three subsequent game moves.
 *
 * This gives the learner a concrete 3–4 move sequence
 * without inventing engine variations.
 */
function buildSolutionLine(
  moves: MoveEvaluation[],
  puzzleMove: MoveEvaluation
): string[] {
  // The stored best move is the only move we can
  // currently guarantee is part of the engine solution.
  //
  // Do not append the game's actual continuation here:
  // after the player chooses a different move, those
  // subsequent moves may no longer be legal or relevant
  // after the recommended move.
  return puzzleMove.bestMove
    ? [puzzleMove.bestMove]
    : [];
}

export function generatePuzzleCandidates(
  moves: MoveEvaluation[]
): PuzzleCandidate[] {
  const puzzleMoves = moves
    .filter(isPuzzleMove)
    .sort(
      (a, b) =>
        b.evaluationLoss -
        a.evaluationLoss
    )
    .slice(0, 5);

  return puzzleMoves.map(
    (move, index): PuzzleCandidate => ({
      id: `puzzle-${move.moveNumber}-${move.color}-${index}`,

      moveNumber: move.moveNumber,
      color: move.color,

      // Puzzle starts before the mistake.
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

      whyItMatters:
        getWhyItMatters(
          getPuzzleClassification(move),
          move.move,
          move.bestMove,
          move.evaluationLoss
        ),

      coachingLesson:
        getCoachingLesson(
          getPuzzleClassification(move)
        ),

      solutionLine:
        buildSolutionLine(
          moves,
          move
        ),
    })
  );
}
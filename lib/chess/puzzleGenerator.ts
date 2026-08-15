import { Chess } from "chess.js";
import {
  MoveEvaluation,
} from "@/lib/chess/moveEvaluation";
import {
  PuzzleCandidate,
} from "@/lib/chess/learningTypes";

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

function uciToSan(
  fen: string,
  uciMove: string
): string {
  if (!uciMove || uciMove.length < 4) {
    return uciMove;
  }

  try {
    const game = new Chess(fen);

    const move = game.move({
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2, 4),
      promotion: uciMove[4] as
        | "q"
        | "r"
        | "b"
        | "n"
        | undefined,
    });

    return move.san;
  } catch {
    return uciMove;
  }
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
 * Convert a Stockfish principal variation from UCI
 * coordinates into SAN moves.
 *
 * Each move is played on the temporary board before
 * converting the next move, so captures, checks,
 * promotions and disambiguation are handled correctly.
 */
function principalVariationToSan(
  fen: string,
  principalVariation: string[]
): string[] {
  if (
    !fen ||
    principalVariation.length === 0
  ) {
    return [];
  }

  try {
    const game = new Chess(fen);
    const sanMoves: string[] = [];

    for (
      const uciMove of principalVariation
    ) {
      if (!uciMove || uciMove.length < 4) {
        break;
      }

      const move = game.move({
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        promotion: uciMove[4] as
          | "q"
          | "r"
          | "b"
          | "n"
          | undefined,
      });

      if (!move) {
        break;
      }

      sanMoves.push(move.san);
    }

    return sanMoves;
  } catch {
    return [];
  }
}

/**
 * Build a short engine continuation.
 *
 * The principal variation comes directly from
 * Stockfish at the puzzle position. We deliberately
 * avoid using the game's original continuation because
 * it may no longer be relevant after the recommended
 * move is played.
 */
function buildSolutionLine(
  puzzleMove: MoveEvaluation
): string[] {
  const rawLine =
    puzzleMove.principalVariation ?? [];

  const sanLine =
    principalVariationToSan(
      puzzleMove.fenBefore,
      rawLine
    );

  /*
   * Keep the coaching experience focused.
   * The first move is the answer; the following
   * moves show the immediate engine continuation.
   */
  return sanLine.slice(0, 5);
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
        buildSolutionLine(move),
    })
  );
}

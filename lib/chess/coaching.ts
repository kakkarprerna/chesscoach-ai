"use client";

import { Chess } from "chess.js";
import {
  MoveClassification,
  MoveEvaluation,
} from "@/lib/chess/moveEvaluation";

interface CoachingContext {
  playedMove: string;
  bestMove: string;
  classification: MoveClassification;
  evaluationLoss: number;
}

function getMoveFlags(
  fen: string,
  san: string
): {
  isCapture: boolean;
  givesCheck: boolean;
} {
  const game = new Chess(fen);

  try {
    const move = game.move(san);

    return {
      isCapture: Boolean(move?.captured),
      givesCheck: Boolean(move?.san?.includes("+") || move?.san?.includes("#")),
    };
  } catch {
    return {
      isCapture: false,
      givesCheck: false,
    };
  }
}

function getBestMoveFlags(
  fen: string,
  bestMove: string
): {
  isCapture: boolean;
  givesCheck: boolean;
} {
  return getMoveFlags(fen, bestMove);
}

function getMaterialValue(pieceType: string): number {
  switch (pieceType) {
    case "p":
      return 1;
    case "n":
    case "b":
      return 3;
    case "r":
      return 5;
    case "q":
      return 9;
    case "k":
      return 0;
    default:
      return 0;
  }
}

function getMaterialBalance(game: Chess): number {
  let balance = 0;

  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue;

      const value = getMaterialValue(piece.type);

      balance += piece.color === "w" ? value : -value;
    }
  }

  return balance;
}

function getForcingMoves(
  fen: string
): {
  checks: string[];
  captures: string[];
} {
  const game = new Chess(fen);

  const checks: string[] = [];
  const captures: string[] = [];

  for (const move of game.moves({ verbose: true })) {
    if (move.captured) {
      captures.push(move.san);
    }

    try {
      const testGame = new Chess(fen);

      const played = testGame.move({
        from: move.from,
        to: move.to,
        ...(move.promotion
          ? { promotion: move.promotion }
          : {}),
      });

      if (
        played?.san?.includes("+") ||
        played?.san?.includes("#")
      ) {
        checks.push(played.san);
      }
    } catch {
      // Ignore moves that cannot be reconstructed.
    }
  }

  return {
    checks,
    captures,
  };
}

export function generateCoachingExplanation(
  move: MoveEvaluation
): string {
  const context: CoachingContext = {
    playedMove: move.move,
    bestMove: move.bestMove,
    classification: move.classification,
    evaluationLoss: move.evaluationLoss,
  };

  if (context.classification === "best") {
    return `Excellent choice. ${context.playedMove} matched Stockfish's preferred move.`;
  }

  if (context.classification === "good") {
    return `Solid move. ${context.playedMove} kept most of the position's value, although ${context.bestMove} was slightly more precise.`;
  }

  const beforeGame = new Chess(move.fenBefore);

  const playedFlags = getMoveFlags(
    move.fenBefore,
    move.move
  );

  const bestFlags = getBestMoveFlags(
    move.fenBefore,
    move.bestMove
  );

  const forcingMoves = getForcingMoves(
    move.fenBefore
  );

  let afterGame: Chess | null = null;

  try {
    afterGame = new Chess(move.fenBefore);
    afterGame.move(move.move);
  } catch {
    afterGame = null;
  }

  /*
   * If the player had a forcing move available but played
   * something else, make that the first coaching signal.
   */
  if (
    forcingMoves.checks.length > 0 &&
    !playedFlags.givesCheck &&
    bestFlags.givesCheck
  ) {
    return `You missed a forcing opportunity. ${move.bestMove} gives check, while ${move.move} does not. When you have a forcing move available, check it first before choosing a quieter continuation.`;
  }

  /*
   * If Stockfish recommends a capture and the player
   * did not capture, highlight the missed material opportunity.
   */
  if (
    bestFlags.isCapture &&
    !playedFlags.isCapture
  ) {
    return `There was a concrete opportunity to win or recover material. Stockfish preferred ${move.bestMove}, a capture, instead of ${move.move}. Before moving on, scan the board for forcing captures.`;
  }

  /*
   * If the player captured but Stockfish chose a
   * different move, avoid claiming the capture was
   * definitely bad for a specific tactical reason.
   */
  if (
    playedFlags.isCapture &&
    !bestFlags.isCapture
  ) {
    return `The capture ${move.move} was tempting, but it was not the most accurate continuation. Stockfish preferred ${move.bestMove}. Before capturing, check what you gain and what your opponent can do immediately afterward.`;
  }

  /*
   * Detect whether the move leaves the player's king
   * in check. This is a concrete tactical signal.
   */
  if (afterGame && afterGame.inCheck()) {
    return `Your move ${move.move} left your king in check. Before committing to a move, make a quick safety check: can your opponent give check or create a direct threat after it?`;
  }

  /*
   * If there were captures available before the move,
   * remind the player to examine forcing moves first.
   */
  if (
    forcingMoves.captures.length > 0 &&
    context.classification !== "inaccuracy"
  ) {
    return `There was a forcing capture available in the position. Stockfish preferred ${move.bestMove} over ${move.move}. A useful habit is to check checks, captures, and threats before making a quieter move.`;
  }

  /*
   * Material-aware fallback. We only use this when the
   * material balance actually changed.
   */
  if (afterGame) {
    const beforeMaterial =
      getMaterialBalance(beforeGame);

    const afterMaterial =
      getMaterialBalance(afterGame);

    const materialChange =
      Math.abs(afterMaterial - beforeMaterial);

    if (materialChange > 0) {
      return `This move changed the material balance, but Stockfish preferred ${move.bestMove}. Before making a trade or capture, compare what you gain with what your opponent gets in return.`;
    }
  }

  /*
   * Safe general explanation when the concrete board
   * signals above do not explain the evaluation loss.
   */
  if (context.classification === "inaccuracy") {
    return `${move.move} was playable, but ${move.bestMove} was more precise. This is a good position to revisit and compare the two moves before your next game.`;
  }

  if (context.classification === "mistake") {
    return `${move.move} noticeably reduced the quality of your position. Stockfish preferred ${move.bestMove}. Before committing to a move like this, pause and check your opponent's strongest reply.`;
  }

  return `${move.move} was a major turning point. Stockfish preferred ${move.bestMove}, and the position changed by about ${move.evaluationLoss.toFixed(
    1
  )} points. This is one of the most useful moments to study from the game.`;
}

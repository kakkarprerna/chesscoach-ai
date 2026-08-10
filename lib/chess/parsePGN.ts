import { Chess } from "chess.js";

export interface ParsedGame {
  white: string;
  black: string;
  result: string;
  event: string;
  date: string;
  moveCount: number;
  opening: string;
}

export function parsePGN(pgn: string): ParsedGame {
  const game = new Chess();

  game.loadPgn(pgn);

  const headers = game.getHeaders();

  const history = game.history();

  return {
    white: headers.White || "Unknown",
    black: headers.Black || "Unknown",
    result: headers.Result || "*",
    event: headers.Event || "Unknown event",
    date: headers.Date || "",
    moveCount: history.length,
    opening: identifyOpening(history),
  };
}

function identifyOpening(moves: string[]): string {
  const openingMoves = moves.slice(0, 6).join(" ");

  if (
    openingMoves.startsWith("e4 e5 Nf3 Nc6 Bb5")
  ) {
    return "Ruy Lopez";
  }

  if (
    openingMoves.startsWith("e4 e5 Nf3 Nc6 Bc4")
  ) {
    return "Italian Game";
  }

  if (
    openingMoves.startsWith("e4 c5")
  ) {
    return "Sicilian Defense";
  }

  if (
    openingMoves.startsWith("e4 e6")
  ) {
    return "French Defense";
  }

  if (
    openingMoves.startsWith("e4 c6")
  ) {
    return "Caro-Kann Defense";
  }

  if (
    openingMoves.startsWith("d4 d5 c4")
  ) {
    return "Queen's Gambit";
  }

  if (
    openingMoves.startsWith("d4 Nf6 c4 g6")
  ) {
    return "King's Indian Defense";
  }

  if (
    openingMoves.startsWith("d4 Nf6 c4 e6")
  ) {
    return "Queen's Indian / Nimzo-Indian family";
  }

  return "Opening not yet identified";
}
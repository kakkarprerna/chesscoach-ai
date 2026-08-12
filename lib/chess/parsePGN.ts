import { Chess } from "chess.js";

export interface ParsedGame {
  white: string;
  black: string;
  result: string;
  event: string;
  date: string;
  moveCount: number;
  opening: string;
  variation: string;
  eco: string;
}

export function parsePGN(pgn: string): ParsedGame {
  const game = new Chess();

  const cleanPgn = pgn.trim();

  if (!cleanPgn) {
    throw new Error("No PGN provided.");
  }

  try {
    game.loadPgn(cleanPgn);
  } catch (error) {
    console.error("PGN parsing failed:", error);
    console.error("PGN received by parser:", cleanPgn);

    throw new Error(
      error instanceof Error
        ? error.message
        : "Invalid PGN."
    );
  }

  const headers = game.getHeaders();
  const history = game.history();

  return {
    white: headers.White || "Unknown",
    black: headers.Black || "Unknown",
    result: headers.Result || "*",
    event: headers.Event || "Unknown Event",
    date: headers.Date || "Unknown Date",
    moveCount: history.length,
    opening: headers.Opening || "Unknown",
    variation: headers.Variation || "",
    eco: headers.ECO || "",
  };
}
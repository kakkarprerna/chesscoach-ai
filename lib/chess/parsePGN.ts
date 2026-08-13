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

export function sanitizePGN(pgn: string): string {
  let cleanPgn = pgn
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  // Remove brace comments, including Lichess engine annotations.
  cleanPgn = cleanPgn.replace(/\{[^}]*\}/g, " ");

  // Remove recursive parenthesized variations.
  // Repeat because chess variations can be nested.
  let previous = "";

  while (previous !== cleanPgn) {
    previous = cleanPgn;
    cleanPgn = cleanPgn.replace(/\([^()]*\)/g, " ");
  }

  // Remove NAG annotations such as $1, $2, etc.
  cleanPgn = cleanPgn.replace(/\$\d+/g, " ");

  // Normalize whitespace.
  cleanPgn = cleanPgn.replace(/\s+/g, " ").trim();

  return cleanPgn;
}

export function parsePGN(pgn: string): ParsedGame {
  const cleanPgn = sanitizePGN(pgn);

  const game = new Chess();

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
    white: headers.White || "White",
    black: headers.Black || "Black",
    result: headers.Result || "*",
    event: headers.Event || "Chess Game",
    date: headers.Date || "",
    moveCount: history.length,
    opening: headers.Opening || "Unknown opening",
    variation: headers.Variation || "",
    eco: headers.ECO || "",
  };
}

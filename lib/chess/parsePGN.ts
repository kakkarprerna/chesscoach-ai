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

interface OpeningMatch {
  opening: string;
  variation: string;
  eco: string;
}

export function parsePGN(pgn: string): ParsedGame {
  const game = new Chess();

  game.loadPgn(pgn);

  const headers = game.getHeaders();
  const history = game.history();

  const opening = identifyOpening(history);

  return {
    white: headers.White || "Unknown",
    black: headers.Black || "Unknown",
    result: headers.Result || "*",
    event: headers.Event || "Unknown event",
    date: headers.Date || "",
    moveCount: history.length,
    opening: opening.opening,
    variation: opening.variation,
    eco: opening.eco,
  };
}

function identifyOpening(moves: string[]): OpeningMatch {
  const moveString = moves.join(" ");

  /*
   * Ruy Lopez
   */
  if (moveString.startsWith("e4 e5 Nf3 Nc6 Bb5")) {
    if (
      moveString.startsWith(
        "e4 e5 Nf3 Nc6 Bb5 a6"
      )
    ) {
      return {
        opening: "Ruy Lopez",
        variation: "Morphy Defense",
        eco: "C60",
      };
    }

    if (
      moveString.startsWith(
        "e4 e5 Nf3 Nc6 Bb5 Nf6"
      )
    ) {
      return {
        opening: "Ruy Lopez",
        variation: "Berlin Defense",
        eco: "C65",
      };
    }

    if (
      moveString.startsWith(
        "e4 e5 Nf3 Nc6 Bb5 f5"
      )
    ) {
      return {
        opening: "Ruy Lopez",
        variation: "Schliemann Defense",
        eco: "C63",
      };
    }

    return {
      opening: "Ruy Lopez",
      variation: "Main Line",
      eco: "C60",
    };
  }

  /*
   * Italian Game
   */
  if (moveString.startsWith("e4 e5 Nf3 Nc6 Bc4")) {
    if (
      moveString.startsWith(
        "e4 e5 Nf3 Nc6 Bc4 Bc5"
      )
    ) {
      return {
        opening: "Italian Game",
        variation: "Giuoco Piano",
        eco: "C50",
      };
    }

    if (
      moveString.startsWith(
        "e4 e5 Nf3 Nc6 Bc4 Nf6"
      )
    ) {
      return {
        opening: "Italian Game",
        variation: "Two Knights Defense",
        eco: "C55",
      };
    }

    return {
      opening: "Italian Game",
      variation: "Main Line",
      eco: "C50",
    };
  }

  /*
   * Sicilian Defense
   */
  if (moveString.startsWith("e4 c5")) {
    if (
      moveString.startsWith(
        "e4 c5 Nf3 d6"
      )
    ) {
      return {
        opening: "Sicilian Defense",
        variation: "Classical setup",
        eco: "B50",
      };
    }

    if (
      moveString.startsWith(
        "e4 c5 Nf3 Nc6"
      )
    ) {
      return {
        opening: "Sicilian Defense",
        variation: "Open Sicilian",
        eco: "B30",
      };
    }

    if (
      moveString.startsWith(
        "e4 c5 Nf3 e6"
      )
    ) {
      return {
        opening: "Sicilian Defense",
        variation: "Paulsen / Kan family",
        eco: "B40",
      };
    }

    return {
      opening: "Sicilian Defense",
      variation: "Main Line",
      eco: "B20",
    };
  }

  /*
   * French Defense
   */
  if (moveString.startsWith("e4 e6")) {
    if (
      moveString.startsWith(
        "e4 e6 d4 d5 Nc3"
      )
    ) {
      return {
        opening: "French Defense",
        variation: "Classical / Winawer family",
        eco: "C10",
      };
    }

    if (
      moveString.startsWith(
        "e4 e6 d4 d5 e5"
      )
    ) {
      return {
        opening: "French Defense",
        variation: "Advance Variation",
        eco: "C02",
      };
    }

    return {
      opening: "French Defense",
      variation: "Main Line",
      eco: "C00",
    };
  }

  /*
   * Caro-Kann
   */
  if (moveString.startsWith("e4 c6")) {
    if (
      moveString.startsWith(
        "e4 c6 d4 d5 e5"
      )
    ) {
      return {
        opening: "Caro-Kann Defense",
        variation: "Advance Variation",
        eco: "B12",
      };
    }

    if (
      moveString.startsWith(
        "e4 c6 d4 d5 Nc3"
      )
    ) {
      return {
        opening: "Caro-Kann Defense",
        variation: "Classical Variation",
        eco: "B18",
      };
    }

    return {
      opening: "Caro-Kann Defense",
      variation: "Main Line",
      eco: "B10",
    };
  }

  /*
   * Queen's Gambit
   */
  if (
    moveString.startsWith(
      "d4 d5 c4"
    )
  ) {
    if (
      moveString.startsWith(
        "d4 d5 c4 e6"
      )
    ) {
      return {
        opening: "Queen's Gambit",
        variation: "Queen's Gambit Declined",
        eco: "D30",
      };
    }

    if (
      moveString.startsWith(
        "d4 d5 c4 dxc4"
      )
    ) {
      return {
        opening: "Queen's Gambit",
        variation: "Queen's Gambit Accepted",
        eco: "D20",
      };
    }

    return {
      opening: "Queen's Gambit",
      variation: "Main Line",
      eco: "D30",
    };
  }

  /*
   * King's Indian Defense
   */
  if (
    moveString.startsWith(
      "d4 Nf6 c4 g6"
    )
  ) {
    return {
      opening: "King's Indian Defense",
      variation: "Main Line",
      eco: "E60",
    };
  }

  /*
   * Nimzo-Indian Defense
   */
  if (
    moveString.startsWith(
      "d4 Nf6 c4 e6 Nc3 Bb4"
    )
  ) {
    return {
      opening: "Nimzo-Indian Defense",
      variation: "Main Line",
      eco: "E20",
    };
  }

  /*
   * Queen's Indian Defense
   */
  if (
    moveString.startsWith(
      "d4 Nf6 c4 e6 Nf3 b6"
    )
  ) {
    return {
      opening: "Queen's Indian Defense",
      variation: "Main Line",
      eco: "E15",
    };
  }

  return {
    opening: "Opening not yet identified",
    variation: "—",
    eco: "—",
  };
}
import { ParsedGame } from "@/lib/chess/parsePGN";

export type GameSource =
  | "lichess"
  | "chess.com"
  | "pgn";

export interface LibraryGame {
  id: string;
  pgn: string;
  source: GameSource;
  importedAt: string;

  white: string;
  black: string;
  result: string;
  date: string;
  event: string;
  moveCount: number;
  opening: string;
  variation: string;
  eco: string;
}

const STORAGE_KEY = "chesscoach-game-library";
const MAX_GAMES = 100;

function createId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function createLibraryGame(
  pgn: string,
  parsedGame: ParsedGame,
  source: GameSource
): LibraryGame {
  return {
    id: createId(),
    pgn,
    source,
    importedAt: new Date().toISOString(),

    white: parsedGame.white,
    black: parsedGame.black,
    result: parsedGame.result,
    date: parsedGame.date,
    event: parsedGame.event,
    moveCount: parsedGame.moveCount,
    opening: parsedGame.opening,
    variation: parsedGame.variation,
    eco: parsedGame.eco,
  };
}

export function getGameLibrary(): LibraryGame[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const games = JSON.parse(raw);

    if (!Array.isArray(games)) {
      return [];
    }

    return games as LibraryGame[];
  } catch {
    return [];
  }
}

export function saveGamesToLibrary(
  games: LibraryGame[]
): LibraryGame[] {
  const existing = getGameLibrary();

  const existingPgns = new Set(
    existing.map((game) => game.pgn.trim())
  );

  const newGames = games.filter(
    (game) => !existingPgns.has(game.pgn.trim())
  );

  const updated = [
    ...newGames,
    ...existing,
  ].slice(0, MAX_GAMES);

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error(
      "[GameLibrary] Failed to save games:",
      error
    );
  }

  return updated;
}

export function removeGameFromLibrary(
  gameId: string
): LibraryGame[] {
  const updated = getGameLibrary().filter(
    (game) => game.id !== gameId
  );

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error(
      "[GameLibrary] Failed to remove game:",
      error
    );
  }

  return updated;
}

export function clearGameLibrary(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error(
      "[GameLibrary] Failed to clear library:",
      error
    );
  }
}

export function getSourceLabel(
  source: GameSource
): string {
  switch (source) {
    case "lichess":
      return "Lichess";
    case "chess.com":
      return "Chess.com";
    case "pgn":
      return "PGN";
  }
}

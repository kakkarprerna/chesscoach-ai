import { ParsedGame } from "@/lib/chess/parsePGN";

export interface StoredGame {
  id: string;
  pgn: string;
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

const STORAGE_KEY = "chesscoach-game-history";
const MAX_GAMES = 20;

function createGameId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function createStoredGame(
  pgn: string,
  parsedGame: ParsedGame
): StoredGame {
  return {
    id: createGameId(),
    pgn,
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

export function getGameHistory(): StoredGame[] {
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

    return games as StoredGame[];
  } catch (error) {
    console.error(
      "[GameHistory] Failed to read history:",
      error
    );

    return [];
  }
}

export function saveGameToHistory(
  game: StoredGame
): StoredGame[] {
  const existing = getGameHistory();

  // Avoid storing the exact same PGN repeatedly.
  const withoutDuplicate = existing.filter(
    (existingGame) => existingGame.pgn !== game.pgn
  );

  const updated = [
    game,
    ...withoutDuplicate,
  ].slice(0, MAX_GAMES);

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error(
      "[GameHistory] Failed to save game:",
      error
    );
  }

  return updated;
}

export function removeGameFromHistory(
  gameId: string
): StoredGame[] {
  const updated = getGameHistory().filter(
    (game) => game.id !== gameId
  );

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error(
      "[GameHistory] Failed to remove game:",
      error
    );
  }

  return updated;
}

export function clearGameHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error(
      "[GameHistory] Failed to clear history:",
      error
    );
  }
}

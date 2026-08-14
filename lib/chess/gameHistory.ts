import { ParsedGame } from "@/lib/chess/parsePGN";
import {
  GameSource,
  LibraryGame,
  getGameLibrary,
  saveGamesToLibrary,
  removeGameFromLibrary,
  clearGameLibrary,
} from "@/lib/chess/gameLibrary";

export type { GameSource };

export interface AnalyzedGame extends LibraryGame {}

export type StoredGame = AnalyzedGame;

export type GameSelectionMode =
  | "last-5"
  | "last-10"
  | "last-20"
  | "selected";

export interface GameSelection {
  mode: GameSelectionMode;
  gameIds: string[];
}

/**
 * Game History is now a compatibility layer over the unified
 * Game Library.
 *
 * The Game Library is the single source of truth.
 */

export function createStoredGame(
  pgn: string,
  parsedGame: ParsedGame,
  source: GameSource = "pgn"
): AnalyzedGame {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    pgn,
    importedAt: new Date().toISOString(),
    source,

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

export function getGameHistory(): AnalyzedGame[] {
  return getGameLibrary();
}

export function saveGameToHistory(
  game: AnalyzedGame
): AnalyzedGame[] {
  return saveGamesToLibrary([game]);
}

export function saveGamesToHistory(
  games: AnalyzedGame[]
): AnalyzedGame[] {
  return saveGamesToLibrary(games);
}

export function removeGameFromHistory(
  gameId: string
): AnalyzedGame[] {
  return removeGameFromLibrary(gameId);
}

export function clearGameHistory(): void {
  clearGameLibrary();
}

export function getSelectedGames(
  games: AnalyzedGame[],
  selection: GameSelection
): AnalyzedGame[] {
  switch (selection.mode) {
    case "last-5":
      return games.slice(0, 5);

    case "last-10":
      return games.slice(0, 10);

    case "last-20":
      return games.slice(0, 20);

    case "selected": {
      const selectedIds = new Set(selection.gameIds);

      return games.filter((game) =>
        selectedIds.has(game.id)
      );
    }

    default:
      return [];
  }
}

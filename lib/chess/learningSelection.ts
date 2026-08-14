import {
  AnalyzedGame,
  GameSelection,
  getGameHistory,
  getSelectedGames,
} from "@/lib/chess/gameHistory";

export interface LearningGameSet {
  games: AnalyzedGame[];
  mode: GameSelection["mode"];
  count: number;
}

export function getLearningGames(
  selection?: GameSelection
): LearningGameSet {
  const resolvedSelection: GameSelection =
    selection ?? {
      mode: "last-20",
      gameIds: [],
    };

  const games =
    getSelectedGames(getGameHistory(), resolvedSelection);

  return {
    games,
    mode: resolvedSelection.mode,
    count: games.length,
  };
}

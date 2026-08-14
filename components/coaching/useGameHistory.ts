"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnalyzedGame,
  GameSelectionMode,
  getGameHistory,
  getSelectedGames,
} from "@/lib/chess/gameHistory";

export function useGameHistory() {
  const [games, setGames] =
    useState<AnalyzedGame[]>([]);

  const [selectionMode, setSelectionMode] =
    useState<GameSelectionMode>("last-20");

  const [selectedGameIds, setSelectedGameIds] =
    useState<string[]>([]);

  const refresh = useCallback(() => {
    setGames(getGameHistory());
  }, []);

  useEffect(() => {
    refresh();

    const handleHistoryUpdate = () => {
      refresh();
    };

    window.addEventListener(
      "chesscoach-history-updated",
      handleHistoryUpdate
    );

    return () => {
      window.removeEventListener(
        "chesscoach-history-updated",
        handleHistoryUpdate
      );
    };
  }, [refresh]);

  const selectedGames = useMemo(() => {
    return getSelectedGames(games, {
      mode: selectionMode,
      gameIds: selectedGameIds,
    });
  }, [
    games,
    selectionMode,
    selectedGameIds,
  ]);

  const toggleGame = useCallback(
    (gameId: string) => {
      setSelectedGameIds((current) => {
        if (current.includes(gameId)) {
          return current.filter(
            (id) => id !== gameId
          );
        }

        return [...current, gameId];
      });
    },
    []
  );

  const selectLast20 = useCallback(() => {
    setSelectionMode("last-20");
    setSelectedGameIds([]);
  }, []);

  const selectLast10 = useCallback(() => {
    setSelectionMode("last-10");
    setSelectedGameIds([]);
  }, []);

  const selectLast5 = useCallback(() => {
    setSelectionMode("last-5");
    setSelectedGameIds([]);
  }, []);

  const selectCustomGames = useCallback(() => {
    setSelectionMode("selected");
    setSelectedGameIds([]);
  }, []);

  return {
    games,
    selectedGames,

    selectionMode,
    setSelectionMode,

    selectedGameIds,
    toggleGame,

    selectLast5,
    selectLast10,
    selectLast20,
    selectCustomGames,

    refresh,
  };
}

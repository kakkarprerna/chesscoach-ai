"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameHistory } from "@/components/coaching/useGameHistory";
import GameHistorySelector from "@/components/coaching/GameHistorySelector";
import {
  analyzeLearningGames,
  LearningAnalysisResult,
} from "@/lib/chess/learningAnalysis";

interface LearningHubProps {
  onSelectMove?: (fen: string) => void;
}

export default function LearningHub({
  onSelectMove,
}: LearningHubProps) {
  const router = useRouter();

  const {
    games,
    selectedGames,
    selectionMode,
    selectedGameIds,
    toggleGame,
    setSelectionMode,
  } = useGameHistory();

  const [loading, setLoading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [error, setError] =
    useState("");
  function openPuzzle(puzzle: LearningAnalysisResult["puzzles"][number]) {
    sessionStorage.setItem(
      "chesscoach-puzzle",
      JSON.stringify(puzzle)
    );

    router.push("/learn/puzzle");
  }

  function openGame(game: (typeof games)[number]) {
    sessionStorage.setItem(
      "chesscoach-imported-pgn",
      game.pgn
    );

    router.push("/analyze");
  }
  async function handleStudy() {
    if (selectedGames.length === 0) {
      return;
    }

    setLoading(true);
    setError("");
    setProgress(0);

    try {
      const result =
        await analyzeLearningGames(
          selectedGames,
          8,
          (completed) => {
            setProgress(completed);
          }
        );

      sessionStorage.setItem(
        "chesscoach-learning-analysis",
        JSON.stringify(result)
      );

      router.push("/learn/results");
    } catch (err) {
      console.error(
        "Learning analysis failed:",
        err
      );

      setError(
        "We couldn't build your learning plan. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const modeLabel =
    selectionMode === "last-5"
      ? `your last ${Math.min(5, games.length)} games`
      : selectionMode === "last-10"
        ? `your last ${Math.min(10, games.length)} games`
        : selectionMode === "last-20"
          ? `your last ${Math.min(20, games.length)} games`
          : "the games you picked";

  return (
    <section className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-sm sm:p-8">
      {/* Intro */}
      <div className="text-center">
        <div className="mx-auto inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">
          Your learning coach
        </div>

        <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
          What should you practise?
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
          Instead of looking at only one game,
          let&apos;s find the things that keep
          showing up in your chess.
        </p>
      </div>

      {/* Study action — deliberately ABOVE the game list */}
      {games.length > 0 && (
        <div className="mt-8 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-violet-600">
                Ready to study
              </p>

              <h3 className="mt-1 text-xl font-black text-zinc-900">
                {selectedGames.length === 0
                  ? "Choose the games for your coach"
                  : `${selectedGames.length} ${
                      selectedGames.length === 1
                        ? "game"
                        : "games"
                    } ready to study`}
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                {selectedGames.length > 0
                  ? `The coach will study ${modeLabel}.`
                  : "Pick a study range below, or choose individual games."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleStudy}
              disabled={
                loading ||
                selectedGames.length === 0
              }
              className="shrink-0 rounded-2xl bg-violet-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Coach is studying..."
                : `Study ${modeLabel}`}
            </button>
          </div>

          {selectionMode === "selected" &&
            selectedGames.length === 0 && (
              <p className="mt-3 text-sm font-bold text-zinc-500">
                Pick at least one game from the list below.
              </p>
            )}

          {loading && (
            <div className="mt-5 border-t border-zinc-100 pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-zinc-500">
                  Finding patterns across your games...
                </span>

                <span className="font-black text-violet-600">
                  {progress}%
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-violet-600 transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-black text-red-700">
            Something went wrong
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* Game selection */}
      <div className="mt-8">
        <GameHistorySelector
          games={games}
          selectedGameIds={selectedGameIds}
          selectionMode={selectionMode}
          onSelectMode={setSelectionMode}
          onToggleGame={toggleGame}
          onOpenGame={openGame}
        />
      </div>
    </section>
  );
}
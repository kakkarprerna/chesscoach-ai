"use client";

import { useState } from "react";
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
  const {
    games,
    selectedGames,
    selectionMode,
    selectedGameIds,
    toggleGame,
    setSelectionMode,
  } = useGameHistory();

  const [analysis, setAnalysis] =
    useState<LearningAnalysisResult | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [error, setError] =
    useState("");

  async function handleStudy() {
    if (selectedGames.length === 0) {
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
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

      setAnalysis(result);
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
      ? "your last 5 games"
      : selectionMode === "last-10"
        ? "your last 10 games"
        : selectionMode === "last-20"
          ? "your last 20 games"
          : "the games you picked";

  return (
    <section className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-sm sm:p-8">
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

      <div className="mt-8">
        <GameHistorySelector
          games={games}
          selectedGameIds={
            selectedGameIds
          }
          selectionMode={
            selectionMode
          }
          onSelectMode={
            setSelectionMode
          }
          onToggleGame={
            toggleGame
          }
        />
      </div>

      {games.length > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleStudy}
            disabled={
              loading ||
              selectedGames.length === 0
            }
            className="w-full rounded-2xl bg-violet-600 px-7 py-4 text-lg font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {loading
              ? "Coach is studying..."
              : `Study ${modeLabel}`}
          </button>

          {selectedGames.length === 0 &&
            selectionMode ===
              "selected" && (
              <p className="mt-3 text-sm font-bold text-zinc-500">
                Pick at least one game first.
              </p>
            )}
        </div>
      )}

      {loading && (
        <div className="mt-7 rounded-3xl border border-violet-100 bg-white p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
            🔎
          </div>

          <h3 className="mt-4 text-2xl font-black text-zinc-900">
            Your coach is looking for
            patterns...
          </h3>

          <p className="mt-2 text-base text-zinc-500">
            We&apos;re checking the games you
            selected.
          </p>

          <div className="mx-auto mt-6 max-w-xl">
            <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p className="mt-3 text-sm font-bold text-violet-600">
              {progress}% complete
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-7 rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="font-black text-red-700">
            Something went wrong
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {analysis && !loading && (
        <div className="mt-8 space-y-8">
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <p className="text-sm font-black uppercase tracking-wide text-violet-600">
              Your chess across time
            </p>

            <h3 className="mt-2 text-3xl font-black text-zinc-900">
              Here&apos;s what your coach noticed
            </h3>

            <p className="mt-2 text-base text-zinc-500">
              Studied{" "}
              <strong>
                {analysis.gamesAnalyzed}
              </strong>{" "}
              {analysis.gamesAnalyzed === 1
                ? "game"
                : "games"}.
            </p>
          </div>

          <div>
            <div className="mb-4">
              <p className="text-sm font-black uppercase tracking-wide text-violet-600">
                Patterns
              </p>

              <h3 className="mt-1 text-2xl font-black text-zinc-900 sm:text-3xl">
                Things to keep an eye on
              </h3>
            </div>

            {analysis.patterns.length ===
            0 ? (
              <div className="rounded-3xl bg-emerald-50 p-6">
                <h4 className="text-xl font-black text-zinc-900">
                  Great start!
                </h4>

                <p className="mt-2 text-base leading-7 text-zinc-600">
                  Your selected games didn&apos;t
                  show a repeated mistake pattern
                  at this analysis depth.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {analysis.patterns.map(
                  (pattern) => (
                    <div
                      key={pattern.id}
                      className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-700">
                          Seen in{" "}
                          {pattern.gameCount}{" "}
                          {pattern.gameCount ===
                          1
                            ? "game"
                            : "games"}
                        </span>

                        <span className="text-sm font-bold capitalize text-zinc-400">
                          {pattern.severity}
                        </span>
                      </div>

                      <h4 className="mt-4 text-xl font-black text-zinc-900">
                        {pattern.title}
                      </h4>

                      <p className="mt-2 text-base leading-7 text-zinc-600">
                        {pattern.description}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4">
              <p className="text-sm font-black uppercase tracking-wide text-violet-600">
                Practice puzzles
              </p>

              <h3 className="mt-1 text-2xl font-black text-zinc-900 sm:text-3xl">
                Can you find a better move?
              </h3>

              <p className="mt-2 text-base text-zinc-500">
                These moments came from your own
                games.
              </p>
            </div>

            {analysis.puzzles.length ===
            0 ? (
              <div className="rounded-3xl bg-emerald-50 p-6">
                <h4 className="text-xl font-black text-zinc-900">
                  No puzzles yet
                </h4>

                <p className="mt-2 text-base leading-7 text-zinc-600">
                  We didn&apos;t find enough
                  critical moments in these games.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {analysis.puzzles.map(
                  (puzzle, index) => (
                    <button
                      key={puzzle.id}
                      type="button"
                      onClick={() =>
                        onSelectMove?.(
                          puzzle.fen
                        )
                      }
                      className="w-full rounded-3xl border border-zinc-100 bg-white p-6 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-lg font-black text-violet-700">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black capitalize text-violet-700">
                              {puzzle.classification}
                            </span>

                            <span className="text-sm font-bold text-zinc-400">
                              {puzzle.gameLabel}
                            </span>
                          </div>

                          <h4 className="mt-3 text-xl font-black text-zinc-900">
                            Move{" "}
                            {puzzle.moveNumber}:{" "}
                            {puzzle.question}
                          </h4>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-zinc-50 p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                                You played
                              </p>

                              <p className="mt-1 text-lg font-black text-zinc-900">
                                {
                                  puzzle.playedMove
                                }
                              </p>
                            </div>

                            <div className="rounded-2xl bg-violet-50 p-4">
                              <p className="text-xs font-black uppercase tracking-wide text-violet-500">
                                Coach suggests
                              </p>

                              <p className="mt-1 text-lg font-black text-violet-700">
                                {
                                  puzzle.bestMove
                                }
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-base leading-7 text-zinc-600">
                            {
                              puzzle.explanation
                            }
                          </p>

                          <p className="mt-4 text-sm font-black text-violet-600">
                            Tap to see the position →
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

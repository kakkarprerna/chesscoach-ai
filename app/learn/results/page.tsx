"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LearningAnalysisResult,
} from "@/lib/chess/learningAnalysis";

export default function LearningResultsPage() {
  const router = useRouter();

  const [analysis, setAnalysis] =
    useState<LearningAnalysisResult | null>(null);

  useEffect(() => {
    const stored =
      sessionStorage.getItem(
        "chesscoach-learning-analysis"
      );

    if (!stored) {
      router.replace("/learn");
      return;
    }

    try {
      const parsed =
        JSON.parse(stored) as LearningAnalysisResult;

      setAnalysis(parsed);
    } catch {
      router.replace("/learn");
    }
  }, [router]);

  function handleSelectPuzzle(
    puzzle: LearningAnalysisResult["puzzles"][number]
  ) {
    sessionStorage.setItem(
      "chesscoach-puzzle",
      JSON.stringify(puzzle)
    );

    router.push("/learn/puzzle");
  }

  if (!analysis) {
    return (
      <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />

            <p className="mt-4 text-sm font-bold text-zinc-500">
              Loading your learning plan...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e8e6df] bg-[#fdfdfb]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5">
          <div>
            <div className="text-sm font-black tracking-tight text-violet-600">
              ChessCoach AI
            </div>

            <h1 className="mt-0.5 text-xl font-black tracking-tight">
              Learning Results
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/games")}
              className="rounded-xl border border-[#dedcd5] bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              Game Library
            </button>

            <button
              type="button"
              onClick={() => router.push("/learn")}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-500"
            >
              Study other games
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
        {/* Summary */}
        <section className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-wide text-violet-600">
            Your chess across time
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Here&apos;s what your coach noticed
          </h2>

          <p className="mt-3 text-base text-zinc-500">
            Studied{" "}
            <strong className="text-zinc-800">
              {analysis.gamesAnalyzed}
            </strong>{" "}
            {analysis.gamesAnalyzed === 1
              ? "game"
              : "games"}.
          </p>
        </section>

        {/* Patterns */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-sm font-black uppercase tracking-wide text-violet-600">
              Patterns
            </p>

            <h3 className="mt-1 text-2xl font-black text-zinc-900 sm:text-3xl">
              Things to keep an eye on
            </h3>

            <p className="mt-2 text-base text-zinc-500">
              These are the themes that appeared across the games you studied.
            </p>
          </div>

          {analysis.patterns.length === 0 ? (
            <div className="rounded-3xl bg-emerald-50 p-6">
              <h4 className="text-xl font-black text-zinc-900">
                Great start!
              </h4>

              <p className="mt-2 text-base leading-7 text-zinc-600">
                Your selected games didn&apos;t show a repeated mistake
                pattern at this analysis depth.
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
                        {pattern.gameCount === 1
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
        </section>

        {/* Puzzles */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-sm font-black uppercase tracking-wide text-violet-600">
              Practice puzzles
            </p>

            <h3 className="mt-1 text-2xl font-black text-zinc-900 sm:text-3xl">
              Can you find a better move?
            </h3>

            <p className="mt-2 text-base text-zinc-500">
              These moments came directly from your own games.
            </p>
          </div>

          {analysis.puzzles.length === 0 ? (
            <div className="rounded-3xl bg-emerald-50 p-6">
              <h4 className="text-xl font-black text-zinc-900">
                No puzzles yet
              </h4>

              <p className="mt-2 text-base leading-7 text-zinc-600">
                We didn&apos;t find enough critical moments in these games.
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
                      handleSelectPuzzle(puzzle)
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

                          <span className="text-sm font-bold text-zinc-400">
                            Move {puzzle.moveNumber}
                          </span>
                        </div>

                        <h4 className="mt-3 text-xl font-black text-zinc-900">
                          {puzzle.question}
                        </h4>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-zinc-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                              You played
                            </p>

                            <p className="mt-1 text-lg font-black text-zinc-900">
                              {puzzle.playedMove}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-violet-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-violet-500">
                              Coach suggests
                            </p>

                            <p className="mt-1 text-lg font-black text-violet-700">
                              {puzzle.bestMove}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-sm font-black text-violet-600">
                          See this position →
                        </p>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </section>

        {/* Bottom navigation */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => router.push("/learn")}
            className="rounded-2xl border border-[#dedcd5] bg-white px-6 py-3 text-sm font-black text-zinc-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            Study another selection
          </button>

          <button
            type="button"
            onClick={() => router.push("/games")}
            className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-black text-white transition hover:bg-violet-500"
          >
            Back to Game Library
          </button>
        </div>
      </div>
    </main>
  );
}
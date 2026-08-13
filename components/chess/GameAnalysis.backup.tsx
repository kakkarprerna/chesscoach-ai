"use client";

import { useState } from "react";
import {
  analyzeGame,
  GameAnalysisResult,
} from "@/lib/chess/analyzeGame";

interface GameAnalysisProps {
  pgn: string;
  onSelectMove?: (fen: string) => void;
}

export default function GameAnalysis({
  pgn,
  onSelectMove,
}: GameAnalysisProps) {
  const [analysis, setAnalysis] =
    useState<GameAnalysisResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!pgn) return;

    setLoading(true);
    setError("");
    setAnalysis(null);
    setProgress(0);

    try {
      const result = await analyzeGame(
        pgn,
        10,
        (completed, total) => {
          setProgress(Math.round((completed / total) * 100));
        }
      );

      setAnalysis(result);
    } catch (err) {
      console.error("Game analysis failed:", err);

      setError(
        "We couldn't finish your game analysis. Let's try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const criticalMoves =
    analysis?.moves
      .filter(
        (move) =>
          move.classification === "blunder" ||
          move.classification === "mistake" ||
          move.classification === "inaccuracy"
      )
      .sort(
        (a, b) =>
          b.evaluationLoss - a.evaluationLoss
      )
      .slice(0, 5) ?? [];

  const biggestLesson = criticalMoves[0];

  return (
    <section className="rounded-3xl border border-violet-100 bg-gradient-to-b from-white to-violet-50/40 p-5 shadow-sm sm:p-8">
      {/* Header */}
      <div className="max-w-2xl">
        <div className="mb-3 inline-flex items-center rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-violet-700">
          Your chess lesson
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Let&apos;s learn from your game
        </h2>

        <p className="mt-3 text-base leading-7 text-zinc-600 sm:text-lg">
          We&apos;ll find your best moves, tricky moments,
          and places where you can improve.
        </p>
      </div>

      {/* Main action */}
      {!analysis && !loading && (
        <div className="mt-7 rounded-3xl border border-violet-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-4xl">🧠</div>

              <h3 className="mt-3 text-xl font-extrabold text-zinc-900">
                Ready to discover your game?
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
                Your coach will look through the game and
                pick out the moments that are most useful
                for you to learn from.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!pgn}
              className="shrink-0 rounded-2xl bg-violet-600 px-6 py-4 text-base font-extrabold text-white shadow-md transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ✨ Analyse my game
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-7 rounded-3xl border border-violet-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="text-5xl">♟</div>

          <h3 className="mt-4 text-2xl font-extrabold text-zinc-900">
            Your coach is looking through the game...
          </h3>

          <p className="mx-auto mt-2 max-w-md text-base leading-6 text-zinc-600">
            We&apos;re checking your moves and finding
            interesting moments.
          </p>

          <div className="mx-auto mt-7 max-w-md">
            <div className="h-3 overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-violet-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-sm font-bold text-violet-700">
              {progress}% complete
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-base font-bold text-red-700">
            Something went wrong
          </p>

          <p className="mt-1 text-sm leading-6 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={handleAnalyze}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="mt-8 space-y-8">
          {/* Friendly summary */}
          <div>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                Your game at a glance
              </p>

              <h3 className="mt-1 text-2xl font-extrabold text-zinc-900">
                Here&apos;s what your coach noticed
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <LessonStat
                emoji="⭐"
                label="Good moves"
                value={
                  analysis.moves.filter(
                    (move) =>
                      move.classification === "best" ||
                      move.classification === "good"
                  ).length
                }
              />

              <LessonStat
                emoji="💡"
                label="Moves to learn from"
                value={
                  analysis.whiteInaccuracies +
                  analysis.blackInaccuracies
                }
              />

              <LessonStat
                emoji="🎯"
                label="Big lessons"
                value={
                  analysis.whiteBlunders +
                  analysis.blackBlunders
                }
              />
            </div>
          </div>

          {/* Biggest lesson */}
          {biggestLesson ? (
            <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
              <div className="p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                    💡
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      Your biggest lesson
                    </p>

                    <h3 className="mt-1 text-2xl font-extrabold text-zinc-900">
                      Let&apos;s look at move{" "}
                      {biggestLesson.moveNumber}
                      {biggestLesson.color === "black"
                        ? "..."
                        : "."}
                    </h3>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-2xl font-extrabold text-zinc-900">
                      {biggestLesson.move}
                    </span>

                    <ClassificationBadge
                      classification={
                        biggestLesson.classification
                      }
                    />
                  </div>

                  <p className="mt-4 text-base leading-7 text-zinc-700">
                    {biggestLesson.explanation}
                  </p>

                  <div className="mt-5 rounded-2xl bg-violet-50 p-4">
                    <p className="text-sm font-bold text-violet-700">
                      Coach&apos;s idea
                    </p>

                    <p className="mt-1 text-lg font-extrabold text-zinc-900">
                      Try{" "}
                      <span className="text-violet-700">
                        {biggestLesson.bestMove}
                      </span>
                    </p>
                  </div>

                  {onSelectMove && (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectMove(biggestLesson.fen)
                      }
                      className="mt-5 w-full rounded-2xl bg-violet-600 px-5 py-3.5 text-base font-extrabold text-white transition hover:bg-violet-500"
                    >
                      ♟ Show me this position
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-7">
              <div className="text-4xl">🎉</div>

              <h3 className="mt-3 text-2xl font-extrabold text-zinc-900">
                Great job!
              </h3>

              <p className="mt-2 text-base leading-7 text-zinc-700">
                We didn&apos;t find any major mistakes at
                this analysis depth. Keep playing and
                learning!
              </p>
            </div>
          )}

          {/* Other lessons */}
          {criticalMoves.length > 1 && (
            <div>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  More moments to explore
                </p>

                <h3 className="mt-1 text-2xl font-extrabold text-zinc-900">
                  Can you spot what happened?
                </h3>
              </div>

              <div className="space-y-3">
                {criticalMoves.slice(1).map((move) => (
                  <button
                    key={`${move.moveNumber}-${move.color}-${move.move}`}
                    type="button"
                    onClick={() =>
                      onSelectMove?.(move.fen)
                    }
                    className="w-full rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-sm font-bold text-zinc-600">
                          {move.moveNumber}
                          {move.color === "black"
                            ? "..."
                            : "."}
                        </span>

                        <span className="text-lg font-extrabold text-zinc-900">
                          {move.move}
                        </span>

                        <ClassificationBadge
                          classification={
                            move.classification
                          }
                        />
                      </div>

                      <span className="text-sm font-bold text-violet-600">
                        See this position →
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                      {move.explanation}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Move-by-move */}
          <details className="rounded-2xl border border-zinc-200 bg-white">
            <summary className="cursor-pointer px-5 py-4 text-base font-bold text-zinc-800">
              Show all moves
            </summary>

            <div className="max-h-[500px] overflow-y-auto border-t border-zinc-100">
              {analysis.moves.map((move, index) => (
                <button
                  key={`${move.moveNumber}-${move.color}-${index}`}
                  type="button"
                  onClick={() =>
                    onSelectMove?.(move.fen)
                  }
                  className="w-full border-b border-zinc-100 px-5 py-4 text-left last:border-b-0 hover:bg-violet-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-xs font-bold text-zinc-400">
                      {move.moveNumber}
                      {move.color === "black"
                        ? "..."
                        : "."}
                    </span>

                    <span className="text-sm font-semibold text-zinc-800">
                      {move.move}
                    </span>

                    <ClassificationBadge
                      classification={
                        move.classification
                      }
                    />

                    <span className="ml-auto text-xs font-semibold text-violet-600">
                      {move.bestMove}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}

function LessonStat({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-3xl">{emoji}</div>

      <p className="mt-3 text-sm font-bold text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-extrabold text-zinc-900">
        {value}
      </p>
    </div>
  );
}

function ClassificationBadge({
  classification,
}: {
  classification:
    | "best"
    | "good"
    | "inaccuracy"
    | "mistake"
    | "blunder";
}) {
  const labels = {
    best: "Great move",
    good: "Good move",
    inaccuracy: "Could improve",
    mistake: "Tricky move",
    blunder: "Big lesson",
  };

  return (
    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700">
      {labels[classification]}
    </span>
  );
}

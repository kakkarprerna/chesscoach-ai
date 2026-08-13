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
          setProgress(
            Math.round((completed / total) * 100)
          );
        }
      );

      setAnalysis(result);
    } catch (err) {
      console.error("Game analysis failed:", err);

      setError(
        "We couldn't finish the lesson. Please try again."
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

  return (
    <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/50 p-5 shadow-sm sm:p-7">

      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
          <span>🧠</span>
          <span>Your chess lesson</span>
        </div>

        <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
          Let&apos;s see what you learned!
        </h2>

        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
          We&apos;ll look through your game and find a few
          moments that can help you become a stronger player.
        </p>
      </div>

      {/* Start analysis */}
      {!analysis && !loading && (
        <div className="mt-7 rounded-3xl border border-violet-100 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-4xl">
            ♟
          </div>

          <h3 className="mt-5 text-2xl font-black text-zinc-900">
            Ready for your lesson?
          </h3>

          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-zinc-500">
            We&apos;ll find the biggest moments in your game
            and explain them in simple chess language.
          </p>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!pgn}
            className="mt-6 w-full rounded-2xl bg-violet-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Start my chess lesson
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-7 rounded-3xl border border-violet-100 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-4xl">
            🔎
          </div>

          <h3 className="mt-5 text-2xl font-black text-zinc-900">
            Coach is looking through your game...
          </h3>

          <p className="mt-2 text-base text-zinc-500">
            Finding the moments worth learning from.
          </p>

          <div className="mx-auto mt-6 max-w-xl">
            <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-sm font-semibold text-violet-600">
              {progress}% complete
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-bold text-red-700">
            Something went wrong
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="mt-8 space-y-8">

          {/* Quick summary */}
          <div>
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-wide text-violet-600">
                Your game at a glance
              </p>

              <h3 className="mt-1 text-2xl font-black text-zinc-900">
                Here&apos;s what stood out
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat
                emoji="🤔"
                label="Things to think about"
                value={
                  analysis.whiteInaccuracies +
                  analysis.blackInaccuracies
                }
              />

              <Stat
                emoji="💡"
                label="Mistakes to learn from"
                value={
                  analysis.whiteMistakes +
                  analysis.blackMistakes
                }
              />

              <Stat
                emoji="🚨"
                label="Big surprises"
                value={
                  analysis.whiteBlunders +
                  analysis.blackBlunders
                }
              />
            </div>
          </div>

          {/* Critical moments */}
          <div>
            <div className="mb-4">
              <p className="text-sm font-bold uppercase tracking-wide text-violet-600">
                Most useful moments
              </p>

              <h3 className="mt-1 text-2xl font-black text-zinc-900">
                These are worth another look
              </h3>

              <p className="mt-2 text-base text-zinc-500">
                Tap a moment to jump back to that position.
              </p>
            </div>

            {criticalMoves.length === 0 ? (
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                <div className="text-4xl">🎉</div>

                <h4 className="mt-3 text-xl font-black text-zinc-900">
                  Great job!
                </h4>

                <p className="mt-2 text-base leading-7 text-zinc-600">
                  We didn&apos;t find any major mistakes at
                  this analysis depth.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {criticalMoves.map((move, index) => (
                  <button
                    key={`${move.moveNumber}-${move.color}-${move.move}`}
                    type="button"
                    onClick={() =>
                      onSelectMove?.(move.fen)
                    }
                    className="w-full rounded-3xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-lg font-black text-violet-700">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-500">
                            Move {move.moveNumber}
                            {move.color === "black"
                              ? "..."
                              : ""}
                          </span>

                          <ClassificationBadge
                            classification={
                              move.classification
                            }
                          />
                        </div>

                        <h4 className="mt-2 text-xl font-black text-zinc-900">
                          You played {move.move}
                        </h4>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-zinc-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                              You played
                            </p>

                            <p className="mt-1 text-lg font-bold text-zinc-900">
                              {move.move}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-violet-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-violet-500">
                              Coach suggests
                            </p>

                            <p className="mt-1 text-lg font-bold text-violet-700">
                              {move.bestMove}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-indigo-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                            Why this matters
                          </p>

                          <p className="mt-2 text-base leading-7 text-zinc-700">
                            {move.explanation}
                          </p>
                        </div>

                        <p className="mt-4 text-sm font-bold text-violet-600">
                          Tap to see this position →
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Move-by-move */}
          <details className="rounded-3xl border border-zinc-200 bg-white">
            <summary className="cursor-pointer list-none p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    Want to see every move?
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Open the full move-by-move breakdown.
                  </p>
                </div>

                <span className="text-violet-600">
                  →
                </span>
              </div>
            </summary>

            <div className="border-t border-zinc-100 p-4 sm:p-6">
              <div className="max-h-[500px] overflow-y-auto rounded-2xl border border-zinc-100">
                {analysis.moves.map((move, index) => (
                  <button
                    key={`${move.moveNumber}-${move.color}-${index}`}
                    type="button"
                    onClick={() =>
                      onSelectMove?.(move.fen)
                    }
                    className="w-full border-b border-zinc-100 px-4 py-4 text-left last:border-b-0 hover:bg-violet-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-12 text-xs text-zinc-400">
                        {move.moveNumber}
                        {move.color === "black"
                          ? "..."
                          : "."}
                      </span>

                      <span className="font-semibold text-zinc-800">
                        {move.move}
                      </span>

                      <ClassificationBadge
                        classification={
                          move.classification
                        }
                      />
                    </div>

                    <p className="mt-2 pl-12 text-sm leading-6 text-zinc-500">
                      {move.explanation}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </details>

        </div>
      )}
    </section>
  );
}

function Stat({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="text-3xl">{emoji}</div>

      <p className="mt-3 text-3xl font-black text-zinc-900">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold leading-5 text-zinc-500">
        {label}
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
    best: "⭐ Great move",
    good: "👍 Good move",
    inaccuracy: "🤔 Could improve",
    mistake: "💡 Learning moment",
    blunder: "🚨 Big learning moment",
  };

  return (
    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
      {labels[classification]}
    </span>
  );
}

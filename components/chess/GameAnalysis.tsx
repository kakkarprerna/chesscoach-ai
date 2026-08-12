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
    if (!pgn) {
      return;
    }

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
        "Unable to analyse the complete game. Please try again."
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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-violet-500">
            Game analysis
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Analyse the entire game
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Stockfish will evaluate every move and identify
            the positions worth studying.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!pgn || loading}
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading
            ? `Analysing ${progress}%`
            : "Analyse entire game"}
        </button>
      </div>

      {loading && (
        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-violet-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            Analysing every position with Stockfish...
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      {analysis && !loading && (
        <div className="mt-8 space-y-8">
          {/* Summary */}
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Performance summary
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Stat
                label="White inaccuracies"
                value={analysis.whiteInaccuracies}
              />

              <Stat
                label="White mistakes"
                value={analysis.whiteMistakes}
              />

              <Stat
                label="White blunders"
                value={analysis.whiteBlunders}
              />

              <Stat
                label="Black inaccuracies"
                value={analysis.blackInaccuracies}
              />

              <Stat
                label="Black mistakes"
                value={analysis.blackMistakes}
              />

              <Stat
                label="Black blunders"
                value={analysis.blackBlunders}
              />
            </div>
          </div>

          {/* Critical moments */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Critical moments
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Positions worth studying
                </h3>
              </div>

              <span className="text-xs text-zinc-500">
                Top {criticalMoves.length}
              </span>
            </div>

            {criticalMoves.length === 0 ? (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-sm text-zinc-400">
                  No major mistakes were detected at this
                  analysis depth.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {criticalMoves.map((move) => (
                  <button
                    key={`${move.moveNumber}-${move.color}-${move.move}`}
                    type="button"
                    onClick={() =>
                      onSelectMove?.(move.fen)
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-500">
                          {move.moveNumber}
                          {move.color === "black"
                            ? "..."
                            : "."}
                        </span>

                        <span className="font-semibold">
                          {move.move}
                        </span>

                        <ClassificationBadge
                          classification={
                            move.classification
                          }
                        />
                      </div>

                      <span className="text-sm text-red-400">
                        -{move.evaluationLoss.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-zinc-600">
                          Your move
                        </p>

                        <p className="mt-1 text-sm text-zinc-300">
                          {move.move}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-600">
                          Engine suggestion
                        </p>

                        <p className="mt-1 text-sm text-violet-500">
                          {move.bestMove}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                      <p className="text-xs uppercase tracking-wider text-zinc-600">
                        Why it matters
                      </p>

                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {move.explanation}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Move-by-move analysis */}
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Move-by-move analysis
            </p>

            <div className="mt-4 max-h-[520px] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950">
              {analysis.moves.map((move, index) => (
                <button
                  key={`${move.moveNumber}-${move.color}-${index}`}
                  type="button"
                  onClick={() =>
                    onSelectMove?.(move.fen)
                  }
                  className="w-full border-b border-zinc-900 px-4 py-4 text-left last:border-b-0 hover:bg-zinc-900"
                >
                  <div className="grid grid-cols-[50px_1fr_auto] items-center gap-3">
                    <span className="text-xs text-zinc-600">
                      {move.moveNumber}
                      {move.color === "black"
                        ? "..."
                        : "."}
                    </span>

                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-sm text-zinc-300">
                        {move.move}
                      </span>

                      <ClassificationBadge
                        classification={
                          move.classification
                        }
                      />
                    </div>

                    <span className="text-xs text-violet-500">
                      {move.bestMove}
                    </span>
                  </div>

                  <div className="mt-3 pl-[50px]">
                    <p className="text-sm leading-6 text-zinc-500">
                      {move.explanation}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
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
    best: "Best",
    good: "Good",
    inaccuracy: "Inaccuracy",
    mistake: "Mistake",
    blunder: "Blunder",
  };

  return (
    <span className="text-xs text-zinc-400">
      {labels[classification]}
    </span>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  evaluatePosition,
  EngineEvaluation,
} from "@/lib/chess/stockfish";

interface EngineAnalysisProps {
  fen: string;
}

function getCoachTitle(analysis: EngineEvaluation): string {
  if (analysis.mate !== null) {
    return analysis.mate > 0
      ? "There is a winning attack!"
      : "Careful — this position is in danger.";
  }

  if (analysis.evaluation >= 1.5) {
    return "You're doing great!";
  }

  if (analysis.evaluation >= 0.5) {
    return "You're in a good position.";
  }

  if (analysis.evaluation > -0.5) {
    return "This position is pretty even.";
  }

  if (analysis.evaluation > -1.5) {
    return "There's a little danger here.";
  }

  return "Time to find a strong defence!";
}

function getCoachMessage(analysis: EngineEvaluation): string {
  if (analysis.mate !== null) {
    return analysis.mate > 0
      ? "Look for forcing moves. You may have a chance to finish the attack."
      : "Look carefully for your opponent's threats and try to protect your king.";
  }

  if (!analysis.bestMove) {
    return "Take a moment to look for checks, captures and threats.";
  }

  if (analysis.evaluation >= 1.5) {
    return "You have an advantage. Look for a way to make it even stronger.";
  }

  if (analysis.evaluation >= 0.5) {
    return "Keep developing your pieces and look for your opponent's threats.";
  }

  if (analysis.evaluation > -0.5) {
    return "Both sides have chances. Look for a move that improves your pieces.";
  }

  if (analysis.evaluation > -1.5) {
    return "Be careful. Look at what your opponent is attacking before you move.";
  }

  return "Look for your opponent's biggest threat first. Then find a move that keeps your pieces safe.";
}

function formatEvaluation(analysis: EngineEvaluation): string {
  if (analysis.mate !== null) {
    return `Mate in ${Math.abs(analysis.mate)}`;
  }

  return analysis.evaluation >= 0
    ? `+${analysis.evaluation.toFixed(2)}`
    : analysis.evaluation.toFixed(2);
}

export default function EngineAnalysis({
  fen,
}: EngineAnalysisProps) {
  const [analysis, setAnalysis] =
    useState<EngineEvaluation | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!fen) {
      setAnalysis(null);
      return;
    }

    let cancelled = false;

    async function analyse() {
      setLoading(true);
      setError("");
      setAnalysis(null);
      setShowDetails(false);

      try {
        const result = await evaluatePosition(fen, 12);

        if (!cancelled) {
          setAnalysis(result);
        }
      } catch (err) {
        console.error("Stockfish error:", err);

        if (!cancelled) {
          setError(
            "I couldn't check this position. Let's try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    analyse();

    return () => {
      cancelled = true;
    };
  }, [fen]);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl sm:p-7">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl">
            ♟
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              ChessCoach
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Your Chess Coach
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Let's see what this position can teach you.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
        {loading && (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">
              ♟
            </div>

            <p className="mt-4 text-lg font-semibold text-white">
              Thinking...
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Your coach is looking for the strongest idea.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && analysis && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Coach says
              </p>

              <h3 className="mt-2 text-2xl font-bold text-white">
                {getCoachTitle(analysis)}
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {getCoachMessage(analysis)}
              </p>
            </div>

            {analysis.bestMove && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm font-semibold text-emerald-300">
                  Try this move
                </p>

                <p className="mt-2 text-4xl font-black tracking-tight text-emerald-400">
                  {analysis.bestMove}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  This is the move the chess engine likes most.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>

                <div>
                  <p className="font-semibold text-white">
                    Coach tip
                  </p>

                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    Before every move, ask yourself:
                    <span className="font-medium text-zinc-200">
                      {" "}What is my opponent threatening?
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() =>
                  setShowDetails((current) => !current)
                }
                className="text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
              >
                {showDetails
                  ? "Hide engine details"
                  : "Show engine details"}
              </button>

              {showDetails && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-600">
                      Evaluation
                    </p>

                    <p className="mt-1 font-mono text-sm text-zinc-300">
                      {formatEvaluation(analysis)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-600">
                      Best move
                    </p>

                    <p className="mt-1 font-mono text-sm text-zinc-300">
                      {analysis.bestMove ?? "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

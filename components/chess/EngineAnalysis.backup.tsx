"use client";

import { useEffect, useState } from "react";
import {
  evaluatePosition,
  EngineEvaluation,
} from "@/lib/chess/stockfish";

interface EngineAnalysisProps {
  fen: string;
}

function getCoachContent(analysis: EngineEvaluation) {
  if (analysis.mate !== null) {
    if (analysis.mate > 0) {
      return {
        emoji: "🎉",
        title: "You have a winning attack!",
        message:
          "Look for checks, captures and threats. You may be very close to winning!",
        tip: "Can you find the move that keeps the attack going?",
      };
    }

    return {
      emoji: "🛡️",
      title: "Your king needs help!",
      message:
        "Your opponent has a dangerous attack. Slow down and look for their biggest threat.",
      tip: "What is your opponent threatening right now?",
    };
  }

  if (analysis.evaluation >= 1.5) {
    return {
      emoji: "⭐",
      title: "You're doing great!",
      message:
        "You have a strong position. Keep looking for ways to make your pieces even stronger.",
      tip: "Can you find a move that creates another threat?",
    };
  }

  if (analysis.evaluation >= 0.5) {
    return {
      emoji: "👍",
      title: "Nice position!",
      message:
        "You have a small advantage. Keep your pieces active and watch what your opponent is planning.",
      tip: "Before you move, ask: what is my opponent threatening?",
    };
  }

  if (analysis.evaluation > -0.5) {
    return {
      emoji: "⚖️",
      title: "It's a fair fight!",
      message:
        "Both sides have good chances. This is a great moment to look for your best idea.",
      tip: "Try checks, captures and threats.",
    };
  }

  if (analysis.evaluation > -1.5) {
    return {
      emoji: "💡",
      title: "There's a chance to improve!",
      message:
        "Your position is a little tricky, but don't worry. Good players look for problems and solve them.",
      tip: "Look at what your opponent can attack next.",
    };
  }

  return {
    emoji: "🛡️",
    title: "Time for a careful move!",
    message:
      "Something dangerous is happening. Take a breath and find a move that keeps your pieces and king safe.",
    tip: "First find your opponent's biggest threat. Then find a defence.",
  };
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

  const coach = analysis
    ? getCoachContent(analysis)
    : null;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15 text-2xl">
          ♟
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-500">
            ChessCoach
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">
            Your Chess Coach
          </h2>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-400">
        Let's see what your position can teach you.
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
        {loading && (
          <div className="py-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-600/10 text-3xl">
              ♟
            </div>

            <p className="mt-4 text-lg font-bold text-white">
              Coach is thinking...
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Looking for the best chess idea.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5">
            <p className="font-semibold text-red-300">
              Hmm, something went wrong.
            </p>

            <p className="mt-2 text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && analysis && coach && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-zinc-900 p-5">
              <div className="text-4xl">
                {coach.emoji}
              </div>

              <h3 className="mt-3 text-2xl font-black text-white">
                {coach.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {coach.message}
              </p>
            </div>

            <div className="rounded-2xl border border-violet-600/20 bg-violet-600/10 p-5">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>

                <div>
                  <p className="font-bold text-violet-400">
                    Coach tip
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {coach.tip}
                  </p>
                </div>
              </div>
            </div>

            {analysis.bestMove && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Want a challenge?
                </p>

                <p className="mt-2 text-lg font-bold text-white">
                  Can you find the strongest move?
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  Try to find it yourself before revealing the answer.
                </p>

                <details className="mt-4">
                  <summary className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-500">
                    Reveal the coach's move
                  </summary>

                  <div className="mt-3 rounded-xl bg-zinc-950 p-4">
                    <p className="text-3xl font-black text-violet-500">
                      {analysis.bestMove}
                    </p>
                  </div>
                </details>
              </div>
            )}

            <div className="border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() =>
                  setShowDetails((current) => !current)
                }
                className="text-xs font-medium text-zinc-600 transition hover:text-zinc-400"
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

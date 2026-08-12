"use client";

import { useEffect, useState } from "react";
import {
  evaluatePosition,
  EngineEvaluation,
} from "@/lib/chess/stockfish";

interface EngineAnalysisProps {
  fen: string;
}

function formatEvaluation(analysis: EngineEvaluation) {
  if (analysis.mate !== null) {
    return `Mate in ${Math.abs(analysis.mate)}`;
  }

  if (analysis.evaluation >= 0) {
    return `+${analysis.evaluation.toFixed(2)}`;
  }

  return analysis.evaluation.toFixed(2);
}

function getPositionAssessment(
  analysis: EngineEvaluation
): string {
  if (analysis.mate !== null) {
    return analysis.mate > 0
      ? "White has a forced checkmate."
      : "Black has a forced checkmate.";
  }

  const evaluation = analysis.evaluation;

  if (evaluation >= 1.5) {
    return "White has a strong advantage.";
  }

  if (evaluation >= 0.5) {
    return "White has a small advantage.";
  }

  if (evaluation > -0.5) {
    return "The position is roughly balanced.";
  }

  if (evaluation > -1.5) {
    return "Black has a small advantage.";
  }

  return "Black has a strong advantage.";
}

function getCoachInsight(
  analysis: EngineEvaluation
): string {
  if (analysis.mate !== null) {
    return analysis.mate > 0
      ? "Look for the forcing sequence that leads to checkmate."
      : "Black has a forcing sequence that leads to checkmate.";
  }

  if (!analysis.bestMove) {
    return "Stockfish could not provide a recommendation for this position.";
  }

  const evaluation = analysis.evaluation;

  if (evaluation >= 1.5) {
    return `Look for ways to convert your advantage. The engine recommends ${analysis.bestMove}.`;
  }

  if (evaluation <= -1.5) {
    return `The position needs accurate defence. The engine recommends ${analysis.bestMove}.`;
  }

  return `The engine recommends ${analysis.bestMove} as the strongest continuation.`;
}

export default function EngineAnalysis({
  fen,
}: EngineAnalysisProps) {
  const [analysis, setAnalysis] =
    useState<EngineEvaluation | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fen) {
      setAnalysis(null);
      return;
    }

    let cancelled = false;

    async function analyse() {
      setLoading(true);
      setError("");

      try {
        const result = await evaluatePosition(fen, 12);

        if (!cancelled) {
          setAnalysis(result);
        }
      } catch (err) {
        console.error("Stockfish error:", err);

        if (!cancelled) {
          setError(
            "Unable to analyse this position."
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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-emerald-400">
          ChessCoach
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Position Coach
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Understand what the engine sees and why it matters.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        {loading && (
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Analysing
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              Stockfish is evaluating this position...
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        {!loading && !error && analysis && (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Position assessment
              </p>

              <p className="mt-2 text-lg font-medium text-zinc-100">
                {getPositionAssessment(analysis)}
              </p>

              <p className="mt-1 text-3xl font-semibold">
                {formatEvaluation(analysis)}
              </p>
            </div>

            {analysis.bestMove && (
              <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Engine recommendation
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-400">
                  {analysis.bestMove}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Coach's insight
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {getCoachInsight(analysis)}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

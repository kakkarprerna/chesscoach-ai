"use client";

interface GameSummaryProps {
  white: string;
  black: string;
  result: string;
  event: string;
  date: string;
  moveCount: number;
  opening: string;
}

export default function GameSummary({
  white,
  black,
  result,
  event,
  date,
  moveCount,
  opening,
}: GameSummaryProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-emerald-400">
            Game
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            {white} vs {black}
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            {event}
            {date ? ` · ${date}` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-4 text-center">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Result
          </p>

          <p className="mt-1 text-2xl font-semibold text-white">
            {result}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Opening
          </p>

          <p className="mt-2 font-medium text-zinc-200">
            {opening}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Moves
          </p>

          <p className="mt-2 font-medium text-zinc-200">
            {moveCount}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Result
          </p>

          <p className="mt-2 font-medium text-zinc-200">
            {result}
          </p>
        </div>
      </div>
    </section>
  );
}
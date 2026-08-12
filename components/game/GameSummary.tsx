interface GameSummaryProps {
  white: string;
  black: string;
  result: string;
  event: string;
  date: string;
  moveCount: number;
  opening: string;
  variation: string;
  eco: string;
}

export default function GameSummary({
  white,
  black,
  result,
  event,
  date,
  moveCount,
  opening,
  variation,
  eco,
}: GameSummaryProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-violet-500">
          Game summary
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          {white} vs {black}
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          {event}
          {date && ` · ${date}`}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Result
          </p>

          <p className="mt-2 text-lg font-semibold text-zinc-100">
            {result}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Moves
          </p>

          <p className="mt-2 text-lg font-semibold text-zinc-100">
            {moveCount}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Opening
          </p>

          <p className="mt-2 font-medium text-zinc-200">
            {opening}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {variation}
          </p>

          <p className="mt-2 text-xs text-zinc-600">
            ECO {eco}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Players
          </p>

          <p className="mt-2 text-sm text-zinc-300">
            White: {white}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Black: {black}
          </p>
        </div>
      </div>
    </section>
  );
}
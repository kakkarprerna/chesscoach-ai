"use client";

import { StoredGame } from "@/lib/chess/gameHistory";

interface GameHistorySelectorProps {
  games: StoredGame[];
  selectedGameIds: string[];
  onChange: (ids: string[]) => void;
}

export default function GameHistorySelector({
  games,
  selectedGameIds,
  onChange,
}: GameHistorySelectorProps) {
  function selectLast20() {
    onChange(games.map((game) => game.id));
  }

  function clearSelection() {
    onChange([]);
  }

  function toggleGame(gameId: string) {
    if (selectedGameIds.includes(gameId)) {
      onChange(
        selectedGameIds.filter((id) => id !== gameId)
      );
      return;
    }

    onChange([...selectedGameIds, gameId]);
  }

  if (games.length === 0) {
    return (
      <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
            ♟
          </div>

          <h3 className="mt-4 text-xl font-black text-zinc-900">
            Your game library is empty
          </h3>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Analyze a few games and they&apos;ll appear here.
            Later, ChessCoach can use them to find patterns
            across your games.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-5 shadow-sm sm:p-7">
      <div className="text-center sm:text-left">
        <div className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
          Learn from your games
        </div>

        <h2 className="text-2xl font-black text-zinc-900 sm:text-3xl">
          What should your coach study?
        </h2>

        <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-600">
          Pick your games and we&apos;ll use them later to
          spot patterns and create practice puzzles.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={selectLast20}
          className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500"
        >
          Study my last {games.length} games
        </button>

        <button
          type="button"
          onClick={clearSelection}
          className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
        >
          Clear selection
        </button>
      </div>

      <div className="mt-5 rounded-2xl bg-indigo-50 px-4 py-3">
        <p className="text-sm font-bold text-indigo-700">
          {selectedGameIds.length}{" "}
          {selectedGameIds.length === 1
            ? "game"
            : "games"}{" "}
          selected
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {games.map((game, index) => {
          const selected =
            selectedGameIds.includes(game.id);

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => toggleGame(game.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-indigo-300 bg-indigo-50 shadow-sm"
                  : "border-zinc-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
                    selected
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {selected ? "✓" : index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-zinc-900">
                      {game.white}
                    </span>

                    <span className="text-zinc-400">
                      vs
                    </span>

                    <span className="font-bold text-zinc-900">
                      {game.black}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-500">
                    <span>{game.result}</span>

                    {game.opening && (
                      <span>{game.opening}</span>
                    )}

                    {game.date && (
                      <span>{game.date}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

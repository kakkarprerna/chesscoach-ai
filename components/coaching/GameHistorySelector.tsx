"use client";

import {
  AnalyzedGame,
  GameSelectionMode,
} from "@/lib/chess/gameHistory";

interface GameHistorySelectorProps {
  games: AnalyzedGame[];
  selectedGameIds: string[];
  selectionMode: GameSelectionMode;
  onSelectMode: (mode: GameSelectionMode) => void;
  onToggleGame: (gameId: string) => void;
  onOpenGame?: (game: AnalyzedGame) => void;
}

export default function GameHistorySelector({
  games,
  selectedGameIds,
  selectionMode,
  onSelectMode,
  onToggleGame,
  onOpenGame,
}: GameHistorySelectorProps) {
  if (games.length === 0) {
    return (
      <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
            ♟
          </div>

          <h3 className="mt-4 text-xl font-black text-zinc-900">
            Your game library is empty
          </h3>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Analyze a few games and they&apos;ll appear here.
          </p>
        </div>
      </section>
    );
  }

  const modes: {
    value: GameSelectionMode;
    label: string;
  }[] = [
    { value: "last-5", label: "Last 5" },
    { value: "last-10", label: "Last 10" },
    { value: "last-20", label: "Last 20" },
    { value: "selected", label: "Pick games" },
  ];

  return (
    <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-5 shadow-sm sm:p-7">
      <div>
        <div className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
          Learn from your games
        </div>

        <h2 className="text-2xl font-black text-zinc-900 sm:text-3xl">
          What should your coach study?
        </h2>

        <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-600">
          Open a game to analyse it on its own, or choose several games
          to find patterns and create practice puzzles.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {modes.map((mode) => {
          const active = selectionMode === mode.value;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onSelectMode(mode.value)}
              className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-indigo-200 hover:bg-indigo-50"
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-indigo-50 px-4 py-3">
        <p className="text-sm font-bold text-indigo-700">
          {selectionMode === "last-5" &&
            `Studying your ${Math.min(5, games.length)} most recent games`}

          {selectionMode === "last-10" &&
            `Studying your ${Math.min(10, games.length)} most recent games`}

          {selectionMode === "last-20" &&
            `Studying your ${Math.min(20, games.length)} most recent games`}

          {selectionMode === "selected" &&
            `${selectedGameIds.length} ${
              selectedGameIds.length === 1 ? "game" : "games"
            } selected`}
        </p>
      </div>

      <div className="mt-5 max-h-[560px] overflow-y-auto rounded-2xl pr-1">
        <div className="grid gap-3">
          {games.map((game, index) => {
          const selected = selectedGameIds.includes(game.id);

          return (
            <div
              key={game.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
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

                    <span className="text-zinc-400">vs</span>

                    <span className="font-bold text-zinc-900">
                      {game.black}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-500">
                    <span>{game.result}</span>

                    {game.opening && <span>{game.opening}</span>}

                    {game.date && <span>{game.date}</span>}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenGame?.(game)}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-500"
                    >
                      Open game
                    </button>

                    {selectionMode === "selected" && (
                      <button
                        type="button"
                        onClick={() => onToggleGame(game.id)}
                        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                          selected
                            ? "border border-indigo-200 bg-indigo-50 text-indigo-700"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:border-indigo-200 hover:bg-indigo-50"
                        }`}
                      >
                        {selected ? "Remove from study" : "Add to study"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

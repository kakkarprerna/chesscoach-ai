"use client";

import { useState } from "react";

interface PGNImporterProps {
  onLoadGame: (pgn: string) => void;
}

export default function PGNImporter({
  onLoadGame,
}: PGNImporterProps) {
  const [pgn, setPgn] = useState("");

  function handleLoadGame() {
    const trimmedPgn = pgn.trim();

    if (!trimmedPgn) {
      return;
    }

    onLoadGame(trimmedPgn);
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-emerald-400">
          Import game
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Load a chess game
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Paste the PGN of a game you want to analyse.
        </p>
      </div>

      <textarea
        value={pgn}
        onChange={(event) => setPgn(event.target.value)}
        placeholder={`Paste PGN here...

Example:
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6`}
        className="mt-6 min-h-48 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-500"
      />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-zinc-600">
          PGN format supported
        </p>

        <button
          type="button"
          onClick={handleLoadGame}
          disabled={!pgn.trim()}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Load game
        </button>
      </div>
    </section>
  );
}
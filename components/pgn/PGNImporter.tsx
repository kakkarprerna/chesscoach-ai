"use client";

import { useState } from "react";

interface PGNImporterProps {
  onLoadGame: (pgn: string) => void;
}

export default function PGNImporter({
  onLoadGame,
}: PGNImporterProps) {
  const [pgn, setPgn] = useState("");
  const [error, setError] = useState("");

  function handleLoadGame() {
    const trimmedPGN = pgn.trim();

    if (!trimmedPGN) {
      setError("Please paste a PGN before loading the game.");
      return;
    }

    setError("");
    onLoadGame(trimmedPGN);
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-violet-500">
          Import game
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Load a PGN
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Paste a chess game below and load it into ChessCoach.
        </p>
      </div>

      <textarea
        value={pgn}
        onChange={(event) => {
          setPgn(event.target.value);
          setError("");
        }}
        placeholder={`Paste PGN here...

Example:

1. e4 e5
2. Nf3 Nc6
3. Bc4 Nf6`}
        className="mt-6 min-h-48 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-600"
      />

      <button
        type="button"
        onClick={handleLoadGame}
        className="mt-4 w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-3 font-medium text-white transition hover:bg-violet-500"
      >
        Load Game
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-zinc-600">
        Characters entered: {pgn.length}
      </p>
    </section>
  );
}
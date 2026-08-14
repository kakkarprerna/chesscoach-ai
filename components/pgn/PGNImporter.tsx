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
      setError("Paste a PGN before loading the game.");
      return;
    }

    setError("");
    onLoadGame(trimmedPGN);
  }

  return (
    <section className="rounded-[24px] border border-[#e4e2db] bg-[#faf9f6] p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">
        PGN import
      </p>

      <h3 className="mt-2 text-xl font-black text-zinc-900">
        Add a chess game
      </h3>

      <p className="mt-1.5 text-sm leading-6 text-zinc-500">
        Paste a PGN below to add the game to your library.
      </p>

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
        className="mt-5 min-h-[220px] w-full resize-y rounded-2xl border border-[#dedcd5] bg-white p-4 font-mono text-sm leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-400">
          Characters entered: {pgn.length}
        </p>

        <button
          type="button"
          onClick={handleLoadGame}
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-700"
        >
          Add to Game Library
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

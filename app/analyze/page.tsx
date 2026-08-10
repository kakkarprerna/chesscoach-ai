"use client";

import { useState } from "react";
import PGNImporter from "@/components/pgn/PGNImporter";
import ChessGame from "@/components/chess/ChessGame";
import GameSummary from "@/components/game/GameSummary";
import { parsePGN, ParsedGame } from "@/lib/chess/parsePGN";
import OpeningStudy from "@/components/opening/OpeningStudy";

export default function AnalyzePage() {
  const [pgn, setPgn] = useState("");
  const [gameSummary, setGameSummary] = useState<ParsedGame | null>(null);

  function handleLoadGame(newPgn: string) {
    try {
      const parsedGame = parsePGN(newPgn);

      setPgn(newPgn);
      setGameSummary(parsedGame);
    } catch {
      setPgn("");
      setGameSummary(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">
            Game Analysis
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Analyse your game
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Import a game and use ChessCoach AI to understand what happened,
            why it happened, and how to improve.
          </p>
        </div>

        <div className="space-y-8">
          <PGNImporter onLoadGame={handleLoadGame} />

          {gameSummary && (
            <GameSummary
              white={gameSummary.white}
              black={gameSummary.black}
              result={gameSummary.result}
              event={gameSummary.event}
              date={gameSummary.date}
              moveCount={gameSummary.moveCount}
              opening={gameSummary.opening}
            />
          )}
          {gameSummary && (
  <OpeningStudy opening={gameSummary.opening} />
)}

          <ChessGame pgn={pgn} />
        </div>
      </div>
    </main>
  );
}
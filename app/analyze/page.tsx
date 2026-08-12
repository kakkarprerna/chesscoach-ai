"use client";

import { useState } from "react";
import PGNImporter from "@/components/pgn/PGNImporter";
import ChessGame from "@/components/chess/ChessGame";
import GameSummary from "@/components/game/GameSummary";
import { parsePGN, ParsedGame } from "@/lib/chess/parsePGN";
import OpeningStudy from "@/components/opening/OpeningStudy";
import EngineAnalysis from "@/components/chess/EngineAnalysis";
import GameAnalysis from "@/components/chess/GameAnalysis";

export default function AnalyzePage() {
  const [pgn, setPgn] = useState("");
  const [gameSummary, setGameSummary] =
    useState<ParsedGame | null>(null);
  const [currentFen, setCurrentFen] = useState("");

  function handleLoadGame(newPgn: string) {
    try {
      const parsedGame = parsePGN(newPgn);

      setPgn(newPgn);
      setGameSummary(parsedGame);

      // Reset engine position until ChessGame reports the
      // newly loaded position.
      setCurrentFen("");
    } catch (error) {
      console.error("Failed to load PGN:", error);

      setPgn("");
      setGameSummary(null);
      setCurrentFen("");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">
            Game Analysis
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Analyse your game
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Import a game and use ChessCoach AI to understand
            what happened, why it happened, and how to improve.
          </p>
        </div>

        <div className="space-y-8">
          {/* PGN Import */}
          <PGNImporter onLoadGame={handleLoadGame} />

          {/* Game Summary */}
          {gameSummary && (
            <GameSummary
              white={gameSummary.white}
              black={gameSummary.black}
              result={gameSummary.result}
              event={gameSummary.event}
              date={gameSummary.date}
              moveCount={gameSummary.moveCount}
              opening={gameSummary.opening}
              variation={gameSummary.variation}
              eco={gameSummary.eco}
            />
          )}

          {/* Opening Study */}
          {gameSummary && (
            <OpeningStudy
              opening={gameSummary.opening}
              variation={gameSummary.variation}
              eco={gameSummary.eco}
            />
          )}

          {/* Chessboard + Replay */}
          {pgn && (
            <ChessGame
              pgn={pgn}
              onPositionChange={setCurrentFen}
            />
          )}

          {/* Engine Analysis for selected position */}
          {currentFen && (
            <EngineAnalysis fen={currentFen} />
          )}

          {/* Full Game Analysis */}
          {pgn && (
            <GameAnalysis
              pgn={pgn}
              onSelectMove={(fen) => {
                setCurrentFen(fen);
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}
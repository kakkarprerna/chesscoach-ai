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
      setCurrentFen("");
    } catch (error) {
      console.error("Failed to load PGN:", error);

      setPgn("");
      setGameSummary(null);
      setCurrentFen("");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-indigo-50 text-zinc-900">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-12">

        {/* Friendly header */}
        <header className="mb-10 text-center sm:text-left">
          <div className="mb-4 inline-flex items-center rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            ChessCoach AI
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Let&apos;s learn from your game!
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
            Bring in a chess game and we&apos;ll help you discover
            your best moves, tricky moments, and ideas for your
            next game.
          </p>
        </header>

        <div className="space-y-8">

          {/* Import */}
          <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-zinc-900">
                1. Bring your game
              </h2>

              <p className="mt-1 text-zinc-500">
                Paste your PGN and let&apos;s take a look.
              </p>
            </div>

            <PGNImporter onLoadGame={handleLoadGame} />
          </section>

          {/* Game summary */}
          {gameSummary && (
            <section>
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
            </section>
          )}

          {/* Opening */}
          {gameSummary && (
            <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
              <OpeningStudy
                opening={gameSummary.opening}
                variation={gameSummary.variation}
                eco={gameSummary.eco}
              />
            </section>
          )}

          {/* Board */}
          {pgn && (
            <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <div className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                  2. Explore
                </div>

                <h2 className="text-2xl font-bold text-zinc-900">
                  Replay your game
                </h2>

                <p className="mt-1 text-zinc-500">
                  Move through the game and see what happened.
                </p>
              </div>

              <ChessGame
                pgn={pgn}
                onPositionChange={setCurrentFen}
              />
            </section>
          )}

          {/* Position analysis */}
          {currentFen && (
            <section className="rounded-3xl border border-purple-100 bg-purple-50/60 p-5 shadow-sm sm:p-7">
              <div className="mb-5">
                <div className="mb-2 inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                  3. Discover
                </div>

                <h2 className="text-2xl font-bold text-zinc-900">
                  What does your chess coach think?
                </h2>

                <p className="mt-1 text-zinc-600">
                  Take a closer look at this position.
                </p>
              </div>

              <EngineAnalysis fen={currentFen} />
            </section>
          )}

          {/* Full game analysis */}
          {pgn && (
            <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5">
                <div className="mb-2 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                  4. Improve
                </div>

                <h2 className="text-2xl font-bold text-zinc-900">
                  Your game story
                </h2>

                <p className="mt-1 text-zinc-500">
                  Find the moments that can make your next game
                  even better.
                </p>
              </div>

              <GameAnalysis
                pgn={pgn}
                onSelectMove={(fen) => {
                  setCurrentFen(fen);
                }}
              />
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
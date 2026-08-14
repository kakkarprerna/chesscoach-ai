"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PGNImporter from "@/components/pgn/PGNImporter";
import ChessGame from "@/components/chess/ChessGame";
import GameSummary from "@/components/game/GameSummary";
import {
  parsePGN,
  ParsedGame,
  splitPGNGames,
} from "@/lib/chess/parsePGN";
import OpeningStudy from "@/components/opening/OpeningStudy";
import EngineAnalysis from "@/components/chess/EngineAnalysis";
import GameAnalysis from "@/components/chess/GameAnalysis";
import {
  createLibraryGame,
  saveGamesToLibrary,
} from "@/lib/chess/gameLibrary";

type Tab =
  | "overview"
  | "coach"
  | "opening"
  | "engine"
  | "replay";

const tabs: {
  id: Tab;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Your game at a glance",
    icon: "✨",
  },
  {
    id: "coach",
    label: "Coach",
    description: "Key moments to learn from",
    icon: "🧠",
  },
  {
    id: "opening",
    label: "Opening",
    description: "Study how you started",
    icon: "📖",
  },
  {
    id: "engine",
    label: "Explore",
    description: "Analyze this position",
    icon: "🔎",
  },
  {
    id: "replay",
    label: "Replay",
    description: "Move through your game",
    icon: "▶",
  },
];

export default function AnalyzePage() {
  const router = useRouter();
    useEffect(() => {
    const importedPgn = sessionStorage.getItem(
      "chesscoach-imported-pgn"
    );

    if (!importedPgn) {
      return;
    }

    sessionStorage.removeItem("chesscoach-imported-pgn");

  try {
  const games = splitPGNGames(importedPgn);

  if (games.length === 0) {
    throw new Error("No valid chess games were found.");
  }

  const firstGame = games[0];
  const parsedGame = parsePGN(firstGame);

  setPgn(firstGame);
  setGameSummary(parsedGame);
  setCurrentFen("");
  setSelectedCoachFen(null);
  setActiveTab("overview");
} catch (error) {
      console.error(
        "Failed to load imported games:",
        error
      );
    }
  }, []);
  const [pgn, setPgn] = useState("");
  const [gameSummary, setGameSummary] =
    useState<ParsedGame | null>(null);

  const [currentFen, setCurrentFen] = useState("");
  const [selectedCoachFen, setSelectedCoachFen] =
    useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<Tab>("overview");

 function handleLoadGame(newPgn: string) {
  try {
    const games = splitPGNGames(newPgn);

    if (games.length === 0) {
      throw new Error("No valid chess games were found.");
    }

    const libraryGames = [];

    for (const game of games) {
      try {
        const parsed = parsePGN(game);

        libraryGames.push(
          createLibraryGame(game, parsed, "pgn")
        );
      } catch (error) {
        console.error(
          "Failed to parse one imported game:",
          error
        );
      }
    }

    if (libraryGames.length === 0) {
      throw new Error("No valid chess games were found.");
    }

    saveGamesToLibrary(libraryGames);

    const firstGame = games[0];
    const parsedGame = parsePGN(firstGame);

    setPgn(firstGame);
    setGameSummary(parsedGame);
    setCurrentFen("");
    setSelectedCoachFen(null);
    setActiveTab("overview");
  } catch (error) {
    console.error("Failed to load PGN:", error);

    setPgn("");
    setGameSummary(null);
    setCurrentFen("");
    setSelectedCoachFen(null);
  }
}

  function handleCoachPosition(fen: string) {
    setSelectedCoachFen(fen);
    setCurrentFen(fen);
    setActiveTab("coach");
  }

  function resetGame() {
    setPgn("");
    setGameSummary(null);
    setCurrentFen("");
    setSelectedCoachFen(null);
    setActiveTab("overview");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[#e8e6df] bg-[#fdfdfb]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <div>
            <div className="text-sm font-black tracking-tight text-violet-600">
              ChessCoach AI
            </div>

            <h1 className="mt-0.5 text-xl font-black tracking-tight text-zinc-900">
              Learn from your game
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/games")}
              className="rounded-xl border border-[#dedcd5] bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              Game Library
            </button>

          {pgn && (
            <button
              type="button"
              onClick={resetGame}
              className="rounded-xl border border-[#dedcd5] bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              Import another game
            </button>
          )}
          </div>
        </div>
      </header>

      {/* Import screen */}
      {!pgn && (
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-20">
          <div className="overflow-hidden rounded-[32px] border border-[#e5e3dc] bg-white shadow-[0_12px_40px_rgba(30,25,50,0.06)]">
            <div className="bg-gradient-to-br from-violet-50 via-white to-amber-50 p-7 sm:p-10">
              <div className="mb-4 inline-flex rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-violet-700 shadow-sm">
                ✨ Start here
              </div>

              <h2 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
                Bring your game
              </h2>

              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
                Paste a PGN and ChessCoach will help you replay,
                understand, and learn from the moments that mattered.
              </p>
            </div>

            <div className="p-7 sm:p-10">
              <PGNImporter onLoadGame={handleLoadGame} />
            </div>
          </div>
        </div>
      )}

      {/* Main learning workspace */}
      {pgn && (
        <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 sm:py-5">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            {/* Lesson sidebar */}
            <aside className="h-fit rounded-[28px] border border-[#e4e2db] bg-white p-3 shadow-[0_8px_30px_rgba(30,25,50,0.05)] lg:sticky lg:top-[92px]">
              <div className="px-3 pb-4 pt-2">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                  Your lesson
                </p>

                {gameSummary && (
                  <p className="mt-1.5 truncate text-sm font-bold text-zinc-800">
                    {gameSummary.white} vs {gameSummary.black}
                  </p>
                )}
              </div>

              <nav className="space-y-1.5">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`group w-full rounded-2xl px-3.5 py-3 text-left transition ${
                        active
                          ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                          : "text-zinc-700 hover:bg-[#f7f5ff] hover:text-violet-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-base">
                          {tab.icon}
                        </span>

                        <div className="min-w-0">
                          <div className="text-sm font-black">
                            {tab.label}
                          </div>

                          <div
                            className={`mt-0.5 text-[11px] leading-4 ${
                              active
                                ? "text-violet-100"
                                : "text-zinc-400 group-hover:text-violet-400"
                            }`}
                          >
                            {tab.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 border-t border-[#efede7] pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("replay")}
                  className="w-full rounded-2xl border border-[#eceae4] bg-[#faf9f6] px-3.5 py-3 text-left transition hover:border-amber-200 hover:bg-amber-50"
                >
                  <div className="flex items-center gap-2">
                    <span>♟</span>
                    <span className="text-sm font-black text-zinc-800">
                      Replay game
                    </span>
                  </div>

                  <div className="mt-1 pl-6 text-[11px] text-zinc-400">
                    Use the board controls
                  </div>
                </button>
              </div>
            </aside>

            {/* Workspace */}
            <div className="min-w-0">
              <div className="grid items-start gap-4 xl:grid-cols-[minmax(560px,1fr)_minmax(380px,500px)]">
                {/* Board column */}
                <section className="min-w-0">
                  {gameSummary && (
                    <div className="mb-5 rounded-[24px] border border-[#e4e2db] bg-white p-4 shadow-sm sm:p-5">
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">

                        {/* White player */}
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                            White
                          </p>
                          <p className="mt-1 truncate text-lg font-black text-zinc-900">
                            {gameSummary.white}
                          </p>
                        </div>

                        {/* Result */}
                        <div className="flex justify-center">
                          <div
                            className={`rounded-2xl border px-5 py-3 text-center ${
                              gameSummary.result === "1-0"
                                ? "border-emerald-200 bg-emerald-50"
                                : gameSummary.result === "0-1"
                                  ? "border-red-200 bg-red-50"
                                  : "border-zinc-200 bg-zinc-50"
                            }`}
                          >
                            <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                              Result
                            </p>

                            <p
                              className={`mt-1 text-2xl font-black ${
                                gameSummary.result === "1-0"
                                  ? "text-emerald-700"
                                  : gameSummary.result === "0-1"
                                    ? "text-red-700"
                                    : "text-zinc-700"
                              }`}
                            >
                              {gameSummary.result}
                            </p>
                          </div>
                        </div>

                        {/* Black player */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 sm:text-right">
                          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
                            Black
                          </p>
                          <p className="mt-1 truncate text-lg font-black text-white">
                            {gameSummary.black}
                          </p>
                        </div>

                      </div>
                    </div>
                  )}

                  <ChessGame
                    pgn={pgn}
                    externalFen={
                      selectedCoachFen ?? undefined
                    }
                    onPositionChange={setCurrentFen}
                  />
                </section>

                {/* Learning panel */}
                <section className="min-w-0">
                  <div className="overflow-hidden rounded-[28px] border border-[#e4e2db] bg-white shadow-[0_8px_30px_rgba(30,25,50,0.05)]">
                    <div className="max-h-[calc(100vh-105px)] overflow-y-auto overscroll-contain">
                      {activeTab === "overview" &&
                        gameSummary && (
                          <div className="space-y-4 p-5">
                            <PanelHeader
                              icon="✨"
                              eyebrow="Overview"
                              title="Your game at a glance"
                              description="A quick look at what you played and what to explore next."
                            />

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

                            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                              <div className="text-xl">
                                🧩
                              </div>

                              <p className="mt-2 text-sm font-black text-amber-900">
                                Ready to discover something?
                              </p>

                              <p className="mt-1 text-sm leading-6 text-amber-800/80">
                                Your Coach will pick out the
                                moments that are most useful to
                                learn from.
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  setActiveTab("coach")
                                }
                                className="mt-4 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-amber-950 shadow-sm transition hover:bg-amber-300"
                              >
                                Meet your Coach →
                              </button>
                            </div>
                          </div>
                        )}

                      {activeTab === "coach" && (
                        <div className="p-5">
                          <GameAnalysis
                            pgn={pgn}
                            onSelectMove={handleCoachPosition}
                          />
                        </div>
                      )}

                      {activeTab === "opening" &&
                        gameSummary && (
                          <div className="space-y-4 p-5">
                            <PanelHeader
                              icon="📖"
                              eyebrow="Opening"
                              title="Study your opening"
                              description="Understand how you started and what to study next."
                            />

                            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
                              <OpeningStudy
                                opening={gameSummary.opening}
                                variation={gameSummary.variation}
                                eco={gameSummary.eco}
                              />
                            </div>
                          </div>
                        )}

                      {activeTab === "engine" && (
                        <div className="space-y-4 p-5">
                          <PanelHeader
                            icon="🔎"
                            eyebrow="Explore"
                            title="Analyze this position"
                            description="Use Stockfish to understand the position currently shown on the board."
                          />

                          {currentFen ? (
                            <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
                              <EngineAnalysis
                                fen={currentFen}
                              />
                            </div>
                          ) : (
                            <EmptyPanel
                              icon="♟"
                              title="No position selected"
                              description="Use the board controls to choose a position first."
                            />
                          )}
                        </div>
                      )}

                      {activeTab === "replay" && (
                        <div className="space-y-4 p-5">
                          <PanelHeader
                            icon="▶"
                            eyebrow="Replay"
                            title="Replay your game"
                            description="Move through the game using the controls on the board."
                          />

                          <div className="rounded-3xl border border-[#e7e5df] bg-[#faf9f6] p-5">
                            <div className="text-2xl">
                              🎮
                            </div>

                            <p className="mt-3 text-sm font-black text-zinc-900">
                              The board is your replay
                              workspace.
                            </p>

                            <p className="mt-1 text-sm leading-6 text-zinc-500">
                              Use Back, Next, First, and Last
                              to move through the game.
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveTab("engine")
                              }
                              className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-500"
                            >
                              Analyze this position →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function PanelHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-violet-50 via-white to-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
          {icon}
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-600">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-900">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-[#e7e5df] bg-[#faf9f6] p-8 text-center">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-3 text-lg font-black text-zinc-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

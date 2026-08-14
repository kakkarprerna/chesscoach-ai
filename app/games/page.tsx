"use client";

import { useState } from "react";
import PGNImporter from "@/components/pgn/PGNImporter";

type ImportSource = "pgn" | "lichess" | "chesscom";

const sources: {
  id: ImportSource;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "pgn",
    label: "Paste PGN",
    description: "Import a game directly",
    icon: "♟",
  },
  {
    id: "lichess",
    label: "Lichess",
    description: "Import your recent games",
    icon: "♞",
  },
  {
    id: "chesscom",
    label: "Chess.com",
    description: "Import your recent games",
    icon: "♛",
  },
];

export default function GamesPage() {
  const [source, setSource] = useState<ImportSource>("pgn");
  const [username, setUsername] = useState("");
  const [gameCount, setGameCount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handlePGNImport(pgn: string) {
    if (!pgn.trim()) return;

    window.location.href = `/analyze?imported=true`;
  }

  async function handleUsernameImport() {
    if (!username.trim()) {
      setMessage("Enter your username first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const endpoint =
        source === "lichess"
          ? "/api/games/lichess"
          : "/api/games/chesscom";

      const response = await fetch(
        `${endpoint}?username=${encodeURIComponent(
          username.trim()
        )}&max=${gameCount}`
      );

      const data = await response.text();

      if (!response.ok) {
        let errorMessage = "Unable to import games.";

        try {
          const parsed = JSON.parse(data);

          if (parsed.error) {
            errorMessage = parsed.error;
          }
        } catch {
          // Keep default error message.
        }

        setMessage(errorMessage);
        return;
      }

      sessionStorage.setItem(
        "chesscoach-imported-pgn",
        data
      );

      sessionStorage.setItem(
        "chesscoach-import-source",
        source
      );

      sessionStorage.setItem(
        "chesscoach-import-username",
        username.trim()
      );

      window.location.href = "/analyze";
    } catch (error) {
      console.error("Game import failed:", error);
      setMessage(
        "Something went wrong while importing the games."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e8e6df] bg-[#fdfdfb]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <div>
            <div className="text-sm font-black tracking-tight text-violet-600">
              ChessCoach AI
            </div>

            <h1 className="mt-0.5 text-xl font-black tracking-tight text-zinc-900">
              Your games
            </h1>
          </div>

          <a
            href="/analyze"
            className="rounded-xl border border-[#dedcd5] bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            Analyze a game
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6 sm:py-16">
        {/* Hero */}
        <section className="overflow-hidden rounded-[32px] border border-[#e5e3dc] bg-white shadow-[0_12px_40px_rgba(30,25,50,0.06)]">
          <div className="bg-gradient-to-br from-violet-50 via-white to-amber-50 px-7 py-10 sm:px-12 sm:py-14">
            <div className="mb-4 inline-flex rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-violet-700 shadow-sm">
              Your chess profile
            </div>

            <h2 className="max-w-3xl text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
              Understand how you really play.
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              Import your games and ChessCoach will look
              across them for recurring mistakes, habits,
              openings, and positions worth practising.
            </p>
          </div>

          {/* Source selector */}
          <div className="p-7 sm:p-10">
            <div className="grid gap-3 md:grid-cols-3">
              {sources.map((item) => {
                const active = source === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSource(item.id);
                      setMessage("");
                    }}
                    className={`rounded-2xl border p-5 text-left transition ${
                      active
                        ? "border-violet-300 bg-violet-50 shadow-sm"
                        : "border-[#e8e6df] bg-white hover:border-violet-200 hover:bg-[#faf9ff]"
                    }`}
                  >
                    <div className="text-2xl">
                      {item.icon}
                    </div>

                    <div
                      className={`mt-3 text-sm font-black ${
                        active
                          ? "text-violet-800"
                          : "text-zinc-900"
                      }`}
                    >
                      {item.label}
                    </div>

                    <div className="mt-1 text-xs leading-5 text-zinc-500">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* PGN */}
            {source === "pgn" && (
              <div className="mt-8">
                <PGNImporter
                  onLoadGame={handlePGNImport}
                />
              </div>
            )}

            {/* Username import */}
            {source !== "pgn" && (
              <div className="mt-8 rounded-3xl border border-[#eceae4] bg-[#faf9f6] p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                    {source === "lichess" ? "♞" : "♛"}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-zinc-900">
                      Import from{" "}
                      {source === "lichess"
                        ? "Lichess"
                        : "Chess.com"}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Enter your username and ChessCoach
                      will bring in your recent games.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_180px_auto]">
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-500"
                    >
                      Username
                    </label>

                    <input
                      id="username"
                      value={username}
                      onChange={(event) =>
                        setUsername(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleUsernameImport();
                        }
                      }}
                      placeholder={
                        source === "lichess"
                          ? "Your Lichess username"
                          : "Your Chess.com username"
                      }
                      className="w-full rounded-xl border border-[#dedcd5] bg-white px-4 py-3 text-sm font-medium outline-none transition placeholder:text-zinc-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="game-count"
                      className="mb-2 block text-xs font-black uppercase tracking-wide text-zinc-500"
                    >
                      Games
                    </label>

                    <select
                      id="game-count"
                      value={gameCount}
                      onChange={(event) =>
                        setGameCount(event.target.value)
                      }
                      className="w-full rounded-xl border border-[#dedcd5] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="5">Last 5</option>
                      <option value="10">Last 10</option>
                      <option value="20">Last 20</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleUsernameImport}
                      disabled={loading}
                      className="w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {loading
                        ? "Importing..."
                        : "Import games"}
                    </button>
                  </div>
                </div>

                {message && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {message}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* What we'll discover */}
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-[#e4e2db] bg-white p-6 shadow-[0_8px_30px_rgba(30,25,50,0.04)]">
            <div className="text-xl">🧩</div>

            <h3 className="mt-3 text-base font-black text-zinc-900">
              Recurring patterns
            </h3>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Find mistakes and decisions that appear
              repeatedly across your games.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#e4e2db] bg-white p-6 shadow-[0_8px_30px_rgba(30,25,50,0.04)]">
            <div className="text-xl">🎯</div>

            <h3 className="mt-3 text-base font-black text-zinc-900">
              Positions worth practising
            </h3>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Turn your real games into targeted coaching
              positions instead of generic puzzles.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
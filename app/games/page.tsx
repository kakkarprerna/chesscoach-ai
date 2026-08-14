"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GameSource,
  LibraryGame,
  createLibraryGame,
  getGameLibrary,
  getSourceLabel,
  removeGameFromLibrary,
  saveGamesToLibrary,
} from "@/lib/chess/gameLibrary";
import {
  parsePGN,
  splitPGNGames,
} from "@/lib/chess/parsePGN";

type Filter = "all" | GameSource;

export default function GamesPage() {
  const router = useRouter();

  const [games, setGames] = useState<LibraryGame[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [pgn, setPgn] = useState("");
  const [username, setUsername] = useState("");
  const [source, setSource] = useState<GameSource>("lichess");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    setGames(getGameLibrary());
  }, []);

  const filteredGames = useMemo(() => {
    if (filter === "all") {
      return games;
    }

    return games.filter(
      (game) => game.source === filter
    );
  }, [games, filter]);

  function importPGN() {
    setMessage("");

    const blocks = splitPGNGames(pgn);

    if (!blocks.length) {
      setMessage("Paste a PGN before importing.");
      return;
    }

    const imported: LibraryGame[] = [];

    for (const block of blocks) {
      try {
        const parsed = parsePGN(block);

        imported.push(
          createLibraryGame(
            block,
            parsed,
            "pgn"
          )
        );
      } catch {
        // Ignore malformed blocks and continue
        // with valid games.
      }
    }

    if (!imported.length) {
      setMessage(
        "No valid games were found in the PGN."
      );
      return;
    }

    const updated =
      saveGamesToLibrary(imported);

    setGames(updated);
    setPgn("");
    setShowImport(false);

    setMessage(
      `${imported.length} game${
        imported.length === 1 ? "" : "s"
      } imported.`
    );
  }

  async function importOnlineGames() {
    if (!username.trim()) {
      setMessage("Enter a username first.");
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
        )}&max=20`
      );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.error ||
            "Could not import games."
        );
      }

      const importedPgn =
        await response.text();

      const blocks =
        splitPGNGames(importedPgn);

      const imported: LibraryGame[] = [];

      for (const block of blocks) {
        try {
          const parsed =
            parsePGN(block);

          imported.push(
            createLibraryGame(
              block,
              parsed,
              source
            )
          );
        } catch {
          // Continue with other valid games.
        }
      }

      if (!imported.length) {
        throw new Error(
          "No valid games were found for this player."
        );
      }

      const updated =
        saveGamesToLibrary(imported);

      setGames(updated);
      setUsername("");
      setShowImport(false);

      setMessage(
        `${imported.length} game${
          imported.length === 1 ? "" : "s"
        } imported from ${getSourceLabel(
          source
        )}.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not import games."
      );
    } finally {
      setLoading(false);
    }
  }

  function openGame(game: LibraryGame) {
    sessionStorage.setItem(
      "chesscoach-imported-pgn",
      game.pgn
    );

    router.push("/analyze");
  }

  function openLearningHub() {
    router.push("/learn");
  }

  function removeGame(gameId: string) {
    const updated =
      removeGameFromLibrary(gameId);

    setGames(updated);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-[#e8e6df] bg-[#fdfdfb]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5">
          <div>
            <div className="text-sm font-black tracking-tight text-violet-600">
              ChessCoach AI
            </div>

            <h1 className="mt-0.5 text-xl font-black tracking-tight">
              Game Library
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openLearningHub}
              className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-black text-violet-700 shadow-sm transition hover:bg-violet-100"
            >
              Study my games
            </button>

            <button
              type="button"
              onClick={() =>
                setShowImport(!showImport)
              }
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-700"
            >
              + Import games
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-600">
            Your chess collection
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-black tracking-tight">
                Every game in one place.
              </h2>

              <p className="mt-2 max-w-2xl text-zinc-500">
                Games imported from Lichess,
                Chess.com, or PGN are collected
                here so you can revisit and learn
                from them.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e4e2db] bg-white px-4 py-3 text-sm">
              <span className="font-black">
                {games.length}
              </span>{" "}
              games saved
            </div>
          </div>
        </div>

        {showImport && (
          <section className="mb-8 rounded-[28px] border border-[#e4e2db] bg-white p-6 shadow-[0_8px_30px_rgba(30,25,50,0.05)]">
            <div className="mb-6">
              <h3 className="text-xl font-black">
                Import games
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Add games from your chess platform
                or paste PGN directly.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setSource("lichess");
                  setPgn("");
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  source === "lichess"
                    ? "border-violet-300 bg-violet-50"
                    : "border-[#e5e3dc] hover:bg-[#faf9f6]"
                }`}
              >
                <div className="font-black">
                  Lichess
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Import games by username
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSource("chess.com");
                  setPgn("");
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  source === "chess.com"
                    ? "border-violet-300 bg-violet-50"
                    : "border-[#e5e3dc] hover:bg-[#faf9f6]"
                }`}
              >
                <div className="font-black">
                  Chess.com
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Import games by username
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSource("pgn")
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  source === "pgn"
                    ? "border-violet-300 bg-violet-50"
                    : "border-[#e5e3dc] hover:bg-[#faf9f6]"
                }`}
              >
                <div className="font-black">
                  PGN
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Paste one or multiple games
                </div>
              </button>
            </div>

            {source === "pgn" ? (
              <div className="mt-5">
                <textarea
                  value={pgn}
                  onChange={(event) =>
                    setPgn(event.target.value)
                  }
                  placeholder="Paste your PGN here..."
                  className="min-h-[220px] w-full rounded-2xl border border-[#dedcd5] bg-[#faf9f6] p-4 font-mono text-sm text-zinc-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />

                <button
                  type="button"
                  onClick={importPGN}
                  className="mt-3 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white hover:bg-violet-700"
                >
                  Add PGN games to library
                </button>
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      importOnlineGames();
                    }
                  }}
                  placeholder={`${getSourceLabel(
                    source
                  )} username`}
                  className="flex-1 rounded-xl border border-[#dedcd5] bg-[#faf9f6] px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={importOnlineGames}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {loading
                    ? "Importing..."
                    : "Import games"}
                </button>
              </div>
            )}

            {message && (
              <p className="mt-4 text-sm font-semibold text-zinc-600">
                {message}
              </p>
            )}
          </section>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          {(
            [
              ["all", "All games"],
              ["lichess", "Lichess"],
              ["chess.com", "Chess.com"],
              ["pgn", "PGN"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                setFilter(id)
              }
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                filter === id
                  ? "bg-violet-600 text-white"
                  : "border border-[#dedcd5] bg-white text-zinc-600 hover:bg-violet-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredGames.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-[#d9d7cf] bg-white px-6 py-16 text-center">
            <div className="text-4xl">
              ♟
            </div>

            <h3 className="mt-4 text-2xl font-black">
              Your library is empty
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Import games from Lichess,
              Chess.com, or paste a PGN. They
              will all appear here together.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowImport(true)
              }
              className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white hover:bg-violet-700"
            >
              Import your first games
            </button>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[28px] border border-[#e4e2db] bg-white shadow-[0_8px_30px_rgba(30,25,50,0.05)]">
            <div className="max-h-[650px] overflow-y-auto">
              <div className="divide-y divide-[#efede7]">
                {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-[#faf9f6] md:flex-row md:items-center md:justify-between"
                >
                  <button
                    type="button"
                    onClick={() =>
                      openGame(game)
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700">
                        {getSourceLabel(
                          game.source
                        )}
                      </span>

                      <span className="text-xs text-zinc-400">
                        {game.date ||
                          "Date unknown"}
                      </span>
                    </div>

                    <h3 className="mt-2 truncate text-lg font-black text-zinc-900">
                      {game.white}{" "}
                      <span className="font-normal text-zinc-400">
                        vs
                      </span>{" "}
                      {game.black}
                    </h3>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span>
                        {game.result}
                      </span>

                      <span>
                        {game.moveCount} moves
                      </span>

                      {game.opening && (
                        <span>
                          {game.opening}
                        </span>
                      )}

                      {game.eco && (
                        <span>
                          ECO {game.eco}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openGame(game)
                      }
                      className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-700"
                    >
                      Analyze
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeGame(game.id)
                      }
                      className="rounded-xl border border-[#dedcd5] px-3 py-2.5 text-xs font-bold text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
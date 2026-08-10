"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

interface ChessGameProps {
  pgn?: string;
}

export default function ChessGame({ pgn }: ChessGameProps) {
  const gameRef = useRef(new Chess());

  const [position, setPosition] = useState(gameRef.current.fen());
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMove, setCurrentMove] = useState(0);
  const [error, setError] = useState("");

  /*
   * Load a PGN whenever the parent provides one.
   */
  useEffect(() => {
    if (!pgn) {
      return;
    }

    try {
      const newGame = new Chess();

      newGame.loadPgn(pgn);

      const history = newGame.history();

      gameRef.current = newGame;

      setMoves(history);
      setCurrentMove(history.length);
      setPosition(newGame.fen());
      setError("");
    } catch {
      setError("This PGN could not be loaded. Please check the format.");
    }
  }, [pgn]);

  /*
   * Rebuild the board position at a specific move.
   */
  function getPositionAtMove(moveNumber: number) {
    if (!pgn) {
      return new Chess().fen();
    }

    try {
      const replayGame = new Chess();

      replayGame.loadPgn(pgn);

      const history = replayGame.history();

      const positionGame = new Chess();

      for (let i = 0; i < moveNumber; i++) {
        positionGame.move(history[i]);
      }

      return positionGame.fen();
    } catch {
      return new Chess().fen();
    }
  }

  /*
   * Move to a specific point in the game.
   */
  function goToMove(moveNumber: number) {
    const safeMove = Math.max(
      0,
      Math.min(moveNumber, moves.length)
    );

    setCurrentMove(safeMove);
    setPosition(getPositionAtMove(safeMove));
  }

  function goToFirstMove() {
    goToMove(0);
  }

  function goToPreviousMove() {
    goToMove(currentMove - 1);
  }

  function goToNextMove() {
    goToMove(currentMove + 1);
  }

  function goToLastMove() {
    goToMove(moves.length);
  }

  /*
   * Manual board moves.
   *
   * We only allow manual moves when the player is
   * looking at the latest position.
   */
function handlePieceDrop({
  sourceSquare,
  targetSquare,
}: {
  sourceSquare: string;
  targetSquare: string | null;
}) {
    if (!targetSquare) {
      return false;
    }

    if (currentMove !== moves.length) {
      return false;
    }

    try {
      const move = gameRef.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) {
        return false;
      }

      const newHistory = gameRef.current.history();

      setMoves(newHistory);
      setCurrentMove(newHistory.length);
      setPosition(gameRef.current.fen());
      setError("");

      return true;
    } catch {
      return false;
    }
  }

  function resetGame() {
    const newGame = new Chess();

    gameRef.current = newGame;

    setPosition(newGame.fen());
    setMoves([]);
    setCurrentMove(0);
    setError("");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[560px_1fr]">
      {/* Chessboard */}
      <div>
       <Chessboard
  options={{
    position,
    onPieceDrop: handlePieceDrop,
  }}
/>

        {/* Navigation */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={goToFirstMove}
            disabled={currentMove === 0}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            First
          </button>

          <button
            type="button"
            onClick={goToPreviousMove}
            disabled={currentMove === 0}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={goToNextMove}
            disabled={currentMove === moves.length}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>

          <button
            type="button"
            onClick={goToLastMove}
            disabled={currentMove === moves.length}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Last
          </button>
        </div>

        <div className="mt-3 text-center text-xs text-zinc-500">
          {moves.length === 0
            ? "No game loaded"
            : `Position ${currentMove} of ${moves.length}`}
        </div>

        <button
          type="button"
          onClick={resetGame}
          className="mt-4 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-800"
        >
          Reset board
        </button>
      </div>

      {/* Game information */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm uppercase tracking-wider text-emerald-400">
          Game workspace
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Your game
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Replay the game move by move and inspect each position.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Move list */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">
              Moves
            </h3>

            <span className="text-xs text-zinc-500">
              {moves.length} moves
            </span>
          </div>

          <div className="max-h-96 min-h-40 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            {moves.length === 0 ? (
              <p className="text-sm text-zinc-600">
                No moves yet.
              </p>
            ) : (
              <div className="space-y-1 text-sm">
                {Array.from(
                  { length: Math.ceil(moves.length / 2) },
                  (_, index) => {
                    const whiteIndex = index * 2;
                    const blackIndex = whiteIndex + 1;

                    const whiteMove = moves[whiteIndex];
                    const blackMove = moves[blackIndex];

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-[32px_1fr_1fr] gap-2"
                      >
                        <span className="py-2 text-zinc-600">
                          {index + 1}.
                        </span>

                        <button
                          type="button"
                          onClick={() => goToMove(whiteIndex + 1)}
                          className={`rounded-lg px-2 py-2 text-left transition ${
                            currentMove === whiteIndex + 1
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "text-zinc-300 hover:bg-zinc-800"
                          }`}
                        >
                          {whiteMove}
                        </button>

                        {blackMove ? (
                          <button
                            type="button"
                            onClick={() => goToMove(blackIndex + 1)}
                            className={`rounded-lg px-2 py-2 text-left transition ${
                              currentMove === blackIndex + 1
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "text-zinc-400 hover:bg-zinc-800"
                            }`}
                          >
                            {blackMove}
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        {/* Current position */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Current position
          </p>

          <p className="mt-2 text-sm text-zinc-300">
            {currentMove === 0
              ? "Starting position"
              : currentMove === moves.length
                ? "Final position"
                : `After ${moves[currentMove - 1]}`}
          </p>
        </div>

        {/* Evaluation placeholder */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Evaluation
          </p>

          <p className="mt-2 text-2xl font-semibold">
            —
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Stockfish analysis will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
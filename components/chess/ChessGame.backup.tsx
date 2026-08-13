"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

interface ChessGameProps {
  pgn: string;
  onPositionChange?: (fen: string) => void;
}

export default function ChessGame({
  pgn,
  onPositionChange,
}: ChessGameProps) {
  const gameRef = useRef(new Chess());

  const [position, setPosition] = useState(
    gameRef.current.fen()
  );

  const [moves, setMoves] = useState<string[]>([]);
  const [currentMove, setCurrentMove] = useState(0);
  const [error, setError] = useState("");

  /*
   * Load PGN.
   *
   * The board initially shows the final position of the
   * imported game.
   */
  useEffect(() => {
    if (!pgn) {
      return;
    }

    try {
      const game = new Chess();

      game.loadPgn(pgn);

      const history = game.history();
      const fen = game.fen();

      gameRef.current = game;

      setMoves(history);
      setCurrentMove(history.length);
      setPosition(fen);
      setError("");

      onPositionChange?.(fen);
    } catch (error) {
      console.error("PGN load error:", error);

      setMoves([]);
      setCurrentMove(0);
      setError(
        "This PGN could not be loaded. Please check the format."
      );
    }
  }, [pgn, onPositionChange]);

  /*
   * Reconstruct the position after a specific number of moves.
   */
  function getPositionAtMove(moveNumber: number): string {
    if (!pgn) {
      return new Chess().fen();
    }

    try {
      const sourceGame = new Chess();

      sourceGame.loadPgn(pgn);

      const history = sourceGame.history();

      const replayGame = new Chess();

      for (let i = 0; i < moveNumber; i++) {
        replayGame.move(history[i]);
      }

      return replayGame.fen();
    } catch (error) {
      console.error(
        "Could not rebuild chess position:",
        error
      );

      return new Chess().fen();
    }
  }

  /*
   * Navigate to a position in the imported game.
   */
  function goToMove(moveNumber: number) {
    const safeMove = Math.max(
      0,
      Math.min(moveNumber, moves.length)
    );

    const fen = getPositionAtMove(safeMove);

    /*
     * Synchronize the actual chess engine state
     * with the position displayed by the board.
     */
    gameRef.current = new Chess(fen);

    setPosition(fen);
    setCurrentMove(safeMove);
    setError("");

    onPositionChange?.(fen);
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
   * Handle a move made directly on the board.
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

    if (sourceSquare === targetSquare) {
      return false;
    }

    /*
     * Do not allow editing a historical position.
     * The user must first go to the latest position.
     */
    if (currentMove !== moves.length) {
      setError(
        "Go to the latest position before making a move."
      );

      return false;
    }

    const game = gameRef.current;

    /*
     * Check what piece is actually on the source square.
     */
    const piece = game.get(sourceSquare as never);

    if (!piece) {
      setError(
        `There is no piece on ${sourceSquare}.`
      );

      return false;
    }

    /*
     * Make sure the player is moving the side whose turn it is.
     */
    const currentTurn = game.turn();

    if (
      (currentTurn === "w" && piece.color !== "w") ||
      (currentTurn === "b" && piece.color !== "b")
    ) {
      setError(
        `It is ${
          currentTurn === "w" ? "White" : "Black"
        }'s turn.`
      );

      return false;
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) {
        setError("That move is not legal.");

        return false;
      }

      const fen = game.fen();

      /*
       * The gameRef is already the authoritative state.
       * Now synchronize React's displayed state.
       */
      setPosition(fen);

      setMoves((previousMoves) => [
        ...previousMoves,
        move.san,
      ]);

      setCurrentMove(
        (previousMove) => previousMove + 1
      );

      setError("");

      onPositionChange?.(fen);

      return true;
    } catch {
      setError("That move is not legal.");

      return false;
    }
  }

  /*
   * Reset to a completely new chess position.
   */
  function resetGame() {
    const game = new Chess();

    gameRef.current = game;

    const fen = game.fen();

    setPosition(fen);
    setMoves([]);
    setCurrentMove(0);
    setError("");

    onPositionChange?.(fen);
  }

  const currentTurn =
    gameRef.current.turn() === "w"
      ? "White"
      : "Black";

    return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Chessboard */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:p-6">
        <div className="mx-auto w-full max-w-[680px]">
          {/* Friendly board header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-500">
                Your game
              </p>

              <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                What would you play?
              </h2>
            </div>

            <div className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300">
              Move {currentMove}
            </div>
          </div>

          <Chessboard
            options={{
              position,
              onPieceDrop: handlePieceDrop,
            }}
          />

          {/* Turn indicator */}
          <div className="mt-4 flex items-center justify-center">
            <div className="rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-violet-500" />

              <span className="text-sm font-semibold text-zinc-200">
                {currentTurn}'s turn
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={goToPreviousMove}
              disabled={currentMove === 0}
              className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={goToNextMove}
              disabled={currentMove === moves.length}
              className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next →
            </button>
          </div>

          {/* Replay controls */}
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={goToFirstMove}
              disabled={currentMove === 0}
              className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            >
              ↤ Start
            </button>

            <button
              type="button"
              onClick={goToLastMove}
              disabled={currentMove === moves.length}
              className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
            >
              End ↦
            </button>

            <button
              type="button"
              onClick={resetGame}
              className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
            >
              New game
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-amber-900/50 bg-amber-950/20 px-4 py-3">
              <p className="text-center text-sm text-amber-300">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simple lesson panel */}
      <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/10 text-2xl">
            🧠
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-500">
              Think like a chess player
            </p>

            <h3 className="mt-1 text-xl font-bold text-white">
              Before you move...
            </h3>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-zinc-950 p-4">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">
                1
              </span>

              <div>
                <p className="font-semibold text-white">
                  Look for checks
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                  Can you give the opponent's king a check?
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-950 p-4">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-black text-white">
                2
              </span>

              <div>
                <p className="font-semibold text-white">
                  Look for captures
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                  Is one of your opponent's pieces undefended?
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-950 p-4">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-black text-white">
                3
              </span>

              <div>
                <p className="font-semibold text-white">
                  Spot threats
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                  What is your opponent trying to do next?
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-violet-600/20 bg-violet-600/5 p-4">
          <p className="text-sm font-semibold text-violet-400">
            Coach challenge
          </p>

          <p className="mt-1 text-sm leading-5 text-zinc-400">
            Don't rush! Take a few seconds to find your idea before
            moving a piece.
          </p>
        </div>
      </aside>
    </div>
  );
}
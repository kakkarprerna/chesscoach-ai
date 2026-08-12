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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* Chessboard */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mx-auto w-full max-w-[680px]">
          <Chessboard
            options={{
              position,
              onPieceDrop: handlePieceDrop,
            }}
          />
        </div>

        {/* Position information */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            {moves.length === 0
              ? "New game"
              : `Position ${currentMove} of ${moves.length}`}
          </span>

          <span className="text-zinc-400">
            {currentTurn} to move
          </span>
        </div>

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

        {/* Reset */}
        <button
          type="button"
          onClick={resetGame}
          className="mt-4 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-800"
        >
          Reset board
        </button>

        {/* Move error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
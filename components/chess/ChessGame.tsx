"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { cleanPGN } from "@/lib/chess/cleanPGN";
import { sanitizePGN } from "@/lib/chess/parsePGN";
import { Chessboard } from "react-chessboard";

interface ChessGameProps {
  pgn: string;
  white?: string;
  black?: string;
  result?: string;
  onPositionChange?: (fen: string) => void;
  externalFen?: string;
}

export default function ChessGame({
  pgn,
  white = "White",
  black = "Black",
  result = "*",
  onPositionChange,
  externalFen,
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

      game.loadPgn(sanitizePGN(pgn));

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
   * Allow external coaching controls to jump the board
   * to a specific position.
   */
  useEffect(() => {
    if (!externalFen) {
      return;
    }

    try {
      const game = new Chess(externalFen);

      gameRef.current = game;

      setPosition(externalFen);
      setCurrentMove(0);
      setError("");

      onPositionChange?.(externalFen);
    } catch (error) {
      console.error(
        "Could not load external chess position:",
        error
      );
    }
  }, [externalFen, onPositionChange]);

  /*
   * Reconstruct the position after a specific number of moves.
   */
  function getPositionAtMove(moveNumber: number): string {
    if (!pgn) {
      return new Chess().fen();
    }

    try {
      const sourceGame = new Chess();

      sourceGame.loadPgn(sanitizePGN(pgn));

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

  const normalizedResult = result.trim();

  const whiteWon = normalizedResult === "1-0";
  const blackWon = normalizedResult === "0-1";
  const isDraw = normalizedResult === "1/2-1/2";

  function playerResult(
    color: "white" | "black"
  ): "win" | "loss" | "draw" | "none" {
    if (isDraw) {
      return "draw";
    }

    if (color === "white" && whiteWon) {
      return "win";
    }

    if (color === "white" && blackWon) {
      return "loss";
    }

    if (color === "black" && blackWon) {
      return "win";
    }

    if (color === "black" && whiteWon) {
      return "loss";
    }

    return "none";
  }

  function resultLabel(
    status: "win" | "loss" | "draw" | "none"
  ) {
    switch (status) {
      case "win":
        return "WIN";
      case "loss":
        return "LOSS";
      case "draw":
        return "DRAW";
      default:
        return "";
    }
  }

  function resultClass(
    status: "win" | "loss" | "draw" | "none"
  ) {
    switch (status) {
      case "win":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "loss":
        return "border-red-200 bg-red-50 text-red-700";
      case "draw":
        return "border-zinc-200 bg-zinc-100 text-zinc-600";
      default:
        return "border-zinc-200 bg-zinc-50 text-zinc-500";
    }
  }

  const whiteStatus = playerResult("white");
  const blackStatus = playerResult("black");

  return (
    <div className="min-w-0">
      {/* Chessboard */}
      <div className="rounded-[28px] border border-[#e4e2db] bg-white p-4 shadow-[0_10px_35px_rgba(30,25,50,0.06)] sm:p-6">
        <div className="mx-auto w-full max-w-[680px]">
          {/* Friendly board header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                Your game
              </p>

              <h2 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">
                What would you play?
              </h2>
            </div>

            <div className="rounded-full border border-[#e7e5df] bg-[#faf9f6] px-3 py-1.5 text-xs font-bold text-zinc-600">
              Move {currentMove}
            </div>
          </div>

          {/* Black player */}
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#e4e2db] bg-[#faf9f6] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-sm font-black text-white">
                B
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Black
                </p>

                <p className="truncate text-sm font-black text-zinc-900 sm:text-base">
                  {black}
                </p>
              </div>
            </div>

            {blackStatus !== "none" && (
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black tracking-wide ${resultClass(
                  blackStatus
                )}`}
              >
                {resultLabel(blackStatus)}
              </span>
            )}
          </div>

          <Chessboard
            options={{
              position,
              boardOrientation: "white",
              onPieceDrop: handlePieceDrop,
            }}
          />

          {/* White player */}
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#e4e2db] bg-[#faf9f6] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm font-black text-zinc-700">
                W
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  White
                </p>

                <p className="truncate text-sm font-black text-zinc-900 sm:text-base">
                  {white}
                </p>
              </div>
            </div>

            {whiteStatus !== "none" && (
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black tracking-wide ${resultClass(
                  whiteStatus
                )}`}
              >
                {resultLabel(whiteStatus)}
              </span>
            )}
          </div>

          {/* Turn indicator */}
          <div className="mt-4 flex items-center justify-center">
            <div className="rounded-full border border-[#dedcd5] bg-white px-4 py-2">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-violet-600" />

              <span className="text-sm font-semibold text-zinc-700">
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
              className="rounded-2xl border border-[#dedcd5] bg-[#f7f5ef] px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-600 hover:bg-[#f0eee8] disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={goToNextMove}
              disabled={currentMove === moves.length}
              className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-30"
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
              className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-[#f0eee8] hover:text-zinc-600 disabled:opacity-30"
            >
              ↤ Start
            </button>

            <button
              type="button"
              onClick={goToLastMove}
              disabled={currentMove === moves.length}
              className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-[#f0eee8] hover:text-zinc-600 disabled:opacity-30"
            >
              End ↦
            </button>

            <button
              type="button"
              onClick={resetGame}
              className="rounded-xl px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-[#f0eee8] hover:text-zinc-600"
            >
              New game
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-center text-sm text-amber-700">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simple lesson panel */}
      <aside className="rounded-3xl border border-[#e4e2db] bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
            🧠
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
              Think like a chess player
            </p>

            <h3 className="mt-1 text-xl font-bold text-zinc-900">
              Before you move...
            </h3>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-[#f7f5ef] p-4">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-zinc-900">
                1
              </span>

              <div>
                <p className="font-semibold text-zinc-900">
                  Look for checks
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-600">
                  Can you give the opponent's king a check?
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#f7f5ef] p-4">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dedcd5] text-xs font-black text-zinc-900">
                2
              </span>

              <div>
                <p className="font-semibold text-zinc-900">
                  Look for captures
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-600">
                  Is one of your opponent's pieces undefended?
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#f7f5ef] p-4">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dedcd5] text-xs font-black text-zinc-900">
                3
              </span>

              <div>
                <p className="font-semibold text-zinc-900">
                  Spot threats
                </p>

                <p className="mt-1 text-sm leading-5 text-zinc-600">
                  What is your opponent trying to do next?
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-semibold text-violet-700">
            Coach challenge
          </p>

          <p className="mt-1 text-sm leading-5 text-zinc-600">
            Don't rush! Take a few seconds to find your idea before
            moving a piece.
          </p>
        </div>
      </aside>
    </div>
  );
}

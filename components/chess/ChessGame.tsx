"use client";

import { useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessGame() {
  const gameRef = useRef(new Chess());

  const [position, setPosition] = useState(gameRef.current.fen());
  const [moves, setMoves] = useState<string[]>([]);

  function handlePieceDrop({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string;
  }) {
    if (!targetSquare) {
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

      setPosition(gameRef.current.fen());
      setMoves(gameRef.current.history());

      return true;
    } catch {
      return false;
    }
  }

  function resetGame() {
    gameRef.current = new Chess();
    setPosition(gameRef.current.fen());
    setMoves([]);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[560px_1fr]">
      {/* Chessboard */}
      <div>
        <Chessboard
          options={{
            position,
            boardWidth: 560,
            onPieceDrop: handlePieceDrop,
          }}
        />

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
          Drag a piece to make a legal move.
        </p>

        {/* Moves */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">
              Moves
            </h3>

            <span className="text-xs text-zinc-500">
              {moves.length} moves
            </span>
          </div>

          <div className="min-h-40 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            {moves.length === 0 ? (
              <p className="text-sm text-zinc-600">
                No moves yet.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {Array.from(
                  { length: Math.ceil(moves.length / 2) },
                  (_, index) => {
                    const whiteMove = moves[index * 2];
                    const blackMove = moves[index * 2 + 1];

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-[32px_1fr_1fr] gap-3"
                      >
                        <span className="text-zinc-600">
                          {index + 1}.
                        </span>

                        <span className="text-zinc-200">
                          {whiteMove}
                        </span>

                        <span className="text-zinc-400">
                          {blackMove ?? ""}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        {/* Evaluation */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
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
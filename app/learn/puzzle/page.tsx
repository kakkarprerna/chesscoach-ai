"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

interface PuzzleData {
  id: string;
  moveNumber: number;
  color: "white" | "black";
  fen: string;
  playedMove: string;
  bestMove: string;
  classification: "inaccuracy" | "mistake" | "blunder";
  evaluationLoss: number;
  question: string;
  explanation: string;
  coachingLesson: string;
  whyItMatters: string;
  gameLabel: string;
  gameDate: string;
  solutionLine: string[];
}

export default function PuzzlePage() {
  const router = useRouter();

  const [puzzle, setPuzzle] =
    useState<PuzzleData | null>(null);

  const [position, setPosition] =
    useState("");

  const [attempts, setAttempts] =
    useState(0);

  const [solved, setSolved] =
    useState(false);

  const [revealed, setRevealed] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const stored =
      sessionStorage.getItem(
        "chesscoach-puzzle"
      );

    if (!stored) {
      router.replace("/learn");
      return;
    }

    try {
      const parsed =
        JSON.parse(stored) as PuzzleData;

      setPuzzle(parsed);
      setPosition(parsed.fen);
    } catch {
      router.replace("/learn");
    }
  }, [router]);

  function goBack() {
    const origin =
      sessionStorage.getItem(
        "chesscoach-puzzle-origin"
      );

    if (origin === "patterns") {
      router.push("/learn/results?section=patterns");
      return;
    }

    if (origin === "puzzles") {
      router.push("/learn/results?section=puzzles");
      return;
    }

    router.push("/learn/results");
  }

  if (!puzzle || !position) {
    return (
      <main className="min-h-screen bg-[#f7f7f4]">
        <div className="mx-auto max-w-[900px] px-5 py-20 text-center">
          <p className="font-bold text-zinc-500">
            Loading puzzle...
          </p>
        </div>
      </main>
    );
  }

  const currentPuzzle = puzzle;

  const game = new Chess(position);

  const playerColor =
    puzzle.color === "white" ? "w" : "b";

  function handleMove({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }) {
    if (!targetSquare || revealed || solved) {
      return false;
    }

    const currentGame = new Chess(position);

    if (
      currentGame.turn() !== playerColor
    ) {
      return false;
    }

    try {
      const move =
        currentGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

      if (!move) {
        return false;
      }

      const played = move.san;

      const bestMoveGame = new Chess(position);

      let isCorrectMove = false;

      try {
        const bestMove = bestMoveGame.move(
          currentPuzzle.bestMove
        );

        const playedPromotion =
          move.promotion ?? null;

        isCorrectMove =
          bestMove.from === move.from &&
          bestMove.to === move.to &&
          (bestMove.promotion ?? null) ===
            playedPromotion;
      } catch {
        isCorrectMove = false;
      }

      const nextAttempts =
        attempts + 1;

      setAttempts(nextAttempts);

      if (isCorrectMove) {
        setSolved(true);
        setMessage(
          "Excellent. You found the coach's move."
        );
        setPosition(currentGame.fen());

        const activePuzzleId =
          sessionStorage.getItem(
            "chesscoach-active-puzzle-id"
          ) ?? currentPuzzle.id;

        const storedCompleted =
          sessionStorage.getItem(
            "chesscoach-completed-puzzles"
          );

        let completedPuzzles: string[] = [];

        try {
          const parsed = storedCompleted
            ? JSON.parse(storedCompleted)
            : [];

          if (Array.isArray(parsed)) {
            completedPuzzles = parsed.filter(
              (value): value is string =>
                typeof value === "string"
            );
          }
        } catch {
          completedPuzzles = [];
        }

        if (
          !completedPuzzles.includes(
            activePuzzleId
          )
        ) {
          completedPuzzles.push(activePuzzleId);

          sessionStorage.setItem(
            "chesscoach-completed-puzzles",
            JSON.stringify(completedPuzzles)
          );
        }

        return true;
      }

      setMessage(
        nextAttempts >= 3
          ? "You've used all three attempts. Let's reveal the coach's suggestion."
          : `That's not the strongest move. You have ${
              3 - nextAttempts
            } attempt${
              3 - nextAttempts === 1
                ? ""
                : "s"
            } left.`
      );

      setPosition(currentPuzzle.fen);

      return true;
    } catch {
      return false;
    }
  }

  function markPuzzleCompleted() {
    const activePuzzleId =
      sessionStorage.getItem(
        "chesscoach-active-puzzle-id"
      ) ?? currentPuzzle.id;

    const storedCompleted =
      sessionStorage.getItem(
        "chesscoach-completed-puzzles"
      );

    let completedPuzzles: string[] = [];

    try {
      const parsed = storedCompleted
        ? JSON.parse(storedCompleted)
        : [];

      if (Array.isArray(parsed)) {
        completedPuzzles = parsed.filter(
          (value): value is string =>
            typeof value === "string"
        );
      }
    } catch {
      completedPuzzles = [];
    }

    if (!completedPuzzles.includes(activePuzzleId)) {
      completedPuzzles.push(activePuzzleId);

      sessionStorage.setItem(
        "chesscoach-completed-puzzles",
        JSON.stringify(completedPuzzles)
      );
    }
  }

  function revealSolution() {
    setRevealed(true);
    markPuzzleCompleted();
    setMessage(
      "Here's the move your coach recommends."
    );
  }


  const solutionVisible =
    solved || revealed;

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
      <header className="border-b border-[#e8e6df] bg-[#fdfdfb]">
        <div className="mx-auto flex h-[72px] max-w-[1300px] items-center justify-between px-5">
          <div>
            <div className="text-sm font-black text-violet-600">
              ChessCoach AI
            </div>

            <h1 className="mt-0.5 text-xl font-black">
              Practice Puzzle
            </h1>
          </div>

          <button
            type="button"
            onClick={goBack}
            className="rounded-xl border border-[#dedcd5] bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 hover:bg-violet-50 hover:text-violet-700"
          >
            ← Back to Learning Results
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1300px] gap-8 px-5 py-8 lg:grid-cols-[minmax(0,680px)_minmax(320px,1fr)]">
        <section>
          <div className="mb-5">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-600">
              Your own game
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Move {puzzle.moveNumber}
            </h2>

            <p className="mt-2 text-zinc-500">
              {puzzle.gameLabel}
              {puzzle.gameDate &&
                ` · ${puzzle.gameDate}`}
            </p>
          </div>

          <div className="rounded-[28px] border border-[#e4e2db] bg-white p-4 shadow-sm sm:p-6">
            <Chessboard
              options={{
                position,
                boardOrientation:
                  puzzle.color === "white"
                    ? "white"
                    : "black",
                onPieceDrop:
                  handleMove,
              }}
            />

            <div className="mt-5 flex items-center justify-between">
              <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-black text-violet-700">
                {attempts}/3 attempts
              </div>

              <div className="text-sm font-bold text-zinc-500">
                {puzzle.color === "white"
                  ? "White"
                  : "Black"}{" "}
                to move
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-sm">
            <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700 inline-block">
              {puzzle.classification}
            </div>

            <h2 className="mt-4 text-2xl font-black">
              {puzzle.question}
            </h2>

            <p className="mt-3 text-base leading-7 text-zinc-600">
              Think before moving. Look for checks,
              captures, threats, and what your
              opponent could do next.
            </p>

            {!solutionVisible && (
              <div className="mt-5 rounded-2xl bg-[#f7f5ef] p-4">
                <p className="text-sm font-bold text-zinc-600">
                  You have{" "}
                  <strong>
                    {3 - attempts}
                  </strong>{" "}
                  attempt
                  {3 - attempts === 1
                    ? ""
                    : "s"}{" "}
                  remaining.
                </p>
              </div>
            )}

            {message && (
              <div className="mt-5 rounded-2xl bg-violet-50 p-4">
                <p className="text-sm font-bold text-violet-700">
                  {message}
                </p>
              </div>
            )}

            {!solutionVisible &&
              attempts > 0 &&
              attempts < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    setPosition(puzzle.fen);
                    setMessage("");
                  }}
                  className="mt-4 w-full rounded-xl border border-[#dedcd5] px-4 py-3 text-sm font-black text-zinc-700 hover:bg-[#faf9f6]"
                >
                  Try again
                </button>
              )}

            {!solutionVisible &&
              attempts >= 3 && (
                <button
                  type="button"
                  onClick={revealSolution}
                  className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white hover:bg-violet-700"
                >
                  Reveal coach suggestion
                </button>
              )}
          </div>

          {solutionVisible && (
            <>
              <div className="rounded-[28px] border border-violet-200 bg-violet-50 p-6">
                <p className="text-xs font-black uppercase tracking-wide text-violet-600">
                  Coach suggestion
                </p>

                <h3 className="mt-2 text-3xl font-black text-violet-900">
                  {puzzle.bestMove}
                </h3>

                <p className="mt-3 text-base leading-7 text-violet-900/80">
                  {puzzle.explanation}
                </p>

                <div className="mt-5 rounded-2xl bg-white/70 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-violet-600">
                    Why it matters
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    {puzzle.whyItMatters}
                  </p>
                </div>

                <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-100/70 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                    Coach lesson
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-violet-900">
                    {puzzle.coachingLesson}
                  </p>
                </div>
              </div>

              {puzzle.solutionLine.length >
                0 && (
                <div className="rounded-[28px] border border-[#e4e2db] bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wide text-violet-600">
                    Coach continuation
                  </p>

                  <h3 className="mt-2 text-2xl font-black">
                    What happens next
                  </h3>

                  <div className="mt-5 space-y-3">
                    {puzzle.solutionLine.map(
                      (move, index) => (
                        <div
                          key={`${move}-${index}`}
                          className="flex items-center gap-3 rounded-2xl bg-[#f7f5ef] p-4"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">
                            {index + 1}
                          </span>

                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                              {index === 0
                                ? "Your stronger move"
                                : index % 2 === 1
                                  ? "Opponent response"
                                  : "Your continuation"}
                            </p>

                            <span className="text-lg font-black">
                              {move}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <p className="mt-5 text-sm leading-6 text-zinc-500">
                    This continuation comes from
                    Stockfish's principal variation starting
                    from the puzzle position. The first move
                    is the key answer; the following moves
                    show how the position can continue.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={goBack}
                className="w-full rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-violet-500"
              >
                {solved
                  ? "Puzzle complete — Back to Learning Results →"
                  : "Back to Learning Results →"}
              </button>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
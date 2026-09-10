'use client';

/**
 * app/puzzles/page.tsx
 *
 * Design note: the turn indicator is built as a tournament clock, because
 * that is the object your son already reads whose-turn-is-it from at events.
 * The lit half is the side to move. His own side carries a small marker.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

interface Puzzle {
  puzzle_id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
  solver_colour: 'w' | 'b';
  game_url: string | null;
}

const QUICK_SEARCHES = [
  'rook versus knight endgame',
  'king and pawn endgame',
  'bishop versus knight',
  'rook versus rook',
  'forks',
  'mate in two',
];

const LEVELS = ['beginner', 'easy', 'intermediate', 'hard'] as const;

type Status = 'loading' | 'opponent' | 'playing' | 'wrong' | 'solved' | 'empty' | 'error';

const C = {
  ink: '#16200f',
  felt: '#2f4029',
  boardLight: '#e9e6d2',
  boardDark: '#7a9a5f',
  paper: '#f7f5ec',
  chalk: '#8d9a80',
  alert: '#a8442c',
};

export default function PuzzlesPage() {
  const [search, setSearch] = useState('rook versus knight endgame');
  const [level, setLevel] = useState<string>('intermediate');
  const [interpretation, setInterpretation] = useState<string | null>(null);

  const [queue, setQueue] = useState<Puzzle[]>([]);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [game, setGame] = useState(() => new Chess());
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const startedAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  // ---- loading -------------------------------------------------------------

  const runSearch = useCallback(async (text: string, chosenLevel: string) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStatus('loading');
    setPuzzle(null);

    try {
      const res = await fetch('/api/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${text} ${chosenLevel}`, limit: 12 }),
      });
      const data = await res.json();

      if (data.error) {
        setStatus('error');
        setMessage(data.error);
        return;
      }
      setInterpretation(data.interpretation ?? null);

      if (!data.puzzles?.length) {
        setStatus('empty');
        setMessage('Nothing matches that yet. Try a different pairing or an easier level.');
        return;
      }
      startPuzzle(data.puzzles[0]);
      setQueue(data.puzzles.slice(1));
    } catch {
      setStatus('error');
      setMessage('Could not reach the puzzle service. Is the dev server still running?');
    }
  }, []);

  useEffect(() => {
    runSearch(search, level);
    // Runs once on mount. Searching after that is an explicit action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- puzzle lifecycle ----------------------------------------------------

  /**
   * The Lichess FEN is the position BEFORE the opponent's move, so the first
   * entry in `moves` is played for him. He solves from move two onwards.
   */
  function startPuzzle(p: Puzzle) {
    setPuzzle(p);
    setGame(new Chess(p.fen));
    setMoveIndex(0);
    setStatus('opponent');
    setMessage('Watch the first move.');

    later(() => {
      const next = new Chess(p.fen);
      applyUci(next, p.moves[0]);
      setGame(next);
      setMoveIndex(1);
      setStatus('playing');
      startedAt.current = Date.now();
      setMessage('Your move.');
    }, 900);
  }

  function nextPuzzle() {
    if (queue.length) {
      startPuzzle(queue[0]);
      setQueue(queue.slice(1));
    } else {
      runSearch(search, level);
    }
  }

  async function record(solved: boolean) {
    if (!puzzle) return;
    try {
      await fetch('/api/puzzles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: puzzle.puzzle_id,
          solved,
          msTaken: Date.now() - startedAt.current,
        }),
      });
    } catch {
      // Progress tracking is never worth interrupting him over.
    }
  }

  function applyUci(chess: Chess, uci: string) {
    chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
  }

  function onDrop(from: string, to: string) {
    if (!puzzle || status !== 'playing') return false;

    const expected = puzzle.moves[moveIndex];
    if (expected.slice(0, 4) !== from + to) {
      setStatus('wrong');
      setMessage('Not that one. What is the opponent threatening?');
      record(false);
      return false;
    }

    const next = new Chess(game.fen());
    applyUci(next, expected);
    const after = moveIndex + 1;
    setGame(next);
    setMoveIndex(after);

    if (after >= puzzle.moves.length) {
      setStatus('solved');
      setMessage('Solved.');
      record(true);
      return true;
    }

    setStatus('opponent');
    setMessage('Good. Now the reply.');

    later(() => {
      const replied = new Chess(next.fen());
      applyUci(replied, puzzle.moves[after]);
      setGame(replied);
      setMoveIndex(after + 1);
      setStatus('playing');
      setMessage('Your move.');
    }, 550);

    return true;
  }

  function retry() {
    if (!puzzle) return;
    const chess = new Chess(puzzle.fen);
    for (let i = 0; i < moveIndex; i++) applyUci(chess, puzzle.moves[i]);
    setGame(chess);
    setStatus('playing');
    setMessage('Your move.');
  }

  function showAnswer() {
    if (!puzzle) return;
    const chess = new Chess(puzzle.fen);
    for (const m of puzzle.moves) applyUci(chess, m);
    setGame(chess);
    setStatus('solved');
    setMessage('That was the finish. Play it through once more in your head.');
  }

  // ---- render --------------------------------------------------------------

  const orientation = puzzle?.solver_colour === 'b' ? 'black' : 'white';
  const toMove: 'w' | 'b' = puzzle ? (game.turn() as 'w' | 'b') : 'w';
  const hisColour = puzzle?.solver_colour ?? 'w';
  const showBoard =
    puzzle && status !== 'loading' && status !== 'empty' && status !== 'error';

  return (
    <main className="min-h-screen px-5 py-10" style={{ background: C.paper, color: C.ink }}>
      <div className="mx-auto w-full max-w-[560px]">
        <h1
          className="text-[2rem] leading-tight tracking-tight"
          style={{ fontFamily: 'Georgia, "Iowan Old Style", serif' }}
        >
          Puzzles
        </h1>

        {/* Search */}
        <div className="mt-5 flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch(search, level)}
            placeholder="Try: rook versus knight endgame"
            aria-label="Describe the puzzles you want"
            className="flex-1 rounded-sm border px-3 py-2.5 text-[0.95rem] outline-none focus:ring-2"
            style={{ borderColor: C.chalk, background: '#fff' }}
          />
          <button
            onClick={() => runSearch(search, level)}
            className="rounded-sm px-5 py-2.5 text-[0.95rem] text-white"
            style={{ background: C.felt }}
          >
            Find
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {QUICK_SEARCHES.map((q) => (
            <button
              key={q}
              onClick={() => {
                setSearch(q);
                runSearch(q, level);
              }}
              className="rounded-full border px-3 py-1 text-[0.8rem]"
              style={{
                borderColor: search === q ? C.felt : C.chalk,
                color: search === q ? C.felt : C.chalk,
              }}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLevel(l);
                runSearch(search, l);
              }}
              className="flex-1 rounded-sm border py-1.5 text-[0.8rem] capitalize"
              style={{
                borderColor: level === l ? C.felt : C.chalk,
                background: level === l ? C.felt : 'transparent',
                color: level === l ? '#fff' : C.chalk,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {interpretation && (
          <p className="mt-2.5 text-[0.8rem]" style={{ color: C.chalk }}>
            Showing {interpretation}
          </p>
        )}

        {/* Clock */}
        {showBoard && (
          <div
            className="mt-7 grid grid-cols-2 overflow-hidden rounded-sm border"
            style={{ borderColor: C.felt }}
          >
            {(['w', 'b'] as const).map((side) => {
              const active = toMove === side;
              return (
                <div
                  key={side}
                  className="px-4 py-3 transition-colors duration-300"
                  style={{
                    background: active ? C.felt : 'transparent',
                    color: active ? '#fff' : C.chalk,
                    borderLeft: side === 'b' ? `1px solid ${C.felt}` : undefined,
                    textAlign: side === 'w' ? 'left' : 'right',
                  }}
                >
                  <span className="text-[1.05rem]" style={{ fontFamily: 'Georgia, serif' }}>
                    {side === 'w' ? 'White' : 'Black'}
                  </span>
                  {hisColour === side && (
                    <span className="ml-2 text-[0.7rem] opacity-80">you</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Board */}
        <div className="mt-3">
          {status === 'loading' && (
            <p className="py-16 text-center" style={{ color: C.chalk }}>
              Finding puzzles.
            </p>
          )}

          {(status === 'empty' || status === 'error') && (
            <p className="py-16 text-center">{message}</p>
          )}

          {showBoard && (
            <Chessboard
              options={{
                id: 'puzzle-board',
                position: game.fen(),
                boardOrientation: orientation,
                allowDragging: status === 'playing',
                onPieceDrop: ({ sourceSquare, targetSquare }) =>
                  onDrop(sourceSquare, targetSquare ?? ''),
                // Delete these two lines if TypeScript objects to them.
                darkSquareStyle: { backgroundColor: C.boardDark },
                lightSquareStyle: { backgroundColor: C.boardLight },
              }}
            />
          )}
        </div>

        {showBoard && (
          <>
            <p
              className="mt-4 min-h-7 text-[1.05rem]"
              style={{
                fontFamily: 'Georgia, serif',
                color: status === 'wrong' ? C.alert : C.ink,
              }}
            >
              {message}
            </p>

            <p className="mt-0.5 text-[0.78rem]" style={{ color: C.chalk }}>
              Rating {puzzle!.rating}.{' '}
              {puzzle!.themes
                .filter((t) => t !== 'crushing' && t !== 'advantage')
                .join(', ')}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {status === 'wrong' && (
                <button
                  onClick={retry}
                  className="rounded-sm px-5 py-2.5 text-white"
                  style={{ background: C.felt }}
                >
                  Try again
                </button>
              )}
              {(status === 'wrong' || status === 'playing') && (
                <button
                  onClick={showAnswer}
                  className="rounded-sm border px-5 py-2.5"
                  style={{ borderColor: C.chalk, color: C.chalk }}
                >
                  Show the answer
                </button>
              )}
              {status === 'solved' && (
                <button
                  onClick={nextPuzzle}
                  className="rounded-sm px-5 py-2.5 text-white"
                  style={{ background: C.felt }}
                >
                  Next puzzle
                </button>
              )}
              {status === 'wrong' && (
                <button
                  onClick={nextPuzzle}
                  className="rounded-sm border px-5 py-2.5"
                  style={{ borderColor: C.chalk, color: C.chalk }}
                >
                  Skip
                </button>
              )}
              {puzzle!.game_url && status === 'solved' && (
                <a
                  href={puzzle!.game_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[0.8rem] underline"
                  style={{ color: C.chalk }}
                >
                  See the original game
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

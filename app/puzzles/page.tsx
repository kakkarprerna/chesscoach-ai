'use client';

/**
 * app/puzzles/page.tsx
 *
 * Styled to match the Learning Coach pages: light ground, violet accent,
 * black tracking-tight headings, rounded-xl controls.
 *
 * The turn indicator is a tournament clock, because that is the object he
 * already reads whose-turn-is-it from at events. The lit half is the side to
 * move; his own side carries a marker.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import SignOutButton from '@/components/auth/SignOutButton';

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

export default function PuzzlesPage() {
  const router = useRouter();

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
      setMessage('Could not reach the puzzle service.');
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

  const ghostButton =
    'rounded-xl border border-[#dedcd5] bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700';
  const solidButton =
    'rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-500';

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-[#e8e6df] bg-[#fdfdfb]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5">
          <div>
            <div className="text-sm font-black tracking-tight text-violet-600">
              ChessCoach AI
            </div>
            <h1 className="mt-0.5 text-xl font-black tracking-tight">Endgame Drills</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/learn')}
              className={ghostButton}
            >
              Learning Coach
            </button>
            <button
              type="button"
              onClick={() => router.push('/analyze')}
              className={solidButton}
            >
              Analyze a game
            </button>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[560px] px-5 py-8">
        {/* Search */}
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch(search, level)}
            placeholder="Try: rook versus knight endgame"
            aria-label="Describe the puzzles you want"
            className="flex-1 rounded-xl border border-[#dedcd5] bg-white px-4 py-2.5 text-sm font-medium shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
          />
          <button onClick={() => runSearch(search, level)} className={solidButton}>
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
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                search === q
                  ? 'border-violet-200 bg-violet-50 text-violet-700'
                  : 'border-[#dedcd5] bg-white text-zinc-500 hover:border-violet-200 hover:text-violet-700'
              }`}
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
              className={`flex-1 rounded-xl border py-2 text-xs font-bold capitalize shadow-sm transition ${
                level === l
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-[#dedcd5] bg-white text-zinc-500 hover:border-violet-200 hover:text-violet-700'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {interpretation && (
          <p className="mt-2.5 text-xs font-medium text-zinc-500">
            Showing {interpretation}
          </p>
        )}

        {/* Clock */}
        {showBoard && (
          <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-[#dedcd5] shadow-sm">
            {(['w', 'b'] as const).map((side) => {
              const active = toMove === side;
              return (
                <div
                  key={side}
                  className={`px-4 py-3 transition-colors duration-300 ${
                    active ? 'bg-violet-600 text-white' : 'bg-white text-zinc-400'
                  } ${side === 'b' ? 'border-l border-[#dedcd5] text-right' : ''}`}
                >
                  <span className="text-base font-black tracking-tight">
                    {side === 'w' ? 'White' : 'Black'}
                  </span>
                  {hisColour === side && (
                    <span className="ml-2 text-[0.7rem] font-bold opacity-80">you</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Board */}
        <div className="mt-3">
          {status === 'loading' && (
            <p className="py-16 text-center text-sm font-medium text-zinc-400">
              Finding puzzles.
            </p>
          )}

          {(status === 'empty' || status === 'error') && (
            <p className="py-16 text-center text-sm font-medium text-zinc-600">
              {message}
            </p>
          )}

          {showBoard && (
            <div className="overflow-hidden rounded-xl shadow-sm">
              <Chessboard
                options={{
                  id: 'puzzle-board',
                  position: game.fen(),
                  boardOrientation: orientation,
                  allowDragging: status === 'playing',
                  onPieceDrop: ({ sourceSquare, targetSquare }) =>
                    onDrop(sourceSquare, targetSquare ?? ''),
                  // Delete these two lines if TypeScript objects to them.
                  darkSquareStyle: { backgroundColor: '#a396ca' },
                  lightSquareStyle: { backgroundColor: '#ebe8f3' },
                }}
              />
            </div>
          )}
        </div>

        {showBoard && (
          <>
            <p
              className={`mt-4 min-h-7 text-lg font-black tracking-tight ${
                status === 'wrong' ? 'text-rose-600' : 'text-zinc-900'
              }`}
            >
              {message}
            </p>

            <p className="mt-0.5 text-xs font-medium text-zinc-500">
              Rating {puzzle!.rating}.{' '}
              {puzzle!.themes
                .filter((t) => t !== 'crushing' && t !== 'advantage')
                .join(', ')}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {status === 'wrong' && (
                <button onClick={retry} className={solidButton}>
                  Try again
                </button>
              )}
              {(status === 'wrong' || status === 'playing') && (
                <button onClick={showAnswer} className={ghostButton}>
                  Show the answer
                </button>
              )}
              {status === 'solved' && (
                <button onClick={nextPuzzle} className={solidButton}>
                  Next puzzle
                </button>
              )}
              {status === 'wrong' && (
                <button onClick={nextPuzzle} className={ghostButton}>
                  Skip
                </button>
              )}
              {puzzle!.game_url && status === 'solved' && (
                <a
                  href={puzzle!.game_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-zinc-500 underline hover:text-violet-700"
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

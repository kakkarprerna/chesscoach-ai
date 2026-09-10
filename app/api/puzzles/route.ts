/**
 * app/api/puzzles/route.ts
 *
 * POST { "text": "rook versus knight endgame, intermediate" }
 * POST { "criteria": { "sideA": "rook", "sideB": "knight" } }
 * PATCH { "puzzleId": "VeFOQ", "solved": true, "msTaken": 14200 }
 *
 * Text requests are parsed locally first. Gemini is only consulted when the
 * local parse finds nothing AND a key is configured, so search works with no
 * API key at all.
 */

import { NextResponse } from 'next/server';
import {
  fetchPuzzles,
  criteriaFromText,
  recordAttempt,
  type PuzzleCriteria,
} from '@/lib/puzzle-queries';
import { parseCriteria, parseIsEmpty } from '@/lib/parse-criteria';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const limit = body.limit ?? 10;

    let criteria: PuzzleCriteria;
    let interpretation: string | null = null;

    if (typeof body.text === 'string' && body.text.trim()) {
      criteria = parseCriteria(body.text);

      if (parseIsEmpty(criteria) && process.env.GEMINI_API_KEY) {
        try {
          criteria = await criteriaFromText(body.text);
        } catch {
          // Local parse stands rather than failing the request.
        }
      }
      interpretation = describe(criteria);
    } else {
      criteria = (body.criteria ?? {}) as PuzzleCriteria;
    }

    const puzzles = await fetchPuzzles({ ...criteria, limit });
    return NextResponse.json({ puzzles, criteria, interpretation });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Something went wrong loading puzzles.';
    console.error('Puzzle query failed:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Plain-language echo of what the search was understood to mean. */
function describe(c: PuzzleCriteria): string {
  const parts: string[] = [];

  if (c.sideA === 'none' && c.sideB === 'none') {
    parts.push('king and pawn endings');
  } else if (c.sideA && c.sideB) {
    parts.push(`${c.sideA} against ${c.sideB}`);
  } else {
    parts.push('any material');
  }

  if (c.themes?.length) parts.push(c.themes.join(' and '));
  if (c.minRating && c.maxRating) parts.push(`rated ${c.minRating} to ${c.maxRating}`);
  else parts.push(c.difficulty ?? 'intermediate');
  if (c.hasPawns === false) parts.push('no pawns');

  return parts.join(', ');
}

export async function PATCH(request: Request) {
  try {
    const { puzzleId, solved, msTaken } = await request.json();
    if (!puzzleId || typeof solved !== 'boolean') {
      return NextResponse.json(
        { error: 'puzzleId and solved are required' },
        { status: 400 }
      );
    }
    await recordAttempt(puzzleId, solved, msTaken);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Recording attempt failed:', err);
    return NextResponse.json({ error: 'Could not record attempt' }, { status: 500 });
  }
}

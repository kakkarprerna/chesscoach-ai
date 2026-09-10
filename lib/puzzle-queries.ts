/**
 * lib/puzzle-queries.ts
 *
 * Server-side only. Uses the app's existing @supabase/ssr client rather than
 * creating a second one, so auth state and cookies stay in one place.
 *
 * Do not import this from a client component. The Gemini call needs a key
 * that must never reach the browser. Call it from a server component or from
 * app/api/puzzles/route.ts instead.
 */

import { createClient } from '@/lib/supabase/server';
import { normaliseMatchup } from '@/lib/fen-material.mjs';

// ---------------------------------------------------------------------------
// Difficulty bands.
//
// Lichess puzzle ratings are Glicko2 scores earned against solvers, not player
// strength, and they run harder than they look. Starting points for an 8 year
// old club player. Watch his solve rate over a few weeks and shift them.
// ---------------------------------------------------------------------------
export const DIFFICULTY_BANDS = {
  beginner: [600, 1000],
  easy: [900, 1200],
  intermediate: [1100, 1500],
  hard: [1400, 1700],
} as const;

export type Difficulty = keyof typeof DIFFICULTY_BANDS;

export interface Puzzle {
  puzzle_id: string;
  fen: string;
  moves: string[];
  rating: number;
  popularity: number | null;
  themes: string[];
  game_url: string | null;
  material_sig: string;
  solver_colour: 'w' | 'b';
  solver_material: string;
  opponent_material: string;
  has_pawns: boolean;
  piece_count: number;
}

export interface PuzzleCriteria {
  /** e.g. 'rook' or ['rook','bishop'] */
  sideA?: string | string[];
  sideB?: string | string[];
  difficulty?: Difficulty;
  minRating?: number;
  maxRating?: number;
  /** Lichess theme tags. All must be present on the puzzle. */
  themes?: string[];
  /** false gives bare piece endings, which are rare. Normally leave unset. */
  hasPawns?: boolean;
  /** Cap total pieces including kings. Ingest already capped at 10. */
  maxPieces?: number;
  minPopularity?: number;
  limit?: number;
  /**
   * When set, returns only puzzles where the solver holds sideA and the
   * opponent holds sideB. Without it, both orientations come back, which is
   * fine for variety but wrong for targeted practice.
   */
  directional?: boolean;
}

export async function fetchPuzzles(
  criteria: PuzzleCriteria = {}
): Promise<Puzzle[]> {
  const supabase = await createClient();
  const band = DIFFICULTY_BANDS[criteria.difficulty ?? 'intermediate'];
  const minRating = criteria.minRating ?? band[0];
  const maxRating = criteria.maxRating ?? band[1];
  const limit = criteria.limit ?? 10;
  const minPopularity = criteria.minPopularity ?? 70;

  // Directional practice: he plays one specific side of the matchup.
  if (criteria.directional && criteria.sideA && criteria.sideB) {
    const { normaliseSide } = await import('@/lib/fen-material.mjs');
    let query = supabase
      .from('puzzles')
      .select('*')
      .eq('solver_material', normaliseSide(criteria.sideA))
      .eq('opponent_material', normaliseSide(criteria.sideB))
      .gte('rating', minRating)
      .lte('rating', maxRating)
      .gte('popularity', minPopularity)
      .limit(limit * 5); // over-fetch, then shuffle client side

    if (criteria.themes?.length) query = query.contains('themes', criteria.themes);
    if (criteria.hasPawns !== undefined) query = query.eq('has_pawns', criteria.hasPawns);
    if (criteria.maxPieces) query = query.lte('piece_count', criteria.maxPieces);

    const { data, error } = await query;
    if (error) throw error;
    return shuffle(data ?? []).slice(0, limit) as Puzzle[];
  }

  // Standard path: colour-agnostic matchup, random sample, unseen only.
  const materialSig =
    criteria.sideA && criteria.sideB
      ? normaliseMatchup(criteria.sideA, criteria.sideB)
      : null;

  const { data, error } = await supabase.rpc('random_puzzles', {
    p_material_sig: materialSig,
    p_themes: criteria.themes?.length ? criteria.themes : null,
    p_min_rating: minRating,
    p_max_rating: maxRating,
    p_has_pawns: criteria.hasPawns ?? null,
    p_max_pieces: criteria.maxPieces ?? null,
    p_min_popularity: minPopularity,
    p_limit: limit,
  });

  if (error) throw error;
  return (data ?? []) as Puzzle[];
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Record an attempt so the puzzle is not served again. */
export async function recordAttempt(
  puzzleId: string,
  solved: boolean,
  msTaken?: number
) {
  const supabase = await createClient();
  const { error } = await supabase.from('puzzle_attempts').insert({
    puzzle_id: puzzleId,
    solved,
    ms_taken: msTaken ?? null,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Natural language -> criteria, via Gemini.
//
// Constrain the model to a fixed schema. Open-ended extraction invents theme
// names that do not exist in the data and quietly returns nothing.
// ---------------------------------------------------------------------------

const VALID_THEMES = [
  'endgame', 'rookEndgame', 'knightEndgame', 'bishopEndgame', 'queenEndgame',
  'pawnEndgame', 'queenRookEndgame', 'fork', 'pin', 'skewer', 'discoveredAttack',
  'deflection', 'sacrifice', 'zugzwang', 'mateIn1', 'mateIn2', 'mateIn3',
  'backRankMate', 'smotheredMate', 'hangingPiece', 'trappedPiece',
  'defensiveMove', 'quietMove', 'promotion', 'underPromotion', 'crushing',
  'advantage', 'short', 'long',
];

const VALID_DIFFICULTIES = ['beginner', 'easy', 'intermediate', 'hard'];

const EXTRACTION_PROMPT = `You convert a chess coaching request into a JSON filter.

Return ONLY raw JSON, no markdown fences, no commentary, matching this shape:
{
  "sideA": "rook",
  "sideB": "knight",
  "difficulty": "intermediate",
  "themes": ["endgame"],
  "hasPawns": null,
  "directional": false
}

Rules:
- sideA and sideB are the non-pawn material each side holds. Use only the
  words queen, rook, bishop, knight, or a space-separated combination such as
  "rook bishop". Use null for both if no specific matchup is named.
- difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}. Default to intermediate.
- themes must be drawn only from: ${VALID_THEMES.join(', ')}. Empty array if none apply.
- hasPawns: only false if the request explicitly says no pawns or bare pieces.
- directional: true only if the request says which side the student plays,
  for example "defending with the knight" or "he has the rook".

Request: `;

export async function criteriaFromText(text: string): Promise<PuzzleCriteria> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: EXTRACTION_PROMPT + text }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini returned ${res.status}`);

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(String(raw).replace(/```json|```/g, '').trim());
  } catch {
    return { difficulty: 'intermediate' }; // fall back rather than throwing at him
  }

  // Never trust the model's output. Whitelist everything.
  const themes = Array.isArray(parsed.themes)
    ? (parsed.themes as string[]).filter((t) => VALID_THEMES.includes(t))
    : [];

  const difficulty = VALID_DIFFICULTIES.includes(String(parsed.difficulty))
    ? (parsed.difficulty as Difficulty)
    : 'intermediate';

  return {
    sideA: (parsed.sideA as string) ?? undefined,
    sideB: (parsed.sideB as string) ?? undefined,
    difficulty,
    themes: themes.length ? themes : undefined,
    hasPawns: typeof parsed.hasPawns === 'boolean' ? parsed.hasPawns : undefined,
    directional: parsed.directional === true,
  };
}

/** End to end: "rook versus knight endgame, intermediate" -> puzzles. */
export async function puzzlesFromText(text: string, limit = 10) {
  const criteria = await criteriaFromText(text);
  return fetchPuzzles({ ...criteria, limit });
}

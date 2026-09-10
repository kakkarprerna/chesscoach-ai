/**
 * lib/parse-criteria.ts
 *
 * Turns a plain-language request into puzzle criteria using plain pattern
 * matching. No API key, no network, no latency. Handles the phrasings you and
 * your son will actually type. Gemini stays available in the route as a
 * fallback for anything this misses.
 */

import type { PuzzleCriteria, Difficulty } from '@/lib/puzzle-queries';

const PIECE_WORDS: Record<string, string> = {
  queen: 'queen', queens: 'queen', q: 'queen',
  rook: 'rook', rooks: 'rook', r: 'rook', castle: 'rook',
  bishop: 'bishop', bishops: 'bishop', b: 'bishop',
  knight: 'knight', knights: 'knight', n: 'knight', horse: 'knight',
};

const NUMBER_WORDS: Record<string, number> = {
  two: 2, double: 2, twin: 2, three: 3, triple: 3, '2': 2, '3': 3,
};

const DIFFICULTY_WORDS: Record<string, Difficulty> = {
  beginner: 'beginner', easiest: 'beginner', starter: 'beginner',
  simple: 'beginner', basic: 'beginner',
  easy: 'easy', gentle: 'easy',
  intermediate: 'intermediate', medium: 'intermediate', middling: 'intermediate',
  hard: 'hard', harder: 'hard', hardest: 'hard', difficult: 'hard',
  tough: 'hard', tricky: 'hard', advanced: 'hard',
};

const THEME_PHRASES: [RegExp, string][] = [
  [/\bfork(s|ing)?\b/, 'fork'],
  [/\bpin(s|ned|ning)?\b/, 'pin'],
  [/\bskewer(s|ed)?\b/, 'skewer'],
  [/\bdiscover(ed|y)\b/, 'discoveredAttack'],
  [/\bdeflect(ion|ing)?\b/, 'deflection'],
  [/\bsacrifice(s|d)?\b|\bsac\b/, 'sacrifice'],
  [/\bzugzwang\b/, 'zugzwang'],
  [/\bmate in (one|1)\b/, 'mateIn1'],
  [/\bmate in (two|2)\b/, 'mateIn2'],
  [/\bmate in (three|3)\b/, 'mateIn3'],
  [/\bback ?rank\b/, 'backRankMate'],
  [/\bsmother(ed)?\b/, 'smotheredMate'],
  [/\bhanging\b/, 'hangingPiece'],
  [/\btrapped\b/, 'trappedPiece'],
  [/\bdefend(ing|ce|se)?\b|\bdefensive\b/, 'defensiveMove'],
  [/\bquiet move\b/, 'quietMove'],
  [/\bpromot(e|ion|ing)\b|\bqueening\b/, 'promotion'],
  [/\bunderpromot/, 'underPromotion'],
  [/\bendgame(s)?\b|\bending(s)?\b/, 'endgame'],
];

/** Pull the pieces named in one half of a matchup, respecting "two rooks". */
function piecesIn(fragment: string): string {
  const tokens = fragment.toLowerCase().split(/[\s,+]+/).filter(Boolean);
  const pieces: string[] = [];
  let pendingCount = 1;

  for (const token of tokens) {
    const cleaned = token.replace(/[^a-z0-9]/g, '');
    if (NUMBER_WORDS[cleaned]) {
      pendingCount = NUMBER_WORDS[cleaned];
      continue;
    }
    const piece = PIECE_WORDS[cleaned];
    if (piece) {
      for (let i = 0; i < pendingCount; i++) pieces.push(piece);
      pendingCount = 1;
    }
  }
  return pieces.join(' ');
}

export function parseCriteria(input: string): PuzzleCriteria {
  const text = input.toLowerCase().trim();
  const criteria: PuzzleCriteria = {};

  // --- matchup ---
  // "rook versus knight", "rook vs knight", "rook against knight", "rook v knight"
  const split = text.split(/\s+(?:versus|vs\.?|v\.?|against)\s+/);
  if (split.length >= 2) {
    const left = piecesIn(split[0]);
    const right = piecesIn(split.slice(1).join(' '));
    if (left) criteria.sideA = left;
    if (right) criteria.sideB = right;
  }

  // "king and pawn endgame" with no pieces named at all
  if (!criteria.sideA && /\b(king and pawn|pawn ending|pawn endgame)\b/.test(text)) {
    criteria.sideA = 'none';
    criteria.sideB = 'none';
  }

  // --- difficulty ---
  for (const [word, level] of Object.entries(DIFFICULTY_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(text)) {
      criteria.difficulty = level;
      break;
    }
  }

  // Explicit rating, e.g. "around 1300" or "1200-1400"
  const range = text.match(/(\d{3,4})\s*(?:-|to|–)\s*(\d{3,4})/);
  if (range) {
    criteria.minRating = Number(range[1]);
    criteria.maxRating = Number(range[2]);
  } else {
    const single = text.match(/\b(?:rated|around|about|near)\s*(\d{3,4})\b/);
    if (single) {
      const centre = Number(single[1]);
      criteria.minRating = centre - 150;
      criteria.maxRating = centre + 150;
    }
  }

  // --- themes ---
  const themes: string[] = [];
  for (const [pattern, theme] of THEME_PHRASES) {
    if (pattern.test(text)) themes.push(theme);
  }
  if (themes.length) criteria.themes = themes;

  // --- direction ---
  // "he has the rook", "playing the knight", "defending with the knight"
  if (/\b(he has|i have|playing (the|as)|with the|defending with)\b/.test(text)) {
    criteria.directional = true;
  }

  // --- no pawns ---
  if (/\b(no pawns|bare|pieces only|without pawns)\b/.test(text)) {
    criteria.hasPawns = false;
  }

  return criteria;
}

/** True when the parse found nothing useful and Gemini is worth trying. */
export function parseIsEmpty(criteria: PuzzleCriteria): boolean {
  return (
    !criteria.sideA &&
    !criteria.themes?.length &&
    !criteria.minRating &&
    !criteria.difficulty
  );
}

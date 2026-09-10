/**
 * FEN parsing + material signature derivation for Lichess puzzles.
 *
 * Why this exists: Lichess themes tell you WHICH pieces are on the board
 * (rookEndgame, knightEndgame) but never the matchup (rook VS knight).
 * These helpers derive a canonical, queryable material signature from the FEN
 * so "rook versus knight endgame" becomes a single indexed equality check.
 */

// Sort order for pieces within one side. Strongest first, so "QRN" not "NQR".
const PIECE_ORDER = ['Q', 'R', 'B', 'N'];

/**
 * Split a FEN into its six fields.
 * Lichess puzzle FENs are always full, valid FENs.
 */
export function splitFen(fen) {
  const [placement, active, castling, enPassant, halfmove, fullmove] =
    fen.trim().split(/\s+/);
  if (!placement || !active) throw new Error(`Malformed FEN: ${fen}`);
  return { placement, active, castling, enPassant, halfmove, fullmove };
}

/**
 * Count every piece in the placement field.
 * Uppercase letters are White, lowercase are Black.
 * Returns { white: {Q,R,B,N,P}, black: {...} } with kings excluded.
 */
export function countPieces(placement) {
  const white = { Q: 0, R: 0, B: 0, N: 0, P: 0 };
  const black = { Q: 0, R: 0, B: 0, N: 0, P: 0 };

  for (const ch of placement) {
    if (ch === '/' || (ch >= '1' && ch <= '8')) continue;
    const upper = ch.toUpperCase();
    if (upper === 'K') continue;
    const side = ch === upper ? white : black;
    if (upper in side) side[upper] += 1;
  }
  return { white, black };
}

/**
 * Turn one side's counts into a compact string of non-pawn material.
 * { Q:0, R:1, B:0, N:1, P:3 } becomes "RN". Returns "-" when bare.
 */
export function sideMaterial(counts) {
  let out = '';
  for (const piece of PIECE_ORDER) {
    out += piece.repeat(counts[piece]);
  }
  return out === '' ? '-' : out;
}

/**
 * Canonical, colour-independent matchup key.
 * White R vs Black N and White N vs Black R both produce "NvR",
 * so one indexed lookup catches both orientations.
 */
export function materialSignature(whiteMat, blackMat) {
  return [whiteMat, blackMat].sort().join('v');
}

/**
 * Build the same signature from a plain-language request.
 * normaliseMatchup('rook', 'knight') === 'NvR'
 * Accepts piece names, letters, or arrays like ['rook','pawn'].
 */
const NAME_TO_LETTER = {
  queen: 'Q', q: 'Q',
  rook: 'R', r: 'R',
  bishop: 'B', b: 'B',
  knight: 'N', n: 'N',
  none: '-', nothing: '-', bare: '-',
};

export function normaliseSide(input) {
  const items = Array.isArray(input) ? input : String(input).split(/[\s,+]+/);
  const counts = { Q: 0, R: 0, B: 0, N: 0, P: 0 };
  for (const raw of items) {
    const key = String(raw).toLowerCase().replace(/s$/, '');
    if (key === 'pawn' || key === 'p') continue; // pawns handled by hasPawns
    const letter = NAME_TO_LETTER[key];
    if (letter && letter !== '-') counts[letter] += 1;
  }
  return sideMaterial(counts);
}

export function normaliseMatchup(sideA, sideB) {
  return materialSignature(normaliseSide(sideA), normaliseSide(sideB));
}

/**
 * The Lichess gotcha, in code.
 *
 * A puzzle FEN is the position BEFORE the opponent plays the first move in
 * the Moves column. So the side to move in the FEN is the OPPONENT, and your
 * son plays the other colour. Get this backwards and every "he has the rook"
 * filter returns the puzzles where he has the knight.
 */
export function solverColour(activeColour) {
  return activeColour === 'w' ? 'b' : 'w';
}

/**
 * Full derived row for one puzzle FEN.
 */
export function deriveMaterial(fen) {
  const { placement, active } = splitFen(fen);
  const { white, black } = countPieces(placement);

  const whiteMaterial = sideMaterial(white);
  const blackMaterial = sideMaterial(black);
  const solver = solverColour(active);

  const solverMaterial = solver === 'w' ? whiteMaterial : blackMaterial;
  const opponentMaterial = solver === 'w' ? blackMaterial : whiteMaterial;

  const nonPawnCount =
    white.Q + white.R + white.B + white.N + black.Q + black.R + black.B + black.N;
  const pawnCount = white.P + black.P;

  return {
    material_sig: materialSignature(whiteMaterial, blackMaterial),
    white_material: whiteMaterial,
    black_material: blackMaterial,
    solver_colour: solver,
    solver_material: solverMaterial,
    opponent_material: opponentMaterial,
    white_pawns: white.P,
    black_pawns: black.P,
    has_pawns: pawnCount > 0,
    piece_count: nonPawnCount + pawnCount + 2, // + both kings
  };
}

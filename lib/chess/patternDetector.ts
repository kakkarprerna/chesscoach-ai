import { Chess } from "chess.js";
import { MoveEvaluation } from "@/lib/chess/moveEvaluation";
import { GamePattern } from "@/lib/chess/learningTypes";

type PatternSignal =
  | "opponent-plan"
  | "king-pressure"
  | "king-pawn-weakening"
  | "piece-improvement"
  | "quiet-position"
  | "forcing-attack"
  | "missed-check"
  | "missed-capture"
  | "missed-threat"
  | "late-reaction"
  | "passive-decision";

interface SignalEvidence {
  signals: PatternSignal[];
  move: MoveEvaluation;
}

interface PatternDefinition {
  id: string;
  title: string;
  description: string;
  lesson: string;
  severity: GamePattern["severity"];
  matches: (evidence: SignalEvidence) => boolean;
}

const ERROR_CLASSIFICATIONS = new Set([
  "inaccuracy",
  "mistake",
  "blunder",
]);

function isError(move: MoveEvaluation): boolean {
  return ERROR_CLASSIFICATIONS.has(move.classification);
}

function isQuietPosition(game: Chess): boolean {
  return (
    !game.isCheck() &&
    !game.isCheckmate() &&
    game.moves({ verbose: true }).length > 8
  );
}

function findKingSquare(
  game: Chess,
  color: "w" | "b"
): string | null {
  const board = game.board();

  for (let rank = 0; rank < board.length; rank++) {
    for (let file = 0; file < board[rank].length; file++) {
      const piece = board[rank][file];

      if (
        piece &&
        piece.type === "k" &&
        piece.color === color
      ) {
        return `${String.fromCharCode(97 + file)}${8 - rank}`;
      }
    }
  }

  return null;
}

function getNearbySquares(square: string): string[] {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;

  const result: string[] = [];

  for (let fileDelta = -2; fileDelta <= 2; fileDelta++) {
    for (let rankDelta = -2; rankDelta <= 2; rankDelta++) {
      const nextFile = file + fileDelta;
      const nextRank = rank + rankDelta;

      if (
        nextFile >= 0 &&
        nextFile <= 7 &&
        nextRank >= 0 &&
        nextRank <= 7
      ) {
        result.push(
          `${String.fromCharCode(97 + nextFile)}${nextRank + 1}`
        );
      }
    }
  }

  return result;
}

function getKingPressure(
  game: Chess,
  mover: "white" | "black"
): boolean {
  const opponent = mover === "white" ? "b" : "w";

  const kingSquare = findKingSquare(
    game,
    mover === "white" ? "w" : "b"
  );

  if (!kingSquare) {
    return false;
  }

  const nearbySquares = getNearbySquares(kingSquare);

  const attackingMoves = game.moves({
    verbose: true,
  });

  const nearbyAttackers = attackingMoves.filter(
    (move) =>
      move.color === opponent &&
      nearbySquares.includes(move.to)
  );

  return nearbyAttackers.length >= 2;
}

function weakensKing(move: MoveEvaluation): boolean {
  const text = move.move.toLowerCase();

  /*
   * SAN pawn moves that alter the kingside structure.
   *
   * Examples:
   *   g3, h3, f3
   *   g4, h4, f4
   *   ...g6, ...h6, ...f6
   *   ...g5, ...h5, ...f5
   */
  const pawnMove =
    /^[a-h][1-8]$/.test(text) ||
    /^[a-h][1-8][+#]$/.test(text);

  if (!pawnMove) {
    return false;
  }

  return [
    "f3",
    "g3",
    "h3",
    "f4",
    "g4",
    "h4",
    "f5",
    "g5",
    "h5",
    "f6",
    "g6",
    "h6",
  ].some((square) => text.startsWith(square));
}

function isForcingMove(move: MoveEvaluation): boolean {
  return (
    move.move.includes("+") ||
    move.move.includes("#") ||
    move.move.includes("x")
  );
}

function isMissedCheck(move: MoveEvaluation): boolean {
  return (
    move.bestMove.includes("+") ||
    move.bestMove.includes("#")
  );
}

function isMissedCapture(move: MoveEvaluation): boolean {
  return move.bestMove.includes("x");
}

function isDirectThreat(move: MoveEvaluation): boolean {
  return (
    isMissedCheck(move) ||
    isMissedCapture(move)
  );
}

function buildSignals(
  move: MoveEvaluation
): SignalEvidence {
  const signals: PatternSignal[] = [];

  const game = new Chess(move.fenBefore);

  const quiet = isQuietPosition(game);

  if (quiet) {
    signals.push("quiet-position");
  }

  const kingPressure = getKingPressure(
    game,
    move.color
  );

  if (kingPressure) {
    signals.push("king-pressure");
    signals.push("opponent-plan");
  }

  if (weakensKing(move)) {
    signals.push("king-pawn-weakening");
  }

  if (isForcingMove(move)) {
    signals.push("forcing-attack");
  }

  if (isMissedCheck(move)) {
    signals.push("missed-check");
    signals.push("forcing-attack");
  }

  if (isMissedCapture(move)) {
    signals.push("missed-capture");
  }

  if (isDirectThreat(move)) {
    signals.push("missed-threat");
  }

  /*
   * A meaningful error made while the opponent has
   * concrete pressure is stronger evidence of a
   * reaction problem than evaluation loss alone.
   */
  if (
    move.evaluationLoss >= 0.75 &&
    !isForcingMove(move) &&
    (kingPressure || isDirectThreat(move))
  ) {
    signals.push("late-reaction");
  }

  /*
   * Quiet-position evidence requires an actual engine
   * continuation. This prevents every inaccurate move
   * in a quiet position from becoming "poor planning."
   */
  if (
    quiet &&
    move.evaluationLoss >= 0.5 &&
    move.principalVariation &&
    move.principalVariation.length >= 2
  ) {
    signals.push("piece-improvement");
  }

  if (
    quiet &&
    move.evaluationLoss >= 0.75 &&
    !isForcingMove(move) &&
    isDirectThreat(move)
  ) {
    signals.push("passive-decision");
  }

  return {
    signals,
    move,
  };
}

const PATTERNS: PatternDefinition[] = [
  {
    id: "opponent-plan",
    title:
      "You don't consistently identify the opponent's plan first",
    description:
      "Your inaccurate decisions sometimes came after the opponent had already created concrete pressure or a threat.",
    lesson:
      "Before choosing your move, ask: What changed after my opponent's last move, and what are they threatening next?",
    severity: "high",
    matches: ({ signals }) =>
      signals.includes("opponent-plan") &&
      signals.includes("late-reaction"),
  },

  {
    id: "king-safety",
    title:
      "You react to king attacks too late",
    description:
      "Your inaccurate decisions sometimes occurred when multiple enemy attacking moves were already available around your king.",
    lesson:
      "When pressure starts building around your king, make king safety part of your candidate-move search before looking for your own attack.",
    severity: "high",
    matches: ({ signals }) =>
      signals.includes("king-pressure") &&
      signals.includes("late-reaction"),
  },

  {
    id: "king-pawn-weakening",
    title:
      "You sometimes weaken your king with pawn moves",
    description:
      "Some inaccurate decisions involved kingside pawn moves that were followed by a meaningful deterioration in the position.",
    lesson:
      "Before moving a pawn near your king, check the squares, files, and diagonals that become weaker.",
    severity: "medium",
    matches: ({ signals }) =>
      signals.includes("king-pawn-weakening") &&
      signals.includes("late-reaction"),
  },

  {
    id: "piece-improvement",
    title:
      "You miss chances to improve your worst-placed piece",
    description:
      "In quiet positions, some inaccurate moves came when the position called for improving a piece rather than forcing the game.",
    lesson:
      "When there is no forcing move, identify your worst-placed piece and ask where it belongs before making a pawn move or starting an attack.",
    severity: "medium",
    matches: ({ signals }) =>
      signals.includes("quiet-position") &&
      signals.includes("piece-improvement") &&
      !signals.includes("king-pressure"),
  },

  {
    id: "quiet-planning",
    title:
      "You need a clearer plan in quiet positions",
    description:
      "Some inaccuracies happened without an immediate tactical crisis, suggesting that choosing a direction was harder than finding a move.",
    lesson:
      "In a quiet position, ask: Which side is better? What is my worst piece? What does my opponent want to improve next?",
    severity: "medium",
    matches: ({ signals }) =>
      signals.includes("quiet-position") &&
      signals.includes("piece-improvement") &&
      !signals.includes("missed-check") &&
      !signals.includes("missed-capture") &&
      !signals.includes("king-pressure"),
  },

  {
    id: "passive-decisions",
    title:
      "You sometimes choose passive moves when action is needed",
    description:
      "Some quiet positions contained a stronger forcing continuation, but your move did not create enough pressure or counterplay.",
    lesson:
      "When your opponent is improving, look for a concrete way to create a threat, gain space, exchange an important piece, or change the character of the position.",
    severity: "medium",
    matches: ({ signals }) =>
      signals.includes("passive-decision"),
  },

  {
    id: "attacking-accuracy",
    title:
      "You see tactical ideas but miss stronger attacking continuations",
    description:
      "Some positions contained a forcing check, capture, or direct threat that was stronger than the move you played.",
    lesson:
      "Before taking material or making a quiet move, scan checks, forcing captures, and direct threats in that order.",
    severity: "medium",
    matches: ({ signals }) =>
      signals.includes("missed-check") &&
      signals.includes("forcing-attack"),
  },

  {
    id: "late-reaction",
    title:
      "You often react one move after the position changes",
    description:
      "Some meaningful errors appeared after the opponent had already created a concrete threat.",
    lesson:
      "Make a habit of reassessing the opponent's last move before continuing with your own plan.",
    severity: "high",
    matches: ({ signals }) =>
      signals.includes("late-reaction"),
  },
];

export interface PatternEvidence {
  patternId: string;
  move: MoveEvaluation;
}

export function detectGamePatternEvidence(
  moves: MoveEvaluation[]
): PatternEvidence[] {
  if (moves.length === 0) {
    return [];
  }

  const evidence = moves
    .filter(isError)
    .map(buildSignals);

  const results: PatternEvidence[] = [];

  for (const pattern of PATTERNS) {
    const matchingEvidence =
      evidence.filter(pattern.matches);

    /*
     * Keep the strongest two examples from this game
     * for each pattern. Cross-game recurrence is handled
     * by learningAnalysis.ts.
     */
    const strongestEvidence =
      matchingEvidence
        .sort(
          (a, b) =>
            b.move.evaluationLoss -
            a.move.evaluationLoss
        )
        .slice(0, 2);

    for (const item of strongestEvidence) {
      results.push({
        patternId: pattern.id,
        move: item.move,
      });
    }
  }

  return results;
}

export function detectGamePatterns(
  moves: MoveEvaluation[]
): GamePattern[] {
  if (moves.length === 0) {
    return [];
  }

  const evidence = moves
    .filter(isError)
    .map(buildSignals);

  const patterns: GamePattern[] = [];

  for (const pattern of PATTERNS) {
    const matchingEvidence =
      evidence.filter(pattern.matches);

    /*
     * This function analyzes ONE game.
     *
     * We only need one or two supporting moments here.
     * Recurrence across multiple games is handled by
     * learningAnalysis.ts.
     */
    if (matchingEvidence.length === 0) {
      continue;
    }

    /*
     * Avoid letting one game contribute dozens of
     * nearly identical moments.
     */
    const count = Math.min(
      matchingEvidence.length,
      2
    );

    patterns.push({
      id: pattern.id,
      title: pattern.title,
      description: pattern.description,
      count,
      severity: pattern.severity,
    });
  }

  return patterns;
}

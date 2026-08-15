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
  | "late-reaction"
  | "passive-decision"
  | "missed-capture"
  | "missed-threat";

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
  minimumEvidence: number;
  minimumGames: number;
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

  if (!/^[a-h][1-8][a-h][1-8]/.test(text)) {
    return false;
  }

  const from = text.slice(0, 2);
  const to = text.slice(2, 4);

  const kingSideSquares = [
    "f2",
    "g2",
    "h2",
    "f3",
    "g3",
    "h3",
    "f7",
    "g7",
    "h7",
    "f6",
    "g6",
    "h6",
  ];

  return (
    kingSideSquares.includes(from) ||
    kingSideSquares.includes(to)
  );
}

function isForcingMove(move: MoveEvaluation): boolean {
  const text = move.move;

  return (
    text.includes("+") ||
    text.includes("#") ||
    text.includes("x")
  );
}

function isMissedCheck(move: MoveEvaluation): boolean {
  return move.bestMove.includes("+") || move.bestMove.includes("#");
}

function isMissedCapture(move: MoveEvaluation): boolean {
  return move.bestMove.includes("x");
}

function isDirectThreat(move: MoveEvaluation): boolean {
  const bestMove = move.bestMove;

  return (
    bestMove.includes("+") ||
    bestMove.includes("#") ||
    bestMove.includes("x")
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
   * A late reaction means:
   * - the player made a meaningful error
   * - there was no forcing move in their choice
   * - the position contained an identifiable threat
   *
   * This is deliberately stricter than simply looking
   * at evaluation loss.
   */
  if (
    move.evaluationLoss >= 0.75 &&
    !isForcingMove(move) &&
    (kingPressure || isDirectThreat(move))
  ) {
    signals.push("late-reaction");
  }

  /*
   * Quiet-position evidence is only useful when there
   * is a real strategic alternative available.
   *
   * We use the principal variation rather than treating
   * every inaccurate quiet move as a piece-improvement
   * problem.
   */
  if (
    quiet &&
    move.evaluationLoss >= 0.5 &&
    move.principalVariation &&
    move.principalVariation.length >= 2
  ) {
    signals.push("piece-improvement");
  }

  /*
   * Passive decision:
   * a quiet position where the engine found a forcing
   * continuation that the player did not choose.
   */
  if (
    quiet &&
    move.evaluationLoss >= 0.75 &&
    !isForcingMove(move) &&
    (isMissedCheck(move) ||
      isMissedCapture(move) ||
      isDirectThreat(move))
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
      "In several games, your inaccurate moves came after the opponent had already created concrete pressure or a threat.",
    lesson:
      "Before choosing your move, ask: What changed after my opponent's last move, and what are they threatening next?",
    severity: "high",
    minimumEvidence: 4,
    minimumGames: 4,
    matches: ({ signals }) =>
      signals.includes("opponent-plan") &&
      signals.includes("late-reaction"),
  },

  {
    id: "king-safety",
    title:
      "You react to king attacks too late",
    description:
      "Your mistakes repeatedly occurred when two or more enemy attacking moves were already available around your king.",
    lesson:
      "When pressure starts building around your king, make king safety part of your candidate-move search before looking for your own attack.",
    severity: "high",
    minimumEvidence: 4,
    minimumGames: 4,
    matches: ({ signals }) =>
      signals.includes("king-pressure") &&
      signals.includes("late-reaction"),
  },

  {
    id: "king-pawn-weakening",
    title:
      "You sometimes weaken your king with pawn moves",
    description:
      "Several inaccurate decisions involved pawn moves on the kingside that were followed by a meaningful deterioration in the position.",
    lesson:
      "Before moving a pawn near your king, check the squares, files, and diagonals that become weaker.",
    severity: "medium",
    minimumEvidence: 4,
    minimumGames: 4,
    matches: ({ signals }) =>
      signals.includes("king-pawn-weakening") &&
      signals.includes("late-reaction"),
  },

  {
    id: "piece-improvement",
    title:
      "You miss chances to improve your worst-placed piece",
    description:
      "In several quiet positions, your move was inaccurate even though there was no immediate tactical crisis. These moments point toward piece placement and long-term improvement.",
    lesson:
      "When there is no forcing move, identify your worst-placed piece and ask where it belongs before making a pawn move or starting an attack.",
    severity: "medium",
    minimumEvidence: 4,
    minimumGames: 4,
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
      "You repeatedly lost some evaluation in positions without an immediate tactical crisis. The recurring issue is choosing a direction rather than finding a move.",
    lesson:
      "In a quiet position, ask three questions: Which side is better? What is my worst piece? What does my opponent want to improve next?",
    severity: "medium",
    minimumEvidence: 5,
    minimumGames: 5,
    matches: ({ signals }) =>
      signals.includes("quiet-position") &&
      signals.includes("piece-improvement") &&
      !signals.includes("missed-check") &&
      !signals.includes("missed-capture"),
  },

  {
    id: "passive-decisions",
    title:
      "You sometimes choose passive moves when action is needed",
    description:
      "Several quiet positions contained a stronger forcing continuation, but your move did not create enough pressure or counterplay.",
    lesson:
      "When your opponent is improving, look for a concrete way to create a threat, gain space, exchange an important piece, or change the character of the position.",
    severity: "medium",
    minimumEvidence: 4,
    minimumGames: 4,
    matches: ({ signals }) =>
      signals.includes("passive-decision"),
  },

  {
    id: "attacking-accuracy",
    title:
      "You see tactical ideas but miss stronger attacking continuations",
    description:
      "Several positions contained a forcing check, capture, or direct threat that was stronger than the move you played.",
    lesson:
      "Before taking material or making a quiet move, scan checks, forcing captures, and direct threats in that order.",
    severity: "medium",
    minimumEvidence: 4,
    minimumGames: 4,
    matches: ({ signals }) =>
      signals.includes("missed-check") &&
      signals.includes("forcing-attack"),
  },

  {
    id: "late-reaction",
    title:
      "You often react one move after the position changes",
    description:
      "Across multiple games, meaningful errors appeared after your opponent had already created a concrete threat.",
    lesson:
      "Make a habit of reassessing the opponent's last move before continuing with your own plan.",
    severity: "high",
    minimumEvidence: 4,
    minimumGames: 4,
    matches: ({ signals }) =>
      signals.includes("late-reaction"),
  },
];

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
     * Do not let one game dominate the pattern count.
     *
     * MoveEvaluation currently does not contain a game ID,
     * so within one analyzed game we count at most two
     * pieces of evidence toward a pattern.
     */
    const cappedCount = Math.min(
      matchingEvidence.length,
      2
    );

    if (cappedCount < pattern.minimumEvidence) {
      continue;
    }

    patterns.push({
      id: pattern.id,
      title: pattern.title,
      description: pattern.description,
      count: cappedCount,
      severity: pattern.severity,
    });
  }

  return patterns;
}

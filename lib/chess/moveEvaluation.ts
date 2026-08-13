export type MoveClassification =
  | "best"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export interface MoveEvaluation {
  moveNumber: number;
  color: "white" | "black";

  move: string;
  bestMove: string;

  evaluationBefore: number;
  evaluationAfter: number;

  evaluationLoss: number;

  classification: MoveClassification;

  fen: string;
fenBefore: string;

  explanation: string;
}

export function classifyMove(
  evaluationLoss: number
): MoveClassification {
  if (evaluationLoss <= 0.1) {
    return "best";
  }

  if (evaluationLoss <= 0.35) {
    return "good";
  }

  if (evaluationLoss <= 0.75) {
    return "inaccuracy";
  }

  if (evaluationLoss <= 1.5) {
    return "mistake";
  }

  return "blunder";
}

export function getMoveExplanation(
  classification: MoveClassification,
  move: string,
  bestMove: string,
  evaluationLoss: number
): string {
  if (classification === "best") {
    return "You played the engine's preferred move or stayed very close to it.";
  }

  if (classification === "good") {
    return "This was a solid move. There was a slightly stronger continuation available, but you kept most of the position's value.";
  }

  if (classification === "inaccuracy") {
    return `This move gave away some of the position's advantage. Stockfish preferred ${bestMove}.`;
  }

  if (classification === "mistake") {
    return `This move noticeably worsened your position. Stockfish preferred ${bestMove}, which would have preserved more of the position's value.`;
  }

  return `This was a major turning point. ${move} lost approximately ${evaluationLoss.toFixed(
    1
  )} evaluation points, while Stockfish preferred ${bestMove}.`;
}

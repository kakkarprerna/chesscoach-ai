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
  switch (classification) {
    case "best":
      return `Excellent choice. ${move} matches Stockfish's preferred move, so you handled this position very well.`;

    case "good":
      return `Solid decision. ${move} kept the position under control, although ${bestMove} was a little more precise.`;

    case "inaccuracy":
      return `This was a playable move, but it gave up some of your position's potential. Stockfish preferred ${bestMove}. The key lesson is to look for a more active or precise continuation before committing to ${move}.`;

    case "mistake":
      return `This is a move worth studying. ${move} noticeably reduced the quality of your position. Stockfish preferred ${bestMove}. Before making a move like this, pause and check what your opponent can do next.`;

    case "blunder":
      return `This was one of the most important moments in the game. ${move} changed the evaluation by about ${evaluationLoss.toFixed(
        1
      )} points, while Stockfish preferred ${bestMove}. This is a position worth revisiting so you can recognize the warning signs next time.`;
  }
}

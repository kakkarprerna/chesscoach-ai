export interface PuzzleCandidate {
  id: string;
  moveNumber: number;
  color: "white" | "black";
  fen: string;
  playedMove: string;
  bestMove: string;
  classification: "inaccuracy" | "mistake" | "blunder";
  evaluationLoss: number;
  question: string;
  explanation: string;
  coachingLesson: string;
  whyItMatters: string;

  solutionLine: string[];
}

export interface PatternReferencePosition {
  gameId: string;
  gameLabel: string;
  gameDate: string;
  moveNumber: number;
  color: "white" | "black";
  fen: string;
  playedMove: string;
  bestMove: string;
  evaluationLoss: number;
  classification: "inaccuracy" | "mistake" | "blunder";
}

export interface GamePattern {
  id: string;
  title: string;
  description: string;
  count: number;
  severity: "low" | "medium" | "high";
  referencePositions?: PatternReferencePosition[];
}

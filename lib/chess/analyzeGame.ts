"use client";

import { Chess } from "chess.js";
import { cleanPGN } from "@/lib/chess/cleanPGN";
import { sanitizePGN } from "@/lib/chess/parsePGN";
import {
  evaluatePosition,
  EngineEvaluation,
} from "@/lib/chess/stockfish";
import {
  MoveEvaluation,
  classifyMove,
} from "@/lib/chess/moveEvaluation";
import { generateCoachingExplanation } from "@/lib/chess/coaching";
import {
  PuzzleCandidate,
  GamePattern,
} from "@/lib/chess/learningTypes";
import { generatePuzzleCandidates } from "@/lib/chess/puzzleGenerator";
import { detectGamePatterns } from "@/lib/chess/patternDetector";

function evaluationToWhitePerspective(
  analysis: EngineEvaluation
): number {
  if (analysis.mate !== null) {
    const mateScore = 100;

    return analysis.mate > 0
      ? mateScore
      : -mateScore;
  }

  return analysis.evaluation;
}

function getMoverEvaluation(
  analysis: EngineEvaluation,
  mover: "white" | "black"
): number {
  const whiteEvaluation =
    evaluationToWhitePerspective(analysis);

  return mover === "white"
    ? whiteEvaluation
    : -whiteEvaluation;
}

function uciToSan(
  game: Chess,
  uciMove: string | null
): string {
  if (!uciMove || uciMove.length < 4) {
    return uciMove ?? "—";
  }

  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);

  const promotion = uciMove[4] as
    | "q"
    | "r"
    | "b"
    | "n"
    | undefined;

  try {
    const temporaryGame = new Chess(game.fen());

    const move = temporaryGame.move({
      from,
      to,
      ...(promotion ? { promotion } : {}),
    });

    return move?.san ?? uciMove;
  } catch {
    return uciMove;
  }
}

export interface GameAnalysisResult {
  moves: MoveEvaluation[];

  averageEvaluationLoss: number;

  whiteBlunders: number;
  blackBlunders: number;

  whiteMistakes: number;
  blackMistakes: number;

  whiteInaccuracies: number;
  blackInaccuracies: number;

  puzzles: PuzzleCandidate[];

  patterns: GamePattern[];
}

export async function analyzeGame(
  pgn: string,
  depth = 10,
  onProgress?: (
    completed: number,
    total: number
  ) => void
): Promise<GameAnalysisResult> {
  const game = new Chess();

  game.loadPgn(sanitizePGN(pgn));

  const history = game.history();

  if (history.length === 0) {
    return {
      moves: [],
      averageEvaluationLoss: 0,

      whiteBlunders: 0,
      blackBlunders: 0,

      whiteMistakes: 0,
      blackMistakes: 0,

      whiteInaccuracies: 0,
      blackInaccuracies: 0,

      puzzles: [],
      patterns: [],
    };
  }

  const analysisGame = new Chess();

  const results: MoveEvaluation[] = [];

  for (
    let index = 0;
    index < history.length;
    index++
  ) {
    const move = history[index];

    const mover: "white" | "black" =
      analysisGame.turn() === "w"
        ? "white"
        : "black";

    const moveNumber =
      Math.floor(index / 2) + 1;

    const positionBefore =
      analysisGame.fen();

    const beforeAnalysis =
      await evaluatePosition(
        positionBefore,
        depth
      );

    const bestMove = uciToSan(
      analysisGame,
      beforeAnalysis.bestMove
    );

    let playedMove;

    try {
      playedMove = analysisGame.move(move);
    } catch {
      continue;
    }

    if (!playedMove) {
      continue;
    }

    const positionAfter =
      analysisGame.fen();

    const afterAnalysis =
      await evaluatePosition(
        positionAfter,
        depth
      );

    const evaluationBefore =
      getMoverEvaluation(
        beforeAnalysis,
        mover
      );

    const evaluationAfter =
      getMoverEvaluation(
        afterAnalysis,
        mover
      );

    // If Stockfish's best move is exactly what the player played,
    // this move cannot be classified as an inaccuracy/mistake/blunder.
    // Shallow engine searches can produce small evaluation swings,
    // so explicitly protect the exact-best-move case.
    const playedMoveIsBest =
      playedMove.san === bestMove;

    const evaluationLoss = playedMoveIsBest
      ? 0
      : Math.max(
          0,
          evaluationBefore - evaluationAfter
        );

    const classification = playedMoveIsBest
      ? "best"
      : classifyMove(evaluationLoss);

    const explanation =
      generateCoachingExplanation({
        moveNumber,
        color: mover,
        move: playedMove.san,
        bestMove,
        evaluationBefore,
        evaluationAfter,
        evaluationLoss,
        classification,
        fen: positionAfter,
        fenBefore: positionBefore,
        explanation: "",
      });

    results.push({
      moveNumber,
      color: mover,
      move: playedMove.san,
      bestMove,
      evaluationBefore,
      evaluationAfter,
      evaluationLoss,
      classification,
      fen: positionAfter,
      fenBefore: positionBefore,
      explanation,
    });

    onProgress?.(
      index + 1,
      history.length
    );
  }

  const averageEvaluationLoss =
    results.length === 0
      ? 0
      : results.reduce(
          (sum, move) =>
            sum + move.evaluationLoss,
          0
        ) / results.length;

  const puzzles =
    generatePuzzleCandidates(results);

  const patterns =
    detectGamePatterns(results);

  return {
    moves: results,

    averageEvaluationLoss,

    whiteBlunders: results.filter(
      (move) =>
        move.color === "white" &&
        move.classification === "blunder"
    ).length,

    blackBlunders: results.filter(
      (move) =>
        move.color === "black" &&
        move.classification === "blunder"
    ).length,

    whiteMistakes: results.filter(
      (move) =>
        move.color === "white" &&
        move.classification === "mistake"
    ).length,

    blackMistakes: results.filter(
      (move) =>
        move.color === "black" &&
        move.classification === "mistake"
    ).length,

    whiteInaccuracies: results.filter(
      (move) =>
        move.color === "white" &&
        move.classification === "inaccuracy"
    ).length,

    blackInaccuracies: results.filter(
      (move) =>
        move.color === "black" &&
        move.classification === "inaccuracy"
    ).length,

    puzzles,
    patterns,
  };
}

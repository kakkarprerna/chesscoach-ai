"use client";

export interface EngineEvaluation {
  evaluation: number;
  mate: number | null;
  bestMove: string | null;
}

let worker: Worker | null = null;
let workerReady = false;
let initializing: Promise<void> | null = null;

const STOCKFISH_PATH = "/stockfish/stockfish-18-lite-single.js";

function createWorker(): Worker {
  console.log("[Stockfish] Creating worker:", STOCKFISH_PATH);

  const engine = new Worker(STOCKFISH_PATH);

  engine.addEventListener("error", (event) => {
    console.error("[Stockfish] Worker failed.");
    console.error("[Stockfish] message:", event.message || "(empty)");
    console.error("[Stockfish] filename:", event.filename || "(empty)");
    console.error("[Stockfish] line:", event.lineno || "(empty)");
    console.error("[Stockfish] column:", event.colno || "(empty)");

    workerReady = false;
    initializing = null;
    worker = null;
  });

  engine.addEventListener("messageerror", (event) => {
    console.error("[Stockfish] Worker message error:", event);
  });

  engine.addEventListener("message", (event) => {
    const line = String(event.data);

    if (
      line === "uciok" ||
      line === "readyok" ||
      line.startsWith("bestmove")
    ) {
      console.log("[Stockfish]", line);
    }
  });

  return engine;
}

function getWorker(): Worker {
  if (worker) {
    return worker;
  }

  worker = createWorker();

  return worker;
}

function waitForReady(engine: Worker): Promise<void> {
  if (workerReady) {
    return Promise.resolve();
  }

  if (initializing) {
    return initializing;
  }

  initializing = new Promise<void>((resolve, reject) => {
    let finished = false;

    const timeout = window.setTimeout(() => {
      if (finished) {
        return;
      }

      finished = true;
      initializing = null;

      engine.removeEventListener("message", handleMessage);

      reject(
        new Error(
          "Stockfish failed to initialize within 15 seconds."
        )
      );
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      engine.removeEventListener("message", handleMessage);
    }

    function handleMessage(event: MessageEvent) {
      const line = String(event.data);

      if (line === "uciok") {
        console.log("[Stockfish] UCI OK");
        engine.postMessage("isready");
        return;
      }

      if (line === "readyok") {
        if (finished) {
          return;
        }

        finished = true;

        cleanup();

        workerReady = true;
        initializing = null;

        console.log("[Stockfish] Engine ready");

        resolve();
      }
    }

    engine.addEventListener("message", handleMessage);

    try {
      engine.postMessage("uci");
    } catch (error) {
      cleanup();

      finished = true;
      initializing = null;

      reject(
        error instanceof Error
          ? error
          : new Error("Unable to communicate with Stockfish.")
      );
    }
  });

  return initializing;
}

export async function evaluatePosition(
  fen: string,
  depth = 10
): Promise<EngineEvaluation> {
  const engine = getWorker();

  await waitForReady(engine);

  return new Promise<EngineEvaluation>((resolve, reject) => {
    let evaluation = 0;
    let mate: number | null = null;
    let bestMove: string | null = null;
    let finished = false;

    const timeout = window.setTimeout(() => {
      if (finished) {
        return;
      }

      finished = true;

      cleanup();

      console.error(
        "[Stockfish] Analysis timed out for FEN:",
        fen
      );

      try {
        engine.postMessage("stop");
      } catch {
        // Ignore worker communication errors.
      }

      reject(
        new Error("Stockfish analysis timed out.")
      );
    }, 30000);

    function cleanup() {
      window.clearTimeout(timeout);

      engine.removeEventListener(
        "message",
        handleMessage
      );
    }

    function handleMessage(event: MessageEvent) {
      if (finished) {
        return;
      }

      const line = String(event.data);

      if (
        line.startsWith("info") &&
        line.includes("score")
      ) {
        const scoreMatch = line.match(
          /score (cp|mate) (-?\d+)/
        );

        if (!scoreMatch) {
          return;
        }

        const type = scoreMatch[1];
        const value = Number(scoreMatch[2]);

        if (type === "cp") {
          evaluation = value / 100;
          mate = null;
        } else if (type === "mate") {
          mate = value;
        }
      }

      if (line.startsWith("bestmove")) {
        const parts = line.trim().split(/\s+/);

        bestMove = parts[1] ?? null;

        finished = true;

        cleanup();

        resolve({
          evaluation,
          mate,
          bestMove,
        });
      }
    }

    engine.addEventListener(
      "message",
      handleMessage
    );

    try {
      engine.postMessage("ucinewgame");
      engine.postMessage(`position fen ${fen}`);
      engine.postMessage(`go depth ${depth}`);
    } catch (error) {
      finished = true;

      cleanup();

      reject(
        error instanceof Error
          ? error
          : new Error("Unable to send commands to Stockfish.")
      );
    }
  });
}
"use client";

import { useEffect, useState } from "react";

export default function StockfishTestPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState("Starting...");

  useEffect(() => {
    const worker = new Worker(
      "/stockfish/stockfish-18-lite-single.js"
    );

    worker.onmessage = (event) => {
      const message = String(event.data);

      console.log("[TEST STOCKFISH]", message);

      setMessages((current) => [
        ...current,
        message,
      ]);

      if (message === "uciok") {
        setStatus("UCI OK");
      }

      if (message === "readyok") {
        setStatus("ENGINE READY");
      }
    };

    worker.onerror = (event) => {
      console.error("[TEST STOCKFISH ERROR]", event);

      setStatus(
        `ERROR: ${event.message || "Worker failed"}`
      );
    };

    worker.postMessage("uci");

    return () => {
      worker.postMessage("quit");
      worker.terminate();
    };
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <h1 className="text-2xl font-semibold">
        Stockfish Test
      </h1>

      <p className="mt-3 text-zinc-400">
        Status: {status}
      </p>

      <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
        {messages.join("\n")}
      </pre>
    </main>
  );
}

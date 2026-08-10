import ChessGame from "@/components/chess/ChessGame";

export default function AnalyzePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">
            Game Analysis
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Analyse your game
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Replay your game, inspect the position and prepare it for deeper
            analysis.
          </p>
        </div>

        <ChessGame />
      </div>
    </main>
  );
}
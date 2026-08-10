export default function AnalyzePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">
            Game Analysis
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Analyse your game
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Upload a PGN or paste your game moves to start your analysis.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Paste PGN
            </h2>

            <textarea
              placeholder="Paste your PGN here..."
              className="mt-4 h-72 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-400"
            />

            <button
              disabled
              className="mt-4 w-full rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 opacity-50"
            >
              Analyse Game
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Import Game
            </h2>

            <div className="mt-4 flex min-h-72 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950">
              <div className="text-center">
                <div className="text-4xl">♟</div>

                <p className="mt-4 font-medium">
                  Drop your PGN here
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  File upload will be enabled next
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
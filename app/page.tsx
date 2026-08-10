import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            ChessCoach<span className="text-emerald-400">AI</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
          </nav>

          <Link
            href="/analyze"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Analyse a game
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-24 md:pb-28 md:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
              Learn from every game you play
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Turn your chess games into
              <span className="block text-emerald-400">
                better chess.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Analyse your games, understand your mistakes, learn the openings
              you played, and build a personalised training plan.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/analyze"
                className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Analyse your first game
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl border border-zinc-700 px-6 py-3 font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Game Input Preview */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Start with a game
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Upload a PGN, paste your moves, or add a game link.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-6 text-center">
                <div className="text-3xl">♟</div>

                <h3 className="mt-3 font-medium">
                  Upload PGN
                </h3>

                <p className="mt-2 text-xs text-zinc-500">
                  .pgn files supported
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
                <div className="text-3xl">♜</div>

                <h3 className="mt-3 font-medium">
                  Paste PGN
                </h3>

                <p className="mt-2 text-xs text-zinc-500">
                  Paste your complete game
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
                <div className="text-3xl">♞</div>

                <h3 className="mt-3 font-medium">
                  Game URL
                </h3>

                <p className="mt-2 text-xs text-zinc-500">
                  Lichess or Chess.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-y border-zinc-800 bg-zinc-900/40 px-6 py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              From game to training plan.
            </h2>

            <p className="mt-4 text-zinc-400">
              ChessCoach AI combines chess-engine analysis with explanations
              designed for players who want to understand their games.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Analyse",
                description:
                  "Find inaccuracies, mistakes, blunders and the critical moments that changed your game.",
              },
              {
                number: "02",
                title: "Understand",
                description:
                  "Get explanations of why your moves worked or failed, without needing to understand raw engine numbers.",
              },
              {
                number: "03",
                title: "Improve",
                description:
                  "Turn recurring mistakes into targeted exercises, opening study and practical training.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-7"
              >
                <span className="text-sm font-semibold text-emerald-400">
                  {item.number}
                </span>

                <h3 className="mt-4 text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-zinc-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">
              Built for improvement
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              More than an engine evaluation.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Game Analysis",
                description:
                  "Understand the moments that mattered instead of staring at an evaluation graph.",
              },
              {
                title: "Opening Reference",
                description:
                  "Identify the opening and discover the plans, variations and ideas behind it.",
              },
              {
                title: "Learning Resources",
                description:
                  "Get 3–5 carefully selected resources related to the opening and weaknesses in your game.",
              },
              {
                title: "Training Puzzles",
                description:
                  "Turn your own mistakes into positions you can solve and learn from.",
              },
              {
                title: "Player Profile",
                description:
                  "Track recurring weaknesses across your games and see where your play is improving.",
              },
              {
                title: "Opponent Preparation",
                description:
                  "Analyse previous games against an opponent and prepare for their common patterns.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-800 p-7 transition hover:border-zinc-700 hover:bg-zinc-900/50"
              >
                <h3 className="text-lg font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-zinc-500 md:flex-row">
          <p>ChessCoach AI</p>
          <p>Learn from every game you play.</p>
        </div>
      </footer>
    </main>
  );
}
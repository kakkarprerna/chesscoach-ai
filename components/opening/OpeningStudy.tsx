"use client";

interface OpeningResource {
  title: string;
  type: "Guide" | "Video" | "Practice" | "Games" | "Reference";
  description: string;
  url: string;
}

interface OpeningStudyData {
  name: string;
  description: string;
  keyIdeas: string[];
  typicalPlans: string[];
  commonMistakes: string[];
  resources: OpeningResource[];
}

interface OpeningStudyProps {
  opening: string;
  variation?: string;
  eco?: string;
}

const openingData: Record<string, OpeningStudyData> = {
  "Ruy Lopez": {
    name: "Ruy Lopez",
    description:
      "A classical 1.e4 opening where White develops actively and puts pressure on the e5-pawn while preparing for long-term central and kingside play.",
    keyIdeas: [
      "Develop pieces quickly and prepare to castle.",
      "Put pressure on the e5-pawn with the bishop.",
      "Understand when to exchange the bishop for the knight on c6.",
      "Prepare the central pawn break d4 when the position allows it.",
    ],
    typicalPlans: [
      "Castle and complete development before starting a major attack.",
      "Use c3 and d4 to build a strong centre in suitable positions.",
      "Control the centre before launching kingside play.",
    ],
    commonMistakes: [
      "Moving the same piece repeatedly during the opening.",
      "Attacking too early before completing development.",
      "Playing d4 without checking the tactical consequences.",
    ],
    resources: [
      {
        title: "Ruy Lopez — Opening Explorer",
        type: "Reference",
        description:
          "Explore the main variations and move orders of the Ruy Lopez.",
        url: "https://lichess.org/analysis",
      },
      {
        title: "Ruy Lopez — Chess Opening Guide",
        type: "Guide",
        description:
          "Study the opening's basic ideas, plans and common structures.",
        url: "https://www.chess.com/openings/Ruy-Lopez-Opening",
      },
      {
        title: "Ruy Lopez — Master Games",
        type: "Games",
        description:
          "Study how strong players handle the resulting positions.",
        url: "https://www.chessgames.com/perl/chessopening?eco=C60",
      },
      {
        title: "Ruy Lopez — Practice",
        type: "Practice",
        description:
          "Play positions from the opening and test your understanding.",
        url: "https://lichess.org/practice",
      },
    ],
  },

  "Italian Game": {
    name: "Italian Game",
    description:
      "An active 1.e4 opening focused on rapid development, central control and pressure around the black king.",
    keyIdeas: [
      "Develop the bishop to c4 and target the f7-square.",
      "Castle early and connect the pieces.",
      "Control the centre with active piece play.",
      "Look for tactical opportunities around the black king.",
    ],
    typicalPlans: [
      "Castle and complete development.",
      "Use c3 and d4 when the position supports the central break.",
      "Keep active pieces rather than making unnecessary pawn moves.",
    ],
    commonMistakes: [
      "Launching an attack before development is complete.",
      "Ignoring Black's counterplay in the centre.",
      "Moving the queen too early.",
    ],
    resources: [
      {
        title: "Italian Game — Opening Explorer",
        type: "Reference",
        description:
          "Explore common Italian Game variations and move orders.",
        url: "https://lichess.org/analysis",
      },
      {
        title: "Italian Game — Chess Opening Guide",
        type: "Guide",
        description:
          "Learn the opening's core plans and strategic ideas.",
        url: "https://www.chess.com/openings/Italian-Game",
      },
      {
        title: "Italian Game — Master Games",
        type: "Games",
        description:
          "Study model games from the Italian Game.",
        url: "https://www.chessgames.com/perl/chessopening?eco=C50",
      },
      {
        title: "Opening Practice",
        type: "Practice",
        description:
          "Practice common opening positions and tactical themes.",
        url: "https://lichess.org/practice",
      },
    ],
  },

  "Sicilian Defense": {
    name: "Sicilian Defense",
    description:
      "A sharp response to 1.e4 where Black immediately challenges White's central pawn and usually creates an asymmetrical position.",
    keyIdeas: [
      "Challenge White's centre with ...c5.",
      "Develop actively rather than defending passively.",
      "Understand the importance of the d5-square.",
      "Be prepared for tactical and strategic complexity.",
    ],
    typicalPlans: [
      "Develop the queenside pieces and castle.",
      "Use ...d5 or ...b5 in appropriate positions.",
      "Create counterplay rather than simply reacting to White.",
    ],
    commonMistakes: [
      "Learning moves without understanding the resulting structures.",
      "Allowing White to build a completely free centre.",
      "Launching pawn attacks without sufficient development.",
    ],
    resources: [
      {
        title: "Sicilian Defense — Opening Explorer",
        type: "Reference",
        description:
          "Explore Sicilian variations and compare different responses.",
        url: "https://lichess.org/analysis",
      },
      {
        title: "Sicilian Defense — Chess Opening Guide",
        type: "Guide",
        description:
          "Understand the main ideas behind the Sicilian Defense.",
        url: "https://www.chess.com/openings/Sicilian-Defense",
      },
      {
        title: "Sicilian Defense — Master Games",
        type: "Games",
        description:
          "Study model games from major Sicilian variations.",
        url: "https://www.chessgames.com/perl/chessopening?eco=B20",
      },
      {
        title: "Opening Practice",
        type: "Practice",
        description:
          "Train recurring positions and tactical patterns.",
        url: "https://lichess.org/practice",
      },
    ],
  },

  "French Defense": {
    name: "French Defense",
    description:
      "A 1.e4 e6 opening where Black prepares ...d5 to challenge White's centre and often obtains a solid but strategically complex position.",
    keyIdeas: [
      "Challenge White's centre with ...d5.",
      "Understand the tension between the pawn chains.",
      "Develop the pieces while managing the c8 bishop.",
      "Choose pawn breaks carefully.",
    ],
    typicalPlans: [
      "Attack the base of White's pawn chain.",
      "Use ...c5 or ...f6 as strategic pawn breaks when appropriate.",
      "Develop the queenside while preparing safe king placement.",
    ],
    commonMistakes: [
      "Allowing White's centre to become permanently dominant.",
      "Playing pawn breaks without calculating the resulting structure.",
      "Neglecting development while focusing on the centre.",
    ],
    resources: [
      {
        title: "French Defense — Opening Explorer",
        type: "Reference",
        description:
          "Explore the major French Defense variations.",
        url: "https://lichess.org/analysis",
      },
      {
        title: "French Defense — Chess Opening Guide",
        type: "Guide",
        description:
          "Learn the main strategic themes and plans.",
        url: "https://www.chess.com/openings/French-Defense",
      },
      {
        title: "French Defense — Master Games",
        type: "Games",
        description:
          "Study model games and recurring pawn structures.",
        url: "https://www.chessgames.com/perl/chessopening?eco=C00",
      },
      {
        title: "Opening Practice",
        type: "Practice",
        description:
          "Practice positions and recurring tactical patterns.",
        url: "https://lichess.org/practice",
      },
    ],
  },

  "Caro-Kann Defense": {
    name: "Caro-Kann Defense",
    description:
      "A solid response to 1.e4 where Black supports ...d5 with the c-pawn and aims for a sound pawn structure and active development.",
    keyIdeas: [
      "Challenge the centre with ...d5.",
      "Develop the light-squared bishop before closing the position.",
      "Maintain a solid pawn structure.",
      "Use active piece development to compensate for White's space.",
    ],
    typicalPlans: [
      "Complete development and castle.",
      "Challenge White's centre with appropriate pawn breaks.",
      "Use the c-file and queenside space for counterplay in suitable positions.",
    ],
    commonMistakes: [
      "Playing too passively because the opening is considered solid.",
      "Delaying development.",
      "Giving White too much space without creating counterplay.",
    ],
    resources: [
      {
        title: "Caro-Kann — Opening Explorer",
        type: "Reference",
        description:
          "Explore the main Caro-Kann variations.",
        url: "https://lichess.org/analysis",
      },
      {
        title: "Caro-Kann — Chess Opening Guide",
        type: "Guide",
        description:
          "Learn the basic plans and strategic themes.",
        url: "https://www.chess.com/openings/Caro-Kann-Defense",
      },
      {
        title: "Caro-Kann — Master Games",
        type: "Games",
        description:
          "Study model games and recurring structures.",
        url: "https://www.chessgames.com/perl/chessopening?eco=B10",
      },
      {
        title: "Opening Practice",
        type: "Practice",
        description:
          "Train typical positions and tactical patterns.",
        url: "https://lichess.org/practice",
      },
    ],
  },
};

export default function OpeningStudy({
  opening,
  variation,
  eco,
}: OpeningStudyProps) {
  const data = openingData[opening];

  if (!data) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm uppercase tracking-wider text-emerald-400">
          Opening study
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Opening not yet identified
        </h2>

        <p className="mt-3 text-sm text-zinc-400">
          We haven't identified this opening yet. More opening coverage will
          be added as the ChessCoach knowledge base grows.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <p className="text-sm uppercase tracking-wider text-emerald-400">
          Opening study
        </p>

       <div className="mt-3 flex flex-wrap gap-2">
  {variation && variation !== "—" && (
    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
      {variation}
    </span>
  )}

  {eco && eco !== "—" && (
    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-500">
      ECO {eco}
    </span>
  )}
</div>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          {data.description}
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h3 className="font-semibold">
            Key ideas
          </h3>

          <ul className="mt-4 space-y-3">
            {data.keyIdeas.map((idea) => (
              <li
                key={idea}
                className="flex gap-3 text-sm leading-5 text-zinc-300"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{idea}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h3 className="font-semibold">
            Typical plans
          </h3>

          <ul className="mt-4 space-y-3">
            {data.typicalPlans.map((plan) => (
              <li
                key={plan}
                className="flex gap-3 text-sm leading-5 text-zinc-300"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{plan}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-amber-900/40 bg-amber-950/10 p-5">
        <h3 className="font-semibold">
          Common mistakes to watch for
        </h3>

        <ul className="mt-4 space-y-3">
          {data.commonMistakes.map((mistake) => (
            <li
              key={mistake}
              className="flex gap-3 text-sm leading-5 text-zinc-300"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              <span>{mistake}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <div>
          <p className="text-sm uppercase tracking-wider text-emerald-400">
            Study resources
          </p>

          <h3 className="mt-2 text-xl font-semibold">
            Learn this opening
          </h3>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {data.resources.map((resource) => (
            <a
              key={resource.title}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400">
                  {resource.type}
                </span>

                <span className="text-zinc-600 transition group-hover:text-zinc-300">
                  ↗
                </span>
              </div>

              <h4 className="mt-4 font-medium text-zinc-100">
                {resource.title}
              </h4>

              <p className="mt-2 text-sm leading-5 text-zinc-500">
                {resource.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
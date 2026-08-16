"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LearningAnalysisResult,
} from "@/lib/chess/learningAnalysis";

type ResultsSection =
  | "overview"
  | "priority"
  | "patterns"
  | "puzzles";

const sections: {
  id: ResultsSection;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    description: "Your coaching report",
  },
  {
    id: "priority",
    label: "Priority Focus",
    shortLabel: "Priority",
    description: "What matters most",
  },
  {
    id: "patterns",
    label: "Recurring Patterns",
    shortLabel: "Patterns",
    description: "Themes across games",
  },
  {
    id: "puzzles",
    label: "Practice Puzzles",
    shortLabel: "Puzzles",
    description: "Positions to revisit",
  },
];

function LearningResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [analysis, setAnalysis] =
    useState<LearningAnalysisResult | null>(null);

  const [activeSection, setActiveSection] =
    useState<ResultsSection>(
      (searchParams.get("section") as ResultsSection) ||
        "overview"
    );

  useEffect(() => {
    const stored =
      sessionStorage.getItem(
        "chesscoach-learning-analysis"
      );

    if (!stored) {
      router.replace("/learn");
      return;
    }

    try {
      const parsed =
        JSON.parse(stored) as LearningAnalysisResult;

      setAnalysis(parsed);
    } catch {
      router.replace("/learn");
    }
  }, [router]);

  function handleSelectPuzzle(
    puzzle: LearningAnalysisResult["puzzles"][number]
  ) {
    sessionStorage.setItem(
      "chesscoach-puzzle",
      JSON.stringify(puzzle)
    );

    sessionStorage.setItem(
      "chesscoach-puzzle-origin",
      "puzzles"
    );

    router.push("/learn/puzzle");
  }

  function handlePracticePattern(
    pattern: LearningAnalysisResult["patterns"][number],
    reference: NonNullable<
      LearningAnalysisResult["patterns"][number]["referencePositions"]
    >[number]
  ) {
    const puzzle = {
      id: `pattern-${pattern.id}-${reference.gameId}-${reference.moveNumber}`,

      moveNumber: reference.moveNumber,
      color: reference.color,

      fen: reference.fen,

      playedMove: reference.playedMove,
      bestMove: reference.bestMove,

      classification:
        reference.classification,

      evaluationLoss:
        reference.evaluationLoss,

      question:
        "What would you do differently in this position?",

      explanation:
        pattern.description,

      coachingLesson:
        pattern.description,

      whyItMatters:
        `This pattern appeared in ${pattern.gameCount} ${
          pattern.gameCount === 1
            ? "game"
            : "games"
        }, so it is worth practicing as a recurring part of your decision-making.`,

      gameLabel:
        reference.gameLabel,

      gameDate:
        reference.gameDate,

      solutionLine: [
        reference.bestMove,
      ],
    };

    sessionStorage.setItem(
      "chesscoach-puzzle",
      JSON.stringify(puzzle)
    );

    sessionStorage.setItem(
      "chesscoach-puzzle-origin",
      "patterns"
    );

    router.push("/learn/puzzle");
  }

  const [completedPuzzles, setCompletedPuzzles] =
    useState<string[]>([]);

  useEffect(() => {
    const stored =
      sessionStorage.getItem(
        "chesscoach-completed-puzzles"
      );

    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setCompletedPuzzles(parsed);
      }
    } catch {
      // Ignore malformed progress state.
    }
  }, []);

  if (!analysis) {
    return (
      <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />

            <p className="mt-4 text-sm font-bold text-zinc-500">
              Loading your learning plan...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const patternCount =
    analysis.patterns.length;

  const puzzleCount =
    analysis.puzzles.length;

  const strongestPattern =
    analysis.patterns[0] ?? null;

  const practicePositions =
    analysis.patterns.reduce(
      (total, pattern) =>
        total +
        (pattern.referencePositions?.length ?? 0),
      0
    );

  function isPuzzleCompleted(
    puzzleId: string
  ) {
    return completedPuzzles.includes(puzzleId);
  }

  const completedPuzzleCount =
    analysis.puzzles.filter((puzzle) =>
      isPuzzleCompleted(puzzle.id)
    ).length;

  const puzzleProgress =
    puzzleCount === 0
      ? 0
      : Math.round(
          (completedPuzzleCount / puzzleCount) * 100
        );

  function handleSelectPuzzleWithProgress(
    puzzle: LearningAnalysisResult["puzzles"][number]
  ) {
    sessionStorage.setItem(
      "chesscoach-active-puzzle-id",
      puzzle.id
    );

    sessionStorage.setItem(
      "chesscoach-puzzle",
      JSON.stringify(puzzle)
    );

    router.push("/learn/puzzle");
  }

  const activeSectionData =
    sections.find(
      (section) => section.id === activeSection
    ) ?? sections[0];

  function goToSection(
    section: ResultsSection
  ) {
    setActiveSection(section);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f7f4] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-40 shrink-0 border-b border-[#e8e6df] bg-[#fdfdfb]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] w-full max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <div>
            <div className="text-sm font-black tracking-tight text-violet-600">
              ChessCoach AI
            </div>

            <h1 className="mt-0.5 text-xl font-black tracking-tight">
              Learning Results
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/games")}
              className="hidden rounded-xl border border-[#dedcd5] bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 sm:block"
            >
              Game Library
            </button>

            <button
              type="button"
              onClick={() => router.push("/learn")}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-500"
            >
              Study other games
            </button>
          </div>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="sticky top-[72px] z-30 border-b border-[#e8e6df] bg-[#fdfdfb]/95 backdrop-blur lg:hidden">
        <div className="flex gap-1 overflow-x-auto px-4 py-2.5">
          {sections.map((section) => {
            const active =
              activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() =>
                  goToSection(section.id)
                }
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                  active
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-white text-zinc-500 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                {section.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main workspace */}
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:min-h-[calc(100vh-72px)]">
        {/* Desktop sidebar */}
        <aside className="hidden w-[250px] shrink-0 lg:block">
          <div className="sticky top-[96px] overflow-hidden rounded-3xl border border-[#e4e2db] bg-white shadow-sm">
            <div className="border-b border-zinc-100 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">
                Your lesson
              </p>

              <h2 className="mt-1 text-lg font-black text-zinc-900">
                Learning Results
              </h2>

              <p className="mt-2 text-xs font-semibold leading-5 text-zinc-400">
                Move through each section without losing your place.
              </p>
            </div>

            <nav className="p-2">
              {sections.map((section) => {
                const active =
                  activeSection === section.id;

                const count =
                  section.id === "patterns"
                    ? patternCount
                    : section.id === "puzzles"
                      ? puzzleCount
                      : null;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      goToSection(section.id)
                    }
                    className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-violet-50 text-violet-700"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                        active
                          ? "bg-violet-600 text-white"
                          : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200"
                      }`}
                    >
                      {section.id === "overview"
                        ? "01"
                        : section.id === "priority"
                          ? "02"
                          : section.id === "patterns"
                            ? "03"
                            : "04"}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black">
                        {section.label}
                      </span>

                      <span
                        className={`mt-0.5 block text-[11px] font-semibold ${
                          active
                            ? "text-violet-500"
                            : "text-zinc-400"
                        }`}
                      >
                        {section.description}
                      </span>
                    </span>

                    {count !== null && (
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black ${
                          active
                            ? "bg-violet-100 text-violet-700"
                            : "bg-zinc-100 text-zinc-400"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-zinc-100 bg-[#fafaf8] p-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white p-3 text-center">
                  <p className="text-lg font-black">
                    {analysis.gamesAnalyzed}
                  </p>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-wide text-zinc-400">
                    Games
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 text-center">
                  <p className="text-lg font-black">
                    {patternCount}
                  </p>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-wide text-zinc-400">
                    Themes
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 text-center">
                  <p className="text-lg font-black">
                    {puzzleCount}
                  </p>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-wide text-zinc-400">
                    Puzzles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content panel */}
        <section className="min-w-0 flex-1">
          <div className="flex min-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-[2rem] border border-[#e4e2db] bg-white shadow-sm">
            {/* Section header */}
            <div className="shrink-0 border-b border-zinc-100 bg-[#fdfdfb] px-5 py-5 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">
                    {activeSectionData.label}
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                    {activeSection === "overview" &&
                      "What your games are teaching you"}

                    {activeSection === "priority" &&
                      "The one thing to focus on first"}

                    {activeSection === "patterns" &&
                      "Recurring themes across your games"}

                    {activeSection === "puzzles" &&
                      "Positions worth practicing"}
                  </h2>
                </div>

                <div className="hidden rounded-2xl bg-violet-50 px-4 py-3 text-right sm:block">
                  <p className="text-[10px] font-black uppercase tracking-wide text-violet-400">
                    Current section
                  </p>

                  <p className="mt-0.5 text-sm font-black text-violet-700">
                    {activeSectionData.shortLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable section content */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="p-5 sm:p-7">
                {/* Overview */}
                {activeSection === "overview" && (
                  <div className="space-y-6">
                    <div className="rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 sm:p-8">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-600">
                        Your coaching report
                      </p>

                      <h3 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
                        Here&apos;s what your games are trying to teach you
                      </h3>

                      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
                        We looked across your selected games for recurring
                        decision-making patterns and moments worth practicing.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-3xl border border-zinc-100 bg-[#fafaf8] p-5">
                        <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                          Games studied
                        </p>

                        <p className="mt-2 text-4xl font-black text-zinc-900">
                          {analysis.gamesAnalyzed}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-zinc-500">
                          Your recent games
                        </p>
                      </div>

                      <div className="rounded-3xl border border-zinc-100 bg-[#fafaf8] p-5">
                        <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                          Recurring themes
                        </p>

                        <p className="mt-2 text-4xl font-black text-zinc-900">
                          {patternCount}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-zinc-500">
                          Patterns across games
                        </p>
                      </div>

                      <div className="rounded-3xl border border-zinc-100 bg-[#fafaf8] p-5">
                        <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                          Practice moments
                        </p>

                        <p className="mt-2 text-4xl font-black text-zinc-900">
                          {puzzleCount + practicePositions}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-zinc-500">
                          Positions worth revisiting
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        goToSection(
                          strongestPattern
                            ? "priority"
                            : "puzzles"
                        )
                      }
                      className="flex w-full items-center justify-between rounded-3xl border border-violet-100 bg-violet-50 p-5 text-left transition hover:border-violet-200 hover:bg-violet-100"
                    >
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-violet-500">
                          Next step
                        </p>

                        <p className="mt-1 text-lg font-black text-violet-900">
                          Start with what matters most
                        </p>

                        <p className="mt-1 text-sm font-semibold text-violet-700">
                          Review your highest-priority coaching focus.
                        </p>
                      </div>

                      <span className="text-xl font-black text-violet-600">
                        →
                      </span>
                    </button>
                  </div>
                )}

                {/* Priority */}
                {activeSection === "priority" && (
                  <div className="space-y-6">
                    {!strongestPattern ? (
                      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                        <h3 className="text-xl font-black text-zinc-900">
                          No priority pattern yet
                        </h3>

                        <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-600">
                          Your selected games did not show a strong recurring
                          pattern yet. Study a few more games and come back here.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-[2rem] bg-violet-600 p-6 text-white shadow-sm sm:p-8">
                          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-200">
                                Your priority focus
                              </p>

                              <h3 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                                {strongestPattern.title}
                              </h3>

                              <p className="mt-4 text-base leading-7 text-violet-100 sm:text-lg">
                                {strongestPattern.description}
                              </p>
                            </div>

                            <div className="shrink-0 rounded-2xl bg-white/10 p-5 lg:min-w-[190px]">
                              <p className="text-xs font-black uppercase tracking-wide text-violet-200">
                                Recurrence
                              </p>

                              <p className="mt-2 text-4xl font-black">
                                {Math.round(
                                  strongestPattern.gameCoverage * 100
                                )}%
                              </p>

                              <p className="mt-1 text-sm font-semibold text-violet-100">
                                of studied games
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="rounded-3xl border border-zinc-100 bg-[#fafaf8] p-5">
                            <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                              Severity
                            </p>

                            <p className="mt-2 text-xl font-black capitalize">
                              {strongestPattern.severity}
                            </p>
                          </div>

                          <div className="rounded-3xl border border-zinc-100 bg-[#fafaf8] p-5">
                            <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                              Games affected
                            </p>

                            <p className="mt-2 text-xl font-black">
                              {strongestPattern.gameCount}
                            </p>
                          </div>

                          <div className="rounded-3xl border border-zinc-100 bg-[#fafaf8] p-5">
                            <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                              Practice positions
                            </p>

                            <p className="mt-2 text-xl font-black">
                              {strongestPattern.referencePositions?.length ?? 0}
                            </p>
                          </div>
                        </div>

                        {strongestPattern.referencePositions &&
                          strongestPattern.referencePositions.length > 0 && (
                            <div className="rounded-3xl border border-zinc-100 bg-white">
                              <div className="border-b border-zinc-100 p-5">
                                <p className="text-xs font-black uppercase tracking-wide text-violet-600">
                                  Start here
                                </p>

                                <h4 className="mt-1 text-xl font-black">
                                  Practice the evidence
                                </h4>

                                <p className="mt-1 text-sm font-semibold text-zinc-500">
                                  These positions are the clearest examples of
                                  your priority pattern.
                                </p>
                              </div>

                              <div className="max-h-[min(430px,55vh)] overflow-y-auto p-4">
                                <div className="space-y-3">
                                  {strongestPattern.referencePositions.map(
                                    (reference) => (
                                      <div
                                        key={`${reference.gameId}-${reference.moveNumber}`}
                                        className="rounded-2xl border border-zinc-100 bg-[#fafaf8] p-4"
                                      >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                          <div>
                                            <p className="text-sm font-black">
                                              {reference.gameLabel}
                                            </p>

                                            <p className="mt-1 text-xs font-bold text-zinc-400">
                                              Move {reference.moveNumber}
                                              {" · "}
                                              {reference.color === "white"
                                                ? "White"
                                                : "Black"}
                                              {" · "}
                                              {reference.classification}
                                            </p>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handlePracticePattern(
                                                strongestPattern,
                                                reference
                                              )
                                            }
                                            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-500"
                                          >
                                            Practice →
                                          </button>
                                        </div>

                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                          <div className="rounded-xl bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                                              You played
                                            </p>

                                            <p className="mt-1 text-lg font-black">
                                              {reference.playedMove}
                                            </p>
                                          </div>

                                          <div className="rounded-xl bg-violet-50 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-wide text-violet-500">
                                              Coach suggests
                                            </p>

                                            <p className="mt-1 text-lg font-black text-violet-700">
                                              {reference.bestMove}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                )}

                {/* Patterns */}
                {activeSection === "patterns" && (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-violet-600">
                          Recurring patterns
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                          These themes appeared across multiple games.
                        </p>
                      </div>

                      <span className="self-start rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-700">
                        {patternCount}{" "}
                        {patternCount === 1
                          ? "theme"
                          : "themes"}
                      </span>
                    </div>

                    {analysis.patterns.length === 0 ? (
                      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                        <h4 className="text-xl font-black">
                          No recurring pattern yet
                        </h4>

                        <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-600">
                          Your selected games did not show a repeated mistake
                          pattern at this analysis depth.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[min(650px,68vh)] space-y-4 overflow-y-auto pr-1">
                        {analysis.patterns.map(
                          (pattern, patternIndex) => (
                            <article
                              key={pattern.id}
                              className="overflow-hidden rounded-3xl border border-zinc-100 bg-[#fafaf8]"
                            >
                              <div className="p-5 sm:p-6">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                                    Focus {patternIndex + 1}
                                  </span>

                                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-zinc-500">
                                    {pattern.severity}
                                  </span>

                                  <span className="text-xs font-bold text-zinc-400">
                                    {pattern.gameCount}{" "}
                                    {pattern.gameCount === 1
                                      ? "game"
                                      : "games"}
                                  </span>

                                  <span className="text-xs font-bold text-zinc-400">
                                    ·{" "}
                                    {Math.round(
                                      pattern.gameCoverage * 100
                                    )}
                                    % coverage
                                  </span>
                                </div>

                                <h4 className="mt-3 text-xl font-black text-zinc-900 sm:text-2xl">
                                  {pattern.title}
                                </h4>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 sm:text-base">
                                  {pattern.description}
                                </p>

                                {pattern.referencePositions &&
                                  pattern.referencePositions.length > 0 && (
                                    <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-100 bg-white">
                                      <div className="border-b border-zinc-100 px-4 py-3">
                                        <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                                          Evidence
                                        </p>
                                      </div>

                                      <div className="max-h-[330px] overflow-y-auto p-3">
                                        <div className="space-y-2">
                                          {pattern.referencePositions.map(
                                            (reference) => (
                                              <div
                                                key={`${reference.gameId}-${reference.moveNumber}`}
                                                className="rounded-xl border border-zinc-100 bg-[#fafaf8] p-3"
                                              >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                  <div className="min-w-0">
                                                    <p className="truncate text-sm font-black">
                                                      {reference.gameLabel}
                                                    </p>

                                                    <p className="mt-1 text-xs font-bold text-zinc-400">
                                                      Move{" "}
                                                      {reference.moveNumber}
                                                      {" · "}
                                                      {reference.color ===
                                                      "white"
                                                        ? "White"
                                                        : "Black"}
                                                      {" · "}
                                                      {
                                                        reference.classification
                                                      }
                                                    </p>
                                                  </div>

                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handlePracticePattern(
                                                        pattern,
                                                        reference
                                                      )
                                                    }
                                                    className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-500"
                                                  >
                                                    Practice →
                                                  </button>
                                                </div>

                                                <div className="mt-2 grid grid-cols-2 gap-2">
                                                  <div className="rounded-lg bg-white p-2.5">
                                                    <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                                                      Played
                                                    </p>

                                                    <p className="mt-0.5 text-base font-black">
                                                      {
                                                        reference.playedMove
                                                      }
                                                    </p>
                                                  </div>

                                                  <div className="rounded-lg bg-violet-50 p-2.5">
                                                    <p className="text-[9px] font-black uppercase tracking-wide text-violet-500">
                                                      Coach
                                                    </p>

                                                    <p className="mt-0.5 text-base font-black text-violet-700">
                                                      {
                                                        reference.bestMove
                                                      }
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </article>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Puzzles */}
                {activeSection === "puzzles" && (
                  <div className="flex min-h-0 flex-col gap-5">
                    {analysis.puzzles.length === 0 ? (
                      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                        <h4 className="text-xl font-black text-zinc-900">
                          No critical puzzles yet
                        </h4>

                        <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-600">
                          We didn&apos;t find enough critical moments in these
                          games. Keep playing and bring more games back to your
                          coach.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Progress header */}
                        <div className="rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 sm:p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">
                                Your practice queue
                              </p>

                              <div className="mt-1 flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-zinc-900">
                                  {completedPuzzleCount}
                                  <span className="text-zinc-400">
                                    {" "}/{" "}
                                  </span>
                                  {puzzleCount}
                                </h3>

                                <span className="text-sm font-bold text-zinc-500">
                                  puzzles completed
                                </span>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                              <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                                Progress
                              </p>

                              <p className="mt-0.5 text-2xl font-black text-violet-700">
                                {puzzleProgress}%
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-violet-100">
                            <div
                              className="h-full rounded-full bg-violet-600 transition-all duration-500"
                              style={{
                                width: `${puzzleProgress}%`,
                              }}
                            />
                          </div>

                          <p className="mt-3 text-sm font-semibold text-zinc-500">
                            {completedPuzzleCount === puzzleCount
                              ? "You completed every puzzle. Great work."
                              : "Start with the next recommended position, then work through the queue at your own pace."}
                          </p>
                        </div>

                        {/* Next recommended puzzle */}
                        {(() => {
                          const nextPuzzle =
                            analysis.puzzles.find(
                              (puzzle) =>
                                !isPuzzleCompleted(puzzle.id)
                            ) ?? null;

                          if (!nextPuzzle) {
                            return (
                              <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-6">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">
                                    ✓
                                  </div>

                                  <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
                                      Practice complete
                                    </p>

                                    <h3 className="mt-1 text-xl font-black text-zinc-900">
                                      You&apos;ve worked through every puzzle
                                    </h3>

                                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                                      Come back after studying more games to
                                      build your next practice set.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectPuzzleWithProgress(
                                  nextPuzzle
                                )
                              }
                              className="group w-full rounded-[1.75rem] border border-violet-200 bg-violet-600 p-5 text-left text-white shadow-sm transition hover:bg-violet-500 hover:shadow-md sm:p-6"
                            >
                              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-violet-100">
                                      Next recommended
                                    </span>

                                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black capitalize text-violet-100">
                                      {nextPuzzle.classification}
                                    </span>
                                  </div>

                                  <h3 className="mt-3 text-xl font-black sm:text-2xl">
                                    {nextPuzzle.question}
                                  </h3>

                                  <p className="mt-2 text-sm font-semibold text-violet-100">
                                    {nextPuzzle.gameLabel}
                                    {" · "}
                                    Move {nextPuzzle.moveNumber}
                                  </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-wide text-violet-200">
                                      Your move
                                    </p>

                                    <p className="mt-1 text-lg font-black">
                                      {nextPuzzle.playedMove}
                                    </p>
                                  </div>

                                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-violet-600 transition group-hover:translate-x-0.5">
                                    →
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })()}

                        {/* Compact practice queue */}
                        <div className="flex min-h-0 flex-col">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-wide text-violet-600">
                                Practice queue
                              </p>

                              <p className="mt-1 text-sm font-semibold text-zinc-500">
                                Choose any position to practice.
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-500">
                              {puzzleCount}{" "}
                              {puzzleCount === 1
                                ? "position"
                                : "positions"}
                            </span>
                          </div>

                          <div className="mt-3 max-h-[min(360px,38vh)] overflow-y-auto rounded-2xl border border-zinc-100 bg-[#fafaf8] p-2">
                            <div className="grid gap-1.5">
                              {analysis.puzzles.map(
                                (puzzle, index) => {
                                  const completed =
                                    isPuzzleCompleted(
                                      puzzle.id
                                    );

                                  return (
                                    <button
                                      key={puzzle.id}
                                      type="button"
                                      onClick={() =>
                                        handleSelectPuzzleWithProgress(
                                          puzzle
                                        )
                                      }
                                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                        completed
                                          ? "bg-white/60 opacity-65 hover:bg-white"
                                          : "bg-white hover:bg-violet-50"
                                      }`}
                                    >
                                      <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                                          completed
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-violet-100 text-violet-700 group-hover:bg-violet-600 group-hover:text-white"
                                        }`}
                                      >
                                        {completed
                                          ? "✓"
                                          : index + 1}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`truncate text-sm font-black ${
                                              completed
                                                ? "text-zinc-500"
                                                : "text-zinc-900"
                                            }`}
                                          >
                                            {puzzle.question}
                                          </span>

                                          {completed && (
                                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">
                                              Completed
                                            </span>
                                          )}
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold text-zinc-400">
                                          <span>
                                            {puzzle.gameLabel}
                                          </span>

                                          <span>·</span>

                                          <span>
                                            Move {puzzle.moveNumber}
                                          </span>

                                          <span>·</span>

                                          <span className="capitalize">
                                            {puzzle.classification}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="hidden shrink-0 text-right sm:block">
                                        <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                                          Evaluation loss
                                        </p>

                                        <p className="mt-0.5 text-xs font-black text-zinc-600">
                                          {puzzle.evaluationLoss.toFixed(1)}
                                        </p>
                                      </div>

                                      <span
                                        className={`shrink-0 text-sm font-black ${
                                          completed
                                            ? "text-zinc-300"
                                            : "text-violet-600 group-hover:translate-x-0.5"
                                        }`}
                                      >
                                        →
                                      </span>
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom navigation */}
            <div className="sticky bottom-0 z-20 shrink-0 border-t border-zinc-100 bg-[#fdfdfb]/95 px-5 py-3 backdrop-blur sm:px-7">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={
                    sections.findIndex(
                      (section) =>
                        section.id === activeSection
                    ) === 0
                  }
                  onClick={() => {
                    const index =
                      sections.findIndex(
                        (section) =>
                          section.id === activeSection
                      );

                    if (index > 0) {
                      setActiveSection(
                        sections[index - 1].id
                      );
                    }
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ← Previous
                </button>

                <p className="text-xs font-bold text-zinc-400">
                  {sections.findIndex(
                    (section) =>
                      section.id === activeSection
                  ) + 1}{" "}
                  / {sections.length}
                </p>

                <button
                  type="button"
                  disabled={
                    sections.findIndex(
                      (section) =>
                        section.id === activeSection
                    ) ===
                    sections.length - 1
                  }
                  onClick={() => {
                    const index =
                      sections.findIndex(
                        (section) =>
                          section.id === activeSection
                      );

                    if (
                      index <
                      sections.length - 1
                    ) {
                      setActiveSection(
                        sections[index + 1].id
                      );
                    }
                  }}
                  className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LearningResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
              <p className="mt-4 text-sm font-bold text-zinc-500">
                Loading your learning plan...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <LearningResultsContent />
    </Suspense>
  );
}

"use client";

import SignOutButton from "@/components/auth/SignOutButton";

import { useRouter } from "next/navigation";
import LearningHub from "@/components/coaching/LearningHub";

export default function LearnPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-[#e8e6df] bg-[#fdfdfb]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5">
          <div>
            <div className="text-sm font-black tracking-tight text-violet-600">
              ChessCoach AI
            </div>

            <h1 className="mt-0.5 text-xl font-black tracking-tight">
              Learning Coach
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/games")}
              className="rounded-xl border border-[#dedcd5] bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              Game Library
            </button>

            <button
              type="button"
              onClick={() => router.push("/analyze")}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-500"
            >
              Analyze a game
            </button>

            <SignOutButton />

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
        <LearningHub />
      </div>
    </main>
  );
}
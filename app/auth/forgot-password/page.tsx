"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    const redirectTo =
      `${window.location.origin}/auth/callback?next=/auth/reset-password`;

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo,
        }
      );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "If an account exists for that email, we've sent a password reset link."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-[520px] items-center px-5 py-12">
        <div className="w-full rounded-[28px] border border-[#e4e2db] bg-white p-7 shadow-sm sm:p-9">
          <div className="text-sm font-black text-violet-600">
            ChessCoach AI
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Reset your password
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Enter your email and we'll send you a secure password reset link.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="text-sm font-bold text-zinc-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#dedcd5] bg-[#fdfdfb] px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold leading-6 text-violet-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Sending..."
                : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href="/auth/login"
              className="font-black text-violet-600 hover:text-violet-700"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

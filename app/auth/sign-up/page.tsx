"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/learn");
      router.refresh();
      return;
    }

    setMessage(
      "Account created. Check your email to confirm your account, then sign in."
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
            Create your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Start building your chess improvement history.
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

            <div>
              <label
                htmlFor="password"
                className="text-sm font-bold text-zinc-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#dedcd5] bg-[#fdfdfb] px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="text-sm font-bold text-zinc-700"
              >
                Confirm password
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#dedcd5] bg-[#fdfdfb] px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder="Enter your password again"
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
            <span>Already have an account? </span>

            <Link
              href="/auth/login"
              className="font-black text-violet-600 hover:text-violet-700"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
            >
              ← Back to ChessCoach AI
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

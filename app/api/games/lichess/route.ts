import { NextRequest, NextResponse } from "next/server";

/**
 * Lichess is more permissive than Chess.com about missing User-Agent headers,
 * but it rate limits by IP. Vercel serverless functions share IPs with other
 * customers, so limits can bite in production that never appear locally.
 * Identifying the app makes the traffic traceable and easier to unblock.
 */
const USER_AGENT =
  "ChessCoachAI/1.0 (personal chess training app; contact: prerna@example.com)";

function describeFailure(status: number, username: string): string {
  if (status === 404) return `"${username}" was not found on Lichess.`;
  if (status === 429)
    return "Lichess is rate limiting requests right now. Wait a minute and try again.";
  if (status >= 500) return "Lichess is having trouble. Try again shortly.";
  return `Lichess returned an unexpected status (${status}).`;
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const maxParam = request.nextUrl.searchParams.get("max") || "20";

  if (!username) {
    return NextResponse.json(
      { error: "Lichess username is required." },
      { status: 400 }
    );
  }

  const max = Math.min(Math.max(Number.parseInt(maxParam, 10) || 20, 1), 100);

  try {
    const url =
      `https://lichess.org/api/games/user/` +
      `${encodeURIComponent(username)}?max=${max}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/x-chess-pgn",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Lichess request failed:", response.status, username);
      return NextResponse.json(
        { error: describeFailure(response.status, username) },
        { status: response.status }
      );
    }

    const pgn = await response.text();

    if (!pgn.trim()) {
      return NextResponse.json(
        { error: "No games were found for this Lichess user." },
        { status: 404 }
      );
    }

    return new NextResponse(pgn, {
      status: 200,
      headers: { "Content-Type": "application/x-chess-pgn; charset=utf-8" },
    });
  } catch (error) {
    console.error("Lichess import failed:", error);
    return NextResponse.json(
      { error: "Unable to connect to Lichess right now." },
      { status: 500 }
    );
  }
}

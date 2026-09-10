import { NextRequest, NextResponse } from "next/server";

interface ChessComArchives {
  archives?: string[];
}

/**
 * Chess.com blocks requests that arrive with no User-Agent, which is what
 * Vercel's runtime sends by default. Local dev worked because the header was
 * being filled in for us. Their API docs ask that this string identify the
 * app and give a way to make contact, so put a real address in here.
 */
const USER_AGENT =
  "ChessCoachAI/1.0 (personal chess training app; contact: prerna@example.com)";

const HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "application/json",
};

function describeFailure(status: number, subject: string): string {
  if (status === 404) return `${subject} not found on Chess.com.`;
  if (status === 403)
    return "Chess.com refused the request. This usually means the User-Agent header was rejected.";
  if (status === 429)
    return "Chess.com is rate limiting requests right now. Wait a minute and try again.";
  if (status >= 500) return "Chess.com is having trouble. Try again shortly.";
  return `Chess.com returned an unexpected status (${status}).`;
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const maxParam = request.nextUrl.searchParams.get("max") || "20";

  if (!username) {
    return NextResponse.json(
      { error: "Chess.com username is required." },
      { status: 400 }
    );
  }

  const max = Math.min(Math.max(Number.parseInt(maxParam, 10) || 20, 1), 100);

  try {
    const normalizedUsername = encodeURIComponent(username);

    const archivesResponse = await fetch(
      `https://api.chess.com/pub/player/${normalizedUsername}/games/archives`,
      { headers: HEADERS, cache: "no-store" }
    );

    if (!archivesResponse.ok) {
      console.error(
        "Chess.com archives request failed:",
        archivesResponse.status,
        username
      );
      return NextResponse.json(
        { error: describeFailure(archivesResponse.status, `"${username}"`) },
        { status: archivesResponse.status }
      );
    }

    const archives = (await archivesResponse.json()) as ChessComArchives;

    if (!archives.archives?.length) {
      return NextResponse.json(
        { error: "No Chess.com game archives were found." },
        { status: 404 }
      );
    }

    const selectedArchives = [...archives.archives].reverse();
    const games: string[] = [];
    let blockedCount = 0;

    for (const archiveUrl of selectedArchives) {
      if (games.length >= max) break;

      const response = await fetch(`${archiveUrl}/pgn`, {
        headers: { "User-Agent": USER_AGENT },
        cache: "no-store",
      });

      if (!response.ok) {
        blockedCount += 1;
        continue;
      }

      const pgn = await response.text();
      if (!pgn.trim()) continue;

      const gameBlocks = pgn
        .split(/\n\s*\n(?=\[Event )/g)
        .filter((game) => game.trim());

      for (const game of gameBlocks) {
        games.push(game);
        if (games.length >= max) break;
      }
    }

    if (games.length === 0) {
      // Distinguish "played nothing" from "every archive request was refused".
      const message =
        blockedCount > 0
          ? "Chess.com refused every archive request. Check the User-Agent header, or wait if you are being rate limited."
          : "No games were found for this Chess.com user.";
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return new NextResponse(games.join("\n\n"), {
      status: 200,
      headers: { "Content-Type": "application/x-chess-pgn; charset=utf-8" },
    });
  } catch (error) {
    console.error("Chess.com import failed:", error);
    return NextResponse.json(
      { error: "Unable to connect to Chess.com right now." },
      { status: 500 }
    );
  }
}

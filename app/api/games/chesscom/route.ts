import { NextRequest, NextResponse } from "next/server";

interface ChessComArchives {
  archives?: string[];
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

  const max = Math.min(
    Math.max(Number.parseInt(maxParam, 10) || 20, 1),
    100
  );

  try {
    const normalizedUsername = encodeURIComponent(username);

    const archivesResponse = await fetch(
      `https://api.chess.com/pub/player/${normalizedUsername}/games/archives`,
      {
        cache: "no-store",
      }
    );

    if (!archivesResponse.ok) {
      return NextResponse.json(
        {
          error:
            archivesResponse.status === 404
              ? "Chess.com user not found."
              : "Could not find this Chess.com player's game archives.",
        },
        { status: archivesResponse.status }
      );
    }

    const archives =
      (await archivesResponse.json()) as ChessComArchives;

    if (!archives.archives?.length) {
      return NextResponse.json(
        { error: "No Chess.com game archives were found." },
        { status: 404 }
      );
    }

    const selectedArchives = [...archives.archives].reverse();

    const games: string[] = [];

    for (const archiveUrl of selectedArchives) {
      if (games.length >= max) {
        break;
      }

      const response = await fetch(`${archiveUrl}/pgn`, {
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const pgn = await response.text();

      if (!pgn.trim()) {
        continue;
      }

      const gameBlocks = pgn
        .split(/\n\s*\n(?=\[Event )/g)
        .filter((game) => game.trim());

      for (const game of gameBlocks) {
        games.push(game);

        if (games.length >= max) {
          break;
        }
      }
    }

    if (games.length === 0) {
      return NextResponse.json(
        { error: "No games were found for this Chess.com user." },
        { status: 404 }
      );
    }

    const combinedPgn = games.join("\n\n");

    return new NextResponse(combinedPgn, {
      status: 200,
      headers: {
        "Content-Type": "application/x-chess-pgn; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chess.com import failed:", error);

    return NextResponse.json(
      { error: "Unable to connect to Chess.com right now." },
      { status: 500 }
    );
  }
}

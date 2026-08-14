import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const maxParam = request.nextUrl.searchParams.get("max") || "20";

  if (!username) {
    return NextResponse.json(
      { error: "Lichess username is required." },
      { status: 400 }
    );
  }

  const max = Math.min(
    Math.max(Number.parseInt(maxParam, 10) || 20, 1),
    100
  );

  try {
    const url =
      `https://lichess.org/api/games/user/` +
      `${encodeURIComponent(username)}?max=${max}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/x-chess-pgn",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            response.status === 404
              ? "Lichess user not found."
              : "Could not import games from Lichess.",
        },
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
      headers: {
        "Content-Type": "application/x-chess-pgn; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Lichess import failed:", error);

    return NextResponse.json(
      { error: "Unable to connect to Lichess right now." },
      { status: 500 }
    );
  }
}

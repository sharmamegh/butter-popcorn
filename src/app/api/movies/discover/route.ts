import { NextResponse } from "next/server";
import { DISCOVERY_FILL_COUNT } from "@/lib/constants";
import { buildSessionMovies, isTmdbEnabled } from "@/lib/tmdb";
import { normalizeMoods, type Mood } from "@/types/movie";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seed = searchParams.get("seed") ?? `solo-${Date.now()}`;
  const countRaw = parseInt(searchParams.get("count") ?? "", 10);
  const count = Number.isFinite(countRaw)
    ? Math.min(24, Math.max(2, countRaw))
    : DISCOVERY_FILL_COUNT;
  const moods = normalizeMoods(
    (searchParams.get("moods") ?? "any").split(",").filter(Boolean) as Mood[]
  );
  const blank = searchParams.get("blank") === "1";

  if (blank) {
    return NextResponse.json({
      movies: [],
      tmdbEnabled: isTmdbEnabled(),
      discoveryMode: "blank" as const,
    });
  }

  if (!isTmdbEnabled()) {
    const movies = await buildSessionMovies({
      seed,
      moods,
      count,
      fillFromDiscovery: true,
    });
    return NextResponse.json({
      movies,
      tmdbEnabled: false,
      discoveryMode: "auto" as const,
    });
  }

  try {
    const movies = await buildSessionMovies({
      seed,
      moods,
      count,
      fillFromDiscovery: true,
    });
    return NextResponse.json({
      movies,
      tmdbEnabled: true,
      discoveryMode: "auto" as const,
    });
  } catch (err) {
    console.error("[butter-popcorn] discover failed", err);
    return NextResponse.json(
      {
        movies: [],
        tmdbEnabled: true,
        error: "Couldn't load suggestions right now. Search and add your own.",
      },
      { status: 502 }
    );
  }
}

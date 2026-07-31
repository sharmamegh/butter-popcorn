import { NextResponse } from "next/server";
import { searchTmdbMovies, isTmdbEnabled } from "@/lib/tmdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (!isTmdbEnabled()) {
    return NextResponse.json({
      movies: [],
      tmdbEnabled: false,
      message: "Add TMDB_API_KEY to enable movie search and a larger catalog.",
    });
  }

  if (query.trim().length < 2) {
    return NextResponse.json({ movies: [], tmdbEnabled: true });
  }

  const movies = await searchTmdbMovies(query);
  return NextResponse.json({ movies, tmdbEnabled: true });
}

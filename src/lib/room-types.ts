import type { Mood } from "@/types/movie";
import type { Movie } from "@/types/movie";

export type RoomStatus = "lobby" | "ranking" | "revealed";

export type VetoResponse = "pending" | "accept" | "veto";

export type RoomPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  submitted: boolean;
  rankings: string[] | null;
  vetoUsed: boolean;
  vetoResponse: VetoResponse;
};

export type MatchResult = {
  winnerId: string;
  scores: { movieId: string; points: number }[];
  breakdown: { playerId: string; name: string; rank: number }[];
  insight: string;
};

export type Room = {
  code: string;
  seed: string;
  mood: Mood;
  movieIds: string[];
  movies: Record<string, Movie>;
  customTmdbIds: number[];
  usedMovieIds: string[];
  excludedMovieIds: string[];
  expectedPlayers: number;
  status: RoomStatus;
  players: RoomPlayer[];
  hostId: string;
  result: MatchResult | null;
  createdAt: number;
};

export type PublicRoom = {
  code: string;
  mood: Mood;
  movieIds: string[];
  movies: Movie[];
  customTmdbIds: number[];
  expectedPlayers: number;
  status: RoomStatus;
  players: {
    id: string;
    name: string;
    isHost: boolean;
    submitted: boolean;
    vetoUsed: boolean;
    vetoResponse: VetoResponse;
  }[];
  hostId: string;
  result: MatchResult | null;
  vetoPending: boolean;
  tmdbEnabled: boolean;
};

export function toPublicRoom(room: Room, tmdbEnabled: boolean): PublicRoom {
  const movies = room.movieIds
    .map((id) => room.movies[id])
    .filter((m): m is Movie => !!m);

  const vetoPending =
    room.status === "revealed" &&
    room.players.some((p) => p.vetoResponse === "pending");

  return {
    code: room.code,
    mood: room.mood,
    movieIds: room.movieIds,
    movies,
    customTmdbIds: room.customTmdbIds,
    expectedPlayers: room.expectedPlayers,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      submitted: p.submitted,
      vetoUsed: p.vetoUsed,
      vetoResponse: p.vetoResponse,
    })),
    hostId: room.hostId,
    result: room.result,
    vetoPending,
    tmdbEnabled,
  };
}

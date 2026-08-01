import type { Mood } from "@/types/movie";
import { normalizeMoods } from "@/types/movie";
import type { Movie } from "@/types/movie";

export type RoomStatus = "lobby" | "picking" | "ranking" | "revealed";

export type VetoResponse = "pending" | "accept" | "veto";

export type RoomPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  picksReady: boolean;
  submitted: boolean;
  /** Full ordered list used for matching (favorites + auto-filled rest). */
  rankings: string[] | null;
  /** Titles this player intentionally favored before auto-fill. */
  pickedIds: string[] | null;
  vetoUsed: boolean;
  vetoResponse: VetoResponse;
};

export type CustomPick = {
  tmdbId: number;
  addedBy: string;
  title: string;
  year: number;
  posterUrl: string | null;
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
  moods: Mood[];
  /** Legacy single mood from older rooms */
  mood?: Mood;
  movieIds: string[];
  movies: Record<string, Movie>;
  customPicks: CustomPick[];
  /** Legacy id-only list from older rooms */
  customTmdbIds?: number[];
  usedMovieIds: string[];
  excludedMovieIds: string[];
  expectedPlayers: number;
  status: RoomStatus;
  players: RoomPlayer[];
  hostId: string;
  result: MatchResult | null;
  createdAt: number;
  /** When set, a "none of these" reset is counting down (unix ms). */
  passDeadline: number | null;
  /** Favorites synced during the countdown, keyed by player id. */
  passFavorites: Record<string, string[]>;
};

export type PublicPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  picksReady: boolean;
  submitted: boolean;
  vetoUsed: boolean;
  vetoResponse: VetoResponse;
};

export type PublicRoom = {
  code: string;
  moods: Mood[];
  movieIds: string[];
  movies: Movie[];
  customPicks: CustomPick[];
  expectedPlayers: number;
  status: RoomStatus;
  players: PublicPlayer[];
  hostId: string;
  result: MatchResult | null;
  vetoPending: boolean;
  /** Countdown end for starting over mid-ranking, if active. */
  passDeadline: number | null;
  tmdbEnabled: boolean;
};

export function roomMoods(room: Pick<Room, "moods" | "mood">): Mood[] {
  if (room.moods?.length) return normalizeMoods(room.moods);
  if (room.mood) return normalizeMoods(room.mood);
  return ["any"];
}

export function roomCustomPicks(
  room: Pick<Room, "customPicks" | "customTmdbIds">
): CustomPick[] {
  if (room.customPicks?.length) return room.customPicks;
  if (room.customTmdbIds?.length) {
    return room.customTmdbIds.map((tmdbId) => ({
      tmdbId,
      addedBy: "",
      title: `Movie ${tmdbId}`,
      year: 0,
      posterUrl: null,
    }));
  }
  return [];
}

export function toPublicRoom(room: Room, tmdbEnabled: boolean): PublicRoom {
  const movies = room.movieIds
    .map((id) => room.movies[id])
    .filter((m): m is Movie => !!m);

  const vetoPending =
    room.status === "revealed" &&
    room.players.some((p) => p.vetoResponse === "pending");

  return {
    code: room.code,
    moods: roomMoods(room),
    movieIds: room.movieIds,
    movies,
    customPicks: roomCustomPicks(room),
    expectedPlayers: room.expectedPlayers,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      picksReady: Boolean(p.picksReady),
      submitted: p.submitted,
      vetoUsed: p.vetoUsed,
      vetoResponse: p.vetoResponse,
    })),
    hostId: room.hostId,
    result: room.result,
    vetoPending,
    passDeadline: room.passDeadline ?? null,
    tmdbEnabled,
  };
}

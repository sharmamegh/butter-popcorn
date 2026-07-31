import { calculateMatch } from "@/lib/match";
import { getStorage } from "@/lib/room-storage";
import type { Room, RoomPlayer } from "@/lib/room-types";
import { buildSessionMovies, isTmdbEnabled } from "@/lib/tmdb";
import type { Mood } from "@/types/movie";
import type { Movie } from "@/types/movie";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function moviesToRecord(movies: Movie[]): Record<string, Movie> {
  return Object.fromEntries(movies.map((m) => [m.id, m]));
}

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function generatePlayerId(): string {
  return crypto.randomUUID();
}

export async function createRoom(
  hostName: string,
  expectedPlayers = 2,
  mood: Mood = "any",
  customTmdbIds: number[] = []
): Promise<Room> {
  const storage = getStorage();
  let code = generateCode();
  while (await storage.get(code)) {
    code = generateCode();
  }

  const hostId = generatePlayerId();
  const seed = `${code}-${Date.now()}`;

  const room: Room = {
    code,
    seed,
    mood,
    movieIds: [],
    movies: {},
    customTmdbIds: customTmdbIds.slice(0, 3),
    usedMovieIds: [],
    excludedMovieIds: [],
    expectedPlayers: Math.min(8, Math.max(2, expectedPlayers)),
    status: "lobby",
    hostId,
    result: null,
    createdAt: Date.now(),
    players: [
      {
        id: hostId,
        name: hostName.trim() || "Host",
        isHost: true,
        submitted: false,
        rankings: null,
        vetoUsed: false,
        vetoResponse: "pending",
      },
    ],
  };

  await storage.set(room);
  return room;
}

export async function getRoom(code: string): Promise<Room | null> {
  return getStorage().get(code);
}

export async function saveRoom(room: Room): Promise<void> {
  await getStorage().set(room);
}

export async function joinRoom(
  code: string,
  name: string
): Promise<{ room: Room; playerId: string } | null> {
  const room = await getRoom(code);
  if (!room || room.status !== "lobby") return null;
  if (room.players.length >= room.expectedPlayers) return null;

  const playerId = generatePlayerId();
  const player: RoomPlayer = {
    id: playerId,
    name: name.trim() || `Guest ${room.players.length + 1}`,
    isHost: false,
    submitted: false,
    rankings: null,
    vetoUsed: false,
    vetoResponse: "pending",
  };

  room.players.push(player);
  await saveRoom(room);
  return { room, playerId };
}

export async function addCustomMovie(
  code: string,
  playerId: string,
  tmdbId: number
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.hostId !== playerId || room.status !== "lobby") return null;
  if (room.customTmdbIds.includes(tmdbId)) return room;
  if (room.customTmdbIds.length >= 3) return null;

  room.customTmdbIds.push(tmdbId);
  await saveRoom(room);
  return room;
}

export async function removeCustomMovie(
  code: string,
  playerId: string,
  tmdbId: number
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.hostId !== playerId || room.status !== "lobby") return null;

  room.customTmdbIds = room.customTmdbIds.filter((id) => id !== tmdbId);
  await saveRoom(room);
  return room;
}

export async function startRanking(
  code: string,
  playerId: string
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.hostId !== playerId || room.status !== "lobby") return null;
  if (room.players.length < 2) return null;

  const seed = `${room.code}-${Date.now()}`;
  const movies = await buildSessionMovies({
    seed,
    mood: room.mood,
    count: 8,
    excludeIds: room.usedMovieIds,
    customTmdbIds: room.customTmdbIds,
  });

  room.seed = seed;
  room.movieIds = movies.map((m) => m.id);
  room.movies = moviesToRecord(movies);
  room.usedMovieIds = [...new Set([...room.usedMovieIds, ...room.movieIds])];
  room.status = "ranking";
  room.result = null;

  for (const player of room.players) {
    player.submitted = false;
    player.rankings = null;
    player.vetoResponse = "pending";
  }

  await saveRoom(room);
  return room;
}

export async function submitRankings(
  code: string,
  playerId: string,
  rankings: string[]
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.status !== "ranking") return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;

  const valid = new Set(room.movieIds);
  if (
    rankings.length !== room.movieIds.length ||
    !rankings.every((id) => valid.has(id)) ||
    new Set(rankings).size !== rankings.length
  ) {
    return null;
  }

  player.rankings = rankings;
  player.submitted = true;

  if (room.players.every((p) => p.submitted)) {
    const result = calculateMatch(room);
    if (result) {
      room.result = result;
      room.status = "revealed";
      for (const p of room.players) {
        p.vetoResponse = "pending";
      }
    }
  }

  await saveRoom(room);
  return room;
}

export async function submitVetoResponse(
  code: string,
  playerId: string,
  response: "accept" | "veto"
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.status !== "revealed" || !room.result) return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player || player.vetoResponse !== "pending") return null;

  if (response === "veto") {
    if (player.vetoUsed) return null;
    player.vetoUsed = true;
    player.vetoResponse = "veto";
    if (!room.excludedMovieIds.includes(room.result.winnerId)) {
      room.excludedMovieIds.push(room.result.winnerId);
    }
  } else {
    player.vetoResponse = "accept";
  }

  const allResponded = room.players.every((p) => p.vetoResponse !== "pending");

  if (allResponded) {
    const vetoCount = room.players.filter((p) => p.vetoResponse === "veto").length;

    if (vetoCount > 0 && room.result) {
      const remaining = room.movieIds.filter(
        (id) => !room.excludedMovieIds.includes(id)
      );

      if (remaining.length === 0) {
        await newRound(code, room.hostId);
        return getRoom(code);
      }

      const next = calculateMatch(room, room.excludedMovieIds);
      if (next) {
        room.result = next;
        for (const p of room.players) {
          p.vetoResponse = "pending";
        }
      }
    }
  }

  await saveRoom(room);
  return room;
}

export async function newRound(
  code: string,
  playerId: string
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.hostId !== playerId) return null;

  const seed = `${room.code}-${Date.now()}`;
  const movies = await buildSessionMovies({
    seed,
    mood: room.mood,
    count: 8,
    excludeIds: room.usedMovieIds,
    customTmdbIds: room.customTmdbIds,
  });

  room.seed = seed;
  room.movieIds = movies.map((m) => m.id);
  room.movies = moviesToRecord(movies);
  room.usedMovieIds = [...new Set([...room.usedMovieIds, ...room.movieIds])];
  room.status = "ranking";
  room.result = null;
  room.excludedMovieIds = [];

  for (const player of room.players) {
    player.submitted = false;
    player.rankings = null;
    player.vetoResponse = "pending";
  }

  await saveRoom(room);
  return room;
}

export async function pruneRooms(): Promise<void> {
  await getStorage().prune();
}

export { isTmdbEnabled };

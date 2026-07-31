import { DISCOVERY_FILL_COUNT, MAX_PLAYERS, MIN_PLAYERS } from "@/lib/constants";
import { calculateMatch } from "@/lib/match";
import { getStorage } from "@/lib/room-storage";
import type { CustomPick, Room, RoomPlayer } from "@/lib/room-types";
import { roomCustomPicks, roomMoods } from "@/lib/room-types";
import { buildSessionMovies, isTmdbEnabled } from "@/lib/tmdb";
import type { Mood } from "@/types/movie";
import { normalizeMoods } from "@/types/movie";
import type { Movie } from "@/types/movie";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function moviesToRecord(movies: Movie[]): Record<string, Movie> {
  return Object.fromEntries(movies.map((m) => [m.id, m]));
}

function uniqueCustomIds(room: Room): number[] {
  return [...new Set(roomCustomPicks(room).map((p) => p.tmdbId))];
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
  moods: Mood[] = ["any"]
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
    moods: normalizeMoods(moods),
    movieIds: [],
    movies: {},
    customPicks: [],
    usedMovieIds: [],
    excludedMovieIds: [],
    expectedPlayers: Math.min(
      MAX_PLAYERS,
      Math.max(MIN_PLAYERS, expectedPlayers)
    ),
    status: "lobby",
    hostId,
    result: null,
    createdAt: Date.now(),
    players: [
      {
        id: hostId,
        name: hostName.trim() || "Host",
        isHost: true,
        picksReady: false,
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
    picksReady: false,
    submitted: false,
    rankings: null,
    vetoUsed: false,
    vetoResponse: "pending",
  };

  room.players.push(player);
  await saveRoom(room);
  return { room, playerId };
}

/** Host moves the room from lobby → picking so everyone can add movies. */
export async function startPicking(
  code: string,
  playerId: string
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.hostId !== playerId || room.status !== "lobby") return null;
  if (room.players.length < 2) return null;

  room.status = "picking";
  room.customPicks = roomCustomPicks(room);
  for (const player of room.players) {
    player.picksReady = false;
    player.submitted = false;
    player.rankings = null;
  }

  await saveRoom(room);
  return room;
}

export async function addCustomMovie(
  code: string,
  playerId: string,
  tmdbId: number,
  meta?: { title?: string; year?: number; posterUrl?: string | null }
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.status !== "picking") return null;
  if (!room.players.some((p) => p.id === playerId)) return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player || player.picksReady) return null;

  room.customPicks = roomCustomPicks(room);
  if (room.customPicks.some((p) => p.tmdbId === tmdbId)) return room;

  const pick: CustomPick = {
    tmdbId,
    addedBy: playerId,
    title: meta?.title?.trim() || `Movie ${tmdbId}`,
    year: meta?.year ?? 0,
    posterUrl: meta?.posterUrl ?? null,
  };

  room.customPicks.push(pick);
  await saveRoom(room);
  return room;
}

export async function removeCustomMovie(
  code: string,
  playerId: string,
  tmdbId: number
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.status !== "picking") return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;
  if (player.picksReady) return null;

  const isHost = room.hostId === playerId;
  const picks = roomCustomPicks(room);
  const target = picks.find((p) => p.tmdbId === tmdbId);
  if (!target) return room;
  if (!isHost && target.addedBy !== playerId) return null;

  room.customPicks = picks.filter((p) => p.tmdbId !== tmdbId);

  // Someone changed the mix: clear ready for people who weren't the remover? 
  // Simpler: only the remover was not ready already. Keep others' ready.
  await saveRoom(room);
  return room;
}

async function buildRoundMovies(room: Room, seed: string): Promise<Movie[]> {
  const customIds = uniqueCustomIds(room);
  return buildSessionMovies({
    seed,
    moods: roomMoods(room),
    count: customIds.length > 0 ? customIds.length : DISCOVERY_FILL_COUNT,
    excludeIds: room.usedMovieIds,
    customTmdbIds: customIds,
    fillFromDiscovery: customIds.length === 0,
  });
}

async function beginRanking(room: Room): Promise<Room | null> {
  const seed = `${room.code}-${Date.now()}`;
  const movies = await buildRoundMovies(room, seed);
  if (movies.length < 2) return null;

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

/** Mark yourself ready. When everyone is ready, ranking starts automatically. */
export async function setPicksReady(
  code: string,
  playerId: string,
  ready: boolean
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.status !== "picking") return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;

  player.picksReady = ready;
  await saveRoom(room);

  if (ready && room.players.every((p) => p.picksReady)) {
    const started = await beginRanking(room);
    if (!started) {
      // Not enough movies; unready everyone so they can add more
      player.picksReady = false;
      await saveRoom(room);
      return room;
    }
    return started;
  }

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

/** Host starts a fresh picking round (keeps or clears picks via resetPicks). */
export async function newRound(
  code: string,
  playerId: string,
  options: { clearPicks?: boolean } = {}
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.hostId !== playerId) return null;

  room.status = "picking";
  room.result = null;
  room.excludedMovieIds = [];
  room.movieIds = [];
  room.movies = {};
  if (options.clearPicks !== false) {
    room.customPicks = [];
  }

  for (const player of room.players) {
    player.picksReady = false;
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

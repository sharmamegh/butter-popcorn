import { DISCOVERY_FILL_COUNT, MAX_PLAYERS, MIN_PLAYERS, PASS_COUNTDOWN_MS } from "@/lib/constants";
import { getSessionMovies } from "@/data/movies";
import { calculateMatch, completeRankings } from "@/lib/match";
import { getStorage } from "@/lib/room-storage";
import type { CustomPick, Room, RoomPlayer } from "@/lib/room-types";
import {
  aggregatePlayerMoods,
  roomCustomPicks,
  roomMoods,
} from "@/lib/room-types";
import { buildSessionMovies, isTmdbEnabled } from "@/lib/tmdb";
import type { Mood } from "@/types/movie";
import { movieIdFromTmdb, normalizeMoods } from "@/types/movie";
import type { Movie } from "@/types/movie";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function moviesToRecord(movies: Movie[]): Record<string, Movie> {
  return Object.fromEntries(movies.map((m) => [m.id, m]));
}

function uniqueCustomIds(room: Room): number[] {
  return [...new Set(roomCustomPicks(room).map((p) => p.tmdbId))];
}

function movieFromCustomPick(pick: CustomPick): Movie {
  return {
    id: movieIdFromTmdb(pick.tmdbId),
    tmdbId: pick.tmdbId,
    title: pick.title,
    year: pick.year || 0,
    tagline: "",
    description: "Added by someone in the room.",
    themes: [],
    runtime: "",
    emoji: "🎬",
    genre: "Movie",
    posterUrl: pick.posterUrl,
  };
}

/** Keep every custom pick on the slate even if TMDB detail fetch fails. */
function ensureCustomsOnSlate(room: Room, movies: Movie[]): Movie[] {
  const have = new Set(movies.map((m) => m.id));
  const extras: Movie[] = [];
  for (const pick of roomCustomPicks(room)) {
    const id = movieIdFromTmdb(pick.tmdbId);
    if (!have.has(id)) {
      extras.push(movieFromCustomPick(pick));
      have.add(id);
    }
  }
  return extras.length ? [...extras, ...movies] : movies;
}

function clearReadyFlags(room: Room) {
  for (const player of room.players) {
    player.picksReady = false;
  }
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
  expectedPlayers = 2
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
    // Aggregated from player moods once everyone is ready.
    moods: ["any"],
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
    passDeadline: null,
    passFavorites: {},
    players: [
      {
        id: hostId,
        name: hostName.trim() || "Host",
        isHost: true,
        picksReady: false,
        submitted: false,
        moods: ["any"],
        rankings: null,
        pickedIds: null,
        vetoUsed: false,
        vetoResponse: "pending",
      },
    ],
  };

  await storage.set(room);
  return room;
}

export async function getRoom(code: string): Promise<Room | null> {
  const room = await getStorage().get(code);
  if (!room) return null;
  return settlePassIfDue(room);
}

export async function saveRoom(room: Room): Promise<void> {
  await getStorage().set(room);
}

function rememberPassFavorites(
  room: Room,
  playerId: string,
  rankings: string[] | undefined
) {
  if (!Array.isArray(rankings) || rankings.length === 0) return;
  const valid = new Set(room.movieIds);
  const picked = rankings.filter((id) => valid.has(id));
  if (picked.length === 0) return;
  room.passFavorites = { ...(room.passFavorites ?? {}), [playerId]: picked };
}

/** Carry ranked favorites into the mix, then return everyone to picking. */
async function finishPass(room: Room): Promise<Room> {
  room.customPicks = roomCustomPicks(room);
  const have = new Set(room.customPicks.map((p) => p.tmdbId));

  const favoriteIds = new Set<string>();
  for (const ids of Object.values(room.passFavorites ?? {})) {
    for (const id of ids) favoriteIds.add(id);
  }
  for (const player of room.players) {
    for (const id of player.pickedIds ?? []) favoriteIds.add(id);
  }

  for (const movieId of favoriteIds) {
    const movie = room.movies[movieId];
    if (!movie?.tmdbId || have.has(movie.tmdbId)) continue;

    let addedBy =
      Object.entries(room.passFavorites ?? {}).find(([, ids]) =>
        ids.includes(movieId)
      )?.[0] ??
      room.players.find((p) => p.pickedIds?.includes(movieId))?.id ??
      room.hostId;

    room.customPicks.push({
      tmdbId: movie.tmdbId,
      addedBy,
      title: movie.title,
      year: movie.year || 0,
      posterUrl: movie.posterUrl,
    });
    have.add(movie.tmdbId);
  }

  room.status = "picking";
  room.result = null;
  room.excludedMovieIds = [];
  room.movieIds = [];
  room.movies = {};
  room.passDeadline = null;
  room.passFavorites = {};

  for (const player of room.players) {
    player.picksReady = false;
    player.submitted = false;
    player.rankings = null;
    player.pickedIds = null;
    player.vetoResponse = "pending";
  }

  await saveRoom(room);
  return room;
}

async function settlePassIfDue(room: Room): Promise<Room> {
  if (
    room.status === "ranking" &&
    room.passDeadline != null &&
    Date.now() >= room.passDeadline
  ) {
    return finishPass(room);
  }
  return room;
}

/**
 * Join a lobby, or reattach if you're already in the room (any phase).
 * Reattach by playerId or matching name so lost tabs / devices can continue.
 */
export async function joinRoom(
  code: string,
  name: string,
  opts: { playerId?: string } = {}
): Promise<{ room: Room; playerId: string } | null> {
  const room = await getRoom(code);
  if (!room) return null;

  const trimmed = name.trim() || "Guest";

  if (opts.playerId) {
    const existing = room.players.find((p) => p.id === opts.playerId);
    if (existing) {
      if (trimmed && existing.name !== trimmed) existing.name = trimmed;
      await saveRoom(room);
      return { room, playerId: existing.id };
    }
  }

  const byName = room.players.find(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (byName) {
    return { room, playerId: byName.id };
  }

  if (room.status !== "lobby") return null;
  if (room.players.length >= room.expectedPlayers) return null;

  const playerId = generatePlayerId();
  const player: RoomPlayer = {
    id: playerId,
    name: trimmed || `Guest ${room.players.length + 1}`,
    isHost: false,
    picksReady: false,
    submitted: false,
    moods: ["any"],
    rankings: null,
    pickedIds: null,
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
  room.passDeadline = null;
  room.passFavorites = {};
  for (const player of room.players) {
    player.picksReady = false;
    player.submitted = false;
    player.rankings = null;
    player.pickedIds = null;
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
  // Mix changed — anyone already ready should reconfirm.
  clearReadyFlags(room);
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
  clearReadyFlags(room);
  await saveRoom(room);
  return room;
}

async function buildRoundMovies(room: Room, seed: string): Promise<Movie[]> {
  const customIds = uniqueCustomIds(room);
  // Every custom stays, plus a fresh batch of suggestions on top.
  const count = Math.max(customIds.length + DISCOVERY_FILL_COUNT, 2);

  let movies: Movie[] = [];
  try {
    movies = await buildSessionMovies({
      seed,
      moods: roomMoods(room),
      count,
      excludeIds: room.usedMovieIds,
      customTmdbIds: customIds,
      fillFromDiscovery: true,
    });
  } catch (err) {
    console.error("[butter-popcorn] buildSessionMovies failed", err);
  }

  movies = ensureCustomsOnSlate(room, movies);

  if (movies.length < 2) {
    try {
      movies = await buildSessionMovies({
        seed: `${seed}-recycle`,
        moods: roomMoods(room),
        count,
        excludeIds: [],
        customTmdbIds: customIds,
        fillFromDiscovery: true,
      });
      movies = ensureCustomsOnSlate(room, movies);
    } catch (err) {
      console.error("[butter-popcorn] recycled build failed", err);
    }
  }

  if (movies.length < 2) {
    const staticPad = getSessionMovies(`${seed}-static`, count);
    const have = new Set(movies.map((m) => m.id));
    movies = [
      ...movies,
      ...staticPad.filter((m) => !have.has(m.id)),
    ].slice(0, Math.max(count, 2));
    movies = ensureCustomsOnSlate(room, movies);
  }

  return movies;
}

async function beginRanking(room: Room): Promise<Room | null> {
  room.moods = aggregatePlayerMoods(room.players);

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
  room.passDeadline = null;
  room.passFavorites = {};

  for (const player of room.players) {
    player.submitted = false;
    player.rankings = null;
    player.pickedIds = null;
    player.vetoResponse = "pending";
  }

  await saveRoom(room);
  return room;
}

/** Update your mood picks while still building the list. */
export async function setPlayerMoods(
  code: string,
  playerId: string,
  moods: Mood[]
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.status !== "picking") return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player || player.picksReady) return null;

  player.moods = normalizeMoods(moods);
  room.moods = aggregatePlayerMoods(room.players);
  await saveRoom(room);
  return room;
}

/** Mark yourself ready. When everyone is ready, ranking starts automatically. */
export async function setPicksReady(
  code: string,
  playerId: string,
  ready: boolean,
  moods?: Mood[]
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room || room.status !== "picking") return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;

  if (ready && moods !== undefined) {
    player.moods = normalizeMoods(moods);
  }

  player.picksReady = ready;
  room.moods = aggregatePlayerMoods(room.players);

  if (!(ready && room.players.every((p) => p.picksReady))) {
    await saveRoom(room);
    return room;
  }

  // Everyone ready — transition. Never leave the room stuck with all-ready.
  try {
    const started = await beginRanking(room);
    if (started) return started;
  } catch (err) {
    console.error("[butter-popcorn] beginRanking threw", err);
  }

  clearReadyFlags(room);
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

  const completed = completeRankings(rankings, room.movieIds);
  if (!completed) return null;

  player.pickedIds = rankings;
  player.rankings = completed;
  player.submitted = true;

  if (room.players.every((p) => p.submitted)) {
    const result = calculateMatch(room);
    if (result) {
      room.result = result;
      room.status = "revealed";
      for (const p of room.players) {
        p.vetoResponse = "pending";
      }
    } else {
      // Should be unreachable after match hardening — still unstick if needed.
      clearReadyFlags(room);
      room.status = "picking";
      room.passDeadline = null;
      room.passFavorites = {};
      for (const p of room.players) {
        p.submitted = false;
        p.rankings = null;
        p.pickedIds = null;
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
      } else {
        // No alternate winner — start a fresh picking round instead of stalling.
        await newRound(code, room.hostId);
        return getRoom(code);
      }
    }
  }

  await saveRoom(room);
  return room;
}

/**
 * Start (or join) a countdown before abandoning the current slate.
 * Favorites already ranked are synced so they join the mix when it fires.
 */
export async function requestPass(
  code: string,
  playerId: string,
  rankings: string[] = []
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.status !== "ranking") return room;
  if (!room.players.some((p) => p.id === playerId)) return null;

  rememberPassFavorites(room, playerId, rankings);

  if (room.passDeadline == null) {
    room.passDeadline = Date.now() + PASS_COUNTDOWN_MS;
  }

  await saveRoom(room);
  return room;
}

/** Push the latest favorites during an active countdown. */
export async function syncPassFavorites(
  code: string,
  playerId: string,
  rankings: string[] = []
): Promise<Room | null> {
  const room = await getRoom(code);
  if (!room) return null;
  if (room.status !== "ranking") return room;
  if (room.passDeadline == null) return room;
  if (!room.players.some((p) => p.id === playerId)) return null;

  rememberPassFavorites(room, playerId, rankings);
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
  room.passDeadline = null;
  room.passFavorites = {};
  if (options.clearPicks !== false) {
    room.customPicks = [];
  }

  for (const player of room.players) {
    player.picksReady = false;
    player.submitted = false;
    player.rankings = null;
    player.pickedIds = null;
    player.vetoResponse = "pending";
  }

  await saveRoom(room);
  return room;
}

export async function pruneRooms(): Promise<void> {
  await getStorage().prune();
}

export { isTmdbEnabled };

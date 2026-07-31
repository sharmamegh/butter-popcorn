import { calculateMatch } from "@/lib/match";
import type { Room, RoomPlayer } from "@/lib/room-types";
import { getSessionMovies } from "@/data/movies";

const rooms = new Map<string, Room>();

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  if (rooms.has(code)) return generateCode();
  return code;
}

export function generatePlayerId(): string {
  return crypto.randomUUID();
}

export function createRoom(hostName: string, expectedPlayers = 2): Room {
  const code = generateCode();
  const hostId = generatePlayerId();
  const seed = `${code}-${Date.now()}`;
  const movies = getSessionMovies(seed, 8);

  const room: Room = {
    code,
    seed,
    movieIds: movies.map((m) => m.id),
    expectedPlayers: Math.min(4, Math.max(2, expectedPlayers)),
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
      },
    ],
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function joinRoom(code: string, name: string): { room: Room; playerId: string } | null {
  const room = getRoom(code);
  if (!room || room.status !== "lobby") return null;
  if (room.players.length >= room.expectedPlayers) return null;

  const playerId = generatePlayerId();
  const player: RoomPlayer = {
    id: playerId,
    name: name.trim() || `Guest ${room.players.length + 1}`,
    isHost: false,
    submitted: false,
    rankings: null,
  };

  room.players.push(player);
  return { room, playerId };
}

export function startRanking(code: string, playerId: string): Room | null {
  const room = getRoom(code);
  if (!room || room.hostId !== playerId || room.status !== "lobby") return null;
  if (room.players.length < 2) return null;

  room.status = "ranking";
  return room;
}

export function submitRankings(
  code: string,
  playerId: string,
  rankings: string[]
): Room | null {
  const room = getRoom(code);
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
    room.result = calculateMatch(room);
    room.status = "revealed";
  }

  return room;
}

export function resetRoom(code: string, playerId: string): Room | null {
  const room = getRoom(code);
  if (!room || room.hostId !== playerId) return null;

  const seed = `${code}-${Date.now()}`;
  const movies = getSessionMovies(seed, 8);

  room.seed = seed;
  room.movieIds = movies.map((m) => m.id);
  room.status = "ranking";
  room.result = null;
  for (const player of room.players) {
    player.submitted = false;
    player.rankings = null;
  }

  return room;
}

/** Drop rooms older than 6 hours */
export function pruneRooms() {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    if (room.createdAt < cutoff) rooms.delete(code);
  }
}

export type RoomStatus = "lobby" | "ranking" | "revealed";

export type RoomPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  submitted: boolean;
  rankings: string[] | null;
};

export type MatchInsight = {
  movieId: string;
  text: string;
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
  movieIds: string[];
  expectedPlayers: number;
  status: RoomStatus;
  players: RoomPlayer[];
  hostId: string;
  result: MatchResult | null;
  createdAt: number;
};

export type PublicRoom = {
  code: string;
  movieIds: string[];
  expectedPlayers: number;
  status: RoomStatus;
  players: { id: string; name: string; isHost: boolean; submitted: boolean }[];
  hostId: string;
  result: MatchResult | null;
};

export function toPublicRoom(room: Room): PublicRoom {
  return {
    code: room.code,
    movieIds: room.movieIds,
    expectedPlayers: room.expectedPlayers,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      submitted: p.submitted,
    })),
    hostId: room.hostId,
    result: room.result,
  };
}

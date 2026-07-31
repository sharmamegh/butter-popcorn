import { NextResponse } from "next/server";
import { createRoom, isTmdbEnabled, pruneRooms } from "@/lib/room-store";
import { toPublicRoom } from "@/lib/room-types";
import type { Mood } from "@/types/movie";
import { MOODS } from "@/types/movie";

export async function POST(request: Request) {
  await pruneRooms();

  const body = await request.json();
  const hostName = typeof body.hostName === "string" ? body.hostName : "Host";
  const expectedPlayers =
    typeof body.expectedPlayers === "number" ? body.expectedPlayers : 2;
  const mood = MOODS.some((m) => m.id === body.mood)
    ? (body.mood as Mood)
    : "any";
  const customTmdbIds = Array.isArray(body.customTmdbIds)
    ? body.customTmdbIds.filter((n: unknown) => typeof n === "number")
    : [];

  const room = await createRoom(hostName, expectedPlayers, mood, customTmdbIds);
  const host = room.players[0];

  return NextResponse.json({
    code: room.code,
    playerId: host.id,
    room: toPublicRoom(room, isTmdbEnabled()),
    tmdbEnabled: isTmdbEnabled(),
  });
}

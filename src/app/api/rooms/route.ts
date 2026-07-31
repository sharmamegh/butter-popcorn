import { NextResponse } from "next/server";
import { createRoom, pruneRooms } from "@/lib/room-store";
import { toPublicRoom } from "@/lib/room-types";

export async function POST(request: Request) {
  pruneRooms();

  const body = await request.json();
  const hostName = typeof body.hostName === "string" ? body.hostName : "Host";
  const expectedPlayers =
    typeof body.expectedPlayers === "number" ? body.expectedPlayers : 2;

  const room = createRoom(hostName, expectedPlayers);
  const host = room.players[0];

  return NextResponse.json({
    code: room.code,
    playerId: host.id,
    room: toPublicRoom(room),
  });
}

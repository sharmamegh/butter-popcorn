import { NextResponse } from "next/server";
import { createRoom, isTmdbEnabled, pruneRooms } from "@/lib/room-store";
import { hasPersistentStorage } from "@/lib/room-storage";
import { toPublicRoom } from "@/lib/room-types";

export async function POST(request: Request) {
  if (!hasPersistentStorage()) {
    console.error(
      "[butter-popcorn] Refusing to create room: Redis REST credentials missing on Vercel"
    );
    return NextResponse.json(
      {
        error:
          "This site isn't set up for shared rooms yet. Add Upstash Redis in the Vercel project, then redeploy.",
      },
      { status: 503 }
    );
  }

  await pruneRooms();

  const body = await request.json();
  const hostName = typeof body.hostName === "string" ? body.hostName : "Host";
  const expectedPlayers =
    typeof body.expectedPlayers === "number" ? body.expectedPlayers : 2;

  const room = await createRoom(hostName, expectedPlayers);
  const host = room.players[0];

  return NextResponse.json({
    code: room.code,
    playerId: host.id,
    room: toPublicRoom(room, isTmdbEnabled()),
    tmdbEnabled: isTmdbEnabled(),
  });
}

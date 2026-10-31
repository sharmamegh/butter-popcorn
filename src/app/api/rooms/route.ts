import { NextResponse } from "next/server";
import { ROOM_ERRORS, isStorageFailure } from "@/lib/api-errors";
import { createRoom, isTmdbEnabled, pruneRooms } from "@/lib/room-store";
import { hasPersistentStorage, storageStatus } from "@/lib/room-storage";
import { toPublicRoom } from "@/lib/room-types";

export async function POST(request: Request) {
  try {
    const status = await storageStatus();
    if (!(await hasPersistentStorage())) {
      console.error(
        "[butter-popcorn] Refusing to create room: no durable storage",
        status
      );
      return NextResponse.json(
        {
          error: status.redisUnreachable
            ? ROOM_ERRORS.storageDown
            : ROOM_ERRORS.storageMissing,
        },
        { status: 503 }
      );
    }

    await pruneRooms();

    let body: {
      hostName?: unknown;
      expectedPlayers?: unknown;
      discoveryMode?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Room details looked incomplete. Refresh and try again." },
        { status: 400 }
      );
    }

    const hostName = typeof body.hostName === "string" ? body.hostName : "Host";
    const expectedPlayers =
      typeof body.expectedPlayers === "number" ? body.expectedPlayers : 2;
    const discoveryMode =
      body.discoveryMode === "blank" ? "blank" : "auto";

    const room = await createRoom(hostName, expectedPlayers, { discoveryMode });
    const host = room.players[0];

    return NextResponse.json({
      code: room.code,
      playerId: host.id,
      room: toPublicRoom(room, isTmdbEnabled()),
      tmdbEnabled: isTmdbEnabled(),
    });
  } catch (err) {
    console.error("[butter-popcorn] POST /api/rooms failed", err);
    if (isStorageFailure(err)) {
      return NextResponse.json(
        { error: ROOM_ERRORS.storageDown },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: ROOM_ERRORS.createFailed },
      { status: 500 }
    );
  }
}

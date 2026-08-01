import { NextResponse } from "next/server";
import {
  addCustomMovie,
  getRoom,
  isTmdbEnabled,
  joinRoom,
  newRound,
  removeCustomMovie,
  setPicksReady,
  startPicking,
  submitRankings,
  submitVetoResponse,
} from "@/lib/room-store";
import { toPublicRoom } from "@/lib/room-types";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const room = await getRoom(code);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({
    room: toPublicRoom(room, isTmdbEnabled()),
    tmdbEnabled: isTmdbEnabled(),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const body = await request.json();
  const action = body.action as string;

  switch (action) {
    case "join": {
      const result = await joinRoom(code, body.name ?? "Guest");
      if (!result) {
        return NextResponse.json({ error: "Cannot join room" }, { status: 400 });
      }
      return NextResponse.json({
        playerId: result.playerId,
        room: toPublicRoom(result.room, isTmdbEnabled()),
      });
    }
    case "start": {
      const room = await startPicking(code, body.playerId);
      if (!room) {
        return NextResponse.json({ error: "Cannot start" }, { status: 400 });
      }
      return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
    }
    case "ready": {
      const result = await setPicksReady(
        code,
        body.playerId,
        body.ready !== false
      );
      if (!result) {
        return NextResponse.json({ error: "Cannot update ready" }, { status: 400 });
      }
      if (result.rankingFailed) {
        return NextResponse.json(
          {
            error:
              "Couldn't build a list to rank yet. Add another movie and try again.",
            room: toPublicRoom(result.room, isTmdbEnabled()),
          },
          { status: 409 }
        );
      }
      return NextResponse.json({
        room: toPublicRoom(result.room, isTmdbEnabled()),
      });
    }
    case "submit": {
      const room = await submitRankings(code, body.playerId, body.rankings);
      if (!room) {
        return NextResponse.json({ error: "Invalid rankings" }, { status: 400 });
      }
      return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
    }
    case "reset": {
      const room = await newRound(code, body.playerId);
      if (!room) {
        return NextResponse.json({ error: "Cannot reset" }, { status: 400 });
      }
      return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
    }
    case "veto": {
      const room = await submitVetoResponse(code, body.playerId, body.response);
      if (!room) {
        return NextResponse.json(
          { error: "Cannot submit response" },
          { status: 400 }
        );
      }
      return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
    }
    case "add-custom": {
      const room = await addCustomMovie(code, body.playerId, body.tmdbId, {
        title: typeof body.title === "string" ? body.title : undefined,
        year: typeof body.year === "number" ? body.year : undefined,
        posterUrl:
          typeof body.posterUrl === "string" || body.posterUrl === null
            ? body.posterUrl
            : undefined,
      });
      if (!room) {
        return NextResponse.json({ error: "Cannot add movie" }, { status: 400 });
      }
      return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
    }
    case "remove-custom": {
      const room = await removeCustomMovie(code, body.playerId, body.tmdbId);
      if (!room) {
        return NextResponse.json(
          { error: "Cannot remove movie" },
          { status: 400 }
        );
      }
      return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

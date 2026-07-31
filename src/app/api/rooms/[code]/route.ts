import { NextResponse } from "next/server";
import {
  getRoom,
  joinRoom,
  resetRoom,
  startRanking,
  submitRankings,
} from "@/lib/room-store";
import { toPublicRoom } from "@/lib/room-types";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const room = getRoom(code);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room: toPublicRoom(room) });
}

export async function POST(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const body = await request.json();
  const action = body.action as string;

  if (action === "join") {
    const result = joinRoom(code, body.name ?? "Guest");
    if (!result) {
      return NextResponse.json({ error: "Cannot join room" }, { status: 400 });
    }
    return NextResponse.json({
      playerId: result.playerId,
      room: toPublicRoom(result.room),
    });
  }

  if (action === "start") {
    const room = startRanking(code, body.playerId);
    if (!room) {
      return NextResponse.json({ error: "Cannot start" }, { status: 400 });
    }
    return NextResponse.json({ room: toPublicRoom(room) });
  }

  if (action === "submit") {
    const room = submitRankings(code, body.playerId, body.rankings);
    if (!room) {
      return NextResponse.json({ error: "Invalid rankings" }, { status: 400 });
    }
    return NextResponse.json({ room: toPublicRoom(room) });
  }

  if (action === "reset") {
    const room = resetRoom(code, body.playerId);
    if (!room) {
      return NextResponse.json({ error: "Cannot reset" }, { status: 400 });
    }
    return NextResponse.json({ room: toPublicRoom(room) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

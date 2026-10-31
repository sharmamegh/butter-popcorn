import { NextResponse } from "next/server";
import { ROOM_ERRORS, isStorageFailure } from "@/lib/api-errors";
import {
  addCustomMovie,
  getRoom,
  isTmdbEnabled,
  joinRoom,
  newRound,
  requestPass,
  removeCustomMovie,
  setPicksReady,
  setPlayerMoods,
  startPicking,
  submitRankings,
  submitVetoResponse,
  syncPassFavorites,
} from "@/lib/room-store";
import { roomCustomPicks, toPublicRoom } from "@/lib/room-types";
import { normalizeMoods } from "@/types/movie";

type RouteContext = { params: Promise<{ code: string }> };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function storageOrInternal(err: unknown) {
  console.error("[butter-popcorn] room action failed", err);
  if (isStorageFailure(err)) {
    return jsonError(ROOM_ERRORS.storageDown, 503);
  }
  return jsonError("Something broke on our side. Try again in a moment.", 500);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const room = await getRoom(code);

    if (!room) {
      return jsonError(ROOM_ERRORS.notFound, 404);
    }

    return NextResponse.json({
      room: toPublicRoom(room, isTmdbEnabled()),
      tmdbEnabled: isTmdbEnabled(),
    });
  } catch (err) {
    return storageOrInternal(err);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonError("That request looked incomplete. Refresh and try again.", 400);
    }
    const action = body.action as string;

    switch (action) {
      case "join": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);

        const result = await joinRoom(code, (body.name as string) ?? "Guest", {
          playerId:
            typeof body.playerId === "string" ? body.playerId : undefined,
        });
        if (!result) {
          if (existing.status !== "lobby") {
            return jsonError(ROOM_ERRORS.joinStarted, 400);
          }
          if (existing.players.length >= existing.expectedPlayers) {
            return jsonError(ROOM_ERRORS.joinFull, 400);
          }
          return jsonError(ROOM_ERRORS.joinFailed, 400);
        }
        return NextResponse.json({
          playerId: result.playerId,
          room: toPublicRoom(result.room, isTmdbEnabled()),
        });
      }
      case "start": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.hostId !== body.playerId) {
          return jsonError(ROOM_ERRORS.startNotHost, 403);
        }
        if (existing.status !== "lobby") {
          return jsonError(ROOM_ERRORS.startWrongPhase, 400);
        }
        const minToStart = existing.expectedPlayers <= 1 ? 1 : 2;
        if (existing.players.length < minToStart) {
          return jsonError(ROOM_ERRORS.startNeedPeople, 400);
        }
        const room = await startPicking(code, body.playerId as string);
        if (!room) return jsonError(ROOM_ERRORS.startWrongPhase, 400);
        return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
      }
      case "moods": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.status !== "picking") {
          return jsonError(ROOM_ERRORS.moodsWrongPhase, 400);
        }
        const player = existing.players.find((p) => p.id === body.playerId);
        if (!player) return jsonError(ROOM_ERRORS.readyNotInRoom, 400);
        if (player.picksReady) return jsonError(ROOM_ERRORS.moodsLocked, 400);

        const room = await setPlayerMoods(
          code,
          body.playerId as string,
          normalizeMoods(body.moods)
        );
        if (!room) return jsonError(ROOM_ERRORS.moodsWrongPhase, 400);
        return NextResponse.json({
          room: toPublicRoom(room, isTmdbEnabled()),
        });
      }
      case "ready": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.status !== "picking") {
          return jsonError(ROOM_ERRORS.readyWrongPhase, 400);
        }
        if (!existing.players.some((p) => p.id === body.playerId)) {
          return jsonError(ROOM_ERRORS.readyNotInRoom, 400);
        }

        const moods =
          body.moods !== undefined ? normalizeMoods(body.moods) : undefined;
        const becomingReady = body.ready !== false;
        if (
          becomingReady &&
          existing.discoveryMode === "blank" &&
          roomCustomPicks(existing).length < 2 &&
          existing.players
            .filter((p) => p.id !== body.playerId)
            .every((p) => p.picksReady)
        ) {
          // Last person going ready would start ranking with an empty blank slate.
          return jsonError(ROOM_ERRORS.blankNeedPicks, 400);
        }

        const room = await setPicksReady(
          code,
          body.playerId as string,
          becomingReady,
          moods
        );
        if (!room) return jsonError(ROOM_ERRORS.readyWrongPhase, 400);
        return NextResponse.json({
          room: toPublicRoom(room, isTmdbEnabled()),
        });
      }
      case "submit": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.status !== "ranking") {
          return jsonError(ROOM_ERRORS.rankingsWrongPhase, 400);
        }
        const room = await submitRankings(
          code,
          body.playerId as string,
          body.rankings as string[]
        );
        if (!room) return jsonError(ROOM_ERRORS.rankingsInvalid, 400);
        return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
      }
      case "pass": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.status !== "ranking") {
          return jsonError(ROOM_ERRORS.passWrongPhase, 400);
        }
        if (!existing.players.some((p) => p.id === body.playerId)) {
          return jsonError(ROOM_ERRORS.passNotInRoom, 400);
        }
        const rankings = Array.isArray(body.rankings) ? body.rankings : [];
        const room = await requestPass(
          code,
          body.playerId as string,
          rankings as string[]
        );
        if (!room) return jsonError(ROOM_ERRORS.passWrongPhase, 400);
        return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
      }
      case "pass-favorites": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.status !== "ranking" || existing.passDeadline == null) {
          return jsonError(ROOM_ERRORS.syncWrongPhase, 400);
        }
        const rankings = Array.isArray(body.rankings) ? body.rankings : [];
        const room = await syncPassFavorites(
          code,
          body.playerId as string,
          rankings as string[]
        );
        if (!room) return jsonError(ROOM_ERRORS.syncWrongPhase, 400);
        return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
      }
      case "reset": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.hostId !== body.playerId) {
          return jsonError(ROOM_ERRORS.resetNotHost, 403);
        }
        const room = await newRound(code, body.playerId as string);
        if (!room) return jsonError(ROOM_ERRORS.resetNotHost, 400);
        return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
      }
      case "veto": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.status !== "revealed" || !existing.result) {
          return jsonError(ROOM_ERRORS.vetoWrongPhase, 400);
        }
        const player = existing.players.find((p) => p.id === body.playerId);
        if (!player) return jsonError(ROOM_ERRORS.passNotInRoom, 400);
        if (player.vetoResponse !== "pending") {
          return jsonError(ROOM_ERRORS.vetoAlready, 400);
        }
        if (body.response === "veto" && player.vetoUsed) {
          return jsonError(ROOM_ERRORS.vetoUsed, 400);
        }
        const room = await submitVetoResponse(
          code,
          body.playerId as string,
          body.response as "accept" | "veto"
        );
        if (!room) return jsonError(ROOM_ERRORS.vetoWrongPhase, 400);
        return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
      }
      case "add-custom": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.status !== "picking") {
          return jsonError(ROOM_ERRORS.addWrongPhase, 400);
        }
        const player = existing.players.find((p) => p.id === body.playerId);
        if (!player) return jsonError(ROOM_ERRORS.addNotInRoom, 400);
        if (player.picksReady) return jsonError(ROOM_ERRORS.addWhenReady, 400);

        const room = await addCustomMovie(
          code,
          body.playerId as string,
          body.tmdbId as number,
          {
            title: typeof body.title === "string" ? body.title : undefined,
            year: typeof body.year === "number" ? body.year : undefined,
            posterUrl:
              typeof body.posterUrl === "string" || body.posterUrl === null
                ? (body.posterUrl as string | null)
                : undefined,
          }
        );
        if (!room) return jsonError(ROOM_ERRORS.addWrongPhase, 400);
        return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
      }
      case "remove-custom": {
        const existing = await getRoom(code);
        if (!existing) return jsonError(ROOM_ERRORS.notFound, 404);
        if (existing.status !== "picking") {
          return jsonError(ROOM_ERRORS.removeWrongPhase, 400);
        }
        const player = existing.players.find((p) => p.id === body.playerId);
        if (!player) return jsonError(ROOM_ERRORS.removeNotInRoom, 400);
        if (player.picksReady) {
          return jsonError(ROOM_ERRORS.removeWhenReady, 400);
        }
        const picks = roomCustomPicks(existing);
        const target = picks.find((p) => p.tmdbId === body.tmdbId);
        if (
          target &&
          existing.hostId !== body.playerId &&
          target.addedBy !== body.playerId
        ) {
          return jsonError(ROOM_ERRORS.removeNotYours, 403);
        }

        const room = await removeCustomMovie(
          code,
          body.playerId as string,
          body.tmdbId as number
        );
        if (!room) return jsonError(ROOM_ERRORS.removeWrongPhase, 400);
        return NextResponse.json({ room: toPublicRoom(room, isTmdbEnabled()) });
      }
      default:
        return jsonError(ROOM_ERRORS.unknownAction, 400);
    }
  } catch (err) {
    return storageOrInternal(err);
  }
}

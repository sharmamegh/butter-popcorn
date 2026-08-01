"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicRoom } from "@/lib/room-types";

const PLAYER_KEY = "butter-popcorn-player";
const playerKey = (roomCode: string) =>
  `${PLAYER_KEY}:${roomCode.toUpperCase()}`;

export function savePlayer(roomCode: string, playerId: string, name: string) {
  const data = { roomCode: roomCode.toUpperCase(), playerId, name };
  try {
    localStorage.setItem(playerKey(roomCode), JSON.stringify(data));
    // Legacy single-key write so older tabs still find something briefly.
    localStorage.setItem(PLAYER_KEY, JSON.stringify(data));
  } catch {
    // private mode / quota — continue without persistence
  }
}

export function loadPlayer(roomCode: string): { playerId: string; name: string } | null {
  try {
    const scoped = localStorage.getItem(playerKey(roomCode));
    if (scoped) {
      const data = JSON.parse(scoped);
      if (data.roomCode?.toUpperCase() === roomCode.toUpperCase()) {
        return { playerId: data.playerId, name: data.name };
      }
    }
    // Migrate from the old global key if it matches this room.
    const raw = localStorage.getItem(PLAYER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.roomCode?.toUpperCase() !== roomCode.toUpperCase()) return null;
    savePlayer(roomCode, data.playerId, data.name);
    return { playerId: data.playerId, name: data.name };
  } catch {
    return null;
  }
}

const draftKey = (roomCode: string, playerId: string) =>
  `${PLAYER_KEY}:draft:${roomCode.toUpperCase()}:${playerId}`;

type DraftRankings = {
  movieIds: string[];
  rankings: string[];
};

/** Persist in-progress favorites so a refresh doesn't wipe them. */
export function saveDraftRankings(
  roomCode: string,
  playerId: string,
  movieIds: string[],
  rankings: string[]
) {
  try {
    const payload: DraftRankings = { movieIds, rankings };
    localStorage.setItem(
      draftKey(roomCode, playerId),
      JSON.stringify(payload)
    );
  } catch {
    // private mode / quota
  }
}

/** Restore draft favorites for this room slate; empty if slate changed. */
export function loadDraftRankings(
  roomCode: string,
  playerId: string,
  movieIds: string[]
): string[] {
  try {
    const raw = localStorage.getItem(draftKey(roomCode, playerId));
    if (!raw) return [];
    const data = JSON.parse(raw) as DraftRankings;
    if (!Array.isArray(data.movieIds) || !Array.isArray(data.rankings)) {
      return [];
    }
    const sameSlate =
      data.movieIds.length === movieIds.length &&
      data.movieIds.every((id, i) => id === movieIds[i]);
    if (!sameSlate) return [];
    const valid = new Set(movieIds);
    return data.rankings.filter((id) => valid.has(id));
  } catch {
    return [];
  }
}

export function clearDraftRankings(roomCode: string, playerId: string) {
  try {
    localStorage.removeItem(draftKey(roomCode, playerId));
  } catch {
    // private mode
  }
}

export function useRoom(code: string) {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<"ok" | "missing" | "error"> => {
    if (!code) {
      setLoading(true);
      setError(null);
      setRoom(null);
      return "error";
    }

    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        const missing = res.status === 404;
        setError(missing ? "Room not found" : "Couldn't load room");
        setRoom(null);
        return missing ? "missing" : "error";
      }
      const data = await res.json();
      setRoom(data.room);
      setError(null);
      return "ok";
    } catch {
      setError("Connection error");
      return "error";
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (!code) {
      setLoading(true);
      setError(null);
      setRoom(null);
      return;
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    setLoading(true);
    (async () => {
      const status = await refresh();
      if (cancelled || status === "missing") return;
      interval = setInterval(async () => {
        const next = await refresh();
        if (next === "missing") stop();
      }, 2000);
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [code, refresh]);

  return { room, error, loading, refresh };
}

export async function createRoom(
  hostName: string,
  expectedPlayers: number,
  moods: string[]
) {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostName, expectedPlayers, moods }),
  });
  if (!res.ok) {
    let message = "Failed to create room";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  return res.json();
}

export async function roomAction(
  code: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`/api/rooms/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  return res.json();
}

export async function joinRoomApi(
  code: string,
  name: string,
  playerId?: string
) {
  return roomAction(code, { action: "join", name, playerId });
}

export async function startRoomApi(code: string, playerId: string) {
  return roomAction(code, { action: "start", playerId });
}

export async function setPicksReadyApi(
  code: string,
  playerId: string,
  ready = true
) {
  return roomAction(code, { action: "ready", playerId, ready });
}

export async function submitRankingsApi(
  code: string,
  playerId: string,
  rankings: string[]
) {
  return roomAction(code, { action: "submit", playerId, rankings });
}

export async function passOnMoviesApi(
  code: string,
  playerId: string,
  rankings: string[] = []
) {
  return roomAction(code, { action: "pass", playerId, rankings });
}

export async function syncPassFavoritesApi(
  code: string,
  playerId: string,
  rankings: string[] = []
) {
  return roomAction(code, { action: "pass-favorites", playerId, rankings });
}

export async function newRoundApi(code: string, playerId: string) {
  return roomAction(code, { action: "reset", playerId });
}

export async function vetoApi(
  code: string,
  playerId: string,
  response: "accept" | "veto"
) {
  return roomAction(code, { action: "veto", playerId, response });
}

export async function addCustomMovieApi(
  code: string,
  playerId: string,
  tmdbId: number,
  meta?: { title?: string; year?: number; posterUrl?: string | null }
) {
  return roomAction(code, { action: "add-custom", playerId, tmdbId, ...meta });
}

export async function removeCustomMovieApi(
  code: string,
  playerId: string,
  tmdbId: number
) {
  return roomAction(code, { action: "remove-custom", playerId, tmdbId });
}

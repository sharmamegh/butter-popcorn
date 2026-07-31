"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicRoom } from "@/lib/room-types";

const PLAYER_KEY = "butter-popcorn-player";

export function savePlayer(roomCode: string, playerId: string, name: string) {
  const data = { roomCode, playerId, name };
  localStorage.setItem(PLAYER_KEY, JSON.stringify(data));
}

export function loadPlayer(roomCode: string): { playerId: string; name: string } | null {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.roomCode !== roomCode) return null;
    return { playerId: data.playerId, name: data.name };
  } catch {
    return null;
  }
}

export function useRoom(code: string) {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        setError("Room not found");
        setRoom(null);
        return;
      }
      const data = await res.json();
      setRoom(data.room);
      setError(null);
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { room, error, loading, refresh };
}

export async function createRoom(
  hostName: string,
  expectedPlayers: number,
  mood: string,
  customTmdbIds: number[]
) {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostName, expectedPlayers, mood, customTmdbIds }),
  });
  if (!res.ok) throw new Error("Failed to create room");
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
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function joinRoomApi(code: string, name: string) {
  return roomAction(code, { action: "join", name });
}

export async function startRoomApi(code: string, playerId: string) {
  return roomAction(code, { action: "start", playerId });
}

export async function submitRankingsApi(
  code: string,
  playerId: string,
  rankings: string[]
) {
  return roomAction(code, { action: "submit", playerId, rankings });
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
  tmdbId: number
) {
  return roomAction(code, { action: "add-custom", playerId, tmdbId });
}

export async function removeCustomMovieApi(
  code: string,
  playerId: string,
  tmdbId: number
) {
  return roomAction(code, { action: "remove-custom", playerId, tmdbId });
}

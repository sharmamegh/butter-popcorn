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

export async function createRoom(hostName: string, expectedPlayers: number) {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostName, expectedPlayers }),
  });
  if (!res.ok) throw new Error("Failed to create room");
  return res.json();
}

export async function joinRoomApi(code: string, name: string) {
  const res = await fetch(`/api/rooms/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join", name }),
  });
  if (!res.ok) throw new Error("Failed to join");
  return res.json();
}

export async function startRoomApi(code: string, playerId: string) {
  const res = await fetch(`/api/rooms/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start", playerId }),
  });
  if (!res.ok) throw new Error("Failed to start");
  return res.json();
}

export async function submitRankingsApi(
  code: string,
  playerId: string,
  rankings: string[]
) {
  const res = await fetch(`/api/rooms/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "submit", playerId, rankings }),
  });
  if (!res.ok) throw new Error("Failed to submit");
  return res.json();
}

export async function resetRoomApi(code: string, playerId: string) {
  const res = await fetch(`/api/rooms/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset", playerId }),
  });
  if (!res.ok) throw new Error("Failed to reset");
  return res.json();
}

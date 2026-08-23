import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Movie } from "@/types/movie";
import {
  createFileStorage,
  getStorage,
  installStorageForTests,
} from "./room-storage";
import {
  addCustomMovie,
  createRoom,
  getRoom,
  joinRoom,
  setPicksReady,
  startPicking,
} from "./room-store";

const tmdb = vi.hoisted(() => ({
  buildSessionMovies: vi.fn(),
}));

vi.mock("@/lib/tmdb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tmdb")>();
  return {
    ...actual,
    buildSessionMovies: tmdb.buildSessionMovies,
  };
});

function fakeMovie(id: string, tmdbId: number): Movie {
  return {
    id,
    tmdbId,
    title: id,
    year: 2000,
    tagline: "",
    description: "",
    themes: [],
    runtime: "",
    emoji: "🎬",
    genre: "Movie",
    posterUrl: null,
  };
}

function useTempFileStorage() {
  const dir = mkdtempSync(path.join(tmpdir(), "bp-rooms-ready-"));
  installStorageForTests(createFileStorage(dir));
}

async function pickingRoom() {
  const created = await createRoom("Host", 2);
  const joined = await joinRoom(created.code, "Guest");
  expect(joined).not.toBeNull();
  const started = await startPicking(created.code, created.hostId);
  expect(started?.status).toBe("picking");
  return { code: created.code, hostId: created.hostId, guestId: joined!.playerId };
}

describe("setPicksReady slate build", () => {
  beforeEach(() => {
    useTempFileStorage();
    tmdb.buildSessionMovies.mockReset();
  });

  afterEach(() => {
    tmdb.buildSessionMovies.mockReset();
  });

  it("does not persist everyone-ready while the slate is still fetching", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    tmdb.buildSessionMovies.mockImplementation(async () => {
      await gate;
      return [fakeMovie("tmdb-1", 1), fakeMovie("tmdb-2", 2)];
    });

    const { code, hostId, guestId } = await pickingRoom();
    await setPicksReady(code, hostId, true);

    const starting = setPicksReady(code, guestId, true);

    await vi.waitFor(async () => {
      expect(tmdb.buildSessionMovies).toHaveBeenCalled();
    });

    const mid = await getRoom(code);
    expect(mid?.status).toBe("picking");
    expect(mid?.players.find((p) => p.id === guestId)?.picksReady).toBe(false);
    expect(mid?.players.every((p) => p.picksReady)).toBe(false);

    release();
    const ranked = await starting;
    expect(ranked?.status).toBe("ranking");
    expect(ranked?.movieIds.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps a custom added during the fetch on the ranking slate", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    tmdb.buildSessionMovies.mockImplementation(async () => {
      await gate;
      return [fakeMovie("tmdb-1", 1), fakeMovie("tmdb-2", 2)];
    });

    const { code, hostId, guestId } = await pickingRoom();
    await setPicksReady(code, hostId, true);
    const starting = setPicksReady(code, guestId, true);

    await vi.waitFor(async () => {
      expect(tmdb.buildSessionMovies).toHaveBeenCalled();
    });

    await setPicksReady(code, hostId, false);
    await addCustomMovie(code, hostId, 550, {
      title: "Fight Club",
      year: 1999,
      posterUrl: null,
    });
    await setPicksReady(code, hostId, true);

    release();
    const ranked = await starting;
    expect(ranked?.status).toBe("ranking");
    expect(ranked?.movieIds).toContain("tmdb-550");
    expect(ranked?.movies["tmdb-550"]?.title).toBe("Fight Club");
  });

  it("leaves the last player unready if applying the slate throws", async () => {
    const storage = getStorage();
    const exclusive = storage.runExclusive.bind(storage);

    let failApply = false;
    tmdb.buildSessionMovies.mockImplementation(async () => {
      failApply = true;
      return [fakeMovie("tmdb-1", 1), fakeMovie("tmdb-2", 2)];
    });

    const { code, hostId, guestId } = await pickingRoom();
    await setPicksReady(code, hostId, true);

    const spy = vi.spyOn(storage, "runExclusive").mockImplementation(async (key, fn) => {
      if (failApply) {
        failApply = false;
        throw new Error("Room is busy, try again");
      }
      return exclusive(key, fn);
    });

    await setPicksReady(code, guestId, true);
    spy.mockRestore();

    const final = await getRoom(code);
    expect(final?.status).toBe("picking");
    expect(final?.players.find((p) => p.id === guestId)?.picksReady).toBe(false);
  });
});

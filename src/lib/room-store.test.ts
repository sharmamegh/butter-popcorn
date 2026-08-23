import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { ExclusiveLock } from "./room-lock";
import {
  createFileStorage,
  installStorageForTests,
} from "./room-storage";
import {
  addCustomMovie,
  createRoom,
  getRoom,
  joinRoom,
  setPicksReady,
  startPicking,
  submitRankings,
} from "./room-store";

function useTempFileStorage() {
  const dir = mkdtempSync(path.join(tmpdir(), "bp-rooms-"));
  installStorageForTests(createFileStorage(dir));
}

describe("ExclusiveLock", () => {
  it("runs same-key work in order", async () => {
    const lock = new ExclusiveLock();
    const order: number[] = [];

    await Promise.all([
      lock.run("ROOM", async () => {
        await new Promise((r) => setTimeout(r, 30));
        order.push(1);
      }),
      lock.run("ROOM", async () => {
        order.push(2);
      }),
    ]);

    expect(order).toEqual([1, 2]);
  });
});

describe("concurrent room updates", () => {
  beforeEach(() => {
    useTempFileStorage();
  });

  it("keeps both players' rankings and reveals when they submit together", async () => {
    const created = await createRoom("Host", 2);
    const joined = await joinRoom(created.code, "Guest");
    expect(joined).not.toBeNull();
    const guestId = joined!.playerId;

    const picking = await startPicking(created.code, created.hostId);
    expect(picking?.status).toBe("picking");

    await setPicksReady(created.code, created.hostId, true);
    const ranking = await setPicksReady(created.code, guestId, true);
    expect(ranking?.status).toBe("ranking");
    expect(ranking!.movieIds.length).toBeGreaterThanOrEqual(2);

    const [first, second] = ranking!.movieIds;
    await Promise.all([
      submitRankings(created.code, created.hostId, [first]),
      submitRankings(created.code, guestId, [second]),
    ]);

    const final = await getRoom(created.code);
    expect(final?.status).toBe("revealed");
    expect(final?.players.every((p) => p.submitted)).toBe(true);
    expect(final?.players.every((p) => p.rankings && p.rankings.length > 0)).toBe(
      true
    );
    expect(final?.result?.winnerId).toBeTruthy();
  });

  it("keeps both custom picks when two players add movies at the same time", async () => {
    const created = await createRoom("Host", 2);
    const joined = await joinRoom(created.code, "Guest");
    expect(joined).not.toBeNull();
    const guestId = joined!.playerId;

    await startPicking(created.code, created.hostId);

    await Promise.all([
      addCustomMovie(created.code, created.hostId, 550, {
        title: "Fight Club",
        year: 1999,
        posterUrl: null,
      }),
      addCustomMovie(created.code, guestId, 680, {
        title: "Pulp Fiction",
        year: 1994,
        posterUrl: null,
      }),
    ]);

    const room = await getRoom(created.code);
    const ids = room?.customPicks.map((p) => p.tmdbId).sort((a, b) => a - b);
    expect(ids).toEqual([550, 680]);
  });
});

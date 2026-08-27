import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  requestPass,
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

describe("joinRoom identities", () => {
  beforeEach(() => {
    useTempFileStorage();
  });

  it("gives two people with the same name distinct player ids in the lobby", async () => {
    const created = await createRoom("Alex", 3);
    const second = await joinRoom(created.code, "Alex");
    const third = await joinRoom(created.code, "alex");

    expect(second).not.toBeNull();
    expect(third).not.toBeNull();
    expect(second!.playerId).not.toBe(created.hostId);
    expect(third!.playerId).not.toBe(created.hostId);
    expect(third!.playerId).not.toBe(second!.playerId);

    const room = await getRoom(created.code);
    expect(room?.players).toHaveLength(3);
    expect(new Set(room!.players.map((p) => p.id)).size).toBe(3);
  });

  it("reattaches a lost tab by playerId even when names collide", async () => {
    const created = await createRoom("Alex", 3);
    const second = await joinRoom(created.code, "Alex");
    expect(second).not.toBeNull();

    const again = await joinRoom(created.code, "Alex", {
      playerId: second!.playerId,
    });
    expect(again?.playerId).toBe(second!.playerId);

    const room = await getRoom(created.code);
    expect(room?.players).toHaveLength(2);
  });

  it("reattaches a unique name after the lobby so a lost tab can continue", async () => {
    const created = await createRoom("Alex", 3);
    const guest = await joinRoom(created.code, "Sam");
    expect(guest).not.toBeNull();

    const picking = await startPicking(created.code, created.hostId);
    expect(picking?.status).toBe("picking");

    const recovered = await joinRoom(created.code, "alex");
    expect(recovered?.playerId).toBe(created.hostId);
  });

  it("does not steal a slot when two players already share a name", async () => {
    const created = await createRoom("Alex", 3);
    const second = await joinRoom(created.code, "Alex");
    expect(second).not.toBeNull();

    const picking = await startPicking(created.code, created.hostId);
    expect(picking?.status).toBe("picking");

    const ambiguous = await joinRoom(created.code, "Alex");
    expect(ambiguous).toBeNull();

    const byId = await joinRoom(created.code, "Alex", {
      playerId: second!.playerId,
    });
    expect(byId?.playerId).toBe(second!.playerId);

    const room = await getRoom(created.code);
    expect(room?.players).toHaveLength(2);
    expect(new Set(room!.players.map((p) => p.id)).size).toBe(2);
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

describe("pass countdown vs lock-in", () => {
  beforeEach(() => {
    useTempFileStorage();
  });

  async function rankingRoom() {
    const created = await createRoom("Host", 2);
    const joined = await joinRoom(created.code, "Guest");
    expect(joined).not.toBeNull();
    const guestId = joined!.playerId;

    await startPicking(created.code, created.hostId);
    await setPicksReady(created.code, created.hostId, true);
    const ranking = await setPicksReady(created.code, guestId, true);
    expect(ranking?.status).toBe("ranking");
    expect(ranking!.movieIds.length).toBeGreaterThanOrEqual(2);

    return {
      code: created.code,
      hostId: created.hostId,
      guestId,
      movieIds: ranking!.movieIds,
    };
  }

  it("does not reveal a winner when the last player locks in during a pass countdown", async () => {
    const { code, hostId, guestId, movieIds } = await rankingRoom();
    const [first, second] = movieIds;

    await submitRankings(code, hostId, [first]);
    const passing = await requestPass(code, hostId, [first]);
    expect(passing?.status).toBe("ranking");
    expect(passing?.passDeadline).not.toBeNull();

    const afterGuest = await submitRankings(code, guestId, [second]);
    expect(afterGuest?.status).toBe("ranking");
    expect(afterGuest?.result).toBeNull();
    expect(afterGuest?.passDeadline).toBe(passing?.passDeadline);
    expect(afterGuest?.players.every((p) => p.submitted)).toBe(true);

    const still = await getRoom(code);
    expect(still?.status).toBe("ranking");
    expect(still?.result).toBeNull();
  });

  it("still starts over after the countdown when everyone locked in during it", async () => {
    const { code, hostId, guestId, movieIds } = await rankingRoom();
    const [first, second] = movieIds;

    await submitRankings(code, hostId, [first]);
    const passing = await requestPass(code, hostId, [first]);
    expect(passing?.passDeadline).not.toBeNull();

    await submitRankings(code, guestId, [second]);

    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(
      passing!.passDeadline! + 1
    );
    try {
      const passed = await getRoom(code);
      expect(passed?.status).toBe("picking");
      expect(passed?.result).toBeNull();
      expect(passed?.passDeadline).toBeNull();
      expect(passed?.players.every((p) => p.submitted)).toBe(false);
    } finally {
      nowSpy.mockRestore();
    }
  });
});

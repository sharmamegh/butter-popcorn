import { describe, expect, it } from "vitest";
import { calculateMatch, completeRankings } from "@/lib/match";
import type { Room, RoomPlayer } from "@/lib/room-types";

function player(
  partial: Partial<RoomPlayer> & Pick<RoomPlayer, "id" | "name">
): RoomPlayer {
  return {
    isHost: false,
    picksReady: true,
    submitted: true,
    moods: ["any"],
    rankings: null,
    pickedIds: null,
    vetoUsed: false,
    vetoResponse: "pending",
    ...partial,
  };
}

function room(
  partial: Partial<Room> & Pick<Room, "movieIds" | "players">
): Room {
  return {
    code: "TEST1",
    seed: "test",
    moods: ["any"],
    movies: {},
    customPicks: [],
    usedMovieIds: [],
    excludedMovieIds: [],
    expectedPlayers: partial.players.length,
    status: "ranking",
    hostId: partial.players[0]?.id ?? "host",
    result: null,
    createdAt: 0,
    passDeadline: null,
    passFavorites: {},
    ...partial,
  };
}

describe("completeRankings", () => {
  it("appends unranked titles in slate order", () => {
    expect(completeRankings(["d1"], ["c1", "c2", "d1", "d2"])).toEqual([
      "d1",
      "c1",
      "c2",
      "d2",
    ]);
  });
});

describe("calculateMatch", () => {
  it("does not let unpicked slate-prefix movies beat actual favorites", () => {
    const movieIds = ["customA", "customB", "d1", "d2", "d3"];
    const result = calculateMatch(
      room({
        movieIds,
        players: [
          player({
            id: "p1",
            name: "Sam",
            pickedIds: ["d1"],
            rankings: completeRankings(["d1"], movieIds),
          }),
          player({
            id: "p2",
            name: "Alex",
            pickedIds: ["d2"],
            rankings: completeRankings(["d2"], movieIds),
          }),
        ],
      })
    );

    expect(result).not.toBeNull();
    expect(result!.winnerId).not.toBe("customA");
    expect(result!.winnerId).not.toBe("customB");
    expect(["d1", "d2"]).toContain(result!.winnerId);

    const customA = result!.scores.find((s) => s.movieId === "customA");
    const winner = result!.scores.find((s) => s.movieId === result!.winnerId);
    expect(customA?.points).toBe(0);
    expect(winner?.points).toBeGreaterThan(0);
  });

  it("picks a movie both people actually favorited", () => {
    const movieIds = ["customA", "d1", "d2"];
    const result = calculateMatch(
      room({
        movieIds,
        players: [
          player({
            id: "p1",
            name: "Sam",
            pickedIds: ["d1", "d2"],
            rankings: completeRankings(["d1", "d2"], movieIds),
          }),
          player({
            id: "p2",
            name: "Alex",
            pickedIds: ["d1"],
            rankings: completeRankings(["d1"], movieIds),
          }),
        ],
      })
    );

    expect(result?.winnerId).toBe("d1");
  });

  it("reports each person's explicit favorite rank, not the auto-filled slot", () => {
    const movieIds = ["customA", "d1", "d2"];
    const result = calculateMatch(
      room({
        movieIds,
        players: [
          player({
            id: "p1",
            name: "Sam",
            pickedIds: ["d1"],
            rankings: completeRankings(["d1"], movieIds),
          }),
          player({
            id: "p2",
            name: "Alex",
            pickedIds: ["d1"],
            rankings: completeRankings(["d1"], movieIds),
          }),
        ],
      })
    );

    expect(result?.winnerId).toBe("d1");
    expect(result?.breakdown.map((b) => b.rank)).toEqual([1, 1]);
    expect(result?.insight).toBe("Unanimous #1! Everyone picked this first.");
  });

  it("does not claim group overlap when only one person picked the winner", () => {
    const movieIds = ["customA", "d1", "d2"];
    const result = calculateMatch(
      room({
        movieIds,
        players: [
          player({
            id: "p1",
            name: "Sam",
            pickedIds: ["d1"],
            rankings: completeRankings(["d1"], movieIds),
          }),
          player({
            id: "p2",
            name: "Alex",
            pickedIds: ["d2"],
            rankings: completeRankings(["d2"], movieIds),
          }),
        ],
      })
    );

    expect(result?.insight).not.toMatch(/Unanimous|everyone's top 3/i);
  });

  it("still uses a full ranking when pickedIds is missing (legacy rooms)", () => {
    const movieIds = ["a", "b", "c"];
    const result = calculateMatch(
      room({
        movieIds,
        players: [
          player({
            id: "p1",
            name: "Sam",
            pickedIds: null,
            rankings: ["a", "b", "c"],
          }),
          player({
            id: "p2",
            name: "Alex",
            pickedIds: null,
            rankings: ["a", "c", "b"],
          }),
        ],
      })
    );

    expect(result?.winnerId).toBe("a");
  });
});

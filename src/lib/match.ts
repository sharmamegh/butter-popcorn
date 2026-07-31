import type { MatchResult } from "@/lib/room-types";
import type { Room } from "@/lib/room-types";

/**
 * Borda count: rank #1 gets N points, last gets 1.
 * Tie-break: lowest worst individual rank (nobody hated it).
 */
export function calculateMatch(room: Room): MatchResult {
  const n = room.movieIds.length;
  const scores = new Map<string, number>();
  const worstRank = new Map<string, number>();

  for (const id of room.movieIds) {
    scores.set(id, 0);
    worstRank.set(id, 0);
  }

  for (const player of room.players) {
    if (!player.rankings) continue;
    player.rankings.forEach((movieId, index) => {
      const rank = index + 1;
      const points = n - index;
      scores.set(movieId, (scores.get(movieId) ?? 0) + points);

      const currentWorst = worstRank.get(movieId) ?? 0;
      if (rank > currentWorst) worstRank.set(movieId, rank);
    });
  }

  const sorted = [...scores.entries()]
    .map(([movieId, points]) => ({ movieId, points }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (worstRank.get(a.movieId) ?? 99) - (worstRank.get(b.movieId) ?? 99);
    });

  const winnerId = sorted[0].movieId;

  const breakdown: MatchResult["breakdown"] = room.players
    .filter((p) => p.rankings)
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      rank: player.rankings!.indexOf(winnerId) + 1,
    }));

  const insight = buildInsight(room, winnerId);

  return {
    winnerId,
    scores: sorted,
    breakdown,
    insight,
  };
}

function buildInsight(room: Room, winnerId: string): string {
  const ranks: number[] = [];

  for (const player of room.players) {
    if (!player.rankings) continue;
    const idx = player.rankings.indexOf(winnerId);
    if (idx >= 0) ranks.push(idx + 1);
  }

  if (ranks.length === 0) return "The algorithm has spoken.";

  const allTop3 = ranks.every((r) => r <= 3);
  const bothNumberOne = ranks.every((r) => r === 1);

  if (bothNumberOne) return "Unanimous #1 — everyone picked this first!";
  if (allTop3) return "Strong group overlap — this was in everyone's top 3.";
  if (ranks.length === 2) {
    const [a, b] = ranks;
    if (a <= 2 && b <= 2) return "Both ranked this near the top — clear favorite.";
    if (Math.max(a, b) <= 4) return "Solid compromise — not everyone's #1, but nobody ranked it last.";
    return "Best overlap on tonight's list — worth a shot!";
  }

  const avgRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
  if (avgRank <= 3) return "Strong group consensus — ranked highly across the board.";
  if (avgRank <= 5) return "Good group fit — a pick most people can get behind.";

  return "Highest combined score across the group!";
}

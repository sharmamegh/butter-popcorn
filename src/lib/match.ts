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

  if (bothNumberOne) return "You both picked this as #1 — perfect match!";
  if (allTop3) return "You both had this in your top 3 — great overlap.";
  if (ranks.length === 2) {
    const [a, b] = ranks;
    if (a <= 2 && b <= 2) return "Strong agree — both of you ranked this near the top.";
    if (Math.max(a, b) <= 4) return "Solid compromise — nobody's top pick, but nobody hated it.";
    return "The best overlap from tonight's list — time to give it a shot!";
  }

  return "Highest combined score across the group!";
}

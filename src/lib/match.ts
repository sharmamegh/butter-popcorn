import type { MatchResult } from "@/lib/room-types";
import type { Room } from "@/lib/room-types";

/**
 * Keep explicit picks in order, then append anything unranked
 * in the slate's original order so a short top list is enough to submit.
 */
export function completeRankings(
  rankings: string[],
  movieIds: string[]
): string[] | null {
  const valid = new Set(movieIds);
  if (rankings.length === 0) return null;
  if (!rankings.every((id) => valid.has(id))) return null;
  if (new Set(rankings).size !== rankings.length) return null;

  const chosen = new Set(rankings);
  const rest = movieIds.filter((id) => !chosen.has(id));
  return [...rankings, ...rest];
}

export function calculateMatch(
  room: Room,
  excludeMovieIds: string[] = []
): MatchResult | null {
  const eligibleIds = room.movieIds.filter(
    (id) => !excludeMovieIds.includes(id)
  );

  if (eligibleIds.length === 0) return null;

  const n = eligibleIds.length;
  const scores = new Map<string, number>();
  const worstRank = new Map<string, number>();

  for (const id of eligibleIds) {
    scores.set(id, 0);
    worstRank.set(id, 0);
  }

  for (const player of room.players) {
    if (!player.rankings) continue;
    player.rankings.forEach((movieId, index) => {
      if (!eligibleIds.includes(movieId)) return;
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

  // Always pick something when the slate has eligible titles — never stall reveal.
  const winnerId = sorted[0]?.movieId ?? eligibleIds[0];
  const scoresOut =
    sorted.length > 0
      ? sorted
      : eligibleIds.map((movieId, i) => ({
          movieId,
          points: eligibleIds.length - i,
        }));

  const breakdown: MatchResult["breakdown"] = room.players
    .filter((p) => p.rankings)
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      rank: Math.max(1, player.rankings!.indexOf(winnerId) + 1),
    }));

  const insight =
    sorted[0] && sorted[0].points > 0
      ? buildInsight(room, winnerId)
      : "Closest match we could find — dig in!";

  return {
    winnerId,
    scores: scoresOut,
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

  if (ranks.length === 1) {
    if (ranks[0] === 1) return "Your #1. Go make the popcorn.";
    if (ranks[0] <= 3) return "High on your list. A solid night in.";
    return "Best fit from the titles you ranked.";
  }

  const allTop3 = ranks.every((r) => r <= 3);
  const bothNumberOne = ranks.every((r) => r === 1);

  if (bothNumberOne) return "Unanimous #1! Everyone picked this first.";
  if (allTop3) return "Strong group overlap. This was in everyone's top 3.";
  if (ranks.length === 2) {
    const [a, b] = ranks;
    if (a <= 2 && b <= 2) return "Both ranked this near the top. Clear favorite.";
    if (Math.max(a, b) <= 4) return "Solid compromise. Not everyone's #1, but nobody ranked it last.";
    return "Best overlap on this list. Worth a shot!";
  }

  const avgRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
  if (avgRank <= 3) return "Strong group consensus. Ranked highly across the board.";
  if (avgRank <= 5) return "Good group fit. A pick most people can get behind.";

  return "Highest combined score across the group!";
}

# 🍿 Butter Popcorn

**Can't agree on a movie?** Everyone ranks the same films on their own device, and the app reveals the group's best match.

Works for any crew size (2-8). Multiple rooms can run at the same time, each with its own code.

## How it works

1. **Create a room**: pick group size, mood filter, optionally add custom movies
2. **Everyone joins on their own device**: scan the QR code or use the invite link
3. **Rank 8 movies**: drag to reorder, tap to add, read descriptions and themes on each card
4. **Grand reveal**: combined scoring picks the winner; anyone can veto once per room
5. **New round**: fresh movies pulled from thousands via TMDB, skipping ones already shown in that room

## Setup

```bash
npm install
cp .env.example .env.local
```

### TMDB API key (recommended)

Get a free key at [themoviedb.org](https://www.themoviedb.org/settings/api) and add it to `.env.local`:

```
TMDB_API_KEY=your_key_here
```

This unlocks a catalog of thousands of popular films, posters, mood filtering, and custom movie search. Without it, the app falls back to a small built-in list of 32 classics.

### Deploy on Vercel (free)

1. Push to GitHub and import in [Vercel](https://vercel.com)
2. Add `TMDB_API_KEY` in Vercel environment variables
3. Optional: add [Upstash Redis](https://upstash.com) (free tier) for reliable room persistence across serverless instances:
   - Create a free Redis database on Upstash
   - Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars
   - Without Redis, rooms still work but may reset on cold starts

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- TMDB-powered catalog with mood filters (comedy, horror, sci-fi, etc.)
- Custom movie search: host adds up to 3 picks per room
- QR code + invite link for easy joining
- Drag-and-drop ranking on mobile and desktop
- One veto per person per room after the reveal
- Tracks used movies per room to reduce repeats across rounds

## Tech

- Next.js 15 · React 19 · Tailwind CSS 4 · Framer Motion
- TMDB API · @dnd-kit · react-qr-code
- Room storage: in-memory (dev) or Upstash Redis (production, free tier)

## License

MIT

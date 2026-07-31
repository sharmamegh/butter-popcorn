# 🍿 Butter Popcorn

**Can't agree on a movie?** Everyone ranks the same films on their own device, and the app reveals the group's best match.

Works for crews of 2–8. Multiple rooms can run at the same time, each with its own code.

## How it works

1. **Create a room**: pick group size, mood filter, optionally add custom movies
2. **Everyone joins on their own device**: scan the QR code or use the invite link
3. **Rank the slate**: drag to reorder, tap to add, read descriptions and themes on each card
4. **Grand reveal**: combined scoring picks the winner; anyone can veto once per room
5. **New round**: fresh movies pulled from thousands via TMDB, skipping ones already shown in that room

## Setup

```bash
npm install
cp .env.example .env.local
```

### TMDB API key (recommended)

Get a free **API Key** (not the Read Access Token) at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) and add it to `.env.local`:

```
TMDB_API_KEY=your_key_here
```

Use the **API Key** field. This app authenticates with the v3 `api_key` query parameter. The "API Read Access Token" is a different Bearer-token style and is not used here.

When requesting the key, set the application URL to your deployed site (for example `https://butter-popcorn.vercel.app`).

This unlocks a catalog of thousands of popular films, posters, mood filtering, and custom movie search. Without it, the app falls back to a small built-in list of 32 classics.

**Attribution:** We display TMDB's logo and the required notice ("This product uses the TMDB API but is not endorsed or certified by TMDB.") per their [logos & attribution](https://www.themoviedb.org/about/logos-attribution) and [API terms](https://www.themoviedb.org/api-terms-of-use).

### Deploy on Vercel (free)

1. Push to GitHub and import in [Vercel](https://vercel.com)
2. Add `TMDB_API_KEY` in Vercel environment variables
3. **Required for multiplayer:** add [Upstash Redis](https://vercel.com/marketplace/upstash) (free tier) so rooms persist across serverless instances:
   - Easiest: Vercel dashboard → Project → Storage → create/connect Upstash Redis
   - The app reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, or Marketplace names like `REDIS_KV_REST_API_URL` + `REDIS_KV_REST_API_TOKEN`
   - Redeploy after the store is connected
   - Without Redis, create-room is blocked on Vercel (in-memory rooms vanish between requests and look like 404s)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- TMDB-powered catalog with mood filters (comedy, horror, sci-fi, etc.)
- Custom movie search: everyone in the lobby adds movies they want; the whole group ranks that mix
- QR code + invite link for easy joining
- Drag-and-drop ranking on mobile and desktop
- One veto per person per room after the reveal
- Tracks used movies per room to reduce repeats across rounds

## Tech

- Next.js 15 · React 19 · Tailwind CSS 4 · Framer Motion
- TMDB API · @dnd-kit · react-qr-code
- Room storage: local file store (dev) or Upstash Redis (production, free tier)

## License

MIT

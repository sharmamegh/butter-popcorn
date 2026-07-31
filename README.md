# 🍿 Butter Popcorn

**Can't decide what to watch?** Everyone ranks the same movies on their own phone — the app reveals your best match.

Built for movie nights on Discord: you and your girlfriend (or a few friends) each rank 8 popular films in private, then get a grand reveal of what you're watching tonight.

## How it works

1. **Start a room** — pick how many people (2–4), get a shareable code
2. **Everyone joins on their own device** — phone, tablet, or laptop
3. **Rank 8 movies** — tap to order them most → least wanted
4. **Grand reveal** — the app picks the most compatible film and shows why

Rankings stay private until the reveal. The match uses a combined scoring system so picks nobody hates tend to win.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your laptop, create a room, and have your girlfriend open the link on her phone.

## Tech

- Next.js 15 · React 19 · Tailwind CSS 4 · Framer Motion
- Room sync via API polling (no account needed)

## License

MIT

# 🍿 Butter Popcorn

**Can't agree on a movie?** Everyone ranks the same films on their own device, and the app reveals the group's best match.

Works for any crew size: a pair of friends, a weekly watch group, or a Discord hangout. Multiple rooms can run at the same time, each with its own code.

## How it works

1. **Create a room**: set how many people (2-8), share the code or link
2. **Everyone joins on their own device**: phone, tablet, or laptop
3. **Rank 8 movies**: each card includes a description and themes so you know what you're picking
4. **Grand reveal**: combined scoring picks the winner and shows how the group ranked it

Rankings stay private until everyone submits. No account needed.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create a room, and share the link with your group.

## Tech

- Next.js 15 · React 19 · Tailwind CSS 4 · Framer Motion
- Room sync via API polling. Independent rooms run in parallel.

## License

MIT

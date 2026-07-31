export type Mood =
  | "any"
  | "feel-good"
  | "mind-bending"
  | "classic"
  | "edge-of-seat"
  | "laugh-out-loud"
  | "tearjerker";

export type Movie = {
  title: string;
  year: number;
  director: string;
  tagline: string;
  mood: Mood[];
  runtime: string;
  emoji: string;
};

export const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: "any", label: "Surprise Me", emoji: "🎲" },
  { id: "feel-good", label: "Feel Good", emoji: "☀️" },
  { id: "mind-bending", label: "Mind Bending", emoji: "🌀" },
  { id: "classic", label: "Classic", emoji: "🎬" },
  { id: "edge-of-seat", label: "Edge of Seat", emoji: "😱" },
  { id: "laugh-out-loud", label: "Laugh Out Loud", emoji: "😂" },
  { id: "tearjerker", label: "Tearjerker", emoji: "💧" },
];

export const MOVIES: Movie[] = [
  {
    title: "Spirited Away",
    year: 2001,
    director: "Hayao Miyazaki",
    tagline: "A bathhouse of wonders awaits.",
    mood: ["feel-good", "mind-bending", "classic"],
    runtime: "2h 5m",
    emoji: "🐉",
  },
  {
    title: "Inception",
    year: 2010,
    director: "Christopher Nolan",
    tagline: "Your mind is the scene of the crime.",
    mood: ["mind-bending", "edge-of-seat"],
    runtime: "2h 28m",
    emoji: "🌀",
  },
  {
    title: "The Grand Budapest Hotel",
    year: 2014,
    director: "Wes Anderson",
    tagline: "A murder. A mystery. A masterpiece.",
    mood: ["feel-good", "laugh-out-loud", "classic"],
    runtime: "1h 39m",
    emoji: "🏨",
  },
  {
    title: "Parasite",
    year: 2019,
    director: "Bong Joon-ho",
    tagline: "Act like you own the place.",
    mood: ["mind-bending", "edge-of-seat", "classic"],
    runtime: "2h 12m",
    emoji: "🏠",
  },
  {
    title: "Back to the Future",
    year: 1985,
    director: "Robert Zemeckis",
    tagline: "Where we're going, we don't need roads.",
    mood: ["feel-good", "classic", "laugh-out-loud"],
    runtime: "1h 56m",
    emoji: "⚡",
  },
  {
    title: "Get Out",
    year: 2017,
    director: "Jordan Peele",
    tagline: "Just because you're invited doesn't mean you're welcome.",
    mood: ["mind-bending", "edge-of-seat"],
    runtime: "1h 44m",
    emoji: "🫖",
  },
  {
    title: "La La Land",
    year: 2016,
    director: "Damien Chazelle",
    tagline: "Here's to the ones who dream.",
    mood: ["feel-good", "tearjerker", "classic"],
    runtime: "2h 8m",
    emoji: "🎹",
  },
  {
    title: "The Shawshank Redemption",
    year: 1994,
    director: "Frank Darabont",
    tagline: "Fear can hold you prisoner. Hope can set you free.",
    mood: ["classic", "tearjerker", "feel-good"],
    runtime: "2h 22m",
    emoji: "🕊️",
  },
  {
    title: "Mad Max: Fury Road",
    year: 2015,
    director: "George Miller",
    tagline: "What a lovely day.",
    mood: ["edge-of-seat", "classic"],
    runtime: "2h",
    emoji: "🔥",
  },
  {
    title: "Everything Everywhere All at Once",
    year: 2022,
    director: "Daniels",
    tagline: "The universe is so much bigger than you realize.",
    mood: ["mind-bending", "feel-good", "tearjerker"],
    runtime: "2h 19m",
    emoji: "🥯",
  },
  {
    title: "The Princess Bride",
    year: 1987,
    director: "Rob Reiner",
    tagline: "As you wish.",
    mood: ["feel-good", "laugh-out-loud", "classic"],
    runtime: "1h 38m",
    emoji: "⚔️",
  },
  {
    title: "Hereditary",
    year: 2018,
    director: "Ari Aster",
    tagline: "Every family tree hides a secret.",
    mood: ["edge-of-seat", "mind-bending"],
    runtime: "2h 7m",
    emoji: "🕯️",
  },
  {
    title: "Toy Story",
    year: 1995,
    director: "John Lasseter",
    tagline: "The adventure takes off when toys come to life.",
    mood: ["feel-good", "laugh-out-loud", "classic"],
    runtime: "1h 21m",
    emoji: "🤠",
  },
  {
    title: "Blade Runner 2049",
    year: 2017,
    director: "Denis Villeneuve",
    tagline: "The key to the future is buried in the past.",
    mood: ["mind-bending", "classic", "edge-of-seat"],
    runtime: "2h 44m",
    emoji: "🌧️",
  },
  {
    title: "Coco",
    year: 2017,
    director: "Lee Unkrich",
    tagline: "The celebration of a lifetime.",
    mood: ["feel-good", "tearjerker"],
    runtime: "1h 45m",
    emoji: "🎸",
  },
  {
    title: "Knives Out",
    year: 2019,
    director: "Rian Johnson",
    tagline: "Hell, any of them could have done it.",
    mood: ["laugh-out-loud", "mind-bending", "edge-of-seat"],
    runtime: "2h 10m",
    emoji: "🔪",
  },
  {
    title: "Jurassic Park",
    year: 1993,
    director: "Steven Spielberg",
    tagline: "An adventure 65 million years in the making.",
    mood: ["classic", "edge-of-seat", "feel-good"],
    runtime: "2h 7m",
    emoji: "🦖",
  },
  {
    title: "Amélie",
    year: 2001,
    director: "Jean-Pierre Jeunet",
    tagline: "She'll change your life.",
    mood: ["feel-good", "classic"],
    runtime: "2h 2m",
    emoji: "🍒",
  },
  {
    title: "The Dark Knight",
    year: 2008,
    director: "Christopher Nolan",
    tagline: "Why so serious?",
    mood: ["edge-of-seat", "classic", "mind-bending"],
    runtime: "2h 32m",
    emoji: "🃏",
  },
  {
    title: "Groundhog Day",
    year: 1993,
    director: "Harold Ramis",
    tagline: "He's having the worst day of his life... over and over.",
    mood: ["laugh-out-loud", "feel-good", "classic"],
    runtime: "1h 41m",
    emoji: "🐿️",
  },
];

export function pickMovie(mood: Mood): Movie {
  const pool =
    mood === "any" ? MOVIES : MOVIES.filter((m) => m.mood.includes(mood));
  return pool[Math.floor(Math.random() * pool.length)];
}

export type Movie = {
  id: string;
  title: string;
  year: number;
  director: string;
  tagline: string;
  runtime: string;
  emoji: string;
  genre: string;
};

function m(
  id: string,
  title: string,
  year: number,
  director: string,
  tagline: string,
  runtime: string,
  emoji: string,
  genre: string
): Movie {
  return { id, title, year, director, tagline, runtime, emoji, genre };
}

/** Popular, widely-loved films — the session picks 8 at random from this pool */
export const MOVIE_CATALOG: Movie[] = [
  m("spirited-away", "Spirited Away", 2001, "Hayao Miyazaki", "A bathhouse of wonders awaits.", "2h 5m", "🐉", "Animation"),
  m("inception", "Inception", 2010, "Christopher Nolan", "Your mind is the scene of the crime.", "2h 28m", "🌀", "Sci-Fi"),
  m("grand-budapest", "The Grand Budapest Hotel", 2014, "Wes Anderson", "A murder. A mystery. A masterpiece.", "1h 39m", "🏨", "Comedy"),
  m("parasite", "Parasite", 2019, "Bong Joon-ho", "Act like you own the place.", "2h 12m", "🏠", "Thriller"),
  m("back-to-future", "Back to the Future", 1985, "Robert Zemeckis", "Where we're going, we don't need roads.", "1h 56m", "⚡", "Adventure"),
  m("la-la-land", "La La Land", 2016, "Damien Chazelle", "Here's to the ones who dream.", "2h 8m", "🎹", "Romance"),
  m("shawshank", "The Shawshank Redemption", 1994, "Frank Darabont", "Fear can hold you prisoner. Hope can set you free.", "2h 22m", "🕊️", "Drama"),
  m("mad-max", "Mad Max: Fury Road", 2015, "George Miller", "What a lovely day.", "2h", "🔥", "Action"),
  m("everything-everywhere", "Everything Everywhere All at Once", 2022, "Daniels", "The universe is so much bigger than you realize.", "2h 19m", "🥯", "Sci-Fi"),
  m("princess-bride", "The Princess Bride", 1987, "Rob Reiner", "As you wish.", "1h 38m", "⚔️", "Adventure"),
  m("toy-story", "Toy Story", 1995, "John Lasseter", "The adventure takes off when toys come to life.", "1h 21m", "🤠", "Animation"),
  m("coco", "Coco", 2017, "Lee Unkrich", "The celebration of a lifetime.", "1h 45m", "🎸", "Animation"),
  m("knives-out", "Knives Out", 2019, "Rian Johnson", "Hell, any of them could have done it.", "2h 10m", "🔪", "Mystery"),
  m("jurassic-park", "Jurassic Park", 1993, "Steven Spielberg", "An adventure 65 million years in the making.", "2h 7m", "🦖", "Adventure"),
  m("amelie", "Amélie", 2001, "Jean-Pierre Jeunet", "She'll change your life.", "2h 2m", "🍒", "Romance"),
  m("dark-knight", "The Dark Knight", 2008, "Christopher Nolan", "Why so serious?", "2h 32m", "🃏", "Action"),
  m("groundhog-day", "Groundhog Day", 1993, "Harold Ramis", "The worst day of his life... over and over.", "1h 41m", "🐿️", "Comedy"),
  m("before-sunrise", "Before Sunrise", 1995, "Richard Linklater", "Can the greatest romance last only one night?", "1h 41m", "🌅", "Romance"),
  m("pride-prejudice", "Pride & Prejudice", 2005, "Joe Wright", "The one you can't live without.", "2h 9m", "💐", "Romance"),
  m("interstellar", "Interstellar", 2014, "Christopher Nolan", "Mankind was born on Earth. It was never meant to die here.", "2h 49m", "🚀", "Sci-Fi"),
  m("get-out", "Get Out", 2017, "Jordan Peele", "Just because you're invited doesn't mean you're welcome.", "1h 44m", "🫖", "Horror"),
  m("whiplash", "Whiplash", 2014, "Damien Chazelle", "Not quite my tempo.", "1h 46m", "🥁", "Drama"),
  m("the-matrix", "The Matrix", 1999, "The Wachowskis", "Welcome to the real world.", "2h 16m", "💊", "Sci-Fi"),
  m("finding-nemo", "Finding Nemo", 2003, "Andrew Stanton", "There are 3.7 trillion fish in the ocean.", "1h 40m", "🐠", "Animation"),
  m("superbad", "Superbad", 2007, "Greg Mottola", "Come and get some.", "1h 53m", "🎉", "Comedy"),
  m("21-jump-street", "21 Jump Street", 2012, "Phil Lord & Chris Miller", "The only thing getting blown is your mind.", "1h 49m", "🚔", "Comedy"),
  m("barbie", "Barbie", 2023, "Greta Gerwig", "She's everything. He's just Ken.", "1h 54m", "💖", "Comedy"),
  m("oppenheimer", "Oppenheimer", 2023, "Christopher Nolan", "The world forever changes.", "3h", "💣", "Drama"),
  m("dune", "Dune", 2021, "Denis Villeneuve", "Fear is the mind-killer.", "2h 35m", "🏜️", "Sci-Fi"),
  m("top-gun-maverick", "Top Gun: Maverick", 2022, "Joseph Kosinski", "Feel the need for speed.", "2h 11m", "✈️", "Action"),
  m("encanto", "Encanto", 2021, "Jared Bush", "The magic of the Encanto has blessed every child...", "1h 42m", "🦋", "Animation"),
  m("spider-verse", "Spider-Man: Into the Spider-Verse", 2018, "Peter Ramsey", "Anyone can wear the mask.", "1h 57m", "🕷️", "Animation"),
];

const catalogById = new Map(MOVIE_CATALOG.map((movie) => [movie.id, movie]));

export function getMovieById(id: string): Movie | undefined {
  return catalogById.get(id);
}

export function getMoviesByIds(ids: string[]): Movie[] {
  return ids.map((id) => catalogById.get(id)).filter((m): m is Movie => !!m);
}

/** Deterministic shuffle so every device in a room sees the same 8 movies */
export function getSessionMovies(seed: string, count = 8): Movie[] {
  const shuffled = [...MOVIE_CATALOG];
  let h = hashSeed(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

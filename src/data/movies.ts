export type Movie = {
  id: string;
  title: string;
  year: number;
  director: string;
  tagline: string;
  description: string;
  themes: string[];
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
  description: string,
  themes: string[],
  runtime: string,
  emoji: string,
  genre: string
): Movie {
  return { id, title, year, director, tagline, description, themes, runtime, emoji, genre };
}

/** Popular, widely-loved films — each session picks 8 at random from this pool */
export const MOVIE_CATALOG: Movie[] = [
  m("spirited-away", "Spirited Away", 2001, "Hayao Miyazaki", "A bathhouse of wonders awaits.",
    "A young girl enters a spirit world and works at a magical bathhouse to save her parents. A dreamy, emotional adventure full of strange creatures and quiet courage.",
    ["Coming of age", "Fantasy", "Family-friendly", "Whimsical"], "2h 5m", "🐉", "Animation"),
  m("inception", "Inception", 2010, "Christopher Nolan", "Your mind is the scene of the crime.",
    "Thieves plant ideas inside dreams within dreams. A puzzle-box heist that rewards attention and sparks debate long after the credits.",
    ["Mind-bending", "Heist", "Sci-fi", "High stakes"], "2h 28m", "🌀", "Sci-Fi"),
  m("grand-budapest", "The Grand Budapest Hotel", 2014, "Wes Anderson", "A murder. A mystery. A masterpiece.",
    "A legendary concierge and his protégé are swept into a caper involving stolen art and a family fortune. Stylized, witty, and endlessly quotable.",
    ["Dark comedy", "Mystery", "Stylized", "Ensemble cast"], "1h 39m", "🏨", "Comedy"),
  m("parasite", "Parasite", 2019, "Bong Joon-ho", "Act like you own the place.",
    "A poor family infiltrates a wealthy household with escalating consequences. Sharp social satire that shifts from comedy to thriller.",
    ["Social commentary", "Thriller", "Dark humor", "Twisty"], "2h 12m", "🏠", "Thriller"),
  m("back-to-future", "Back to the Future", 1985, "Robert Zemeckis", "Where we're going, we don't need roads.",
    "A teen accidentally travels to the 1950s and must make sure his parents fall in love. Pure fun, great chemistry, iconic soundtrack.",
    ["Time travel", "Adventure", "Feel-good", "Classic"], "1h 56m", "⚡", "Adventure"),
  m("la-la-land", "La La Land", 2016, "Damien Chazelle", "Here's to the ones who dream.",
    "An aspiring actress and a jazz musician fall in love while chasing careers in Los Angeles. Vibrant musical about dreams, love, and compromise.",
    ["Romance", "Musical", "Bittersweet", "Aspirational"], "2h 8m", "🎹", "Romance"),
  m("shawshank", "The Shawshank Redemption", 1994, "Frank Darabont", "Fear can hold you prisoner. Hope can set you free.",
    "Two inmates build a friendship over decades inside a brutal prison. A deeply moving story about resilience, dignity, and hope.",
    ["Drama", "Friendship", "Redemption", "Emotional"], "2h 22m", "🕊️", "Drama"),
  m("mad-max", "Mad Max: Fury Road", 2015, "George Miller", "What a lovely day.",
    "Furiosa and Max flee a tyrant across a desert wasteland in nonstop vehicular chaos. Visual storytelling at full throttle.",
    ["Action", "Post-apocalyptic", "Feminist icon", "Adrenaline"], "2h", "🔥", "Action"),
  m("everything-everywhere", "Everything Everywhere All at Once", 2022, "Daniels", "The universe is so much bigger than you realize.",
    "A laundromat owner is pulled into multiverse madness to save existence. Chaotic, heartfelt, and wildly original.",
    ["Multiverse", "Family", "Absurdist", "Emotional"], "2h 19m", "🥯", "Sci-Fi"),
  m("princess-bride", "The Princess Bride", 1987, "Rob Reiner", "As you wish.",
    "A classic fairy tale with pirates, giants, and true love, told as a story within a story. Charming and endlessly rewatchable.",
    ["Adventure", "Romance", "Comedy", "Fairy tale"], "1h 38m", "⚔️", "Adventure"),
  m("toy-story", "Toy Story", 1995, "John Lasseter", "The adventure takes off when toys come to life.",
    "Woody and Buzz navigate jealousy and friendship when a new toy arrives. The film that changed animation forever.",
    ["Family", "Friendship", "Nostalgia", "Heartwarming"], "1h 21m", "🤠", "Animation"),
  m("coco", "Coco", 2017, "Lee Unkrich", "The celebration of a lifetime.",
    "A boy travels to the Land of the Dead to uncover his family's history. Colorful, musical, and deeply touching.",
    ["Family", "Music", "Afterlife", "Emotional"], "1h 45m", "🎸", "Animation"),
  m("knives-out", "Knives Out", 2019, "Rian Johnson", "Hell, any of them could have done it.",
    "A famed detective investigates the death of a wealthy novelist as every relative looks guilty. Clever, funny, and satisfying.",
    ["Whodunit", "Satire", "Ensemble", "Twisty"], "2h 10m", "🔪", "Mystery"),
  m("jurassic-park", "Jurassic Park", 1993, "Steven Spielberg", "An adventure 65 million years in the making.",
    "Scientists clone dinosaurs for a theme park and chaos follows. Blockbuster spectacle with awe and terror in equal measure.",
    ["Adventure", "Sci-fi", "Survival", "Classic"], "2h 7m", "🦖", "Adventure"),
  m("amelie", "Amélie", 2001, "Jean-Pierre Jeunet", "She'll change your life.",
    "A shy Parisian waitress secretly improves strangers' lives while searching for love. Warm, quirky, and visually delightful.",
    ["Romance", "Whimsical", "Feel-good", "French"], "2h 2m", "🍒", "Romance"),
  m("dark-knight", "The Dark Knight", 2008, "Christopher Nolan", "Why so serious?",
    "Batman faces the Joker, an agent of chaos with no demands and no limits. Gritty, intense, and widely considered a superhero peak.",
    ["Superhero", "Crime", "Psychological", "Intense"], "2h 32m", "🃏", "Action"),
  m("groundhog-day", "Groundhog Day", 1993, "Harold Ramis", "The worst day of his life... over and over.",
    "A cynical weatherman relives the same day until he changes himself. Smart comedy with surprising philosophical depth.",
    ["Comedy", "Time loop", "Character growth", "Romance"], "1h 41m", "🐿️", "Comedy"),
  m("before-sunrise", "Before Sunrise", 1995, "Richard Linklater", "Can the greatest romance last only one night?",
    "Two strangers spend one night walking and talking through Vienna. Intimate, dialogue-driven, and quietly romantic.",
    ["Romance", "Dialogue-heavy", "Intimate", "Realistic"], "1h 41m", "🌅", "Romance"),
  m("pride-prejudice", "Pride & Prejudice", 2005, "Joe Wright", "The one you can't live without.",
    "Elizabeth Bennet and Mr. Darcy navigate pride, class, and misunderstanding in Regency England. Lush, witty, and romantic.",
    ["Romance", "Period drama", "Literary", "Classic"], "2h 9m", "💐", "Romance"),
  m("interstellar", "Interstellar", 2014, "Christopher Nolan", "Mankind was born on Earth. It was never meant to die here.",
    "Astronauts search for a new home as Earth dies, driven by love across time and space. Epic sci-fi with emotional weight.",
    ["Sci-fi", "Space", "Family", "Emotional"], "2h 49m", "🚀", "Sci-Fi"),
  m("get-out", "Get Out", 2017, "Jordan Peele", "Just because you're invited doesn't mean you're welcome.",
    "A young Black man visits his girlfriend's family estate and realizes something is deeply wrong. Horror with sharp social bite.",
    ["Horror", "Social commentary", "Suspense", "Satire"], "1h 44m", "🫖", "Horror"),
  m("whiplash", "Whiplash", 2014, "Damien Chazelle", "Not quite my tempo.",
    "A jazz drummer pushes himself to the breaking point under a ruthless instructor. Tense, electrifying, and unforgettable.",
    ["Drama", "Music", "Ambition", "Intense"], "1h 46m", "🥁", "Drama"),
  m("the-matrix", "The Matrix", 1999, "The Wachowskis", "Welcome to the real world.",
    "A hacker learns reality is a simulation and joins a rebellion. Groundbreaking action and big ideas about freedom and control.",
    ["Sci-fi", "Action", "Philosophical", "Cyberpunk"], "2h 16m", "💊", "Sci-Fi"),
  m("finding-nemo", "Finding Nemo", 2003, "Andrew Stanton", "There are 3.7 trillion fish in the ocean.",
    "A clownfish crosses the ocean to rescue his captured son. Funny, heartfelt, and perfect for all ages.",
    ["Family", "Adventure", "Father-son", "Feel-good"], "1h 40m", "🐠", "Animation"),
  m("superbad", "Superbad", 2007, "Greg Mottola", "Come and get some.",
    "Two high school friends try to score alcohol for a party on their last wild night together. Crude, hilarious, and oddly sweet.",
    ["Comedy", "Coming of age", "Buddy film", "Raunchy"], "1h 53m", "🎉", "Comedy"),
  m("21-jump-street", "21 Jump Street", 2012, "Phil Lord & Chris Miller", "The only thing getting blown is your mind.",
    "Undercover cops return to high school and embarrass themselves constantly. Self-aware comedy that never slows down.",
    ["Comedy", "Action", "Buddy cop", "Parody"], "1h 49m", "🚔", "Comedy"),
  m("barbie", "Barbie", 2023, "Greta Gerwig", "She's everything. He's just Ken.",
    "Barbie leaves Barbieland and questions identity, perfection, and what it means to be human. Bright, funny, surprisingly thoughtful.",
    ["Comedy", "Satire", "Fantasy", "Feminist"], "1h 54m", "💖", "Comedy"),
  m("oppenheimer", "Oppenheimer", 2023, "Christopher Nolan", "The world forever changes.",
    "The physicist who built the atomic bomb wrestles with genius, politics, and guilt. Dense, serious, and visually stunning.",
    ["Biography", "History", "Drama", "Intense"], "3h", "💣", "Drama"),
  m("dune", "Dune", 2021, "Denis Villeneuve", "Fear is the mind-killer.",
    "A noble family's son is drawn into desert politics, prophecy, and giant sandworms. Sweeping sci-fi epic with rich world-building.",
    ["Sci-fi", "Epic", "Political", "Coming of age"], "2h 35m", "🏜️", "Sci-Fi"),
  m("top-gun-maverick", "Top Gun: Maverick", 2022, "Joseph Kosinski", "Feel the need for speed.",
    "Maverick trains a new generation for an impossible mission. Crowd-pleasing action with genuine heart and jaw-dropping flight sequences.",
    ["Action", "Military", "Sequel", "Adrenaline"], "2h 11m", "✈️", "Action"),
  m("encanto", "Encanto", 2021, "Jared Bush", "The magic of the Encanto has blessed every child...",
    "A girl in a magical Colombian family discovers why she's the only one without a gift. Colorful, musical, and about belonging.",
    ["Family", "Musical", "Magic", "Emotional"], "1h 42m", "🦋", "Animation"),
  m("spider-verse", "Spider-Man: Into the Spider-Verse", 2018, "Peter Ramsey", "Anyone can wear the mask.",
    "Miles Morales becomes Spider-Man and teams up with versions from other dimensions. Visually groundbreaking and genuinely inspiring.",
    ["Superhero", "Animation", "Multiverse", "Coming of age"], "1h 57m", "🕷️", "Animation"),
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

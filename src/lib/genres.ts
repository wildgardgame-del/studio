
export const availableGenres = [
  "Action",
  "Action RPG",
  "Adventure",
  "Atmospheric",
  "Challenging",
  "Co-op",
  "Dark Fantasy",
  "Exploration",
  "Fantasy",
  "Fighting",
  "Horror",
  "Immersive",
  "Indie",
  "Multiplayer",
  "Mythology",
  "Open World",
  "Platformer",
  "Puzzle",
  "RPG",
  "Racing",
  "Shooter",
  "Simulation",
  "Souls-like",
  "Sports",
  "Story-Rich",
  "Strategy"
] as const;

export type Genre = typeof availableGenres[number];

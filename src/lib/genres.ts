
export const availableGenres = [
  "Action",
  "Adventure",
  "RPG",
  "Strategy",
  "Simulation",
  "Sports",
  "Racing",
  "Fighting",
  "Puzzle",
  "Platformer",
  "Shooter",
  "Horror",
  "Open World",
  "Indie",
  "Co-op",
  "Multiplayer"
] as const;

export type Genre = typeof availableGenres[number];

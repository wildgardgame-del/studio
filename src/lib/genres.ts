

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

export const availableTags = [
    "Single-player",
    "Multiplayer",
    "Co-op",
    "Local Co-op",
    "Online Co-op",
    "Controller Support",
    "Free to Play",
    "Early Access"
] as const;

export type Tag = typeof availableTags[number];

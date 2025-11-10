import type { Game } from './types';
import imageData from './placeholder-images.json';

export const games: Game[] = [
  {
    id: 'cosmic-rift',
    title: 'Cosmic Rift',
    description: 'Embark on an epic journey across the galaxy to seal the Cosmic Rift.',
    longDescription: 'Cosmic Rift is a single-player, story-driven action RPG where you play as the last pilot of the Star Alliance. A cataclysmic event has torn a hole in the fabric of spacetime, and you must traverse dangerous star systems, upgrade your ship, and battle alien factions to restore balance to the universe.',
    price: 59.99,
    genres: ['Sci-Fi', 'Action', 'RPG'],
    coverImage: imageData.placeholderImages[1].imageUrl,
    screenshots: [
      imageData.placeholderImages[2].imageUrl,
      imageData.placeholderImages[3].imageUrl,
    ],
    rating: 4.5,
    reviews: [
      { id: 1, author: 'GamerX1', text: 'Incredible visuals and tight controls!', rating: 5 },
      { id: 2, author: 'SpaceExplorer', text: 'A bit repetitive, but a solid sci-fi adventure.', rating: 4 },
    ],
  },
  {
    id: 'cyberpunk-samurai',
    title: 'Cyberpunk Samurai',
    description: 'Wield your katana in a neon-drenched city of the future.',
    longDescription: 'In the year 2099, you are a masterless samurai in the mega-city of Neo-Kyoto. Navigate corporate espionage, underground crime syndicates, and augment your body with cybernetics. Cyberpunk Samurai blends fast-paced melee combat with deep character customization and a branching narrative.',
    price: 49.99,
    genres: ['Cyberpunk', 'Action', 'Stealth'],
    coverImage: imageData.placeholderImages[4].imageUrl,
    screenshots: [
      imageData.placeholderImages[5].imageUrl,
      imageData.placeholderImages[6].imageUrl,
    ],
    rating: 4.8,
    reviews: [
      { id: 1, author: 'SynthWaveFan', text: 'The atmosphere is unmatched. A masterpiece!', rating: 5 },
      { id: 2, author: 'BladeRunner99', text: 'Combat is challenging and rewarding.', rating: 5 },
    ],
  },
  {
    id: 'oceans-whisper',
    title: "Ocean's Whisper",
    description: 'Uncover the secrets of a lost civilization beneath the waves.',
    longDescription: "Ocean's Whisper is a serene exploration and puzzle game. As a marine biologist, you discover a submersible that can withstand extreme pressures, allowing you to explore the deepest trenches of the ocean. Discover new species, decipher ancient murals, and uncover the truth about a society that thrived in the abyss.",
    price: 29.99,
    genres: ['Adventure', 'Puzzle', 'Exploration'],
    coverImage: imageData.placeholderImages[7].imageUrl,
    screenshots: [
      imageData.placeholderImages[8].imageUrl,
      imageData.placeholderImages[9].imageUrl,
    ],
    rating: 4.2,
    reviews: [
      { id: 1, author: 'DeepDive', text: 'A beautiful and relaxing experience.', rating: 5 },
      { id: 2, author: 'PuzzlerPro', text: 'Some puzzles are a bit obscure, but overall very enjoyable.', rating: 4 },
    ],
  },
  {
    id: 'void-racer',
    title: 'Void Racer',
    description: 'High-speed anti-gravity racing on perilous tracks.',
    longDescription: 'Get your adrenaline pumping with Void Racer, the fastest racing game in the galaxy. Compete in high-stakes tournaments on tracks suspended over futuristic cities and alien landscapes. Customize your vehicle, master drifting mechanics, and climb the leaderboards to become the ultimate Void Racer.',
    price: 39.99,
    genres: ['Racing', 'Sci-Fi', 'Sports'],
    coverImage: imageData.placeholderImages[10].imageUrl,
    screenshots: [
      imageData.placeholderImages[11].imageUrl,
      imageData.placeholderImages[12].imageUrl,
    ],
    rating: 4.6,
    reviews: [
      { id: 1, author: 'SpeedDemon', text: 'The sense of speed is insane!', rating: 5 },
      { id: 2, author: 'TrackMaster', text: 'Fun, but needs more tracks.', rating: 4 },
    ],
  },
  {
    id: 'forest-guardian',
    title: 'Forest Guardian',
    description: 'A whimsical adventure to protect an ancient, magical forest.',
    longDescription: 'Play as a young spirit chosen to be the Forest Guardian. A creeping corruption threatens to consume the woods and its inhabitants. Use your nature-based magic to heal the land, befriend fantastical creatures, and solve environmental puzzles in this charming and heartfelt adventure.',
    price: 19.99,
    genres: ['Adventure', 'Family-Friendly', 'Fantasy'],
    coverImage: imageData.placeholderImages[13].imageUrl,
    screenshots: [
      imageData.placeholderImages[14].imageUrl,
      imageData.placeholderImages[15].imageUrl,
    ],
    rating: 4.9,
    reviews: [
      { id: 1, author: 'CozyGamer', text: 'Absolutely adorable and so much fun to play.', rating: 5 },
      { id: 2, author: 'NatureLover', text: 'A wonderful message and beautiful art style.', rating: 5 },
    ],
  },
  {
    id: 'starfall',
    title: 'Starfall',
    description: 'Survive and build a new home on a mysterious alien world.',
    longDescription: 'After your colony ship crash-lands, you are one of the few survivors on a breathtaking but hostile alien planet. Starfall is a survival-crafting game with a deep story. Forage for resources, build a shelter, research alien technology, and uncover the secrets of the advanced civilization that once walked this world.',
    price: 44.99,
    genres: ['Survival', 'Crafting', 'Open World'],
    coverImage: imageData.placeholderImages[16].imageUrl,
    screenshots: [
      imageData.placeholderImages[17].imageUrl,
      imageData.placeholderImages[18].imageUrl,
    ],
    rating: 4.7,
    reviews: [
      { id: 1, author: 'BuilderBob', text: 'Best survival crafting game I have played in years.', rating: 5 },
      { id: 2, author: 'AlienHunter', text: 'The world is massive and full of secrets. I love it!', rating: 5 },
    ],
  },
];

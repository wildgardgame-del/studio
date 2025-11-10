export type Game = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  price: number;
  genres: string[];
  coverImage: string;
  screenshots: string[];
  rating: number;
  reviews: {
    id: number;
    author: string;
    text: string;
    rating: number;
  }[];
};

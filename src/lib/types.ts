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

export type DeveloperApplication = {
  // This type is now obsolete with the new purchase flow, but kept for reference
  // to avoid breaking changes in other parts of the app if it's referenced.
  id: string;
  userId: string;
  developerName: string;
  portfolio?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

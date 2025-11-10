export type Game = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
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
  status?: 'pending' | 'approved' | 'rejected';
  developerId?: string;
};

// This type is no longer used, but kept for reference to avoid breaking other parts of the app.
export type DeveloperApplication = {
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

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
  id: string;
  userId: string;
  developerName: string;
  portfolio?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: { // Made optional to handle older data that might not have it
    seconds: number;
    nanoseconds: number;
  };
}

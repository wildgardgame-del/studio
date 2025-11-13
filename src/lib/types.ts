
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
  rejectionReason?: string;
  developerId?: string;
  publisher?: string;
  websiteUrl?: string;
  trailerUrls?: string[];
  isAdultContent?: boolean;
  submittedAt?: {
    seconds: number;
    nanoseconds: number;
  };
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

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  type: 'game-status' | 'promotion' | 'system';
  link?: string;
};

export type AdminMessage = {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  subject: string;
  message: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  isRead: boolean;
};

export type Admin = {
  email: string;
  role: 'admin';
  addedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

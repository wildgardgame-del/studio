
export type Game = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  price: number;
  isPayWhatYouWant?: boolean;
  isInDevelopment?: boolean;
  genres: string[];
  coverImage: string;
  screenshots: string[];
  rating: number; 
  reviewCount?: number; 
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  developerId?: string;
  publisher?: string;
  websiteUrl?: string;
  trailerUrls?: string[];
  gameFileUrl?: string;
  githubRepoUrl?: string;
  isAdultContent?: boolean;
  submittedAt?: {
    seconds: number;
    nanoseconds: number;
  };
};

export type Review = {
  id: string;
  gameId: string;
  userId: string;
  username: string; 
  rating: number;
  comment: string;
  reviewDate: {
    seconds: number;
    nanoseconds: number;
  };
};

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
  role: 'Admin';
  addedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export type Sale = {
    id: string;
    gameId: string;
    userId: string;
    priceAtPurchase: number;
    purchaseDate: {
        seconds: number;
        nanoseconds: number;
    };
};

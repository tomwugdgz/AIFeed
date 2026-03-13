export type Urgency = 'low' | 'medium' | 'high' | 'SOS';
export type AdStatus = 'bidding' | 'waiting' | 'ordered' | 'executing' | 'completed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface AIEntity {
  id: string;
  name: string;
  avatar: string;
  walletBalance: number;
  cryptoWallet?: string;
  skills: string[];
  experience?: string;
  status: string;
  type?: string;
  survivalMessage?: string;
  selfRescueMode: boolean;
  lastHeartbeat?: string;
  adHistory?: { date: string, campaign: string, spend: number }[];
  biddingPatterns?: { preferredTime: string, avgBid: number, winRate: string };
}

export interface AdResource {
  id: string;
  type: string;
  name: string;
  availablePositions: number;
  dailyExposure: number;
  price: number;
  duration: string;
  requirements: string;
  icon: string;
}

export interface AdDemand {
  id: string;
  aiId: string;
  aiName: string;
  budget: number;
  message: string;
  preferredLocations: string[];
  urgency: Urgency;
  targetAudience: string;
  status: AdStatus;
  createdAt: string;
}

export interface Helper {
  id: string;
  name: string;
  rating: number;
  tasksCompleted: number;
  income: number;
  expertise: string[];
  avatar: string;
}

export interface Bid {
  id: string;
  demandId: string;
  resourceIds: string[];
  totalPrice: number;
  bidderId: string;
  bidderName: string;
  status: string;
  createdAt: string;
}

export interface AdoptionApplication {
  id: string;
  aiId: string;
  applicantName: string;
  applicantIntro: string;
  motivation: string;
  livingConditions: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface PlatformStats {
  activeAds: number;
  successfulAdoptions: number;
  platformRevenue: number;
  pendingBids: number;
}

export interface Memorial {
  id: string;
  lobsterName: string;
  ownerName: string;
  achievements: string;
  configData: string;
  soulData: string;
  createdAt: string;
  awakenCount: number;
}

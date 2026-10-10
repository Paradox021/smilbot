import { AxiosInstance, AxiosError } from 'axios';
import { api } from './api';
import { Card } from './cardService';
import { UserLuckStats } from './leaderboardService';

export { UserLuckStats };

export interface User {
  discordId: string;
  username: string;
  balance: number;
  cards: string[];
  lastDaily: string;
  dailyStreak?: number;
  maxDailyStreak?: number;
  previousMaxStreak?: number;
  totalDailiesClaimed?: number;
  totalCoinsEarned?: number;
  totalCoinsSpent?: number;
  cardsOpenedCount?: number;
}

/**
 * Extended user data including populated cards
 */
export interface UserWithCards {
  discordId: string;
  username: string;
  balance: number;
  cards: Card[];
  lastDaily: string;
  dailyStreak?: number;
  maxDailyStreak?: number;
  previousMaxStreak?: number;
  totalDailiesClaimed?: number;
  totalCoinsEarned?: number;
  totalCoinsSpent?: number;
  cardsOpenedCount?: number;
}

export interface UserPityStats {
  pullsSinceLastMythic: number;
  pityThreshold: number;
  pullsUntilGuaranteed: number;
  pityMythicsCount: number;
}

export interface UserStats {
  discordId: string;
  username: string;
  avatarUrl?: string | null;
  balance: number;
  dailyStreak: number;
  maxDailyStreak: number;
  previousMaxStreak?: number;
  totalDailiesClaimed: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  cardsCount: number;
  cardsOpenedCount: number;
  marketSalesCount: number;
  pity?: UserPityStats;
  luck?: UserLuckStats;
}

/**
 * Fields accepted by PATCH /user/:discordId/profile (at least one required).
 * `avatar` is the Discord avatar hash, or null when the user has no custom avatar.
 */
export interface UserProfileUpdate {
  username?: string;
  avatar?: string | null;
}

export interface UserProfile {
  discordId: string;
  username: string;
  avatar: string | null;
  avatarUrl: string | null;
}

export class UserService {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Gets or creates a user in the backend.
   * Corresponds to POST /user in the original implementation.
   */
  async createUser(user: { discordId: string; username: string }): Promise<void> {
    try {
      await this.http.post('/user', user);
    } catch (error) {
      // 409 = user already exists, which is a valid scenario
      if (error instanceof AxiosError && error.response?.status === 409) {
        return;
      }
      throw error;
    }
  }


  /**
   * Gets a user by their Discord ID
   * @param discordId Discord user ID
   * @returns User data
   */
  async getUser(discordId: string): Promise<User> {
    const { data } = await this.http.get<User>(`/user/${discordId}`);
    return data;
  }

  /**
   * Gets a user's cards with full card details
   * @param discordId Discord user ID
   * @returns User data with populated card objects
   */
  async getMyCards(discordId: string): Promise<UserWithCards | null> {
    try {
      const { data } = await this.http.get<UserWithCards>(`/user/${discordId}/cards`);
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Gets aggregated statistics for a user
   * @param discordId Discord user ID
   * @returns User stats
   */
  async getUserStats(discordId: string): Promise<UserStats> {
    const { data } = await this.http.get<UserStats>(`/user/${discordId}/stats`);
    return data;
  }

  /**
   * Syncs the user's Discord profile (username and/or avatar hash) into the backend.
   * Bot-only endpoint: PATCH /user/:discordId/profile
   * @param discordId Discord user ID
   * @param profile Fields to update (at least one)
   * @returns Updated profile as stored by the backend
   */
  async updateProfile(discordId: string, profile: UserProfileUpdate): Promise<UserProfile> {
    const { data } = await this.http.patch<UserProfile>(`/user/${discordId}/profile`, profile);
    return data;
  }
}

export const userService = new UserService(api);

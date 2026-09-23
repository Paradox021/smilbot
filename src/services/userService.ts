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
}

export const userService = new UserService(api);

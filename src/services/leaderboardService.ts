import { AxiosInstance } from 'axios';
import { api } from './api';

export type LuckTierCode = 'GODLY' | 'LUCKY' | 'AVERAGE' | 'UNLUCKY' | 'CURSED';

export interface RarityBreakdown {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  mythic: number;
  pityMythics?: number;
}

export interface UserLuckStats {
  totalCards: number;
  luckPercentage: number;
  luckDelta: string;
  tier: string;
  tierCode: LuckTierCode;
  eligibleForLeaderboard: boolean;
  pityMythicsCount?: number;
  breakdown: RarityBreakdown;
}

export interface LuckLeaderboardItem {
  rank: number;
  discordId: string;
  username: string;
  totalCards: number;
  luckPercentage: number;
  luckDelta: string;
  tier: string;
  tierCode: LuckTierCode;
  breakdown: RarityBreakdown;
}

export interface LuckLeaderboardResponse {
  order: 'asc' | 'desc';
  minPulls: number;
  leaderboard: LuckLeaderboardItem[];
}

export interface GetLuckLeaderboardOptions {
  order?: 'asc' | 'desc';
  minPulls?: number;
  limit?: number;
}

export class LeaderboardService {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Fetches the gacha luck leaderboard from backend API
   */
  async getLuckLeaderboard(options: GetLuckLeaderboardOptions = {}): Promise<LuckLeaderboardResponse> {
    const { order = 'desc', minPulls = 20, limit = 5 } = options;
    const { data } = await this.http.get<LuckLeaderboardResponse>('/leaderboard/luck', {
      params: {
        order,
        minPulls,
        limit,
      },
    });
    return data;
  }
}

export const leaderboardService = new LeaderboardService(api);

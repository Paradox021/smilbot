import { AxiosError, AxiosInstance } from 'axios';
import { api } from './api';

export type StreakRestoreReason =
  | 'NO_LOST_STREAK'
  | 'RESTORE_EXPIRED'
  | 'CLAIM_DAILY_FIRST'
  | 'RESTORE_COOLDOWN'
  | 'INSUFFICIENT_BALANCE';

/** Whether the lost streak can be restored and on what terms (GET /user/:id/streak/restore). */
export interface StreakRestoreQuote {
  available: boolean;
  reason: StreakRestoreReason | null;
  currentStreak: number;
  balance: number;
  // Absent when reason is NO_LOST_STREAK
  lostStreak?: number;
  restoredStreak?: number;
  cost?: number;
  streakLostAt?: string;
  expiresAt?: string;
  nextRestoreAt?: string | null;
}

export interface StreakRestoreResult {
  ok: true;
  lostStreak: number;
  dailyStreak: number;
  maxDailyStreak: number;
  cost: number;
  balance: number;
  streakExpiresAt: string | null;
}

/** Restore rejected by the backend: 400 carries the reason and the quote, 409 a concurrent change. */
export class StreakRestoreError extends Error {
  constructor(
    readonly code: StreakRestoreReason | 'STREAK_RESTORE_CONFLICT' | 'UNKNOWN',
    readonly quote?: StreakRestoreQuote
  ) {
    super(code);
  }
}

export interface ClaimResponse {
  ok: boolean;
  balance?: number;
  dailyStreak?: number;
  previousStreak?: number;
  maxDailyStreak?: number;
  previousMaxStreak?: number;
  isNewRecord?: boolean;
  totalDailiesClaimed?: number;
  /** Only when this claim broke the streak */
  streakRestore?: StreakRestoreQuote | null;
  error?: string;
}

export class EconomyService {
  constructor(private readonly http: AxiosInstance) {}

  async claimDailyBalance(discordId: string): Promise<ClaimResponse> {
    try {
      const { data } = await this.http.post<ClaimResponse>(`/user/${discordId}/dailyBalance`);
      return {
        ok: true,
        balance: data.balance,
        dailyStreak: data.dailyStreak,
        previousStreak: data.previousStreak,
        maxDailyStreak: data.maxDailyStreak,
        previousMaxStreak: data.previousMaxStreak,
        isNewRecord: data.isNewRecord,
        totalDailiesClaimed: data.totalDailiesClaimed,
        streakRestore: data.streakRestore ?? null,
      };
    } catch (err: any) {
      console.error('[EconomyService] claimDailyBalance error:', err.response?.data?.error || err.message);
      const errorMessage = err.response?.data?.error || 'Unexpected error while claiming daily balance.';
      return { ok: false, error: errorMessage };
    }
  }

  async getStreakRestore(discordId: string): Promise<StreakRestoreQuote> {
    const { data } = await this.http.get<StreakRestoreQuote>(`/user/${discordId}/streak/restore`);
    return data;
  }

  /** Pays and restores the lost streak. Throws StreakRestoreError when the backend refuses it. */
  async restoreStreak(discordId: string): Promise<StreakRestoreResult> {
    try {
      const { data } = await this.http.post<StreakRestoreResult>(`/user/${discordId}/streak/restore`);
      return data;
    } catch (err) {
      const body = err instanceof AxiosError ? err.response?.data : undefined;
      if (body && typeof body.code === 'string') {
        const { error: _error, code, ...quote } = body;
        throw new StreakRestoreError(code, quote as StreakRestoreQuote);
      }
      console.error('[EconomyService] restoreStreak error:', body?.error || (err as Error).message);
      throw new StreakRestoreError('UNKNOWN');
    }
  }
}

export const economyService = new EconomyService(api);
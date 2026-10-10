import { AxiosInstance, AxiosError } from 'axios';
import { api } from './api';
import { Card } from './cardService';

export type MarketOfferStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED';

/**
 * Market offer as returned by GET /market/:serverId/offers(/:offerId)
 */
export interface MarketOffer {
  _id: string;
  seller: {
    _id: string;
    discordId: string;
    username: string;
  };
  cardId: Card;
  price: number;
  serverId: string;
  status?: MarketOfferStatus;
}

/**
 * Discord user acting on the market. The backend creates the user if it does not exist,
 * so the username is always sent.
 */
export interface MarketActor {
  discordId: string;
  username: string;
}

export interface AddOfferParams extends MarketActor {
  serverId: string;
  cardId: string;
  price: number;
}

export interface OfferActionParams extends MarketActor {
  serverId: string;
  offerId: string;
}

/**
 * Market service for managing card offers
 */
export class MarketService {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Gets all active offers for a server
   */
  async getAllOffers(serverId: string): Promise<MarketOffer[]> {
    const { data } = await this.http.get<MarketOffer[]>(`/market/${serverId}/offers`);
    return data;
  }

  /**
   * Gets a specific offer (any status). Returns null if it does not exist.
   */
  async getOfferById(serverId: string, offerId: string): Promise<MarketOffer | null> {
    try {
      const { data } = await this.http.get<MarketOffer>(`/market/${serverId}/offers/${offerId}`);
      return data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) return null;
      throw error;
    }
  }

  /**
   * Publishes a card from the seller's inventory. The card is held until it is sold or cancelled.
   */
  async addOffer({ serverId, discordId, username, cardId, price }: AddOfferParams): Promise<MarketOffer> {
    const { data } = await this.http.post<MarketOffer>(`/market/${serverId}/offers`, {
      discordId,
      username,
      cardId,
      price,
    });
    return data;
  }

  /**
   * Buys an active offer
   */
  async buyOffer({ serverId, offerId, discordId, username }: OfferActionParams): Promise<void> {
    await this.http.post(`/market/${serverId}/offers/${offerId}/buy`, { discordId, username });
  }

  /**
   * Cancels an active offer of the seller and returns the card to their inventory
   */
  async removeOffer({ serverId, offerId, discordId, username }: OfferActionParams): Promise<void> {
    await this.http.delete(`/market/${serverId}/offers/${offerId}`, {
      data: { discordId, username },
    });
  }
}

/**
 * Extracts the error message sent by the backend ({ error }) or a fallback
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const backendError = (error.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof backendError === 'string') return backendError;
  }
  return fallback;
}

export const marketService = new MarketService(api);

import { AxiosInstance } from 'axios';
import { api } from './api';
import { CardType } from '@/types/CardType';

export interface Card {
  _id: string;
  name: string;
  type: CardType;
  description: string;
  author: string;
  imageUrl: string;
}

export interface CreateCardData {
  name: string;
  type: string;
  description: string;
  author: string;
}

export class CardService {
  constructor(private readonly http: AxiosInstance) {}

  async buyRandomCard(discordId: string): Promise<Card> {
    const { data } = await this.http.post<Card>(`/user/${discordId}/card/random`);
    return data;
  }

  async getAllCards(): Promise<Card[]> {
    const { data } = await this.http.get<Card[]>('/card');
    return data;
  }

  async createCard(
    cardData: CreateCardData,
    imageBuffer: Buffer,
    fileName = 'card.png'
  ): Promise<Card> {
    const formData = new FormData();
    formData.append('image', new Blob([new Uint8Array(imageBuffer)]), fileName);
    formData.append('data', JSON.stringify(cardData));

    const { data } = await this.http.post<Card>('/card', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return data;
  }
}

export const cardService = new CardService(api);

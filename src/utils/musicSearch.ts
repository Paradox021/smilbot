import { Message } from 'discord.js';
import { Track } from 'discord-player';
import { createTextEmbed } from '@/components/embeds';

/** Seconds a `.search` result stays selectable */
export const SEARCH_EXPIRY_SECONDS = 60;

interface PendingSearch {
  ownerId: string;
  tracks: Track[];
  timeout: NodeJS.Timeout;
}

/**
 * `.search` results waiting for the user to choose, by message id.
 * They live in memory: if the bot restarts, old menus just say the search expired.
 */
const pendingSearches = new Map<string, PendingSearch>();

/**
 * Stores the results of a search message. When it expires, the menu is removed from the message.
 */
export function savePendingSearch(message: Message, ownerId: string, tracks: Track[]): void {
  const timeout = setTimeout(() => {
    pendingSearches.delete(message.id);
    message
      .edit({ embeds: [createTextEmbed(0x5A5F66, '🔎 Search expired. Use `.search` again.')], components: [] })
      .catch(() => {});
  }, SEARCH_EXPIRY_SECONDS * 1000);
  timeout.unref();
  pendingSearches.set(message.id, { ownerId, tracks, timeout });
}

/** Returns the pending search of a message without removing it */
export function getPendingSearch(messageId: string): PendingSearch | undefined {
  return pendingSearches.get(messageId);
}

/** Removes a pending search (chosen or cancelled) and stops its expiry timer */
export function clearPendingSearch(messageId: string): void {
  const pending = pendingSearches.get(messageId);
  if (!pending) return;
  clearTimeout(pending.timeout);
  pendingSearches.delete(messageId);
}

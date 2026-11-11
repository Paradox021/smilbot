// src/events/player/queueDelete.ts
import { PlayerEvent } from '@/types/PlayerEvent';
import { FINISHED_LABELS, MusicQueue, finalizeNowPlayingMessage } from '@/utils/musicQueue';

/**
 * Emitted when the queue is destroyed (.stop, stop button, or the bot leaves the channel):
 * the "Now playing" message (if a song was still playing) becomes a "Stopped" message.
 * If the queue had already ended, the message was finalized as "Played" in emptyQueue.
 */
export const queueDelete: PlayerEvent = {
  name: 'queueDelete',
  execute: async (queue: MusicQueue) => {
    await finalizeNowPlayingMessage(queue, FINISHED_LABELS.stopped);
  },
};

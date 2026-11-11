// src/events/player/emptyQueue.ts
import { PlayerEvent } from '@/types/PlayerEvent';
import { createTextEmbed } from '@/components/embeds';
import { MusicQueue, finalizeNowPlayingMessage } from '@/utils/musicQueue';
import { LEAVE_ON_END_COOLDOWN_MS } from '@/utils/musicOptions';

export const emptyQueue: PlayerEvent = {
  name: 'emptyQueue',
  execute: async (queue: MusicQueue) => {
    await finalizeNowPlayingMessage(queue);
    const minutes = Math.round(LEAVE_ON_END_COOLDOWN_MS / 60_000);
    await queue.metadata?.channel?.send({
      embeds: [createTextEmbed(0x85C734, `No more songs in queue. I'll leave in ${minutes} minute${minutes === 1 ? '' : 's'} unless you add more with \`.play\`.`)],
    }).catch(() => {});
  },
};

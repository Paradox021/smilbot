// src/events/player/playerPauseResume.ts
import { PlayerEvent } from '@/types/PlayerEvent';
import { MusicQueue, refreshNowPlayingMessage } from '@/utils/musicQueue';

/**
 * Pause/resume (from a command or a button): refresh the "Now playing" message so it shows
 * "Paused at m:ss" while paused and a correct end time after resuming.
 */
export const playerPause: PlayerEvent = {
  name: 'playerPause',
  execute: async (queue: MusicQueue) => {
    await refreshNowPlayingMessage(queue);
  },
};

export const playerResume: PlayerEvent = {
  name: 'playerResume',
  execute: async (queue: MusicQueue) => {
    await refreshNowPlayingMessage(queue);
  },
};

// src/events/player/playerStart.ts
import { PlayerEvent } from '@/types/PlayerEvent';
import { Track } from 'discord-player';
import { createNowPlayingEmbed } from '@/components/embeds';
import { createMusicControlButtons } from '@/components/buttons';
import { musicLog } from '@/utils/musicDebug';
import { MusicQueue, finalizeNowPlayingMessage } from '@/utils/musicQueue';

/**
 * Sends the "Now playing" message with the player buttons.
 * Only the latest message is "live"; the previous one becomes a "Played/Skipped" message.
 */
export const playerStart: PlayerEvent = {
  name: 'playerStart',
  execute: async (queue: MusicQueue, track: Track) => {
    musicLog(`playerStart: ${track.title} (audio is now being sent to Discord)`);
    if (!queue.metadata?.channel) return;

    // La canción anterior ya no suena: su mensaje pasa a "Played" / "Skipped".
    await finalizeNowPlayingMessage(queue);
    try {
      queue.metadata.nowPlayingMessage = await queue.metadata.channel.send({
        embeds: [createNowPlayingEmbed(queue, track)],
        components: [createMusicControlButtons(queue)],
      });
      queue.metadata.nowPlayingTrack = track;
    } catch (err) {
      console.error('Could not send the now playing message:', err);
    }
  },
};

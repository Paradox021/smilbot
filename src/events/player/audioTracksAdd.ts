// src/events/player/audioTracksAdd.ts
import { PlayerEvent } from '@/types/PlayerEvent';
import { Track } from 'discord-player';
import { createTextEmbed } from '@/components/embeds';
import { MusicQueue, refreshNowPlayingMessage } from '@/utils/musicQueue';

/**
 * Emitted when several songs are added at once (a playlist)
 */
export const audioTracksAdd: PlayerEvent = {
  name: 'audioTracksAdd',
  execute: async (queue: MusicQueue, tracks: Track[]) => {
    const playlist = tracks[0]?.playlist;
    const source = playlist ? ` from [${playlist.title.replace(/[[\]]/g, '')}](${playlist.url})` : '';
    await queue.metadata?.channel?.send({
      embeds: [createTextEmbed(0x85C734, `📃 Added **${tracks.length} songs**${source} to the queue.`)],
    }).catch(() => {});
    await refreshNowPlayingMessage(queue); // "Up next" cambia
  },
};

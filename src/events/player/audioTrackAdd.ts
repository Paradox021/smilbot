// src/events/player/audioTrackAdd.ts
import { PlayerEvent } from '@/types/PlayerEvent';
import { Track } from 'discord-player';
import { createSongEmbed } from '@/components/embeds';
import { MusicQueue, refreshNowPlayingMessage } from '@/utils/musicQueue';

export const audioTrackAdd: PlayerEvent = {
  name: 'audioTrackAdd',
  execute: async (queue: MusicQueue, track: Track) => {
    // Si no suena nada, esta canción empieza ya y el mensaje "Now playing" basta.
    if (!queue.currentTrack) return;

    const embed = createSongEmbed(0x85C734, `Song added to queue (#${queue.tracks.size})`, track);
    await queue.metadata?.channel?.send({ embeds: [embed] }).catch(() => {});
    await refreshNowPlayingMessage(queue); // "Up next" cambia
  },
};

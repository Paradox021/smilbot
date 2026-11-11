// src/events/player/playerError.ts
import { PlayerEvent } from '@/types/PlayerEvent';
import { GuildQueue, Track } from 'discord-player';
import { createTextEmbed } from '@/components/embeds';

/**
 * Se emite cuando falla la reproducción de una canción concreta (p. ej. yt-dlp no puede obtener el audio).
 * discord-player salta a la siguiente canción de la cola.
 */
export const playerError: PlayerEvent = {
  name: 'playerError',
  execute: (queue: GuildQueue<{ channel: any }>, error: Error, track: Track) => {
    console.error(`Playback error in ${queue.guild.name} (${track.url}):`, error);
    queue.metadata?.channel?.send({
      embeds: [createTextEmbed(0xFF0000, `Could not play **${track.title}**, skipping it.`)],
    });
  },
};

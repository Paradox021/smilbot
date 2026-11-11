// src/events/player/playerStart.ts
import { PlayerEvent } from '@/types/PlayerEvent';
import { GuildQueue, Track } from 'discord-player';
import { createSongEmbed } from '@/components/embeds';
import { musicLog } from '@/utils/musicDebug';

export const playerStart: PlayerEvent = {
  name: 'playerStart',
  execute: (queue: GuildQueue<{ channel: any }>, track: Track) => {
    musicLog(`playerStart: ${track.title} (audio is now being sent to Discord)`);
    queue.metadata?.channel?.send({ embeds: [createSongEmbed(0x00569D, 'Now playing', track)] });
  },
};

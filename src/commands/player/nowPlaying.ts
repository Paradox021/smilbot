import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createNowPlayingEmbed, createTextEmbed } from '@/components/embeds';
import { createMusicControlButtons } from '@/components/buttons';
import { MusicQueueMetadata } from '@/types/MusicQueueMetadata';
import { sendMusicReply, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { canSendMessages } from '@/utils/typeGuards';

/**
 * Command to show the current song with its progress and the player buttons.
 * Anyone can look; the buttons check that whoever presses them is in the voice channel.
 */
export const nowPlaying: Command = {
  name: 'nowplaying',
  aliases: ['np', 'current'],
  description: 'Shows the current song with its progress and the player buttons',
  usage: '.nowplaying',
  examples: ['.np'],
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = message.guildId ? client.player.nodes.get<MusicQueueMetadata>(message.guildId) : null;
    if (!queue || !queue.currentTrack) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'Nothing is playing right now.'));
      return;
    }
    if (!canSendMessages(message.channel)) return;

    // Solo un mensaje "Now playing" a la vez: el anterior es de la misma canción, así que se borra.
    const previous = queue.metadata?.nowPlayingMessage;
    const sent = await message.channel.send({
      embeds: [createNowPlayingEmbed(queue)],
      components: [createMusicControlButtons(queue)],
    });
    if (queue.metadata) {
      queue.metadata.nowPlayingMessage = sent;
      queue.metadata.nowPlayingTrack = queue.currentTrack;
    }
    await previous?.delete().catch(() => {});
    await message.delete().catch(() => {});
  },
};

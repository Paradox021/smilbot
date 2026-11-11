import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { getControllableQueue, refreshNowPlayingMessage, sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { shuffleQueue } from '@/utils/musicActions';

/**
 * Command to shuffle the upcoming songs
 */
export const shuffle: Command = {
  name: 'shuffle',
  aliases: ['mix'],
  description: 'Shuffles the songs in the queue',
  usage: '.shuffle',
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = await getControllableQueue(message, client);
    if (!queue) return;

    const count = shuffleQueue(queue);
    if (count === 0) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'There are not enough songs in the queue to shuffle.'));
      return;
    }

    await refreshNowPlayingMessage(queue);
    await sendMusicReply(message, createTextEmbed(MUSIC_COLOR, `🔀 ${message.author} shuffled ${count} songs.`));
  },
};

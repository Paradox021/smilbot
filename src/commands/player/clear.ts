import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { getControllableQueue, refreshNowPlayingMessage, sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';

/**
 * Command to remove all upcoming songs, keeping the current one playing
 */
export const clear: Command = {
  name: 'clear',
  aliases: ['clearqueue'],
  description: 'Removes all songs from the queue (the current song keeps playing)',
  usage: '.clear',
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = await getControllableQueue(message, client);
    if (!queue) return;

    const count = queue.tracks.size;
    if (count === 0) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'The queue is already empty.'));
      return;
    }

    queue.tracks.clear();
    await refreshNowPlayingMessage(queue);
    await sendMusicReply(message, createTextEmbed(MUSIC_COLOR, `🧹 ${message.author} cleared ${count} song${count === 1 ? '' : 's'} from the queue.`));
  },
};

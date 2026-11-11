import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed, trackLink } from '@/components/embeds';
import { getControllableQueue, refreshNowPlayingMessage, sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';

/**
 * Command to remove a song from the queue by its position (as shown in .queue)
 */
export const remove: Command = {
  name: 'remove',
  aliases: ['rm'],
  description: 'Removes a song from the queue by its number in `.queue`',
  usage: '.remove <number>',
  examples: ['.remove 3'],
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = await getControllableQueue(message, client);
    if (!queue) return;

    const position = Number(args[0]);
    const size = queue.tracks.size;
    if (size === 0) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'There are no songs in the queue to remove.'));
      return;
    }
    if (!Number.isInteger(position) || position < 1 || position > size) {
      await sendMusicReply(
        message,
        createTextEmbed(MUSIC_ERROR_COLOR, `Give a song number between 1 and ${size}. Check the numbers with \`.queue\`.`),
      );
      return;
    }

    const removed = queue.removeTrack(position - 1);
    if (!removed) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'Could not remove that song.'));
      return;
    }

    await refreshNowPlayingMessage(queue);
    await sendMusicReply(message, createTextEmbed(MUSIC_COLOR, `🗑️ ${message.author} removed ${trackLink(removed)} from the queue.`));
  },
};

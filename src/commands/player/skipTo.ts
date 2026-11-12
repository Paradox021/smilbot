import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed, trackLink } from '@/components/embeds';
import { getControllableQueue, sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { skipToTrack } from '@/utils/musicActions';

/**
 * Command to jump to a song of the queue by its number in `.queue`, dropping the songs before it
 */
export const skipTo: Command = {
  name: 'skipto',
  aliases: ['jump'],
  description: 'Jumps to a song of the queue by its number in `.queue` (the songs before it are removed)',
  usage: '.skipto <number>',
  examples: ['.skipto 3'],
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = await getControllableQueue(message, client);
    if (!queue) return;

    const result = skipToTrack(queue, Number(args[0]));
    if (!result.ok) {
      const text = result.reason === 'empty'
        ? 'There are no songs in the queue to jump to.'
        : `Give a song number between 1 and ${queue.tracks.size}. Check the numbers with \`.queue\`.`;
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, text));
      return;
    }

    const skippedNote = result.skippedCount > 0
      ? ` (${result.skippedCount} song${result.skippedCount === 1 ? '' : 's'} removed from the queue)`
      : '';
    const loopNote = result.loopDisabled ? '\n*Song loop was turned off.*' : '';
    await sendMusicReply(
      message,
      createTextEmbed(MUSIC_COLOR, `⏩ ${message.author} jumped to ${trackLink(result.target)}${skippedNote}${loopNote}`),
    );
  },
};

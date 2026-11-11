import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed, trackLink } from '@/components/embeds';
import { getControllableQueue, sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { NO_NEXT_TRACK_MESSAGE, skipTrack } from '@/utils/musicActions';

/**
 * Command to skip the current song
 */
export const skip: Command = {
  name: 'skip',
  aliases: ['s', 'next'],
  description: 'Skips the current song',
  usage: '.skip',
  examples: ['.skip', '.s'],
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = await getControllableQueue(message, client);
    if (!queue) return;

    const result = skipTrack(queue);
    if (!result.ok) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, NO_NEXT_TRACK_MESSAGE));
      return;
    }

    const loopNote = result.loopDisabled ? '\n*Song loop was turned off.*' : '';
    await sendMusicReply(
      message,
      createTextEmbed(MUSIC_COLOR, `⏭️ ${message.author} skipped ${result.skipped ? trackLink(result.skipped) : 'the song'}${loopNote}`),
    );
  },
};

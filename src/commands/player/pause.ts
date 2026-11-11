import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { getControllableQueue, sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';

/**
 * Command to pause the current song
 */
export const pause: Command = {
  name: 'pause',
  description: 'Pauses the current song',
  usage: '.pause',
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = await getControllableQueue(message, client);
    if (!queue) return;

    if (queue.node.isPaused()) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'The music is already paused. Use `.resume` to continue.'));
      return;
    }

    queue.node.pause();
    await sendMusicReply(message, createTextEmbed(MUSIC_COLOR, `⏸️ ${message.author} paused the music.`));
  },
};

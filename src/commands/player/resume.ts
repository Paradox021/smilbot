import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { getControllableQueue, sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';

/**
 * Command to resume a paused song
 */
export const resume: Command = {
  name: 'resume',
  aliases: ['unpause'],
  description: 'Resumes the paused song',
  usage: '.resume',
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = await getControllableQueue(message, client);
    if (!queue) return;

    if (!queue.node.isPaused()) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'The music is not paused.'));
      return;
    }

    queue.node.resume();
    await sendMusicReply(message, createTextEmbed(MUSIC_COLOR, `▶️ ${message.author} resumed the music.`));
  },
};

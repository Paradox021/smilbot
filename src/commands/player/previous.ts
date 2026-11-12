import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed, trackLink } from '@/components/embeds';
import { getControllableQueue, sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { goToPreviousTrack } from '@/utils/musicActions';

/**
 * Command to play the previous song again (the current one goes back to the front of the queue)
 */
export const previous: Command = {
  name: 'previous',
  aliases: ['back', 'prev'],
  description: 'Plays the previous song again. The current song goes back to the front of the queue',
  usage: '.previous',
  examples: ['.back'],
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = await getControllableQueue(message, client);
    if (!queue) return;

    try {
      const track = await goToPreviousTrack(queue);
      if (!track) {
        await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'There is no previous song yet.'));
        return;
      }
      await sendMusicReply(message, createTextEmbed(MUSIC_COLOR, `⏮️ ${message.author} went back to ${trackLink(track)}`));
    } catch (e: unknown) {
      console.error('Error in .previous:', e);
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'Could not go back to the previous song.'));
    }
  },
};

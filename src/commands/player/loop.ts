import { Client, Message } from 'discord.js';
import { QueueRepeatMode } from 'discord-player';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { getControllableQueue, refreshNowPlayingMessage, sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { repeatModeLabel } from '@/utils/musicFormat';
import { setLoop } from '@/utils/musicActions';

const MODES: Record<string, QueueRepeatMode> = {
  off: QueueRepeatMode.OFF,
  song: QueueRepeatMode.TRACK,
  track: QueueRepeatMode.TRACK,
  queue: QueueRepeatMode.QUEUE,
  all: QueueRepeatMode.QUEUE,
};

/**
 * Command to repeat the current song or the whole queue
 */
export const loop: Command = {
  name: 'loop',
  aliases: ['repeat'],
  description: 'Repeats the current song or the whole queue. Without a mode it cycles off → song → queue',
  usage: '.loop [off|song|queue]',
  examples: ['.loop', '.loop song', '.loop queue', '.loop off'],
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const queue = await getControllableQueue(message, client);
    if (!queue) return;

    const arg = args[0]?.toLowerCase();
    if (arg && !(arg in MODES)) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'Unknown mode. Use `.loop off`, `.loop song` or `.loop queue`.'));
      return;
    }

    const mode = setLoop(queue, arg ? MODES[arg] : undefined);
    const text = mode === QueueRepeatMode.OFF
      ? `${message.author} turned the loop off.`
      : `${message.author} set the loop to **${repeatModeLabel(mode)}**.`;
    await refreshNowPlayingMessage(queue);
    await sendMusicReply(message, createTextEmbed(MUSIC_COLOR, text));
  },
};

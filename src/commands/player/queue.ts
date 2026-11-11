import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createQueueEmbed, createTextEmbed } from '@/components/embeds';
import { createQueueButtons } from '@/components/buttons';
import { createPaginationState } from '@/components/pagination';
import { MusicQueueMetadata } from '@/types/MusicQueueMetadata';
import { sendMusicReply, MUSIC_ERROR_COLOR, QUEUE_ITEMS_PER_PAGE } from '@/utils/musicQueue';
import { canSendMessages } from '@/utils/typeGuards';

/**
 * Command to show the current song and the upcoming songs, paginated
 */
export const queue: Command = {
  name: 'queue',
  aliases: ['q', 'list'],
  description: 'Shows the songs in the queue',
  usage: '.queue',
  examples: ['.q'],
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    const guildQueue = message.guildId ? client.player.nodes.get<MusicQueueMetadata>(message.guildId) : null;
    if (!guildQueue || !guildQueue.currentTrack) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'Nothing is playing right now.'));
      return;
    }
    if (!canSendMessages(message.channel)) return;

    const state = createPaginationState(guildQueue.tracks.toArray(), QUEUE_ITEMS_PER_PAGE);
    await message.channel.send({
      embeds: [createQueueEmbed(guildQueue, state)],
      components: createQueueButtons(state),
    });
    await message.delete().catch(() => {});
  },
};

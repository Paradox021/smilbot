import { Client, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createSearchResultsEmbed, createTextEmbed } from '@/components/embeds';
import { createSearchComponents } from '@/components/buttons';
import { sendMusicReply, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { resolvePlaybackChannel } from '@/utils/musicPlay';
import { SEARCH_EXPIRY_SECONDS, savePendingSearch } from '@/utils/musicSearch';

const MAX_RESULTS = 5;

/**
 * Command to search YouTube and choose which result to play from a menu
 */
export const search: Command = {
  name: 'search',
  aliases: ['find'],
  description: 'Searches YouTube and lets you choose which result to play',
  usage: '.search <text>',
  examples: ['.search glimpse of us'],
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    if (!message.channel.isSendable()) return;

    // Se comprueba antes de buscar para no hacer esperar a quien no puede reproducir.
    const target = resolvePlaybackChannel(message.member, client, message.guildId);
    if ('error' in target) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, `${message.author} ${target.error}`));
      return;
    }

    const query = args.join(' ').trim();
    if (!query) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'Write what to search, e.g. `.search glimpse of us`.'));
      return;
    }

    try {
      await message.channel.sendTyping().catch(() => {});
      const result = await client.player.search(query, { requestedBy: message.author });
      const tracks = result.tracks.slice(0, MAX_RESULTS);
      if (tracks.length === 0) {
        await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, `No results for **${query}**.`));
        return;
      }

      const sent = await message.channel.send({
        embeds: [createSearchResultsEmbed(query, tracks, SEARCH_EXPIRY_SECONDS)],
        components: createSearchComponents(tracks, message.author.id),
      });
      savePendingSearch(sent, message.author.id, tracks);
      await message.delete().catch(() => {});
    } catch (e: unknown) {
      console.error('Error in .search:', e);
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'An error occurred while searching.'));
    }
  },
};

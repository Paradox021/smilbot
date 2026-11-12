import { Client, EmbedBuilder, Message } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { MusicQueueMetadata } from '@/types/MusicQueueMetadata';
import { sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { findLyricsByQuery, findLyricsForTrack, splitLyrics } from '@/utils/lyrics';
import { canSendMessages } from '@/utils/typeGuards';

/** Max messages to send for very long lyrics */
const MAX_LYRICS_MESSAGES = 3;

/**
 * Command to show the lyrics of the current song, or of any song by name
 */
export const lyrics: Command = {
  name: 'lyrics',
  aliases: ['ly', 'letra'],
  description: 'Shows the lyrics of the current song, or of the song you write',
  usage: '.lyrics [song name]',
  examples: ['.lyrics', '.lyrics bohemian rhapsody queen'],
  categories: [CommandCategory.PLAYER],
  async execute(message: Message, args: string[], client: Client) {
    if (!canSendMessages(message.channel)) return;

    const query = args.join(' ').trim();
    const queue = message.guildId ? client.player.nodes.get<MusicQueueMetadata>(message.guildId) : null;
    const track = queue?.currentTrack;

    if (!query && !track) {
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'Nothing is playing. Use `.lyrics <song name>` to search any song.'));
      return;
    }

    try {
      const result = query ? await findLyricsByQuery(client.player, query) : await findLyricsForTrack(client.player, track!);
      if (!result) {
        const what = query ? `**${query}**` : `**${track!.title}**`;
        await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, `No lyrics found for ${what}. Try \`.lyrics <artist> <song>\`.`));
        return;
      }

      const chunks = splitLyrics(result.plainLyrics);
      const shown = chunks.slice(0, MAX_LYRICS_MESSAGES);
      for (let i = 0; i < shown.length; i++) {
        const embed = new EmbedBuilder().setColor(MUSIC_COLOR).setDescription(shown[i]);
        if (i === 0) embed.setTitle(`📝 ${result.trackName} — ${result.artistName}`.slice(0, 256));
        if (i === shown.length - 1) {
          const truncated = chunks.length > shown.length ? ' · (truncated)' : '';
          embed.setFooter({ text: `Lyrics from LRCLib${truncated}` });
        }
        await message.channel.send({ embeds: [embed] });
      }
      await message.delete().catch(() => {});
    } catch (e: unknown) {
      console.error('Error in .lyrics:', e);
      await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, 'Could not get the lyrics right now. Try again later.'));
    }
  },
};

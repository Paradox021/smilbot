import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { Client, Message } from 'discord.js';
import { musicLog } from '@/utils/musicDebug';
import { sendMusicReply, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { resolvePlaybackChannel, startPlayback } from '@/utils/musicPlay';

/**
 * Command to play a song
 */
export const play: Command = {
    name: 'play',
    description: 'Plays a song or playlist from YouTube or Spotify (name or URL)',
    usage: '.play <name or URL>',
    examples: ['.play bad bunny dtmf', '.p https://youtu.be/dQw4w9WgXcQ'],
    aliases: ['p'],
    categories: [CommandCategory.PLAYER],
    async execute(message: Message, args: string[], client: Client) {
        if (!message.channel.isSendable()) {
            return;
        }

        const target = resolvePlaybackChannel(message.member, client, message.guildId);
        if ('error' in target) {
            await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, `${message.author} ${target.error}`));
            return;
        }

        const query = args.join(" ");
        if (!query) {
            await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, "Please provide the name or URL of the song."));
            return;
        }

        try {
            const start = Date.now();
            musicLog(`.play "${query}" received`);
            await startPlayback(client, target.voiceChannel, query, message.channel, message.author);
            musicLog(`.play "${query}" resolved in ${Date.now() - start}ms`);

            // Elimina el mensaje original para limpiar el canal
            await message.delete().catch(() => {});
        } catch (e: unknown) {
            console.error('Error in .play:', e);
            await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, "An error occurred while trying to play the song."));
        }
    }
}

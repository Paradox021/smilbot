import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { Client, Message } from 'discord.js';
import { sendMusicReply, MUSIC_COLOR, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { stopQueue } from '@/utils/musicActions';

/**
 * Command to stop the music, clear the queue and leave the voice channel
 */
export const stop: Command = {
    name: 'stop',
    description: 'Stops the music, clears the queue and leaves the voice channel',
    usage: '.stop',
    aliases: ['leave'],
    categories: [CommandCategory.PLAYER],
    async execute(message: Message, args: string[], client: Client) {
        const voiceChannel = message.member?.voice.channel;
        const queue = message.guildId ? client.player.nodes.get(message.guildId) : null;

        if (!queue) {
            await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, "I'm not playing anything."));
            return;
        }

        // Funciona aunque no suene nada (p. ej. esperando tras acabar la cola), pero solo desde el mismo canal.
        if (!voiceChannel || (queue.channel && queue.channel.id !== voiceChannel.id)) {
            const where = queue.channel ? ` ${queue.channel}` : ' my voice channel';
            await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, `${message.author} you must be in${where} to do this!`));
            return;
        }

        try {
            stopQueue(queue);
            await sendMusicReply(message, createTextEmbed(MUSIC_COLOR, `⏹️ ${message.author} stopped the music and left the channel.`));
        } catch (e: unknown) {
            console.error('Error in .stop:', e);
            await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, "An error occurred while trying to stop playback."));
        }
    }
};

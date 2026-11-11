import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { Client, Message } from 'discord.js';
import { HEADROOM_FILTER } from '@/utils/audioFilters';
import { musicLog } from '@/utils/musicDebug';
import { MusicQueueMetadata } from '@/types/MusicQueueMetadata';
import { sendMusicReply, MUSIC_ERROR_COLOR } from '@/utils/musicQueue';
import { LEAVE_ON_EMPTY_COOLDOWN_MS, LEAVE_ON_END_COOLDOWN_MS } from '@/utils/musicOptions';

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
        const voiceChannel = message.member?.voice.channel;

        if (!message.channel.isSendable() || !message.guildId) {
            return;
        }

        if (!voiceChannel) {
            await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, `${message.author} you must be in a voice channel to do this!`));
            return;
        }

        const query = args.join(" ");
        if (!query) {
            await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, "Please provide the name or URL of the song."));
            return;
        }

        // Si el bot ya está en otro canal de voz del servidor, no se lo "roba" a quien lo está usando.
        const existingQueue = client.player.nodes.get(message.guildId);
        if (existingQueue?.channel && existingQueue.channel.id !== voiceChannel.id) {
            await sendMusicReply(
                message,
                createTextEmbed(MUSIC_ERROR_COLOR, `${message.author} I'm already playing in ${existingQueue.channel}. Join that channel to add songs.`),
            );
            return;
        }

        try {
            const start = Date.now();
            musicLog(`.play "${query}" received`);

            const metadata: MusicQueueMetadata = { channel: message.channel, nowPlayingMessage: null };
            await client.player.play(voiceChannel, query, {
                requestedBy: message.author,
                nodeOptions: {
                    metadata,
                    // Margen antes de salir del canal, para que un nuevo .play no tenga que reconectar
                    leaveOnEnd: true,
                    leaveOnEndCooldown: LEAVE_ON_END_COOLDOWN_MS,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: LEAVE_ON_EMPTY_COOLDOWN_MS,
                    // Baja 3 dB antes de convertir a 16 bits para evitar distorsión en canciones con máster muy alto
                    defaultFFmpegFilters: [HEADROOM_FILTER],
                    // Sin procesado DSP en JavaScript (ecualizador, biquad, filtros, resampler, volumen): no se usa
                    // y bloqueaba el hilo hasta ~40 ms al empezar cada canción, retrasando paquetes de voz (pops).
                    disableFilterer: true,
                    disableEqualizer: true,
                    disableBiquad: true,
                    disableResampler: true,
                    disableVolume: true,
                }
            });
            musicLog(`.play "${query}" resolved in ${Date.now() - start}ms`);

            // Elimina el mensaje original para limpiar el canal
            await message.delete().catch(() => {});
        } catch (e: unknown) {
            console.error('Error in .play:', e);
            await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, "An error occurred while trying to play the song."));
        }
    }
}

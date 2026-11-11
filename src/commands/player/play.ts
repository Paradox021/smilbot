import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { Client, GuildTextBasedChannel, Message } from 'discord.js';
import { canSendMessages } from '@/utils/typeGuards';
import { HEADROOM_FILTER } from '@/utils/audioFilters';
import { musicLog } from '@/utils/musicDebug';

/**
 * Command to play a song
 */
export const play: Command = {
    name: 'play',
    description: 'Plays a song from YouTube or Spotify',
    aliases: ['p'],
    categories: [CommandCategory.PLAYER],
    async execute(message: Message, args: string[], client: Client) {
        const voiceChannel = message.member?.voice.channel;
          
        if (!canSendMessages(message.channel)) {
            return
        }

        if (!voiceChannel) {
            message.channel.send({
                embeds: [
                    createTextEmbed(0xFF0000, `${message.author} you must be in a voice channel to do this!`)
                ]
            });
            message.delete();
            return;
        }

        const query = args.join(" ");
        if (!query) {
            message.channel.send({
                embeds: [
                    createTextEmbed(0xFF0000, "Please provide the name or URL of the song.")
                ]
            });
            
            message.delete();
            return;
        }

        try {
            const player = client.player;
            const start = Date.now();
            musicLog(`.play "${query}" received`);

            // Llama a la función play de discord-player
            await player.play(voiceChannel, query, {
                nodeOptions: {
                    metadata: {
                        channel: message.channel
                    },
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
            message.delete();
          } catch (e: any) {
            console.error('Error in .play:', e);
            message.channel.send({
                embeds: [
                    createTextEmbed(0xFF0000, "An error occurred while trying to play the song.")
                ]
            });
          }
    }
}
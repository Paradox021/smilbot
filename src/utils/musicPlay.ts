import { Client, GuildMember, SendableChannels, User, VoiceBasedChannel } from 'discord.js';
import { Track } from 'discord-player';
import { MusicQueueMetadata } from '@/types/MusicQueueMetadata';
import { HEADROOM_FILTER } from '@/utils/audioFilters';
import { LEAVE_ON_EMPTY_COOLDOWN_MS, LEAVE_ON_END_COOLDOWN_MS } from '@/utils/musicOptions';

/**
 * Checks that a member can start or add music: must be in a voice channel, and if the bot
 * is already playing in another channel of the server, it is not taken away from there.
 */
export function resolvePlaybackChannel(
  member: GuildMember | null | undefined,
  client: Client,
  guildId: string | null,
): { voiceChannel: VoiceBasedChannel } | { error: string } {
  const voiceChannel = member?.voice.channel;
  if (!guildId || !voiceChannel) return { error: 'you must be in a voice channel to do this!' };

  const existingQueue = client.player.nodes.get(guildId);
  if (existingQueue?.channel && existingQueue.channel.id !== voiceChannel.id) {
    return { error: `I'm already playing in ${existingQueue.channel}. Join that channel to add songs.` };
  }
  return { voiceChannel };
}

/**
 * Plays (or adds to the queue) a song, URL, search text or an already resolved Track,
 * with the queue options used across the bot.
 */
export async function startPlayback(
  client: Client,
  voiceChannel: VoiceBasedChannel,
  query: string | Track,
  textChannel: SendableChannels,
  requestedBy: User,
): Promise<void> {
  const metadata: MusicQueueMetadata = { channel: textChannel, nowPlayingMessage: null };
  await client.player.play(voiceChannel, query, {
    requestedBy,
    nodeOptions: {
      // Solo se usa si la cola no existe todavía (si ya existe, se conservan sus metadatos)
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
    },
  });
}

import { Client, EmbedBuilder, GuildMember, Message } from 'discord.js';
import { GuildQueue } from 'discord-player';
import { MusicQueueMetadata } from '@/types/MusicQueueMetadata';
import { createFinishedSongEmbed, createNowPlayingEmbed, createTextEmbed } from '@/components/embeds';
import { createMusicControlButtons } from '@/components/buttons';
import { canSendMessages } from '@/utils/typeGuards';

export type MusicQueue = GuildQueue<MusicQueueMetadata>;

export const MUSIC_COLOR = 0x00569D;
export const MUSIC_ERROR_COLOR = 0xFF0000;
/** Songs per page in `.queue` */
export const QUEUE_ITEMS_PER_PAGE = 10;

/**
 * Checks that a member can control the music of a guild:
 * something must be playing and the member must be in the bot's voice channel.
 * @returns The queue, or an error message to show the user
 */
export function resolveControllableQueue(
  member: GuildMember | null | undefined,
  client: Client,
  guildId: string | null,
): { queue: MusicQueue } | { error: string } {
  if (!guildId || !member) return { error: 'This only works inside a server.' };

  const queue = client.player.nodes.get<MusicQueueMetadata>(guildId);
  if (!queue || !queue.currentTrack) return { error: 'Nothing is playing right now.' };

  const userChannel = member.voice.channel;
  if (!userChannel) return { error: 'You must be in a voice channel to do this!' };

  if (queue.channel && queue.channel.id !== userChannel.id) {
    return { error: `You must be in ${queue.channel} to control the music.` };
  }

  return { queue };
}

/**
 * Same as resolveControllableQueue but for message commands:
 * sends the error to the channel and returns null when the user cannot control the music.
 */
export async function getControllableQueue(message: Message, client: Client): Promise<MusicQueue | null> {
  const result = resolveControllableQueue(message.member, client, message.guildId);
  if ('error' in result) {
    await sendMusicReply(message, createTextEmbed(MUSIC_ERROR_COLOR, `${message.author} ${result.error}`));
    return null;
  }
  return result.queue;
}

/**
 * Sends an embed to the command's channel and deletes the command message (same behaviour as .play/.stop).
 */
export async function sendMusicReply(message: Message, embed: EmbedBuilder): Promise<void> {
  if (canSendMessages(message.channel)) {
    await message.channel.send({ embeds: [embed] }).catch((err: unknown) => console.error('Could not send music reply:', err));
  }
  // Puede fallar si el bot no tiene permiso para borrar mensajes: no es crítico.
  await message.delete().catch(() => {});
}

/**
 * Updates the current "Now playing" message (end time, pause state, loop, up next, buttons).
 * Called on pause/resume and whenever the queue or loop mode changes.
 */
export async function refreshNowPlayingMessage(queue: MusicQueue): Promise<void> {
  const message = queue.metadata?.nowPlayingMessage;
  if (!message || !queue.currentTrack) return;
  await message
    .edit({ embeds: [createNowPlayingEmbed(queue)], components: [createMusicControlButtons(queue)] })
    .catch(() => {});
}

export const FINISHED_LABELS = {
  played: '✅ Played',
  skipped: '⏭️ Skipped',
  stopped: '⏹️ Stopped',
  wentBack: '⏮️ Went back to the previous song',
} as const;

/**
 * Turns the current "Now playing" message into its final state (Played / Skipped / Stopped…):
 * removes the live end time and the buttons. Called when the song stops playing.
 * @param label Label to show; by default the one set by skip/previous (metadata.endLabel), otherwise "Played"
 */
export async function finalizeNowPlayingMessage(queue: MusicQueue, label?: string): Promise<void> {
  const metadata = queue.metadata;
  const message = metadata?.nowPlayingMessage;
  if (!metadata || !message) return;

  const track = metadata.nowPlayingTrack;
  const finalLabel = label ?? metadata.endLabel ?? FINISHED_LABELS.played;
  metadata.nowPlayingMessage = null;
  metadata.nowPlayingTrack = null;
  metadata.endLabel = null;

  const payload = track
    ? { embeds: [createFinishedSongEmbed(track, finalLabel)], components: [] }
    : { components: [] };
  await message.edit(payload).catch(() => {});
}

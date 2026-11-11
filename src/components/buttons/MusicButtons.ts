import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { GuildQueue, QueueRepeatMode } from 'discord-player';
import { PaginationState, createPaginationButtons } from '@/components/pagination';

/**
 * Button custom ID prefix for the player controls of the "Now playing" message
 */
export const MUSIC_CONTROL_PREFIX = 'music';

/**
 * Button custom ID prefix for the queue pagination
 */
export const MUSIC_QUEUE_PREFIX = 'musicQueue';

export type MusicControlAction = 'pause' | 'skip' | 'loop' | 'shuffle' | 'stop';

const MUSIC_ACTIONS: MusicControlAction[] = ['pause', 'skip', 'loop', 'shuffle', 'stop'];

/**
 * Creates the player control buttons (pause/resume, skip, loop, shuffle, stop)
 */
export function createMusicControlButtons(queue: GuildQueue): ActionRowBuilder<ButtonBuilder> {
  const paused = queue.node.isPaused();
  const looping = queue.repeatMode !== QueueRepeatMode.OFF;

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${MUSIC_CONTROL_PREFIX}_pause`)
      .setEmoji(paused ? '▶️' : '⏸️')
      .setStyle(paused ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${MUSIC_CONTROL_PREFIX}_skip`)
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${MUSIC_CONTROL_PREFIX}_loop`)
      .setEmoji(queue.repeatMode === QueueRepeatMode.TRACK ? '🔂' : '🔁')
      .setStyle(looping ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${MUSIC_CONTROL_PREFIX}_shuffle`)
      .setEmoji('🔀')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${MUSIC_CONTROL_PREFIX}_stop`)
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger),
  );
}

/**
 * Parses a player control button custom ID (music_action)
 */
export function parseMusicControlCustomId(customId: string): MusicControlAction | null {
  const [prefix, action] = customId.split('_');
  if (prefix !== MUSIC_CONTROL_PREFIX) return null;
  return MUSIC_ACTIONS.includes(action as MusicControlAction) ? (action as MusicControlAction) : null;
}

/**
 * Creates the pagination buttons for the queue view (only if there is more than one page)
 */
export function createQueueButtons(state: PaginationState): ActionRowBuilder<ButtonBuilder>[] {
  if (state.totalPages <= 1) return [];
  return [createPaginationButtons(state, { customIdPrefix: MUSIC_QUEUE_PREFIX })];
}

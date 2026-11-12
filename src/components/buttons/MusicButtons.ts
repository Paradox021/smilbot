import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { GuildQueue, QueueRepeatMode, Track } from 'discord-player';
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
 * Custom ID prefix for the `.search` select menu and cancel button
 */
export const MUSIC_SEARCH_PREFIX = 'musicSearch';

const SEARCH_LABEL_MAX = 100;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Creates the select menu (one option per result) and the cancel button for `.search`.
 * The owner's id goes in the custom ID so only they can choose.
 */
export function createSearchComponents(tracks: Track[], ownerId: string): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${MUSIC_SEARCH_PREFIX}_select_${ownerId}`)
    .setPlaceholder('Choose a song to play')
    .addOptions(
      tracks.map((track, i) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(truncate(`${i + 1}. ${track.title}`, SEARCH_LABEL_MAX))
          .setDescription(truncate(`${track.author} · ${track.duration}`, SEARCH_LABEL_MAX))
          .setValue(String(i)),
      ),
    );

  const cancel = new ButtonBuilder()
    .setCustomId(`${MUSIC_SEARCH_PREFIX}_cancel_${ownerId}`)
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu),
    new ActionRowBuilder<ButtonBuilder>().addComponents(cancel),
  ];
}

/**
 * Parses a `.search` component custom ID (musicSearch_action_ownerId)
 */
export function parseSearchCustomId(customId: string): { action: 'select' | 'cancel'; ownerId: string } | null {
  const [prefix, action, ownerId] = customId.split('_');
  if (prefix !== MUSIC_SEARCH_PREFIX || !ownerId) return null;
  if (action !== 'select' && action !== 'cancel') return null;
  return { action, ownerId };
}

/**
 * Creates the pagination buttons for the queue view (only if there is more than one page)
 */
export function createQueueButtons(state: PaginationState): ActionRowBuilder<ButtonBuilder>[] {
  if (state.totalPages <= 1) return [];
  return [createPaginationButtons(state, { customIdPrefix: MUSIC_QUEUE_PREFIX })];
}

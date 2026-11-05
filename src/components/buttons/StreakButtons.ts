import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Button custom ID prefix for the streak restore confirmation
 */
export const STREAK_BUTTON_PREFIX = 'streakRestore';

/**
 * Creates the confirm / cancel buttons for restoring a streak.
 * The owner's id goes in the custom ID so only they can press them.
 * @param ownerId Discord ID of the user who ran the command
 */
export function createStreakRestoreButtons(ownerId: string): ActionRowBuilder<ButtonBuilder> {
  const confirm = new ButtonBuilder()
    .setCustomId(`${STREAK_BUTTON_PREFIX}_confirm_${ownerId}`)
    .setLabel('Restore')
    .setEmoji('🔥')
    .setStyle(ButtonStyle.Success);

  const cancel = new ButtonBuilder()
    .setCustomId(`${STREAK_BUTTON_PREFIX}_cancel_${ownerId}`)
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);
}

/**
 * Parses a streak restore button custom ID
 * @param customId Button custom ID (streakRestore_action_ownerId)
 * @returns Parsed data or null
 */
export function parseStreakRestoreCustomId(
  customId: string
): { action: 'confirm' | 'cancel'; ownerId: string } | null {
  const [prefix, action, ownerId] = customId.split('_');
  if (prefix !== STREAK_BUTTON_PREFIX || !ownerId) return null;
  if (action !== 'confirm' && action !== 'cancel') return null;
  return { action, ownerId };
}

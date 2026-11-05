import { ButtonInteraction, Client, Colors, Interaction, MessageFlags } from 'discord.js';
import { economyService, StreakRestoreError } from '@/services/economyService';
import {
  createStreakRestoreResultEmbed,
  createStreakRestoreUnavailableEmbed,
  createTextEmbed,
} from '@/components/embeds';
import { parseStreakRestoreCustomId } from '@/components/buttons';

/**
 * Handles the confirm button: the backend re-checks everything and charges
 */
async function handleStreakRestoreConfirm(interaction: ButtonInteraction): Promise<void> {
  // Remove the buttons first so a double click can't send a second request
  await interaction.update({ components: [] });

  try {
    const result = await economyService.restoreStreak(interaction.user.id);
    await interaction.editReply({ embeds: [createStreakRestoreResultEmbed(result)] });
  } catch (error) {
    const code = error instanceof StreakRestoreError ? error.code : 'UNKNOWN';
    const quote = error instanceof StreakRestoreError ? error.quote : undefined;
    await interaction.editReply({ embeds: [createStreakRestoreUnavailableEmbed(code, quote)] });
  }
}

/**
 * Main router for streak restore interactions
 */
export async function handleStreakInteraction(
  interaction: Interaction,
  client: Client
): Promise<boolean> {
  if (!interaction.isButton()) return false;

  const parsed = parseStreakRestoreCustomId(interaction.customId);
  if (!parsed) return false;

  if (interaction.user.id !== parsed.ownerId) {
    await interaction.reply({
      embeds: [createTextEmbed(Colors.Red, 'Only the user who ran `.restore` can use these buttons.')],
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  if (parsed.action === 'cancel') {
    await interaction.update({
      embeds: [createTextEmbed(Colors.Grey, 'Streak restore cancelled.')],
      components: [],
    });
    return true;
  }

  await handleStreakRestoreConfirm(interaction);
  return true;
}

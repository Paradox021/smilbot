import { Interaction, Client, MessageFlags } from 'discord.js';
import { handleCardInteraction } from './CardInteractions';
import { handleMarketInteraction } from './MarketInteractions';
import { handleHelpInteraction } from './HelpInteractions';
import { handleStreakInteraction } from './StreakInteractions';

/**
 * Main interaction handler that routes to specific handlers
 * @param interaction Discord interaction
 * @param client Discord client
 */
export async function handleInteraction(
  interaction: Interaction,
  client: Client
): Promise<void> {
  try {
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      // Try help interactions
      const helpHandled = await handleHelpInteraction(interaction, client);
      if (helpHandled) return;
    }

    if (interaction.isButton()) {
      const handled = await handleCardInteraction(interaction, client);
      if (handled) return;
    }

    // Try market interactions (handles both buttons and select menus)
    const marketHandled = await handleMarketInteraction(interaction, client);
    if (marketHandled) return;

    const streakHandled = await handleStreakInteraction(interaction, client);
    if (streakHandled) return;

    // Add more handlers here as needed...

  } catch (error) {
    console.error('Error handling interaction:');

    // Try to respond with an error message
    try {
      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: 'An error occurred while processing your request.',
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: 'An error occurred while processing your request.',
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    } catch {
      // Silently fail if we can't respond
    }
  }
}

export { handleCardInteraction } from './CardInteractions';
export { handleMarketInteraction } from './MarketInteractions';
export { handleHelpInteraction } from './HelpInteractions';
export { handleStreakInteraction } from './StreakInteractions';

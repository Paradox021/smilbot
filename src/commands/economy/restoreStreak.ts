import { Colors, Message, Client } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import {
  createStreakRestoreQuoteEmbed,
  createStreakRestoreUnavailableEmbed,
  createTextEmbed,
} from '@/components/embeds';
import { createStreakRestoreButtons } from '@/components/buttons';
import { checkUser } from '@/middlewares/checkUser';
import { economyService } from '@/services/economyService';

/**
 * Command to pay coins and get back a streak broken in the last 72 hours.
 * Shows the cost and asks for confirmation; only the author can press the buttons.
 * Usage: .restorestreak
 */
export const restoreStreak: Command = {
  name: 'restorestreak',
  aliases: ['restore'],
  description: 'Pay coins to recover a daily streak broken in the last 72 hours',
  usage: '.restorestreak',
  examples: ['.restore'],
  categories: [CommandCategory.ECONOMY],
  middlewares: [checkUser],

  async execute(message: Message, args: string[], client: Client): Promise<void> {
    try {
      const quote = await economyService.getStreakRestore(message.author.id);

      if (!quote.available) {
        await message.reply({
          embeds: [createStreakRestoreUnavailableEmbed(quote.reason ?? 'UNKNOWN', quote)],
        });
        return;
      }

      await message.reply({
        embeds: [createStreakRestoreQuoteEmbed(quote)],
        components: [createStreakRestoreButtons(message.author.id)],
      });
    } catch (error) {
      console.error('[restoreStreak] error:', (error as Error).message);
      await message.reply({
        embeds: [createTextEmbed(Colors.Red, 'Failed to check your streak. Please try again.')],
      });
    }
  },
};

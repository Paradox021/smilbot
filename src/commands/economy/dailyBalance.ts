import { economyService } from '@/services/economyService';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { Colors, Message, Client } from 'discord.js';
import { checkUser } from '@/middlewares/checkUser';

/**
 * Daily Balance command to get the daily 100 coins
 */
export const dailyBalance: Command = {
    name: 'dailybalance',
    aliases: ['db'],
    description: 'Claim your daily 100 coins',
    categories: [CommandCategory.ECONOMY],
    middlewares: [checkUser],
    execute: async (message: Message, args: string[], client: Client) => {
      const discordId = message.author.id;

      const res = await economyService.claimDailyBalance(discordId);

      if (!res.ok) {
        message.reply({
          embeds: [
            createTextEmbed(Colors.Red, res.error ?? 'Failed to claim your daily balance.'),
          ],
        });
        return;
      }

      const streak = res.dailyStreak ?? 0;
      const prevStreak = res.previousStreak ?? 0;
      const prevMaxStreak = res.previousMaxStreak ?? 0;
      const maxStreak = res.maxDailyStreak ?? Math.max(streak, prevMaxStreak);
      const isNewRecord = res.isNewRecord ?? (prevMaxStreak > 0 && streak === prevMaxStreak + 1);

      const lines = [
        `💰 Claimed **100** daily coins!`,
        ``,
        `• **Balance:** **${res.balance?.toLocaleString() ?? 0}** coins`,
      ];

      if (streak >= 2) {
        let streakInfo = `🔥 **${streak}** days`;
        if (maxStreak > streak) {
          streakInfo += ` *(Record: ${maxStreak})*`;
        }
        lines.push(`• **Daily Streak:** ${streakInfo}`);
      }

      if (isNewRecord) {
        lines.push(``, `🎉 **New Personal Record!** You've surpassed your previous record of **${prevMaxStreak}** days!`);
      } else if (streak === 1 && prevStreak >= 2) {
        lines.push(``, `💔 Your previous streak of **${prevStreak}** days was broken. Starting fresh!`);

        // Restorable for a while: show the price and the deadline (also when short on coins, so they can save up)
        const restore = res.streakRestore;
        if (restore?.expiresAt && (restore.available || restore.reason === 'INSUFFICIENT_BALANCE')) {
          const deadline = Math.floor(Date.parse(restore.expiresAt) / 1000);
          lines.push(
            `🩹 Use \`.restore\` to get it back for **${restore.cost?.toLocaleString()}** coins before <t:${deadline}:R>.`
          );
        }
      }

      message.reply({
        embeds: [
          createTextEmbed(
            Colors.Blurple,
            lines.join('\n')
          ),
        ],
      });
      
    }
  
};
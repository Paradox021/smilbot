import { userService, UserStats } from '@/services/userService';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { Colors, EmbedBuilder, Message, Client } from 'discord.js';
import { checkUser } from '@/middlewares/checkUser';
import { UserLuckStats } from '@/services/leaderboardService';

function getLuckTierEmoji(tierCode?: string): string {
  switch (tierCode) {
    case 'GODLY':
      return '🌟';
    case 'LUCKY':
      return '🍀';
    case 'AVERAGE':
      return '⚖️';
    case 'UNLUCKY':
      return '🌧️';
    case 'CURSED':
      return '💀';
    default:
      return '🎲';
  }
}

function createProgressBar(current: number, total: number, size = 10): string {
  if (total <= 0) return '▱'.repeat(size);
  const percentage = Math.min(Math.max(current / total, 0), 1);
  const filled = Math.round(percentage * size);
  const empty = size - filled;
  const pctStr = (percentage * 100).toFixed(1).replace(/\.0$/, '');
  return `${'▰'.repeat(filled)}${'▱'.repeat(empty)} **${pctStr}%**`;
}

function formatLuckField(luck?: UserLuckStats, cardsOpenedCount: number = 0): string {
  if (!luck) {
    return '• Rating: ⏳ No gacha pulls yet (minimum 20 required)';
  }

  const pulls = luck.totalCards ?? cardsOpenedCount;
  if (!luck.eligibleForLeaderboard || pulls < 20) {
    return pulls > 0
      ? `• Rating: ⏳ Not enough pulls yet (${pulls}/20 required)`
      : '• Rating: ⏳ No gacha pulls yet (minimum 20 required)';
  }

  const emoji = getLuckTierEmoji(luck.tierCode);
  const bd = luck.breakdown;
  let breakdownStr = '';
  if (bd) {
    const pityStr = bd.pityMythics && bd.pityMythics > 0 ? ` (+${bd.pityMythics} Pity)` : '';
    breakdownStr = `${bd.common ?? 0}⚪  ${bd.rare ?? 0}🟢  ${bd.epic ?? 0}🟣  ${bd.legendary ?? 0}🟡  ${bd.mythic ?? 0}🔴${pityStr}`;
  }

  const lines = [
    `• Rating: ${emoji} **${luck.tier}** (${luck.luckDelta})`,
  ];
  if (breakdownStr) {
    lines.push(`• Breakdown: ${breakdownStr}`);
  }
  return lines.join('\n');
}

/**
 * Daily availability and streak expiry, using Discord relative timestamps.
 * Both dates come from the backend, which owns the 23h cooldown / 48h streak rules.
 */
function formatDailyStatus(userStats: UserStats): string[] {
  const lines: string[] = [];
  if (userStats.nextDailyAt) {
    const next = Date.parse(userStats.nextDailyAt);
    lines.push(
      next <= Date.now()
        ? '• Next Daily: **available now**'
        : `• Next Daily: <t:${Math.floor(next / 1000)}:R>`
    );
  }
  if (userStats.streakExpiresAt) {
    lines.push(`• Streak Ends: <t:${Math.floor(Date.parse(userStats.streakExpiresAt) / 1000)}:R>`);
  }
  return lines;
}

/**
 * Stats command to check user's economic profile, streaks, and activity
 */
export const stats: Command = {
  name: 'stats',
  aliases: ['profile', 'estadisticas', 'mystats'],
  description: 'Shows user stats, balance, streaks, and card metrics',
  categories: [CommandCategory.ECONOMY],
  middlewares: [checkUser],
  execute: async (message: Message, args: string[], client: Client) => {
    const mentionedUser = message.mentions.users.first();
    const targetUser = mentionedUser ?? message.author;
    const discordId = targetUser.id;

    try {
      const userStats = await userService.getUserStats(discordId);

      const embed = new EmbedBuilder()
        .setColor(Colors.Gold)
        .setAuthor({
          name: `${userStats.username || targetUser.username}'s Profile & Stats`,
          iconURL: targetUser.displayAvatarURL(),
        })
        .addFields(
          {
            name: '💰 Economy',
            value: [
              `• Current Balance: **${(userStats.balance ?? 0).toLocaleString()}** coins`,
              `• Total Earned: **${(userStats.totalCoinsEarned ?? 0).toLocaleString()}** coins`,
              `• Total Spent: **${(userStats.totalCoinsSpent ?? 0).toLocaleString()}** coins`,
            ].join('\n'),
            inline: false,
          },
          {
            name: '🔥 Daily Streaks',
            value: [
              `• Current Streak: **${userStats.dailyStreak ?? 0}** days`,
              `• Max Record Streak: **${userStats.maxDailyStreak ?? 0}** days`,
              `• Dailies Claimed: **${userStats.totalDailiesClaimed ?? 0}** times`,
              ...formatDailyStatus(userStats),
            ].join('\n'),
            inline: true,
          },
          {
            name: '🃏 Cards & Market',
            value: [
              `• Inventory: **${userStats.cardsCount ?? 0}** cards`,
              `• Packs Opened: **${userStats.cardsOpenedCount ?? 0}**`,
              `• Market Sales: **${userStats.marketSalesCount ?? 0}**`,
            ].join('\n'),
            inline: true,
          },
          {
            name: '✨ Gacha Pity',
            value: userStats.pity
              ? [
                  `• Progress: **${userStats.pity.pullsSinceLastMythic ?? 0}/${userStats.pity.pityThreshold ?? 250}**`,
                  `• Guaranteed In: **${userStats.pity.pullsUntilGuaranteed ?? 250}** pulls`,
                  `• ${createProgressBar(userStats.pity.pullsSinceLastMythic ?? 0, userStats.pity.pityThreshold ?? 250)}`,
                ].join('\n')
              : '• No pity data available',
            inline: true,
          },
          {
            name: '🎲 Gacha Luck',
            value: formatLuckField(userStats.luck, userStats.cardsOpenedCount ?? 0),
            inline: false,
          }
        )
        .setFooter({ text: 'Smilbot Economy' })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err: any) {
      console.error('[StatsCommand] error:', err?.response?.data || err?.message);
      const isSelf = targetUser.id === message.author.id;
      const errorMsg = isSelf
        ? 'Could not fetch your statistics at this moment.'
        : `Could not fetch statistics for **${targetUser.username}**.`;

      message.reply({
        embeds: [createTextEmbed(Colors.Red, errorMsg)],
      });
    }
  },
};

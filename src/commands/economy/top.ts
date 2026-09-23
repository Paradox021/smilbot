import { leaderboardService, LuckLeaderboardItem } from '@/services/leaderboardService';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { Colors, EmbedBuilder, Message, Client } from 'discord.js';
import { checkUser } from '@/middlewares/checkUser';

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

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

/**
 * Top command to view leaderboards (Gacha Luck by default)
 */
export const top: Command = {
  name: 'top',
  aliases: ['topluck', 'lucktop', 'leaderboard', 'ranking'],
  description: 'Shows rankings and leaderboards (e.g. gacha luck: .top luck [worst])',
  categories: [CommandCategory.ECONOMY],
  middlewares: [checkUser],
  execute: async (message: Message, args: string[], client: Client) => {
    // Normalizar argumentos para detectar si es petición de los más desafortunados (worst)
    const normalizedArgs = args.map((arg) => arg.toLowerCase());

    const isWorst =
      normalizedArgs.includes('worst') ||
      normalizedArgs.includes('bad') ||
      normalizedArgs.includes('cursed') ||
      normalizedArgs.includes('asc');

    const order: 'asc' | 'desc' = isWorst ? 'asc' : 'desc';

    try {
      const response = await leaderboardService.getLuckLeaderboard({
        order,
        limit: 5,
        minPulls: 20,
      });

      const list = response.leaderboard ?? [];

      if (list.length === 0) {
        message.reply({
          embeds: [
            createTextEmbed(
              Colors.Orange,
              '⚠️ No players have qualified for the luck leaderboard yet (minimum 20 gacha pulls required).'
            ),
          ],
        });
        return;
      }

      const title = isWorst
        ? '💀 Top 5 Most Unlucky Players (Gacha Luck)'
        : '🍀 Top 5 Luckiest Players (Gacha Luck)';

      const embedColor = isWorst ? Colors.DarkRed : Colors.Gold;

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(title)
        .setDescription(
          `*Minimum threshold: **20 pulls** • Neutralized against market trades*\n`
        )
        .setFooter({ text: 'Smilbot Economy • Top 5 Rankings' })
        .setTimestamp();

      const fields = list.slice(0, 5).map((item: LuckLeaderboardItem, index: number) => {
        const medal = MEDALS[index] || `${index + 1}.`;
        const emoji = getLuckTierEmoji(item.tierCode);
        const bd = item.breakdown;
        let breakdownStr = '';
        if (bd) {
          const pityStr = bd.pityMythics && bd.pityMythics > 0 ? ` (+${bd.pityMythics} Pity)` : '';
          breakdownStr = `${bd.common ?? 0}⚪  ${bd.rare ?? 0}🟢  ${bd.epic ?? 0}🟣  ${bd.legendary ?? 0}🟡  ${bd.mythic ?? 0}🔴${pityStr}`;
        }

        return {
          name: `${medal} ${item.username} — ${emoji} ${item.tier} (\`${item.luckDelta}\`)`,
          value: [
            `• User: <@${item.discordId}>`,
            `• Gacha Pulls: **${item.totalCards}**`,
            breakdownStr ? `• Rarities: ${breakdownStr}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          inline: false,
        };
      });

      embed.addFields(fields);

      message.reply({ embeds: [embed] });
    } catch (err: any) {
      console.error('[TopCommand] error:', err?.response?.data || err?.message);
      message.reply({
        embeds: [
          createTextEmbed(
            Colors.Red,
            'Could not retrieve the luck leaderboard at this moment. Please try again later.'
          ),
        ],
      });
    }
  },
};

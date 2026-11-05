import { Colors, EmbedBuilder } from 'discord.js';
import { StreakRestoreError, StreakRestoreQuote, StreakRestoreResult } from '@/services/economyService';

/** Discord relative timestamp (<t:…:R>) for an ISO date */
const relative = (iso: string): string => `<t:${Math.floor(Date.parse(iso) / 1000)}:R>`;

/**
 * Explains why the streak can't be restored right now
 * @param code Reason returned by the backend
 * @param quote Quote with the details, when the backend sent one
 */
export function createStreakRestoreUnavailableEmbed(
  code: StreakRestoreError['code'],
  quote?: StreakRestoreQuote
): EmbedBuilder {
  const lost = quote?.lostStreak ?? 0;
  let text: string;

  switch (code) {
    case 'NO_LOST_STREAK':
      text = 'You have no broken streak to restore.';
      break;
    case 'RESTORE_EXPIRED':
      text = `💔 Your **${lost}**-day streak broke too long ago and can no longer be restored.`;
      break;
    case 'CLAIM_DAILY_FIRST':
      text =
        `💔 Your **${lost}**-day streak is broken.\n` +
        `Claim your daily with \`.db\` first, then use \`.restore\` to recover it` +
        (quote?.cost !== undefined ? ` for **${quote.cost.toLocaleString()}** coins` : '') +
        (quote?.expiresAt ? ` before ${relative(quote.expiresAt)}.` : '.');
      break;
    case 'RESTORE_COOLDOWN':
      text =
        `⏳ You already restored a streak recently.` +
        (quote?.nextRestoreAt ? ` You can restore again ${relative(quote.nextRestoreAt)}.` : '');
      break;
    case 'INSUFFICIENT_BALANCE':
      text =
        `Restoring your **${lost}**-day streak costs **${quote?.cost?.toLocaleString() ?? '?'}** coins ` +
        `and you have **${quote?.balance?.toLocaleString() ?? 0}**.` +
        (quote?.expiresAt ? `\nYou have until ${relative(quote.expiresAt)}.` : '');
      break;
    case 'STREAK_RESTORE_CONFLICT':
      text = 'Your streak changed while restoring it. Please run `.restore` again.';
      break;
    default:
      text = 'Failed to restore your streak. Please try again.';
  }

  return new EmbedBuilder().setColor(Colors.Red).setDescription(text);
}

/**
 * Confirmation prompt with the cost and the resulting streak
 * @param quote Available quote (lostStreak, cost and expiresAt are set)
 */
export function createStreakRestoreQuoteEmbed(quote: StreakRestoreQuote): EmbedBuilder {
  const lines = [
    `💔 Lost streak: **${quote.lostStreak}** days`,
    `🔥 Current streak: **${quote.currentStreak}** days`,
    `✨ After restoring: **${quote.restoredStreak}** days`,
    ``,
    `💰 Cost: **${quote.cost?.toLocaleString()}** coins *(balance: ${quote.balance.toLocaleString()})*`,
  ];
  if (quote.expiresAt) {
    lines.push(`⏳ Offer ends ${relative(quote.expiresAt)}`);
  }

  return new EmbedBuilder()
    .setColor(Colors.Orange)
    .setTitle('Restore your streak?')
    .setDescription(lines.join('\n'));
}

/**
 * Result of a successful restore
 */
export function createStreakRestoreResultEmbed(result: StreakRestoreResult): EmbedBuilder {
  const lines = [
    `🔥 Your streak is back: **${result.dailyStreak}** days!`,
    ``,
    `• **Paid:** ${result.cost.toLocaleString()} coins`,
    `• **Balance:** ${result.balance.toLocaleString()} coins`,
  ];
  if (result.streakExpiresAt) {
    lines.push(`• **Streak Ends:** ${relative(result.streakExpiresAt)}`);
  }
  return new EmbedBuilder().setColor(Colors.Green).setDescription(lines.join('\n'));
}

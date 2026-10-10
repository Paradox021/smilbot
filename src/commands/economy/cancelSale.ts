import { Colors, Message, Client } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { checkUser } from '@/middlewares/checkUser';
import { marketService, getApiErrorMessage } from '@/services/marketService';

/**
 * Command to cancel one of your active offers on this server's market and get the card back.
 * Without arguments it lists your active offers.
 * Usage: .cancelsale [card name]
 */
export const cancelSale: Command = {
  name: 'cancelsale',
  aliases: ['unsell', 'myoffers'],
  description: 'Lists your offers on this server\'s market, or cancels one and returns the card to you',
  usage: '.cancelsale [card name]',
  examples: ['.cancelsale', '.cancelsale SwimmingLarry'],
  categories: [CommandCategory.ECONOMY],
  middlewares: [checkUser],

  async execute(message: Message, args: string[], client: Client): Promise<void> {
    const serverId = message.guildId;
    if (!serverId) {
      await message.reply({
        embeds: [createTextEmbed(Colors.Red, 'This command can only be used in a server.')],
      });
      return;
    }

    const discordId = message.author.id;
    const cardName = args.join(' ').trim();

    try {
      // Las ofertas llegan de la más reciente a la más antigua
      const myOffers = (await marketService.getAllOffers(serverId)).filter(
        (offer) => offer.seller?.discordId === discordId
      );

      if (!cardName) {
        const list = myOffers.length
          ? myOffers.map((offer) => `• **${offer.cardId.name}** — ${offer.price} coins`).join('\n')
          : 'You have no active offers on this server.';
        await message.reply({
          embeds: [
            createTextEmbed(
              Colors.Blue,
              `🛒 **Your offers**\n${list}${myOffers.length ? '\n\nUse `.cancelsale <card name>` to cancel one.' : ''}`
            ),
          ],
        });
        return;
      }

      const offer = myOffers.find(
        (item) => item.cardId.name.toLowerCase() === cardName.toLowerCase()
      );

      if (!offer) {
        await message.reply({
          embeds: [
            createTextEmbed(Colors.Red, `You have no active offer for **${cardName}** on this server.`),
          ],
        });
        return;
      }

      await marketService.removeOffer({
        serverId,
        offerId: offer._id,
        discordId,
        username: message.author.username,
      });

      await message.reply({
        embeds: [
          createTextEmbed(
            Colors.Green,
            `↩️ Your offer for **${offer.cardId.name}** was cancelled and the card is back in your collection.`
          ),
        ],
      });
    } catch (error) {
      await message.reply({
        embeds: [
          createTextEmbed(Colors.Red, getApiErrorMessage(error, 'Failed to cancel the offer. Please try again.')),
        ],
      });
    }
  },
};

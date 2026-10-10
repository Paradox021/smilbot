import { Colors, Message, Client } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed } from '@/components/embeds';
import { checkUser } from '@/middlewares/checkUser';
import { userService } from '@/services/userService';
import { marketService, getApiErrorMessage } from '@/services/marketService';

const USAGE = '.sell <card name> <price>';

/**
 * Command to publish one copy of a card from your collection on this server's market.
 * The card is held by the market until it is sold or the offer is cancelled.
 * Usage: .sell <card name> <price>
 */
export const sell: Command = {
  name: 'sell',
  aliases: ['offer'],
  description: 'Puts one copy of one of your cards up for sale on this server\'s market',
  usage: USAGE,
  examples: ['.sell SwimmingLarry 300', '.sell Gato Pan 150'],
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

    const priceArg = args[args.length - 1];
    const cardName = args.slice(0, -1).join(' ').trim();
    const price = Number(priceArg);

    if (!cardName || !Number.isInteger(price) || price <= 0) {
      await message.reply({
        embeds: [
          createTextEmbed(
            Colors.Red,
            `**Invalid command usage!**\n**Syntax:** \`${USAGE}\`\nThe price must be a positive whole number.`
          ),
        ],
      });
      return;
    }

    try {
      const userData = await userService.getMyCards(message.author.id);
      const card = userData?.cards.find(
        (item) => item.name.toLowerCase() === cardName.toLowerCase()
      );

      if (!card) {
        await message.reply({
          embeds: [
            createTextEmbed(Colors.Red, `You don't have any card called **${cardName}** in your collection.`),
          ],
        });
        return;
      }

      await marketService.addOffer({
        serverId,
        discordId: message.author.id,
        username: message.author.username,
        cardId: card._id,
        price,
      });

      await message.reply({
        embeds: [
          createTextEmbed(
            Colors.Green,
            `🛒 **${card.name}** is now on sale for **${price}** coins.\nUse \`.cancelsale ${card.name}\` to take it back.`
          ),
        ],
      });
    } catch (error) {
      await message.reply({
        embeds: [
          createTextEmbed(Colors.Red, getApiErrorMessage(error, 'Failed to publish the offer. Please try again.')),
        ],
      });
    }
  },
};

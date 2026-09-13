import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed, createCardEmbed } from '@/components/embeds';
import { Colors, Message, Client } from 'discord.js';
import { cardService } from '@/services/cardService';
import { checkAdmin } from '@/middlewares/checkAdmin';
import axios from 'axios';

const VALID_RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'];

export const createCard: Command = {
  name: 'createcard',
  aliases: ['newcard', 'addcard'],
  description: 'Create a new collectible card in the game (Admin only)',
  usage: '.createcard <name | "name with spaces"> <rarity> <description> [image_url]',
  examples: [
    '.createcard "El Pana Miguel" mythic Se le ve bastante fresco, no te voy a mentir. (attach image)',
    '.createcard "Gato Pan" legendary Un gatito atrapado en una rebanada de pan https://i.imgur.com/gatopan.png',
    '.createcard "Pop Cat" rare Gato abriendo y cerrando la boca al son del click',
  ],
  categories: [CommandCategory.ECONOMY],
  middlewares: [checkAdmin],
  execute: async (message: Message, args: string[], client: Client) => {
    // Extract everything after the command name to preserve quoted strings
    const rawContent = message.content.slice(1).trim();
    const rawArgs = rawContent.replace(/^\S+\s*/, '').trim();

    // Regex supporting: "Card Name" rarity description OR CardName rarity description
    const match = rawArgs.match(/^(?:"([^"]+)"|(\S+))\s+(\S+)\s+([\s\S]+)$/);

    if (!match) {
      await message.reply({
        embeds: [
          createTextEmbed(
            Colors.Red,
            '**Invalid command usage!**\n\n' +
              '**Syntax:** `.createcard <name | "name with spaces"> <rarity> <description> [image_url]`\n\n' +
              '**Examples:**\n' +
              '• With attachment: `.createcard "El Pana Miguel" mythic Se le ve bastante fresco, no te voy a mentir.` *(attach image)*\n' +
              '• With image URL: `.createcard "Gato Pan" legendary Un gatito con una rebanada de pan https://i.imgur.com/gatopan.png`\n\n' +
              '**Valid rarities:** `common`, `rare`, `epic`, `legendary`, `mythic`'
          ),
        ],
      });
      return;
    }

    const name = (match[1] || match[2]).trim();
    const rarity = match[3].toLowerCase();
    let description = match[4].trim();

    if (!VALID_RARITIES.includes(rarity)) {
      await message.reply({
        embeds: [
          createTextEmbed(
            Colors.Red,
            `Invalid rarity **"${rarity}"**.\nValid rarities are: \`${VALID_RARITIES.join(', ')}\``
          ),
        ],
      });
      return;
    }

    let imageBuffer: Buffer | null = null;
    let fileName = 'card.png';

    const attachment = message.attachments.first();

    if (attachment && attachment.contentType?.startsWith('image/')) {
      try {
        const response = await axios.get(attachment.url, {
          responseType: 'arraybuffer',
          timeout: 8000,
        });
        imageBuffer = Buffer.from(response.data);
        fileName = attachment.name || 'card.png';

        // Strip trailing URL if present in description to avoid link in lore
        description = description.replace(/\s+https?:\/\/\S+$/i, '').trim();
      } catch (err: any) {
        await message.reply({
          embeds: [
            createTextEmbed(
              Colors.Red,
              `Failed to download the attached image: ${err.message}`
            ),
          ],
        });
        return;
      }
    } else {
      // Check if description ends with a URL
      const urlMatch = description.match(/https?:\/\/\S+$/i);
      if (urlMatch) {
        const imageUrl = urlMatch[0];
        description = description.slice(0, urlMatch.index).trim();

        try {
          const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 8000,
          });

          const contentType = String(response.headers['content-type'] || '');
          if (!contentType.startsWith('image/')) {
            await message.reply({
              embeds: [
                createTextEmbed(
                  Colors.Red,
                  'The provided URL does not point to a valid image.'
                ),
              ],
            });
            return;
          }

          imageBuffer = Buffer.from(response.data);
          const urlFileName = imageUrl.split('/').pop()?.split('?')[0];
          if (urlFileName && /\.(png|jpe?g|webp|gif)$/i.test(urlFileName)) {
            fileName = urlFileName;
          }
        } catch (err: any) {
          await message.reply({
            embeds: [
              createTextEmbed(
                Colors.Red,
                `Failed to download image from URL: ${err.message}`
              ),
            ],
          });
          return;
        }
      }
    }

    if (!imageBuffer) {
      await message.reply({
        embeds: [
          createTextEmbed(
            Colors.Red,
            '**Missing image!**\n' +
              'You must either attach an image file to your message or provide a direct image URL at the end of the command.'
          ),
        ],
      });
      return;
    }

    if (!description) {
      await message.reply({
        embeds: [
          createTextEmbed(
            Colors.Red,
            '**Missing description!**\nYou must provide a description for the card.'
          ),
        ],
      });
      return;
    }

    try {
      const card = await cardService.createCard(
        {
          name,
          type: rarity,
          description,
          author: message.author.username,
        },
        imageBuffer,
        fileName
      );

      await message.reply({
        embeds: [createCardEmbed(card)],
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'An unexpected error occurred while creating the card.';

      await message.reply({
        embeds: [createTextEmbed(Colors.Red, `Error creating card: ${errorMessage}`)],
      });
    }
  },
};

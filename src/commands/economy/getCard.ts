import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { createTextEmbed, createCardEmbed } from '@/components/embeds';
import { Colors, Message, Client } from 'discord.js';
import { cardService } from '@/services/cardService';
import { checkUser } from '@/middlewares/checkUser';

export const getCard: Command = {
    name: 'getcard',
    aliases: ['buycard', 'gc'],
    description: 'Buy a random card for 100 coins',
    categories: [CommandCategory.ECONOMY],
    middlewares: [checkUser],
    execute: async (message: Message, args: string[], client: Client) => {
        const discordId = message.author.id;

        try {
            // Backend handles balance check and deduction
            const card = await cardService.buyRandomCard(discordId);

            const content = card.isPity
                ? '🌟 **Smilbot took pity on your bad luck and granted you a guaranteed Mythic card!**'
                : undefined;

            message.reply({
                content,
                embeds: [createCardEmbed(card)]
            });

        } catch (error: any) {

            // Handle specific errors from backend if possible, e.g., insufficient funds
            const errorMessage = error.response?.data?.error || error.message || "An unexpected error occurred.";
            message.reply({
                embeds: [createTextEmbed(Colors.Red, errorMessage)]
            });
        }
    }
};

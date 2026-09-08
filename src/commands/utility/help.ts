import { Message, Client, EmbedBuilder } from 'discord.js';
import { Command } from '@/types/Command';
import { CommandCategory } from '@/types/CommandCategory';
import { generateHelpEmbed, createHelpButtons, COMMANDS_PER_PAGE, createCategorySelectMenu } from '@/handlers/HelpInteractions';
import { createTextEmbed } from '@/components/embeds';

export const help: Command = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Shows all available commands or details about a specific command/category',
  categories: [CommandCategory.UTILITY],

  async execute(message: Message, args: string[], client: Client): Promise<void> {
    // Dynamically import to avoid circular dependency
    const { commandList } = await import('@/commands');

    if (args.length === 0) {
      // General help - show all commands
      const totalPages = Math.ceil(commandList.length / COMMANDS_PER_PAGE) || 1;
      const embed = generateHelpEmbed(commandList, 'All', 1);
      
      const components = [];
      components.push(createCategorySelectMenu('All'));
      
      if (totalPages > 1) {
        components.push(createHelpButtons('All', 1, totalPages));
      }
      
      const categoriesText = Object.values(CommandCategory).join(', ');
      embed.setDescription(`Here are all available commands.\n**Categories:** ${categoriesText}\n*Use \`.help [category]\`, \`.help [command]\`, or the dropdown interface.*`);

      await message.reply({ embeds: [embed], components });
      return;
    }

    const query = args[0].toLowerCase();

    // 1. Check if query is a category
    const categoryEnumValues = Object.values(CommandCategory);
    const matchedCategory = categoryEnumValues.find(c => c.toLowerCase() === query);

    if (matchedCategory) {
      const categoryCommands = commandList.filter((cmd: Command) => cmd.categories?.includes(matchedCategory));
      
      if (categoryCommands.length === 0) {
         await message.reply({ embeds: [createTextEmbed(0xFF0000, `No commands found for category: **${matchedCategory}**`)] });
         return;
      }

      const totalPages = Math.ceil(categoryCommands.length / COMMANDS_PER_PAGE) || 1;
      const embed = generateHelpEmbed(categoryCommands, matchedCategory, 1);
      
      const components = [];
      components.push(createCategorySelectMenu(matchedCategory));
      if (totalPages > 1) {
        components.push(createHelpButtons(matchedCategory, 1, totalPages));
      }

      await message.reply({ embeds: [embed], components });
      return;
    }

    // 2. Check if query is a specific command
    const matchedCommand = commandList.find((cmd: Command) => cmd.name === query || (cmd.aliases && cmd.aliases.includes(query)));

    if (matchedCommand) {
      const commandCategories = matchedCommand.categories?.join(', ') || 'None';
      const aliases = matchedCommand.aliases?.length ? matchedCommand.aliases.join(', ') : 'None';

      const embed = new EmbedBuilder()
        .setTitle(`Command Details: .${matchedCommand.name}`)
        .setColor(0x00569D)
        .addFields(
          { name: 'Description', value: matchedCommand.description },
          { name: 'Aliases', value: aliases, inline: true },
          { name: 'Categories', value: commandCategories, inline: true }
        );

      if (matchedCommand.usage) {
        embed.addFields({ name: 'Usage', value: `\`${matchedCommand.usage}\``, inline: false });
      }

      if (matchedCommand.examples && matchedCommand.examples.length > 0) {
        embed.addFields({
          name: 'Examples',
          value: matchedCommand.examples.map(ex => `• \`${ex}\``).join('\n'),
          inline: false,
        });
      }

      await message.reply({ embeds: [embed] });
      return;
    }

    // 3. Not found
    await message.reply({ 
      embeds: [createTextEmbed(0xFF0000, `Could not find any category or command matching **${args[0]}**.\nAvailable categories: ${categoryEnumValues.join(', ')}`)] 
    });
  }
};

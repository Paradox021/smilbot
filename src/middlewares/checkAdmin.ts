import { PermissionFlagsBits } from 'discord.js';
import { Middleware } from '@/types/Middleware';
import { createTextEmbed } from '@/components/embeds';

/**
 * Middleware that allows execution only if the member has
 * Discord Administrator permissions or a role named 'admin' (case-insensitive).
 */
export const checkAdmin: Middleware = async (message, client, args, next) => {
  const member = message.member;
  if (!member) {
    await message.reply({
      embeds: [createTextEmbed(0xff0000, 'This command can only be used in a server.')],
    });
    return;
  }

  const hasAdminPerm = member.permissions.has(PermissionFlagsBits.Administrator);
  const hasAdminRole = member.roles.cache.some(
    (role) => role.name.toLowerCase() === 'admin'
  );

  if (!hasAdminPerm && !hasAdminRole) {
    await message.reply({
      embeds: [
        createTextEmbed(
          0xff0000,
          'You do not have permission to use this command! Administrator privileges required.'
        ),
      ],
    });
    return;
  }

  await next();
};

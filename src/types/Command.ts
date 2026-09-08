import { Client, Message } from 'discord.js';
import { Middleware } from './Middleware';
import { CommandCategory } from './CommandCategory';

/**
 * Command interface
 */
export interface Command {
  name: string;
  description: string;
  usage?: string;
  examples?: string[];
  aliases?: string[];
  categories?: CommandCategory[];
  middlewares?: Middleware[];
  execute: (message: Message, args: string[], client: Client) => Promise<void> | void;
}
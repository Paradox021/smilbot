import { Command } from '@/types/Command';
import { ping } from './fun/ping';
import { play } from './player/play';
import { stop } from './player/stop';
import { balance } from './economy/balance';
import { dailyBalance } from './economy/dailyBalance';
import { getCard } from './economy/getCard';
import { myCards } from './economy/myCards';
import { show } from './economy/show';
import { allCards } from './economy/allCards';
import { createCard } from './economy/createCard';
import { market } from './economy/market';
import { stats } from './economy/stats';
import { top } from './economy/top';
import { help } from './utility/help';

/**
 * List of all commands
 */
export const commandList: Command[] = [
  ping,
  play,
  stop,
  balance,
  dailyBalance,
  stats,
  getCard,
  myCards,
  show,
  allCards,
  createCard,
  market,
  top,
  help,
];
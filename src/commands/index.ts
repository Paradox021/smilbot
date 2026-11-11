import { Command } from '@/types/Command';
import { ping } from './fun/ping';
import { play } from './player/play';
import { stop } from './player/stop';
import { skip } from './player/skip';
import { pause } from './player/pause';
import { resume } from './player/resume';
import { nowPlaying } from './player/nowPlaying';
import { queue } from './player/queue';
import { loop } from './player/loop';
import { shuffle } from './player/shuffle';
import { remove } from './player/remove';
import { clear } from './player/clear';
import { balance } from './economy/balance';
import { dailyBalance } from './economy/dailyBalance';
import { restoreStreak } from './economy/restoreStreak';
import { getCard } from './economy/getCard';
import { myCards } from './economy/myCards';
import { show } from './economy/show';
import { allCards } from './economy/allCards';
import { createCard } from './economy/createCard';
import { market } from './economy/market';
import { sell } from './economy/sell';
import { cancelSale } from './economy/cancelSale';
import { stats } from './economy/stats';
import { top } from './economy/top';
import { help } from './utility/help';

/**
 * List of all commands
 */
export const commandList: Command[] = [
  ping,
  play,
  skip,
  pause,
  resume,
  nowPlaying,
  queue,
  loop,
  shuffle,
  remove,
  clear,
  stop,
  balance,
  dailyBalance,
  restoreStreak,
  stats,
  getCard,
  myCards,
  show,
  allCards,
  createCard,
  market,
  sell,
  cancelSale,
  top,
  help,
];
/** Time the bot stays in the voice channel after the queue ends, so a new `.play` doesn't have to reconnect */
export const LEAVE_ON_END_COOLDOWN_MS = 2 * 60_000;
/** Time the bot stays in the voice channel after everyone else leaves */
export const LEAVE_ON_EMPTY_COOLDOWN_MS = 30_000;

import { Message, SendableChannels } from 'discord.js';
import { Track } from 'discord-player';

/**
 * Metadata stored on each discord-player GuildQueue
 */
export interface MusicQueueMetadata {
  /** Text channel where the music messages are sent */
  channel: SendableChannels;
  /** Current "Now playing" message (the only one with live end time and buttons) */
  nowPlayingMessage?: Message | null;
  /** Song shown in nowPlayingMessage, to turn it into a "Played/Skipped/Stopped" message when it ends */
  nowPlayingTrack?: Track | null;
  /** Label for the current song's message when it stops (set by skip / previous); defaults to "Played" */
  endLabel?: string | null;
}

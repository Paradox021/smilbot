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
  /** Set by skip so the finished message says "Skipped" instead of "Played" */
  skipRequested?: boolean;
}

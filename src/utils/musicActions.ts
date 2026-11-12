import { QueueRepeatMode, Track } from 'discord-player';
import { FINISHED_LABELS, MusicQueue } from '@/utils/musicQueue';
import { nextRepeatMode } from '@/utils/musicFormat';

/**
 * Player actions shared by the message commands and the "Now playing" buttons.
 */

/** Whether there is a song to skip to (with queue loop the current song goes back to the queue) */
export function hasNextTrack(queue: MusicQueue): boolean {
  return queue.tracks.size > 0 || queue.repeatMode === QueueRepeatMode.QUEUE || queue.repeatMode === QueueRepeatMode.AUTOPLAY;
}

export type SkipResult =
  | { ok: true; skipped: Track | null; loopDisabled: boolean }
  | { ok: false; reason: 'no-next' };

/**
 * Skips the current song. Does nothing if there is no next song (use stop for that).
 * If the song was on repeat, repeat is turned off first (otherwise discord-player would play the same song again).
 */
export function skipTrack(queue: MusicQueue): SkipResult {
  if (!hasNextTrack(queue)) return { ok: false, reason: 'no-next' };

  const skipped = queue.currentTrack;
  const loopDisabled = queue.repeatMode === QueueRepeatMode.TRACK;
  if (loopDisabled) queue.setRepeatMode(QueueRepeatMode.OFF);
  // Para que el mensaje de la canción saltada diga "Skipped" en lugar de "Played"
  if (queue.metadata) queue.metadata.endLabel = FINISHED_LABELS.skipped;
  queue.node.skip();
  return { ok: true, skipped, loopDisabled };
}

/** Message shown when there is nothing to skip to */
export const NO_NEXT_TRACK_MESSAGE = 'There is no next song in the queue. Add one with `.play`, or use `.stop` / ⏹️ to stop.';

export type SkipToResult =
  | { ok: true; target: Track; skippedCount: number; loopDisabled: boolean }
  | { ok: false; reason: 'empty' | 'out-of-range' };

/**
 * Jumps to the song at `position` (1-based, as shown in `.queue`), dropping the songs before it.
 */
export function skipToTrack(queue: MusicQueue, position: number): SkipToResult {
  const size = queue.tracks.size;
  if (size === 0) return { ok: false, reason: 'empty' };
  if (!Number.isInteger(position) || position < 1 || position > size) return { ok: false, reason: 'out-of-range' };

  const target = queue.tracks.at(position - 1);
  if (!target) return { ok: false, reason: 'out-of-range' };

  // Con bucle de canción, discord-player volvería a poner la actual en vez de saltar.
  const loopDisabled = queue.repeatMode === QueueRepeatMode.TRACK;
  if (loopDisabled) queue.setRepeatMode(QueueRepeatMode.OFF);
  if (queue.metadata) queue.metadata.endLabel = FINISHED_LABELS.skipped;

  queue.node.skipTo(position - 1);
  return { ok: true, target, skippedCount: position - 1, loopDisabled };
}

/**
 * Plays the previous song again. The current song goes back to the front of the queue.
 * @returns The song that will play, or null if there is no previous song
 */
export async function goToPreviousTrack(queue: MusicQueue): Promise<Track | null> {
  const previous = queue.history.previousTrack;
  if (!previous) return null;

  if (queue.metadata) queue.metadata.endLabel = FINISHED_LABELS.wentBack;
  await queue.history.previous(true);
  return previous;
}

/** Pauses or resumes playback. Returns true if it is paused now. */
export function togglePause(queue: MusicQueue): boolean {
  if (queue.node.isPaused()) {
    queue.node.resume();
    return false;
  }
  queue.node.pause();
  return true;
}

/** Sets the repeat mode, or cycles off → song → queue → off when no mode is given. Returns the new mode. */
export function setLoop(queue: MusicQueue, mode?: QueueRepeatMode): QueueRepeatMode {
  const newMode = mode ?? nextRepeatMode(queue.repeatMode);
  queue.setRepeatMode(newMode);
  return newMode;
}

/** Shuffles the upcoming songs. Returns how many songs were shuffled (0 if there was nothing to shuffle). */
export function shuffleQueue(queue: MusicQueue): number {
  const size = queue.tracks.size;
  if (size < 2) return 0;
  queue.tracks.shuffle();
  return size;
}

/** Stops playback, clears the queue and leaves the voice channel. */
export function stopQueue(queue: MusicQueue): void {
  queue.delete();
}

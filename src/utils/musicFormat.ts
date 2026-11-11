import { QueueRepeatMode } from 'discord-player';

/** Human readable name of a repeat mode */
export function repeatModeLabel(mode: QueueRepeatMode): string {
  switch (mode) {
    case QueueRepeatMode.TRACK:
      return '🔂 Song';
    case QueueRepeatMode.QUEUE:
      return '🔁 Queue';
    case QueueRepeatMode.AUTOPLAY:
      return '♾️ Autoplay';
    default:
      return 'Off';
  }
}

/** Next repeat mode when cycling with the loop button / `.loop` without arguments: off → song → queue → off */
export function nextRepeatMode(mode: QueueRepeatMode): QueueRepeatMode {
  if (mode === QueueRepeatMode.OFF) return QueueRepeatMode.TRACK;
  if (mode === QueueRepeatMode.TRACK) return QueueRepeatMode.QUEUE;
  return QueueRepeatMode.OFF;
}

/** Formats milliseconds as m:ss or h:mm:ss */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

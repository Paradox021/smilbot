import { EmbedBuilder } from 'discord.js';
import { GuildQueue, Track } from 'discord-player';
import { PaginationState, getPageItems } from '@/components/pagination';
import { formatDuration, repeatModeLabel } from '@/utils/musicFormat';

const MUSIC_COLOR = 0x00569D;
const MAX_TITLE_LENGTH = 70;

/**
 * Creates an embed for a song
 * @param color Color of the embed
 * @param title Title of the embed
 * @param song Song to create the embed for
 * @returns EmbedBuilder
 */
export function createSongEmbed(color: number, title: string, song: any): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(`[${song.name || song.title}](${song.url}) - \`${song.formattedDuration || song.duration}\``)
    .setThumbnail(song.thumbnail || null);
}

/** Song title as a markdown link, trimmed and without brackets that would break the link */
export function trackLink(track: Track): string {
  let title = track.title.replace(/[[\]]/g, '');
  if (title.length > MAX_TITLE_LENGTH) title = `${title.slice(0, MAX_TITLE_LENGTH - 1)}…`;
  return `[${title}](${track.url})`;
}

function trackDuration(track: Track): string {
  return track.durationMS > 0 ? formatDuration(track.durationMS) : track.duration;
}

/**
 * Playback status line. Instead of a progress bar (which would only be correct when the message is edited),
 * it uses a Discord relative timestamp: the user's client updates "ends in X" live without editing the message.
 * The message is refreshed on pause/resume so the end time stays correct.
 */
function playbackStatus(queue: GuildQueue, track: Track, paused: boolean): string {
  if (track.live || !(track.durationMS > 0)) return '🔴 Live';

  const total = track.durationMS;
  const position = Math.min(queue.node.getTimestamp()?.current.value ?? 0, total);
  if (paused) return `⏸️ Paused at \`${formatDuration(position)} / ${formatDuration(total)}\``;

  const endsAt = Math.round((Date.now() + total - position) / 1000);
  return `⏱️ \`${formatDuration(total)}\` · ends <t:${endsAt}:R>`;
}

/**
 * Embed for the song that is currently playing, with live end time and queue status
 */
export function createNowPlayingEmbed(queue: GuildQueue, track: Track | null = queue.currentTrack): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(MUSIC_COLOR);
  if (!track) return embed.setTitle('Nothing is playing');

  const paused = queue.node.isPaused();
  const next = queue.tracks.at(0);

  return embed
    .setTitle(paused ? '⏸️ Paused' : '🎶 Now playing')
    .setDescription(`${trackLink(track)}\n${track.author}\n\n${playbackStatus(queue, track, paused)}`)
    .setThumbnail(track.thumbnail || null)
    .addFields(
      { name: 'Requested by', value: track.requestedBy ? `${track.requestedBy}` : '—', inline: true },
      { name: 'Loop', value: repeatModeLabel(queue.repeatMode), inline: true },
      { name: 'Up next', value: next ? `${trackLink(next)} (+${queue.tracks.size - 1} more)` : 'Nothing', inline: false },
    );
}

/**
 * Final state of a "Now playing" message once its song is no longer playing:
 * no live end time and no buttons, just what was played.
 * @param label e.g. "✅ Played", "⏭️ Skipped", "⏹️ Stopped"
 */
export function createFinishedSongEmbed(track: Track, label: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x5A5F66)
    .setTitle(label)
    .setDescription(`${trackLink(track)}\n${track.author} · \`${trackDuration(track)}\``)
    .setThumbnail(track.thumbnail || null)
    .addFields({ name: 'Requested by', value: track.requestedBy ? `${track.requestedBy}` : '—', inline: true });
}

/**
 * Embed with the results of `.search`, numbered to match the select menu
 */
export function createSearchResultsEmbed(query: string, tracks: Track[], expiresInSeconds: number): EmbedBuilder {
  const lines = tracks.map((track, i) => `\`${i + 1}.\` ${trackLink(track)}\n${track.author} · \`${trackDuration(track)}\``);
  return new EmbedBuilder()
    .setColor(MUSIC_COLOR)
    .setTitle(`🔎 Results for "${query.slice(0, 100)}"`)
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: `Choose a song from the menu · expires in ${expiresInSeconds}s` });
}

/**
 * Embed with one page of the queue (current song + upcoming songs)
 * @param queue Guild queue
 * @param state Pagination state over the upcoming songs
 */
export function createQueueEmbed(queue: GuildQueue, state: PaginationState): EmbedBuilder {
  const upcoming = queue.tracks.toArray();
  const current = queue.currentTrack;
  const pageItems = getPageItems(upcoming, state);
  const offset = state.currentPage * state.itemsPerPage;

  const lines: string[] = [];
  if (current) {
    lines.push(`**${queue.node.isPaused() ? '⏸️ Paused' : '🎶 Now playing'}:** ${trackLink(current)} \`${trackDuration(current)}\``, '');
  }

  if (upcoming.length === 0) {
    lines.push('*No more songs in the queue. Add some with `.play`!*');
  } else {
    lines.push('**Up next:**');
    pageItems.forEach((track, i) => {
      const requester = track.requestedBy ? ` · ${track.requestedBy}` : '';
      lines.push(`\`${offset + i + 1}.\` ${trackLink(track)} \`${trackDuration(track)}\`${requester}`);
    });
  }

  const totalMs = upcoming.reduce((sum, track) => sum + (track.durationMS || 0), 0);
  const footer = [
    `Page ${state.currentPage + 1}/${state.totalPages}`,
    `${upcoming.length} song${upcoming.length === 1 ? '' : 's'} queued`,
    `${formatDuration(totalMs)} total`,
    `Loop: ${repeatModeLabel(queue.repeatMode)}`,
  ].join(' · ');

  return new EmbedBuilder()
    .setColor(MUSIC_COLOR)
    .setTitle('📜 Queue')
    .setDescription(lines.join('\n'))
    .setFooter({ text: footer });
}

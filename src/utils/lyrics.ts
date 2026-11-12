import { LrcSearchResult, Player, Track } from 'discord-player';

/** Words that YouTube titles add and that are not part of the song name */
const NOISE_WORDS =
  /\b(official|oficial|music|video|videoclip|audio|lyrics?|letra|visuali[sz]er|hd|hq|4k|remaster(ed)?|live|en vivo|ft\.?|feat\.?|prod\.?)\b/gi;

/**
 * Cleans a YouTube title for a lyrics search:
 * removes (...) / [...] blocks, "| extra" suffixes, "feat. X" and typical noise words.
 */
export function cleanSongTitle(title: string): string {
  return title
    .replace(/\([^)]*\)|\[[^\]]*\]|【[^】]*】/g, ' ')
    .replace(/\s[|｜].*$/, ' ')
    .replace(/\s(ft\.?|feat\.?)\s.*$/i, ' ')
    .replace(NOISE_WORDS, ' ')
    .replace(/["“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cleans a YouTube channel name ("Artist - Topic", "ArtistVEVO", "Artist Official") */
export function cleanArtistName(author: string): string {
  return author
    .replace(/\s*-\s*topic$/i, '')
    .replace(/vevo$/i, '')
    .replace(/\b(official|oficial)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Possible (song, artist) pairs to look up for a track, from most to least likely */
function candidateQueries(track: Track): { trackName?: string; artistName?: string; q?: string }[] {
  const artist = cleanArtistName(track.author);
  const candidates: { trackName?: string; artistName?: string; q?: string }[] = [];

  // "Artista - Canción (Official Video)" → artista y canción del propio título
  const dash = track.title.match(/^(.+?)\s[-–—]\s(.+)$/);
  if (dash) {
    const titleArtist = cleanArtistName(dash[1]);
    const titleSong = cleanSongTitle(dash[2]);
    if (titleSong) candidates.push({ trackName: titleSong, artistName: titleArtist });
    if (titleSong && artist) candidates.push({ trackName: titleSong, artistName: artist });
    if (titleSong) candidates.push({ q: `${titleArtist} ${titleSong}` });
  }

  const song = cleanSongTitle(track.title);
  if (song && artist) candidates.push({ trackName: song, artistName: artist });
  if (song) candidates.push({ q: artist ? `${artist} ${song}` : song });
  if (song) candidates.push({ q: song });

  // Último recurso: solo el nombre de la canción. Sirve para versiones/covers, que suelen
  // compartir letra con la original (el embed indica de qué artista es la letra encontrada).
  const songOnly = dash ? cleanSongTitle(dash[2]) : song;
  if (songOnly) candidates.push({ trackName: songOnly });
  return candidates;
}

/** Picks the best result: with lyrics, and preferably with a duration close to the song's */
function pickBest(results: LrcSearchResult[], durationMs?: number): LrcSearchResult | null {
  const withLyrics = results.filter((r) => !r.instrumental && r.plainLyrics?.trim());
  if (withLyrics.length === 0) return null;
  if (!durationMs || durationMs <= 0) return withLyrics[0];

  // La de duración más parecida (en empate, la primera: LRCLib ordena por relevancia).
  const seconds = durationMs / 1000;
  return withLyrics.reduce((best, r) =>
    Math.abs(r.duration - seconds) < Math.abs(best.duration - seconds) ? r : best,
  );
}

/**
 * Finds the lyrics of a track (current song) using LRCLib.
 */
export async function findLyricsForTrack(player: Player, track: Track): Promise<LrcSearchResult | null> {
  for (const params of candidateQueries(track)) {
    try {
      const best = pickBest(await player.lyrics.search(params), track.durationMS);
      if (best) return best;
    } catch (err) {
      console.warn('Lyrics search failed for', params, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

/**
 * Finds lyrics from free text (`.lyrics <song name>`).
 */
export async function findLyricsByQuery(player: Player, query: string): Promise<LrcSearchResult | null> {
  return pickBest(await player.lyrics.search({ q: query }));
}

/**
 * Splits lyrics into chunks that fit in an embed description (max 4096), cutting at line breaks.
 */
export function splitLyrics(lyrics: string, maxLength = 4000): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const line of lyrics.split('\n')) {
    if (current.length + line.length + 1 > maxLength) {
      if (current) chunks.push(current);
      current = line.slice(0, maxLength);
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

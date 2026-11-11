import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import {
    BaseExtractor,
    ExtractorInfo,
    ExtractorSearchContext,
    ExtractorStreamable,
    Playlist,
    QueryType,
    SearchQueryType,
    Track,
    Util,
} from 'discord-player';
import { musicLog } from '@/utils/musicDebug';

/** Ruta al binario de yt-dlp (en Docker queda en el PATH). */
const YTDLP_PATH = process.env.YTDLP_PATH || 'yt-dlp';
/** Runtime JS que usa yt-dlp para resolver los retos de YouTube (node viene con la imagen). */
const YTDLP_JS_RUNTIME = process.env.YTDLP_JS_RUNTIME || 'node';
/** Fichero de cookies opcional (formato Netscape) por si YouTube pide verificación. */
const YTDLP_COOKIES = process.env.YTDLP_COOKIES;
/**
 * Cliente de YouTube que se prueba primero. Con los clientes por defecto YouTube impone una espera
 * de ~4 s (anuncio del cliente TV) antes de dar el audio; `visionos` empieza en ~1,5 s.
 * Si falla se reintenta con los clientes por defecto de yt-dlp. Vacío = usar siempre los por defecto.
 */
const YTDLP_PLAYER_CLIENT = process.env.YTDLP_PLAYER_CLIENT ?? 'visionos';

/** Máximo de canciones que se cargan de una playlist. */
const PLAYLIST_LIMIT = 100;
/** Tiempo máximo para obtener metadatos (búsqueda, vídeo o playlist). */
const INFO_TIMEOUT_MS = 30_000;
/** Tiempo máximo hasta recibir los primeros bytes de audio. */
const STREAM_START_TIMEOUT_MS = 30_000;
/** Tiempo máximo del intento con el cliente rápido antes de pasar a los clientes por defecto. */
const FAST_CLIENT_TIMEOUT_MS = 15_000;

const YOUTUBE_URL_REGEX = /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\//i;

const SUPPORTED_TYPES: SearchQueryType[] = [
    QueryType.AUTO,
    QueryType.AUTO_SEARCH,
    QueryType.YOUTUBE,
    QueryType.YOUTUBE_SEARCH,
    QueryType.YOUTUBE_VIDEO,
    QueryType.YOUTUBE_PLAYLIST,
];

/** Subconjunto de campos que devuelve `yt-dlp --dump-single-json --flat-playlist`. */
interface YtDlpEntry {
    _type?: 'video' | 'playlist' | 'url';
    id: string;
    title?: string;
    url?: string;
    webpage_url?: string;
    duration?: number | null;
    channel?: string | null;
    uploader?: string | null;
    view_count?: number | null;
    is_live?: boolean | null;
    live_status?: string | null;
    description?: string | null;
    entries?: YtDlpEntry[];
}

/** Argumentos comunes a todas las llamadas a yt-dlp. */
function baseArgs(): string[] {
    const args = ['--no-warnings', '--js-runtimes', YTDLP_JS_RUNTIME];
    if (YTDLP_COOKIES) args.push('--cookies', YTDLP_COOKIES);
    return args;
}

/**
 * Ejecuta `attempt` primero con el cliente rápido de YouTube y, si falla, con los clientes por defecto.
 * Solo se usa en operaciones que extraen un vídeo concreto (las búsquedas y playlists planas no lo necesitan).
 */
async function withFastClient<T>(label: string, attempt: (extraArgs: string[], timeoutMs: number) => Promise<T>, defaultTimeoutMs: number): Promise<T> {
    const start = Date.now();
    if (YTDLP_PLAYER_CLIENT) {
        try {
            const result = await attempt(['--extractor-args', `youtube:player_client=${YTDLP_PLAYER_CLIENT}`], FAST_CLIENT_TIMEOUT_MS);
            musicLog(`yt-dlp ${label}: ok with player_client=${YTDLP_PLAYER_CLIENT} in ${Date.now() - start}ms`);
            return result;
        } catch (err) {
            const reason = err instanceof Error ? err.message.split('\n')[0] : String(err);
            console.warn(`[yt-dlp] player_client=${YTDLP_PLAYER_CLIENT} failed for ${label}, retrying with default clients: ${reason}`);
        }
    }
    const result = await attempt([], defaultTimeoutMs);
    musicLog(`yt-dlp ${label}: ok with default clients in ${Date.now() - start}ms`);
    return result;
}

/** Ejecuta yt-dlp y parsea su salida JSON. */
function runYtDlpJson(args: string[], timeoutMs = INFO_TIMEOUT_MS): Promise<YtDlpEntry> {
    return new Promise((resolve, reject) => {
        const child = spawn(YTDLP_PATH, [...baseArgs(), ...args], { windowsHide: true });
        let stdout = '';
        let stderr = '';

        const timer = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error(`yt-dlp timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
        child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
        child.on('error', (err) => {
            clearTimeout(timer);
            reject(new Error(`Could not run yt-dlp (${YTDLP_PATH}): ${err.message}`));
        });
        child.on('close', (code) => {
            clearTimeout(timer);
            if (code !== 0) {
                reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim()}`));
                return;
            }
            try {
                resolve(JSON.parse(stdout) as YtDlpEntry);
            } catch {
                reject(new Error(`yt-dlp returned invalid JSON: ${stderr.trim()}`));
            }
        });
    });
}

/**
 * Lanza yt-dlp descargando solo el audio hacia stdout.
 * Resuelve cuando llegan los primeros bytes; si yt-dlp falla antes, rechaza con su error
 * para que discord-player lo notifique en lugar de reproducir silencio.
 */
function spawnAudioStream(url: string, extraArgs: string[] = [], timeoutMs = STREAM_START_TIMEOUT_MS): Promise<Readable> {
    return new Promise((resolve, reject) => {
        const child = spawn(
            YTDLP_PATH,
            [
                ...baseArgs(),
                ...extraArgs,
                '--quiet',
                '--no-playlist',
                '-f', 'bestaudio[acodec=opus]/bestaudio/best',
                '-o', '-',
                url,
            ],
            { windowsHide: true },
        );

        let stderr = '';
        let started = false;

        const timer = setTimeout(() => {
            if (started) return;
            child.kill('SIGKILL');
            reject(new Error(`yt-dlp did not start streaming within ${timeoutMs}ms`));
        }, timeoutMs);

        child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));

        // 'readable' también salta al final del stream sin datos: solo damos por iniciado si hay bytes.
        const onReadable = () => {
            if (child.stdout.readableLength === 0) return;
            started = true;
            clearTimeout(timer);
            child.stdout.off('readable', onReadable);
            resolve(child.stdout);
        };
        child.stdout.on('readable', onReadable);

        // Si el reproductor cierra el stream (skip/stop), matamos el proceso.
        child.stdout.once('close', () => {
            if (child.exitCode === null) child.kill('SIGKILL');
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            if (!started) reject(new Error(`Could not run yt-dlp (${YTDLP_PATH}): ${err.message}`));
        });

        child.on('close', (code, signal) => {
            clearTimeout(timer);
            if (!started) {
                reject(new Error(`yt-dlp exited with code ${code}: ${stderr.trim()}`));
            } else if (code !== 0 && signal !== 'SIGKILL') {
                console.error(`[yt-dlp] stream for ${url} ended with code ${code}: ${stderr.trim()}`);
            }
        });
    });
}

/**
 * Extractor de discord-player que usa yt-dlp para buscar y reproducir desde YouTube.
 * También sirve de puente para Spotify/Apple Music: busca la canción en YouTube y la reproduce.
 */
export class YtDlpExtractor extends BaseExtractor {
    static identifier = 'smilbot.ytdlp' as const;

    // Por encima de los extractores por defecto (prioridad 1) para que las búsquedas vayan a YouTube.
    public priority = 10;

    async validate(query: string, type?: SearchQueryType | null): Promise<boolean> {
        if (typeof query !== 'string' || !query.trim()) return false;
        if (!type) return true;
        return SUPPORTED_TYPES.includes(type);
    }

    async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> {
        const isUrl = YOUTUBE_URL_REGEX.test(query);
        const isPlaylist = context.type === QueryType.YOUTUBE_PLAYLIST || (isUrl && /[?&]list=/.test(query));

        if (isUrl && isPlaylist) {
            const data = await runYtDlpJson([
                '--flat-playlist',
                '--dump-single-json',
                '--playlist-end', String(PLAYLIST_LIMIT),
                query,
            ]);
            return this.buildPlaylistResponse(data, context);
        }

        if (isUrl) {
            const data = await withFastClient(
                query,
                (extraArgs, timeoutMs) =>
                    runYtDlpJson([...extraArgs, '--flat-playlist', '--dump-single-json', '--no-playlist', query], timeoutMs),
                INFO_TIMEOUT_MS,
            );
            return this.createResponse(null, [this.buildTrack(data, context)]);
        }

        const start = Date.now();
        const results = await this.search(query, 5);
        musicLog(`yt-dlp search "${query}": ${results.length} results in ${Date.now() - start}ms`);
        return this.createResponse(null, results.map((entry) => this.buildTrack(entry, context)));
    }

    async stream(track: Track): Promise<ExtractorStreamable> {
        return this.openAudio(track.url);
    }

    /** Recibe canciones de otros extractores (p. ej. Spotify) y las reproduce desde YouTube. */
    async bridge(track: Track): Promise<ExtractorStreamable | null> {
        const [match] = await this.search(this.createBridgeQuery(track), 1);
        if (!match) return null;
        return this.openAudio(this.entryUrl(match));
    }

    private openAudio(url: string): Promise<Readable> {
        return withFastClient(url, (extraArgs, timeoutMs) => spawnAudioStream(url, extraArgs, timeoutMs), STREAM_START_TIMEOUT_MS);
    }

    async getRelatedTracks(): Promise<ExtractorInfo> {
        return this.createResponse(null, []);
    }

    private async search(query: string, limit: number): Promise<YtDlpEntry[]> {
        const data = await runYtDlpJson(['--flat-playlist', '--dump-single-json', `ytsearch${limit}:${query}`]);
        return (data.entries ?? []).filter((entry) => entry.id);
    }

    private buildPlaylistResponse(data: YtDlpEntry, context: ExtractorSearchContext): ExtractorInfo {
        const playlist = new Playlist(this.context.player, {
            id: data.id,
            title: data.title ?? 'YouTube playlist',
            description: data.description ?? '',
            thumbnail: '',
            type: 'playlist',
            source: 'youtube',
            author: { name: data.channel ?? data.uploader ?? 'YouTube', url: '' },
            url: data.webpage_url ?? `https://www.youtube.com/playlist?list=${data.id}`,
            tracks: [],
            rawPlaylist: data,
        });

        const tracks = (data.entries ?? [])
            .filter((entry) => entry.id)
            .map((entry) => {
                const track = this.buildTrack(entry, context);
                track.playlist = playlist;
                return track;
            });

        playlist.tracks = tracks;
        if (tracks[0]) playlist.thumbnail = tracks[0].thumbnail;

        return this.createResponse(playlist, tracks);
    }

    private buildTrack(entry: YtDlpEntry, context: ExtractorSearchContext): Track {
        const durationMs = (entry.duration ?? 0) * 1000;
        const live = entry.is_live === true || entry.live_status === 'is_live';

        const track = new Track(this.context.player, {
            title: entry.title ?? 'Unknown title',
            description: entry.description ?? '',
            author: entry.channel ?? entry.uploader ?? 'Unknown',
            url: this.entryUrl(entry),
            thumbnail: `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
            duration: live ? 'LIVE' : Util.buildTimeCode(Util.parseMS(durationMs)),
            views: entry.view_count ?? 0,
            requestedBy: context.requestedBy ?? null,
            source: 'youtube',
            queryType: QueryType.YOUTUBE_VIDEO,
            live,
            raw: entry,
        });
        track.extractor = this;
        return track;
    }

    private entryUrl(entry: YtDlpEntry): string {
        if (entry.webpage_url) return entry.webpage_url;
        if (entry.url && YOUTUBE_URL_REGEX.test(entry.url)) return entry.url;
        return `https://www.youtube.com/watch?v=${entry.id}`;
    }
}

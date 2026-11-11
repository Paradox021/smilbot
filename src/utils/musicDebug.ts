import { monitorEventLoopDelay } from 'node:perf_hooks';
import { Player } from 'discord-player';

/** Activo con MUSIC_DEBUG=1 en el .env. */
export const MUSIC_DEBUG = process.env.MUSIC_DEBUG === '1' || process.env.MUSIC_DEBUG === 'true';

function log(message: string): void {
    console.log(`[music ${new Date().toISOString().slice(11, 23)}] ${message}`);
}

/** Registro de diagnóstico de música (solo si MUSIC_DEBUG está activo). */
export function musicLog(message: string): void {
    if (MUSIC_DEBUG) log(message);
}

/** Estadísticas del intervalo entre paquetes de voz enviados, por servidor */
interface PacketTimingStats {
    last: number;
    count: number;
    max: number;
    late30: number;
    late40: number;
    burst: number;
}

const packetTiming = new Map<string, PacketTimingStats>();

/**
 * Mide el intervalo entre paquetes de voz que salen hacia Discord (deberían ser 20 ms exactos).
 * Si salen a trompicones (uno tarde y el siguiente pegado), el oyente nota microcortes aunque
 * el total de audio enviado cuadre. Solo en modo diagnóstico: parchea VoiceConnection.dispatchAudio.
 */
function instrumentPacketTiming(): void {
    try {
        // discord-voip es una dependencia de discord-player; solo se usa aquí, para diagnóstico.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const voip = require('discord-voip') as {
            VoiceConnection: { prototype: { dispatchAudio: () => boolean; joinConfig?: { guildId: string } } };
        };
        const proto = voip.VoiceConnection.prototype;
        const original = proto.dispatchAudio;
        proto.dispatchAudio = function patchedDispatchAudio(this: { joinConfig: { guildId: string } }) {
            const sent = original.call(this);
            if (sent) {
                const now = performance.now();
                const id = this.joinConfig.guildId;
                const stats = packetTiming.get(id);
                if (!stats) {
                    packetTiming.set(id, { last: now, count: 0, max: 0, late30: 0, late40: 0, burst: 0 });
                } else {
                    const interval = now - stats.last;
                    stats.last = now;
                    // Un hueco de más de 1 s es una pausa o un cambio de canción, no jitter.
                    if (interval < 1000) {
                        stats.count++;
                        stats.max = Math.max(stats.max, interval);
                        if (interval > 30) stats.late30++;
                        if (interval > 40) stats.late40++;
                        if (interval < 10) stats.burst++;
                    }
                }
            }
            return sent;
        };
        log('packet timing instrumentation enabled');
    } catch (err) {
        log(`packet timing instrumentation unavailable: ${err instanceof Error ? err.message : String(err)}`);
    }
}

/** Devuelve y reinicia las estadísticas de intervalo entre paquetes de un servidor */
export function takePacketTiming(guildId: string): string | null {
    const stats = packetTiming.get(guildId);
    if (!stats || stats.count === 0) return null;
    const summary =
        `packets=${stats.count} maxInterval=${stats.max.toFixed(1)}ms ` +
        `>30ms=${stats.late30} >40ms=${stats.late40} bursts(<10ms)=${stats.burst}`;
    packetTiming.set(guildId, { last: stats.last, count: 0, max: 0, late30: 0, late40: 0, burst: 0 });
    return summary;
}

/**
 * Activa los logs de diagnóstico de música:
 * - Eventos de depuración de discord-player (conexión de voz, creación del stream, estados del reproductor).
 * - Retraso del event loop mientras suena algo: Discord necesita un paquete de audio cada 20 ms,
 *   así que bloqueos de más de ~20 ms pueden provocar cortes o chasquidos.
 */
export function setupMusicDebug(player: Player): void {
    if (!MUSIC_DEBUG) return;

    player.on('debug', (message) => log(`player: ${message}`));
    player.events.on('debug', (queue, message) => log(`queue ${queue.guild.name}: ${message}`));

    instrumentPacketTiming();

    const histogram = monitorEventLoopDelay({ resolution: 10 });
    histogram.enable();

    // Audio enviado por cola en la ventana anterior, para detectar huecos (el bot deja de enviar audio).
    const lastPlayback = new Map<string, { resource: unknown; playbackMs: number; at: number }>();
    const pausedInWindow = new Set<string>();
    player.events.on('playerPause', (queue) => {
        pausedInWindow.add(queue.id);
        log(`queue ${queue.guild.name}: paused`);
    });
    player.events.on('playerResume', (queue) => {
        pausedInWindow.add(queue.id);
        log(`queue ${queue.guild.name}: resumed`);
    });
    // Por qué termina o se interrumpe una canción
    player.events.on('playerFinish', (queue, track) => log(`queue ${queue.guild.name}: finished "${track.title}"`));
    player.events.on('playerSkip', (queue, track, reason, description) =>
        log(`queue ${queue.guild.name}: skipped "${track.title}" reason=${reason} ${description ?? ''}`));
    player.events.on('emptyChannel', (queue) => log(`queue ${queue.guild.name}: voice channel is empty (leave cooldown started)`));
    player.events.on('disconnect', (queue) => log(`queue ${queue.guild.name}: bot was disconnected from the voice channel`));
    player.events.on('queueDelete', (queue) => log(`queue ${queue.guild.name}: queue deleted (stop / leave)`));

    setInterval(() => {
        const playing = player.nodes.cache.some((queue) => queue.isPlaying());
        if (playing) {
            const ms = (ns: number) => (ns / 1e6).toFixed(1);
            log(
                `event loop delay (10s): p50=${ms(histogram.percentile(50))}ms ` +
                `p99=${ms(histogram.percentile(99))}ms max=${ms(histogram.max)}ms`,
            );
        }
        histogram.reset();

        for (const queue of player.nodes.cache.values()) {
            const dispatcher = queue.dispatcher;
            const resource = dispatcher?.audioResource;
            if (!dispatcher || !resource) {
                lastPlayback.delete(queue.id);
                continue;
            }
            const state = dispatcher.audioPlayer.state;
            const missed = 'missedFrames' in state ? state.missedFrames : 0;
            const now = Date.now();
            const prev = lastPlayback.get(queue.id);
            lastPlayback.set(queue.id, { resource, playbackMs: resource.playbackDuration, at: now });
            if (!prev || prev.resource !== resource) continue; // nueva canción: aún no hay ventana completa

            const wallMs = now - prev.at;
            const sentMs = resource.playbackDuration - prev.playbackMs;
            const hadPause = pausedInWindow.delete(queue.id) || state.status !== 'playing';
            const gapMs = hadPause ? 0 : wallMs - sentMs;
            log(
                `audio ${queue.guild.name}: status=${state.status} sent=${sentMs}ms of ${wallMs}ms` +
                `${hadPause ? ' (paused during window)' : ''}` +
                `${gapMs > 200 ? ` ⚠️ GAP ${gapMs}ms without audio` : ''} missedFrames=${missed} ` +
                `position=${Math.round(resource.playbackDuration / 1000)}s`,
            );
            const timing = takePacketTiming(queue.guild.id);
            if (timing) log(`packets ${queue.guild.name}: ${timing}`);
        }
    }, 10_000).unref();

    log('music debug enabled');
}

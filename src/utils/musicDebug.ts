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

    const histogram = monitorEventLoopDelay({ resolution: 10 });
    histogram.enable();
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
    }, 10_000).unref();

    log('music debug enabled');
}

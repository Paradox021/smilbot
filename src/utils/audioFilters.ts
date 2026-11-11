import { AudioFilters, QueueFilters } from 'discord-player';

/**
 * Filtro FFmpeg que baja 3 dB el audio antes de convertirlo a PCM de 16 bits.
 * Muchos másters de YouTube tienen picos por encima de 0 dBFS al decodificarse (hasta +2 dB),
 * lo que provoca clipping (distorsión) en las canciones más fuertes. Con -3 dB desaparece.
 */
export const HEADROOM_FILTER = 'headroom' as keyof QueueFilters;

/** Registra los filtros propios en discord-player. Llamar una vez al arrancar. */
export function registerAudioFilters(): void {
    AudioFilters.define(HEADROOM_FILTER, 'volume=-3dB');
}

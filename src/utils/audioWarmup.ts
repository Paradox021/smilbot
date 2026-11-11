import { PassThrough } from 'node:stream';
import { FFmpeg } from '@discord-player/ffmpeg';
import { OpusEncoder } from '@discord-player/opus';

/**
 * Precalienta la cadena de audio al arrancar (detección de FFmpeg y codificador Opus),
 * para que su coste de inicialización no recaiga en el primer `.play`
 * (se observó un bloqueo de ~3 s solo en la primera reproducción tras arrancar).
 */
export async function warmUpAudio(): Promise<void> {
    const start = Date.now();
    try {
        FFmpeg.resolve();

        // Codifica unos paquetes de silencio con el mismo codificador que usa el reproductor.
        const encoder = new OpusEncoder({ rate: 48000, channels: 2, frameSize: 960 });
        const input = new PassThrough();
        input.pipe(encoder);
        const frames = 5;
        const done = new Promise<void>((resolve) => {
            let packets = 0;
            encoder.on('data', () => {
                if (++packets >= frames) resolve();
            });
            setTimeout(resolve, 5_000).unref();
        });
        input.write(Buffer.alloc(960 * 2 * 2 * frames));
        await done;
        input.end();
        encoder.destroy();

        console.log(`Audio warm-up done in ${Date.now() - start}ms`);
    } catch (err) {
        console.warn('Audio warm-up failed (music will still work):', err);
    }
}

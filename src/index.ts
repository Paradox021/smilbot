import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { registerAllEvents } from '@/events';
import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { YtDlpExtractor } from '@/extractors/YtDlpExtractor';
import { registerAudioFilters } from '@/utils/audioFilters';
import { setupMusicDebug } from '@/utils/musicDebug';
import { warmUpAudio } from '@/utils/audioWarmup';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Crea la instancia de discord-player
const player = new Player(client);

// Filtros FFmpeg propios (margen de volumen para evitar clipping)
registerAudioFilters();

// Logs de diagnóstico de música (MUSIC_DEBUG=1)
setupMusicDebug(player);

// Inicializa FFmpeg y el codificador Opus antes del primer .play
void warmUpAudio();

// YouTube vía yt-dlp (búsquedas por texto, vídeos y playlists). También hace de puente para
// Spotify/Apple Music. Los extractores por defecto ya no incluyen YouTube.
player.extractors.register(YtDlpExtractor, {}).catch(console.error);
// Resto de extractores por defecto (Spotify, SoundCloud, Apple Music, adjuntos...)
player.extractors.loadMulti(DefaultExtractors).catch(console.error);

client.player = player;

if (!client.player) {
  throw new Error('Player instance is not set up.');
}

// Registra todos los eventos en una sola llamada
registerAllEvents(client, player);

client.login(process.env.TOKEN).catch(console.error);
import { ButtonInteraction, Client, Interaction, MessageFlags } from 'discord.js';
import { createNowPlayingEmbed, createQueueEmbed, createTextEmbed, trackLink } from '@/components/embeds';
import {
  MUSIC_QUEUE_PREFIX,
  MusicControlAction,
  createMusicControlButtons,
  createQueueButtons,
  parseMusicControlCustomId,
} from '@/components/buttons';
import { createPaginationState, goToPage, parsePaginationCustomId } from '@/components/pagination';
import { MusicQueueMetadata } from '@/types/MusicQueueMetadata';
import { MusicQueue, MUSIC_COLOR, MUSIC_ERROR_COLOR, QUEUE_ITEMS_PER_PAGE, resolveControllableQueue } from '@/utils/musicQueue';
import { NO_NEXT_TRACK_MESSAGE, setLoop, shuffleQueue, skipTrack, stopQueue, togglePause } from '@/utils/musicActions';
import { musicLog } from '@/utils/musicDebug';

/** Refreshes the "Now playing" message the button belongs to */
function refreshNowPlaying(interaction: ButtonInteraction, queue: MusicQueue) {
  return interaction.update({
    embeds: [createNowPlayingEmbed(queue)],
    components: [createMusicControlButtons(queue)],
  });
}

/**
 * Handles the player control buttons of the "Now playing" message
 */
async function handleControlButton(interaction: ButtonInteraction, client: Client, action: MusicControlAction): Promise<void> {
  musicLog(`button "${action}" pressed by ${interaction.user.tag}`);
  const member = interaction.inCachedGuild() ? interaction.member : null;
  const result = resolveControllableQueue(member, client, interaction.guildId);
  if ('error' in result) {
    await interaction.reply({ embeds: [createTextEmbed(MUSIC_ERROR_COLOR, result.error)], flags: MessageFlags.Ephemeral });
    return;
  }
  const { queue } = result;
  const user = interaction.user;

  switch (action) {
    case 'pause':
      // El mensaje lo actualizan los eventos playerPause/playerResume (igual que con .pause/.resume).
      await interaction.deferUpdate();
      togglePause(queue);
      return;

    case 'loop':
      setLoop(queue);
      await refreshNowPlaying(interaction, queue);
      return;

    case 'shuffle': {
      const count = shuffleQueue(queue);
      if (count === 0) {
        await interaction.reply({
          embeds: [createTextEmbed(MUSIC_ERROR_COLOR, 'There are not enough songs in the queue to shuffle.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await refreshNowPlaying(interaction, queue);
      await interaction.followUp({ embeds: [createTextEmbed(MUSIC_COLOR, `🔀 ${user} shuffled ${count} songs.`)] });
      return;
    }

    case 'skip': {
      const skip = skipTrack(queue);
      if (!skip.ok) {
        await interaction.reply({ embeds: [createTextEmbed(MUSIC_ERROR_COLOR, NO_NEXT_TRACK_MESSAGE)], flags: MessageFlags.Ephemeral });
        return;
      }
      const loopNote = skip.loopDisabled ? '\n*Song loop was turned off.*' : '';
      await interaction.reply({
        embeds: [createTextEmbed(MUSIC_COLOR, `⏭️ ${user} skipped ${skip.skipped ? trackLink(skip.skipped) : 'the song'}${loopNote}`)],
      });
      return;
    }

    case 'stop':
      await interaction.reply({ embeds: [createTextEmbed(MUSIC_COLOR, `⏹️ ${user} stopped the music and cleared the queue.`)] });
      stopQueue(queue);
      return;
  }
}

/**
 * Handles the page buttons of `.queue`. The queue is read again so the page is always up to date.
 */
async function handleQueuePage(interaction: ButtonInteraction, client: Client, targetPage: number): Promise<void> {
  const queue = interaction.guildId ? client.player.nodes.get<MusicQueueMetadata>(interaction.guildId) : null;
  if (!queue || !queue.currentTrack) {
    await interaction.update({ embeds: [createTextEmbed(MUSIC_ERROR_COLOR, 'Nothing is playing right now.')], components: [] });
    return;
  }

  const state = goToPage(createPaginationState(queue.tracks.toArray(), QUEUE_ITEMS_PER_PAGE), targetPage);
  await interaction.update({ embeds: [createQueueEmbed(queue, state)], components: createQueueButtons(state) });
}

/**
 * Main router for music interactions
 */
export async function handleMusicInteraction(interaction: Interaction, client: Client): Promise<boolean> {
  if (!interaction.isButton()) return false;

  const action = parseMusicControlCustomId(interaction.customId);
  if (action) {
    await handleControlButton(interaction, client, action);
    return true;
  }

  const page = parsePaginationCustomId(interaction.customId);
  if (page && page.prefix === MUSIC_QUEUE_PREFIX) {
    await handleQueuePage(interaction, client, page.targetPage);
    return true;
  }

  return false;
}

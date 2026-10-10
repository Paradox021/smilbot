import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  Client,
  Interaction,
  MessageFlags,
} from 'discord.js';
import { marketService, MarketOffer, getApiErrorMessage } from '@/services/marketService';
import {
  createMarketListEmbed,
  createEmptyMarketEmbed,
  createPurchaseResultEmbed,
} from '@/components/embeds';
import {
  createMarketComponents,
  MARKET_BUTTON_PREFIXES,
  parseMarketCustomId,
} from '@/components/buttons';
import { createPaginationState, goToPage } from '@/components/pagination';

const ITEMS_PER_PAGE = 10;

// Store selected offer per user per message
// Key: `${userId}_${messageId}` Value: offerId
const selectedOffers = new Map<string, string>();

/**
 * Gets the selection key for tracking selected offers
 */
function getSelectionKey(userId: string, messageId: string): string {
  return `${userId}_${messageId}`;
}

/**
 * Handles opening the market (initial button click)
 */
export async function handleOpenMarket(
  interaction: ButtonInteraction,
  client: Client
): Promise<void> {
  const serverId = interaction.guildId;

  if (!serverId) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const offers = await marketService.getAllOffers(serverId);

  if (offers.length === 0) {
    await interaction.reply({
      embeds: [createEmptyMarketEmbed()],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const state = createPaginationState(offers, ITEMS_PER_PAGE);
  const embed = createMarketListEmbed(offers, state);
  const components = createMarketComponents(offers, state, serverId, null);

  await interaction.reply({
    embeds: [embed],
    components,
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * Handles market pagination
 */
export async function handleMarketPagination(
  interaction: ButtonInteraction,
  serverId: string,
  targetPage: number
): Promise<void> {
  const offers = await marketService.getAllOffers(serverId);

  if (offers.length === 0) {
    await interaction.update({
      embeds: [createEmptyMarketEmbed()],
      components: [],
    });
    return;
  }

  const state = goToPage(createPaginationState(offers, ITEMS_PER_PAGE), targetPage);
  const embed = createMarketListEmbed(offers, state);

  // Clear selection when changing pages
  const selectionKey = getSelectionKey(interaction.user.id, interaction.message.id);
  selectedOffers.delete(selectionKey);

  const components = createMarketComponents(offers, state, serverId, null);

  await interaction.update({
    embeds: [embed],
    components,
  });
}

/**
 * Handles offer selection from dropdown
 */
export async function handleMarketSelect(
  interaction: StringSelectMenuInteraction,
  serverId: string,
  currentPage: number
): Promise<void> {
  const selectedOfferId = interaction.values[0];

  if (selectedOfferId === 'none') {
    return;
  }

  // Store the selection
  const selectionKey = getSelectionKey(interaction.user.id, interaction.message.id);
  selectedOffers.set(selectionKey, selectedOfferId);

  // Refresh the market view with buy button enabled
  const offers = await marketService.getAllOffers(serverId);
  const state = goToPage(createPaginationState(offers, ITEMS_PER_PAGE), currentPage);
  const embed = createMarketListEmbed(offers, state);
  const components = createMarketComponents(offers, state, serverId, selectedOfferId);

  await interaction.update({
    embeds: [embed],
    components,
  });
}

/**
 * Handles buying an offer
 */
export async function handleMarketBuy(
  interaction: ButtonInteraction,
  serverId: string,
  offerId: string
): Promise<void> {
  const buyerId = interaction.user.id;

  // Get offer details before purchase
  let offer: MarketOffer | null;
  try {
    offer = await marketService.getOfferById(serverId, offerId);
  } catch (error) {
    await interaction.update({
      embeds: [
        createPurchaseResultEmbed(
          null,
          false,
          getApiErrorMessage(error, 'Failed to load the offer. Please try again.')
        ),
      ],
      components: [],
    });
    return;
  }

  if (!offer || (offer.status && offer.status !== 'ACTIVE')) {
    await interaction.update({
      embeds: [createPurchaseResultEmbed(null, false, 'This offer is no longer available.')],
      components: [],
    });
    return;
  }

  // Check if user is trying to buy their own card
  if (offer.seller.discordId === buyerId) {
    await interaction.reply({
      embeds: [createPurchaseResultEmbed(null, false, 'You cannot buy your own card.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await marketService.buyOffer({
      serverId,
      offerId,
      discordId: buyerId,
      username: interaction.user.username,
    });

    // Clear selection
    const selectionKey = getSelectionKey(interaction.user.id, interaction.message.id);
    selectedOffers.delete(selectionKey);

    await interaction.update({
      embeds: [
        createPurchaseResultEmbed(
          offer,
          true,
          `You purchased **${offer.cardId.name}** for ${offer.price} coins!`
        ),
      ],
      components: [],
    });
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to complete purchase. Please try again.');
    await interaction.update({
      embeds: [createPurchaseResultEmbed(null, false, message)],
      components: [],
    });
  }
}

/**
 * Main router for market interactions
 */
export async function handleMarketInteraction(
  interaction: Interaction,
  client: Client
): Promise<boolean> {
  // Handle open market button
  if (interaction.isButton() && interaction.customId === 'openMarket') {
    await handleOpenMarket(interaction, client);
    return true;
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const parsed = parseMarketCustomId(interaction.customId);
    if (!parsed) return false;

    switch (parsed.type) {
      case 'page':
        if (parsed.serverId && parsed.page !== undefined) {
          await handleMarketPagination(interaction, parsed.serverId, parsed.page);
          return true;
        }
        break;
      case 'buy':
        if (parsed.serverId && parsed.offerId) {
          await handleMarketBuy(interaction, parsed.serverId, parsed.offerId);
          return true;
        }
        break;
    }
  }

  // Handle select menu interactions
  if (interaction.isStringSelectMenu()) {
    const customId = interaction.customId;
    if (customId.startsWith(MARKET_BUTTON_PREFIXES.SELECT)) {
      const parts = customId.split('_');
      const serverId = parts[1];
      const page = parseInt(parts[2], 10) || 0;
      await handleMarketSelect(interaction, serverId, page);
      return true;
    }
  }

  return false;
}

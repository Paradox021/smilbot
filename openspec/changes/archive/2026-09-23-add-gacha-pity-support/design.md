## Context

The backend API has incorporated a deterministic Gacha Pity System (`user.pityCount >= 250` grants a guaranteed Mythic card, resets counter to 0, and records telemetry). The payloads for `POST /user/:discordId/card/random` and `GET /user/:discordId/stats` now return pity information:
- Card roll returns `isPity: boolean`, `roll: number | null`, and `pity: { current, threshold, remaining }`.
- Stats returns `pity: { pullsSinceLastMythic, pityThreshold, pullsUntilGuaranteed, pityMythicsCount }`, and `luck.breakdown.pityMythics`.

This design outlines the client-side presentation in Smilbot's Discord interactions.

## Goals / Non-Goals

**Goals:**
- Update TypeScript types (`Card`, `UserStats`, `UserLuckStats`, `RarityBreakdown`) with optional pity telemetry fields.
- Adapt `createCardEmbed` and `getCard.ts` to prominently highlight pity-awarded pulls in English and display current pity progress in the embed footer.
- Integrate pity metrics into `stats.ts` (`✨ Gacha Pity` or integrated fields) showing streak without mythic, pulls remaining, and lifetime pity mythics.
- Display neutralized pity mythics in the Gacha Luck breakdown where applicable.
- Update the centralized Obsidian Vault documentation (`smilbot-vault`).

**Non-Goals:**
- Modifying backend logic or MongoDB schemas (already deployed in backend).
- Changing gacha pull prices or odds calculation in the bot.

## Decisions

### 1. Presentation for Pity Pulls in `.getcard`
- **Choice**: When `card.isPity === true`:
  - Send message text (`content`): `🌟 **Smilbot took pity on your bad luck and granted you a guaranteed Mythic card!**`
  - Keep the card embed 100% clean and authentic (`card.name`, `card.description`, clean artwork, and footer: `Rarity: Mythic | Author: {author}`), avoiding visual clutter or redundant pity labels on the collectible card itself.
  - Pity progress telemetry is tracked and visualized in detail via the `.stats` command.
- **Alternative considered**: Embedding pity labels and reset counters inside the card embed. *Rejected* based on Discord UI testing because it clutters the collectible card aesthetic and is redundant with the announcement text.

### 2. Pity Integration in `.stats`
- **Choice**: Add a dedicated embed field `✨ Gacha Pity` (inline: true, alongside Cards & Market) or integrate within the cards section. Having a dedicated field or clear sub-items makes the pity progress immediately scannable.
- **Luck Neutralization note**: When `breakdown.pityMythics > 0`, append a note in the luck breakdown so players know why their luck score is unaffected by pity mythics.

### 3. Graceful Fallbacks & Backward Compatibility
- Make all pity fields optional in TypeScript definitions (`card.pity?`, `userStats.pity?`). If the bot connects to an instance or mock where pity data is absent, default gracefully without runtime errors or `undefined` labels.

## Risks / Trade-offs

- **[Risk]** Missing or null `pity` object on legacy payloads or catalog endpoints (`/card`).
  - **Mitigation:** Use nullish coalescing (`card.pity?.current ?? 0`) and conditional formatting in `createCardEmbed` so static catalog views (e.g. `.allcards`, `.show`) are completely unaffected.
- **[Risk]** Embed character limits or clutter.
  - **Mitigation:** Keep pity status in `.getcard` concisely in the footer / short highlight description, preserving the existing card artwork visibility.

## Why

The backend gacha engine now implements a deterministic **Pity System** guaranteeing a Mythic card (`type: 4`) after 250 consecutive pulls without obtaining one. Smilbot needs to support and reflect the new pity telemetry in the Discord bot's user experience: alerting users when a card was granted via Pity in `.getcard`, displaying pity progress and counters in `.stats`, and updating model contracts/interfaces to match the backend payload.

## What Changes

- **Pity Notification & Progress in `.getcard`**: When a card roll is triggered by pity (`isPity: true`), display a prominent notice/description celebrating that Smilbot had pity on the user with a guaranteed Mythic card. Display current pity progress (`current/threshold` or remaining pulls) in pull responses.
- **Pity Metrics in `.stats`**: Add pity tracking metrics into the `.stats` embed, showing the current streak without a Mythic (`pullsSinceLastMythic`/`pityThreshold`), remaining pulls until guaranteed Mythic, and lifetime pity Mythics obtained.
- **Neutralized Luck Breakdown**: Reflect `pityMythics` in user luck stats and breakdown, matching the backend's luck calculation where pity mythics are neutralized from random luck.
- **Type Interfaces & Services**: Update `Card`, `UserStats`, `UserLuckStats`, and `RarityBreakdown` interfaces to include pity fields (`isPity`, `pity`, `pityMythicsCount`, `pityMythics`).
- **Obsidian Documentation**: Update `Bot Discord/Comandos de Economia.md` and `Bot Discord/Componentes de UI.md` in the centralized Obsidian Vault (`smilbot-vault`).

## Capabilities

### New Capabilities
- `gacha-pull-pity`: Displays pity status, custom messaging when a Mythic is awarded via pity, and pity counter progress in the card pull command (`.getcard`).

### Modified Capabilities
- `user-luck-stats`: Extends the economic profile and luck breakdown in `.stats` to include the user's pity counters and breakdown of pity-awarded mythics.

## Impact

- **Affected Commands**: `src/commands/economy/getCard.ts`, `src/commands/economy/stats.ts`.
- **Affected Services & Types**: `src/services/cardService.ts`, `src/services/userService.ts`, `src/services/leaderboardService.ts`.
- **Affected Embeds/Components**: `src/components/embeds/CardEmbeds.ts`.
- **Documentation**: Obsidian Vault `smilbot-vault` (`Bot Discord/Comandos de Economia.md`, `Bot Discord/Componentes de UI.md`).

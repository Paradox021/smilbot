## 1. Type Interfaces & Services

- [x] 1.1 Update `Card` interface in `src/services/cardService.ts` to include optional `roll?: number | null`, `isPity?: boolean`, and `pity?: { current: number; threshold: number; remaining: number }`, and verify type check passes.
- [x] 1.2 Update `UserStats`, `UserLuckStats`, and `RarityBreakdown` in `src/services/userService.ts` and `src/services/leaderboardService.ts` to include `pity`, `pityMythicsCount`, and `pityMythics`, and verify type check passes.

## 2. Gacha Pull UI & Command (`.getcard`)

- [x] 2.1 Update `createCardEmbed` in `src/components/embeds/CardEmbeds.ts` and `.getcard` in `src/commands/economy/getCard.ts` to highlight pity trigger events in English (`✨ Pity Triggered! Smilbot took pity on you and granted a guaranteed Mythic card!`) and display pity progress in the embed footer.

## 3. User Statistics Command (`.stats`)

- [x] 3.1 Update `src/commands/economy/stats.ts` to add pity tracking fields (`pullsSinceLastMythic`, `pityThreshold`, `pullsUntilGuaranteed`, `pityMythicsCount`) and display neutralized pity mythics in the Gacha Luck breakdown.

## 4. Documentation & Verification

- [x] 4.1 Update centralized Obsidian Vault documentation in `Bot Discord/Comandos de Economia.md` and `Bot Discord/Componentes de UI.md` with pity details and contracts.
- [x] 4.2 Run TypeScript compiler / build check (`npm run build` or `npx tsc --noEmit`) to verify zero errors across the project.

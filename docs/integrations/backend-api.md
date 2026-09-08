# 🔌 Integración con Backend API REST

Smilbot se comunica con la API REST del backend a través de instancias tipadas de `Axios` (`src/services/`).

La variable de entorno `BACKEND_URL` en `.env` define el host base de la API.

---

## 1. Servicios y Endpoints Consumidos

### A. Usuario y Estadísticas (`userService.ts`)

| Endpoint | Método | Descripción | Retorno |
| :--- | :--- | :--- | :--- |
| `/user` | `POST` | Crea un usuario inicial si no existe | `{ ok: boolean }` (409 si ya existe) |
| `/user/:discordId` | `GET` | Obtiene los datos básicos del usuario | `User` (balance, id, username) |
| `/user/:discordId/cards` | `GET` | Obtiene el usuario con cartas pobladas | `UserWithCards` |
| `/user/:discordId/stats` | `GET` | Estadísticas acumuladas, rachas y suerte gacha | `UserStats` (con objeto `luck`) |

#### Formato de Respuesta de `GET /user/:discordId/stats`:
```json
{
  "discordId": "123456789012345678",
  "username": "Gamer123",
  "balance": 650,
  "dailyStreak": 11,
  "maxDailyStreak": 11,
  "previousMaxStreak": 10,
  "totalDailiesClaimed": 42,
  "totalCoinsEarned": 5400,
  "totalCoinsSpent": 4750,
  "cardsCount": 35,
  "cardsOpenedCount": 30,
  "marketSalesCount": 5,
  "luck": {
    "totalCards": 35,
    "luckPercentage": 138.5,
    "luckDelta": "+38.5%",
    "tier": "Lucky",
    "tierCode": "LUCKY",
    "eligibleForLeaderboard": true,
    "breakdown": {
      "common": 18,
      "rare": 11,
      "epic": 4,
      "legendary": 2,
      "mythic": 0
    }
  }
}
```

### B. Economía y Rachas (`economyService.ts`)

| Endpoint | Método | Descripción | Retorno |
| :--- | :--- | :--- | :--- |
| `/user/:discordId/dailyBalance` | `POST` | Reclama los 100 diarios y actualiza racha | `ClaimResponse` (balance, streaks, etc.) |

#### Formato de Respuesta de `dailyBalance`:
```json
{
  "ok": true,
  "balance": 650,
  "dailyStreak": 7,
  "previousStreak": 6,
  "maxDailyStreak": 14,
  "previousMaxStreak": 14,
  "totalDailiesClaimed": 42
}
```

### C. Cartas y Gacha (`cardService.ts`)

| Endpoint | Método | Descripción | Retorno |
| :--- | :--- | :--- | :--- |
| `/card` | `GET` | Catálogo de todas las cartas | `Card[]` |
| `/card` | `POST` | Creación de carta (`multipart/form-data`) | `Card` |
| `/user/:discordId/card/random` | `POST` | Tirada gacha (descuenta 100 monedas) | `Card` |

### D. Mercado Libre (`marketService.ts`)

| Endpoint | Método | Descripción | Retorno |
| :--- | :--- | :--- | :--- |
| `/market/:serverId/offers` | `GET` | Ofertas activas en un servidor | `MarketOfferWithCard[]` |
| `/market/:serverId/offers/:offerId/buy` | `POST` | Compra de una oferta | `{ ok: boolean, message: string }` |

### E. Tablas de Clasificación y Rankings (`leaderboardService.ts`)

| Endpoint | Método | Query Params | Descripción | Retorno |
| :--- | :--- | :--- | :--- | :--- |
| `/leaderboard/luck` | `GET` | `order` (`'desc'` \| `'asc'`), `minPulls` (default: `20`), `limit` (default: `5`) | Ranking de suerte gacha neutralizado contra mercado | `LuckLeaderboardResponse` |

#### Formato de Respuesta de `GET /leaderboard/luck`:
```json
{
  "order": "desc",
  "minPulls": 20,
  "leaderboard": [
    {
      "rank": 1,
      "discordId": "111222333444555666",
      "username": "LuckyGamer",
      "totalCards": 45,
      "luckPercentage": 145.2,
      "luckDelta": "+45.2%",
      "tier": "Godly Luck",
      "tierCode": "GODLY",
      "breakdown": {
        "common": 20,
        "rare": 14,
        "epic": 7,
        "legendary": 3,
        "mythic": 1
      }
    }
  ]
}
```

---

## 2. Manejo de Errores y Resiliencia

Los servicios capturan las respuestas de error del backend (`err.response.data.error`) y las devuelven en formato amigable para que los comandos puedan mostrar un Embed descriptivo en Discord (por ejemplo: saldo insuficiente, cooldown de daily activo, usuario sin permisos, etc.).

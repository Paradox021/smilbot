# 📚 Documentación Técnica de Smilbot (v2.0)

Bienvenido a la documentación técnica de **Smilbot**, un bot de Discord modular escrito en TypeScript enfocado en la gestión de economía virtual, coleccionismo de cartas gacha, mercado libre y reproducción musical.

---

## 🗺️ Mapa de la Documentación

```text
docs/
├── README.md                          # Índice principal (este archivo)
│
├── architecture/                      # Diseño y arquitectura del bot
│   ├── overview.md                    # Arquitectura general, flujo de eventos y servicios
│   └── ui-and-components.md           # Sistema de UI interactiva (Embeds, Botones, Paginación)
│
├── features/                          # Lógica interna y diseño de sistemas
│   ├── economy-and-streaks.md         # Economía, balance, rachas de dailybalance y métricas
│   ├── cards-and-gacha.md             # Sistema de cartas, probabilidades y colección
│   ├── market.md                      # Marketplace de cartas e interacción
│   └── music.md                       # Sistema de música y cola de reproducción
│
├── commands/                          # Referencia de comandos (sintaxis, alias y ejemplos)
│   ├── economy.md                     # Comandos de economía, cartas, mercado y administración
│   ├── music.md                       # Comandos de reproducción musical
│   └── utility.md                     # Comandos de utilidad y ayuda
│
└── integrations/                      # Comunicación con servicios externos
    └── backend-api.md                 # Especificación de endpoints consumidos de la API REST
```

---

## 🚀 Guías Rápidas de Navegación

* **Para entender cómo funciona el bot internamente:** Consulta [Arquitectura General](file:///e:/codigos/Smilbot/docs/architecture/overview.md).
* **Para consultar la sintaxis y uso de comandos:** Consulta la sección [Comandos](file:///e:/codigos/Smilbot/docs/commands/economy.md).
* **Para ver cómo se comunica el bot con el backend:** Revisa [Integración con Backend API](file:///e:/codigos/Smilbot/docs/integrations/backend-api.md).
* **Para conocer la lógica de rachas y auditoría:** Revisa [Economía y Rachas](file:///e:/codigos/Smilbot/docs/features/economy-and-streaks.md).

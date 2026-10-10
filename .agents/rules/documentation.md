# Reglas de Documentación

La documentación técnica del ecosistema Smilbot **no vive en este repo**: está en la Bóveda de Obsidian [Paradox021/smilbot-vault](https://github.com/Paradox021/smilbot-vault) (servidor MCP `obsidian_vault`, o la ruta local donde esté clonada). Es la única fuente de verdad compartida entre el Bot de Discord, el Backend API y el Frontend. **No crees una carpeta `docs/` en este repo.**

---

## 🧭 Qué nota actualizar según el cambio

| Tipo de cambio | Nota de la bóveda | Qué incluir |
| :--- | :--- | :--- |
| **Comando nuevo o modificado** | `Bot Discord/Comandos de *.md` | Nombre, alias, middlewares/permisos, argumentos, endpoint que usa y ejemplos. |
| **Arquitectura, eventos, middlewares, variables de entorno** | `Bot Discord/Arquitectura y Eventos.md` | Flujo, responsabilidades y variables nuevas. |
| **Embeds, botones, menús, paginación** | `Bot Discord/Componentes de UI.md` | Componentes, `customId` y comportamiento. |
| **Uso de un endpoint del backend** | `Backend API/Endpoints *.md` (solo lectura para el bot) | Si el bot necesita un endpoint o campo que no existe, no lo inventes: se cambia primero el backend y su nota. |
| **Reglas de juego** (rachas, gacha, pity, suerte, mercado) | `Modelos y Contratos/*.md` | Solo si cambia la regla; las reglas las define el backend. |
| **Fallo detectado que no se arregla ahora / fallo arreglado** | `Backend API/Problemas Conocidos.md` | Añadir o quitar la entrada. |
| **Nota nueva** | `README.md` de la bóveda | Enlazarla en el mapa. |

---

## 📋 Checklist antes de terminar
- [ ] ¿Cambiaron comandos, alias o argumentos? → `Bot Discord/Comandos de *.md`.
- [ ] ¿Se consume un endpoint nuevo o con otros campos? → Comprobar que coincide con `Backend API/Endpoints *.md`.
- [ ] ¿Variable de entorno nueva? → `.env.sample` y `Bot Discord/Arquitectura y Eventos.md`.
- [ ] ¿Lo documentado coincide con lo que hace el código? Documenta el comportamiento real.

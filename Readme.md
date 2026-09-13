# Smilbot 🤖

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)

Smilbot es un bot de Discord enfocado en coleccionar cartas, gestionar una economía virtual y reproducir música.

> **Nota de Versiones:** Este repositorio está en la rama de la **versión 2.0** (reescrito completamente en TypeScript y con sistema de música mejorado usando `discord-player`). La versión legacy estable la puedes encontrar en el tag [**v1.0**](https://github.com/Paradox021/Smilbot/releases/tag/v1.0).

## Requisitos
- Node.js 18 o superior
- Una cuenta de Discord (para el Token del bot)
- [FFmpeg](https://ffmpeg.org/download.html) instalado en el sistema (requerido para reproducir música)

## Instalación
1. Clona este repositorio y navega hasta la carpeta.
   ```bash
   git clone https://github.com/Paradox021/Smilbot.git
   cd Smilbot
   ```
2. Ejecuta `npm install` para instalar las dependencias.
3. Crea un archivo `.env` en la raíz con las siguientes variables:
   ```env
   TOKEN=tu_token_de_discord
   BACKEND_URL=https://url.de.tu.backend
   ```
4. Inicia el bot en entorno de desarrollo:
   ```bash
   npm run dev
   ```
   *(También puedes compilarlo con `npm run build` y ejecutarlo con `npm start` para producción)*

## 📂 Estructura del Proyecto

El código fuente está organizado en `src/` siguiendo un diseño modular para separar responsabilidades:

- 📁 `commands/` - Contiene la lógica de todos los comandos del bot (agrupados en economía, música y diversión).
- 📁 `events/` - Listeners para los eventos de Discord (como `ready`, `messageCreate`).
- 📁 `handlers/` - Gestión de interacciones complejas (como botones y menús de las cartas).
- 📁 `middlewares/` - Lógica que se ejecuta antes de ciertos comandos (ej. `checkUser` para validar que el usuario existe en la BD).
- 📁 `services/` - Conexión con el backend / API externa para consultas de economía y sistema de cartas.
- 📁 `components/` - Constructores de UI para Discord (Embeds, botones, paginación, etc.).
- 📁 `utils/` y `types/` - Funciones auxiliares genéricas e interfaces de TypeScript.

## Comandos Principales
Los comandos del bot utilizan el prefijo `.` por defecto.

### 🛠️ Utilidad
- `ping`: Comprueba que el bot está activo y su latencia de respuesta.

### 💰 Economía
- `dailybalance`: Reclama 100 monedas diariamente (cada 23 horas) y acumula rachas.
- `balance`: Consulta tu saldo actual.
- `stats`: Muestra tu perfil económico completo, rachas diarias, récord histórico y actividad.

### 🃏 Sistema de Cartas
- `getcard`: Compra y obtiene una carta aleatoria por 100 monedas (tasas de aparición según rareza).
- `mycards`: Muestra tu inventario usando menús paginados.
- `show <usuario>`: Muestra el inventario de cartas de otro jugador.
- `allcards`: Visualiza la enciclopedia de todas las cartas disponibles en el juego.

### 🏪 Mercado Libre
- `market`: Abre el menú interactivo del mercado donde puedes explorar y **comprar** cartas publicadas.
- *(Nota: Los comandos para publicar y gestionar ventas, `sell` y `remove`, están actualmente en desarrollo para la v2.0).*

### 🎵 Música
- `play <canción/URL>`: Reproduce música en tu canal de voz.
- `stop`: Detiene la reproducción y desconecta al bot.
- *(Nota: Las otras funciones de música están en desarrollo).*

---

## 📚 Documentación Técnica
 
 Toda la documentación técnica, especificaciones de endpoints, arquitectura y modelos de datos están centralizados en la bóveda de Obsidian:
 
 👉 **[Repositorio de Documentación (smilbot-vault)](https://github.com/Paradox021/smilbot-vault)**
 
- 📐 **Modelos y Contratos:** Esquemas de cartas, reglas de economía, gacha y mercado.
- 🔌 **Backend API:** Especificaciones y contratos de endpoints REST.
- 🤖 **Bot Discord:** Arquitectura modular, componentes UI y referencia de comandos.
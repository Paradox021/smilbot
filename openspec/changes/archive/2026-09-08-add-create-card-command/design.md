## Context

Smilbot 2.0 utiliza un sistema modular en TypeScript basado en comandos con prefijo (`.`), middlewares (`executeWithMiddlewares`) y clientes de servicio HTTP (`axios`).
El backend de Smilbot (`backendSmilbot`) expone el endpoint `POST /card` que recibe `multipart/form-data` conteniendo `req.file` (`image`) y `req.body.data` (JSON con `name`, `type`, `description`, `author`).

## Goals / Non-Goals

**Goals:**
- Implementar el comando `.createcard` respetando la arquitectura y convenciones de Smilbot.
- Crear un middleware `checkAdmin` para restringir comandos administrativos a usuarios con permiso `Administrator` o rol `admin`/`ADMIN`.
- Implementar un parser robusto que soporte nombres entre comillas y de una sola palabra.
- Implementar resolución de imagen con prioridad en archivo adjunto y fallback en URL trailing, limpiando la descripción.
- Ampliar `CardService` para empaquetar y enviar `FormData` al backend.
- Presentar el resultado con `createCardEmbed`.
- Cumplir con la Definición de Terminado documentando todo en `docs/`.

**Non-Goals:**
- No implementar Slash Commands para esta funcionalidad (mantener la consistencia con el prefijo `.` actual del bot).
- No implementar gestión de borrado de cartas en este cambio (solo creación).
- No implementar autenticación por API Key en el backend en este cambio (el endpoint `POST /card` existente en el backend se consume tal como está).

## Decisions

### 1. Middleware de Autorización (`checkAdmin`)
- **Decisión**: Crear `src/middlewares/checkAdmin.ts` que verifique:
  `message.member?.permissions.has(PermissionFlagsBits.Administrator) || message.member?.roles.cache.some(r => r.name.toLowerCase() === 'admin')`
- **Alternativas consideradas**:
  - *Hardcodear IDs de usuario*: Rechazado por el usuario, ya que reduce la flexibilidad en el servidor y requiere variables de entorno fijas.
  - *Chequeo manual dentro del comando*: Descartado en favor de un middleware reutilizable acorde al patrón `Middleware` de Smilbot.

### 2. Sintaxis de Argumentos y Regex de Parseo
- **Decisión**: Extraer argumentos con una expresión regular que soporte comillas para nombres con espacios:
  `/^(?:"([^"]+)"|(\S+))\s+(\S+)\s+([\s\S]+)$/`
  - Primer grupo: nombre.
  - Segundo grupo: rareza (`common`, `rare`, `epic`, `legendary`, `mythic`).
  - Tercer grupo: descripción (y posible URL).
- **Alternativas consideradas**:
  - *Delimitador `|`*: Menos intuitivo y diferente a la experiencia clásica.
  - *Args separados por espacios sin comillas*: No permitiría nombres compuestos con espacios.

### 3. Resolución de Imagen y Sanitización de Descripción
- **Decisión**:
  1. Si `message.attachments.first()` tiene `contentType?.startsWith('image')`, se usa ese stream/buffer.
     - Si la descripción termina en una URL `http...`, se elimina de la descripción.
  2. Si no hay adjunto, se verifica si la última palabra de la descripción es una URL `https?://...`.
     - Si lo es, se descarga como `arraybuffer` con axios, se verifica el `content-type`, y se recorta de la descripción.
  3. Si no hay adjunto ni URL válida, se aborta con mensaje explicativo.
- **Alternativas consideradas**:
  - *Solo permitir adjunto*: Menos flexible cuando los administradores tienen la imagen en un host externo (imgur, cdn).

### 4. Transmisión al Backend (`CardService.createCard`)
- **Decisión**: Usar la API estándar `FormData` (o `form-data`) para añadir:
  - `image`: Blob/Buffer con su nombre de archivo correspondiente.
  - `data`: `JSON.stringify({ name, type, description, author })`.
  - Headers `Content-Type: multipart/form-data`.
- **Alternativas consideradas**:
  - *Enviar URL de imagen en JSON*: El backend no soporta esto; requiere el archivo binario multipart en `req.file`.

## Risks / Trade-offs

- [Descarga de URL lenta o caída] → Se configura un timeout de 5 segundos al descargar la imagen por URL y se notifica al usuario si no responde.
- [Imagen no soportada o corrupta] → Se valida que el `content-type` de la respuesta o del adjunto sea una imagen soportada antes de enviarla al backend.
- [Permisos de canal] → Se asegura que el bot tenga permisos de lectura y envío de mensajes con embeds en el canal correspondiente.

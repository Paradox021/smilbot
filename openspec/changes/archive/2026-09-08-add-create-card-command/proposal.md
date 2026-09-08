## Why

El bot Smilbot en su versión previa en JavaScript disponía de un comando administrativo para crear nuevas cartas en el catálogo gacha global. Tras la reescritura a TypeScript, esta funcionalidad quedó ausente, impidiendo a los administradores registrar cartas coleccionables directamente desde Discord sin manipular manualmente la base de datos o herramientas externas.

## What Changes

- **Nuevo comando con prefijo `.createcard`**: Permite a usuarios con rol de administrador o permisos de Administrador registrar una nueva carta especificando nombre, rareza, descripción y una imagen (mediante adjunto o URL al final del texto).
- **Extracción limpia de datos**:
  - Soporte de nombres entre comillas (`"Nombre Con Espacios"`) o de una sola palabra (`Nombre`).
  - Validación estricta de rareza (`common`, `rare`, `epic`, `legendary`, `mythic`).
  - Detección prioritaria de archivo adjunto de imagen; si no existe, extracción de URL al final del mensaje eliminándola de la descripción final para evitar enlaces en el lore.
- **Middleware / Verificación de Administrador**: Comprobación de que el autor posea permiso `Administrator` de Discord o un rol denominado `admin`/`ADMIN`.
- **Integración en `CardService`**: Nuevo método `createCard` que transmite la imagen (Buffer) y la metadata en formato `multipart/form-data` al endpoint `POST /card` del backend de Smilbot.
- **Feedback visual**: Al crearse la carta con éxito, responde con un embed completo que muestra la carta recién añadida mediante `createCardEmbed`.
- **Documentación obligatoria en `docs/`**:
  - Creación de `docs/commands/admin.md` (o actualización de `docs/commands/economy.md`).
  - Actualización de `docs/features/cartas-y-gacha.md` (mención del comando de creación de cartas).
  - Actualización de `docs/README.md` para enlazar la nueva documentación.

## Capabilities

### New Capabilities
- `create-card`: Funcionalidad administrativa para registrar cartas coleccionables mediante `.createcard`, validando permisos de administrador, parseando argumentos (con soporte de comillas), resolviendo la imagen (adjunta o URL) y persistiendo en el backend.

### Modified Capabilities
<!-- None -->

## Impact

- **Código fuente**:
  - `src/commands/economy/createCard.ts` (o `src/commands/admin/createCard.ts`)
  - `src/commands/index.ts`
  - `src/services/cardService.ts`
  - `src/middlewares/checkAdmin.ts` (nuevo middleware para verificación de administrador)
- **Documentación**:
  - `docs/commands/economy.md` (o `docs/commands/admin.md`)
  - `docs/features/cartas-y-gacha.md`
  - `docs/README.md`
- **APIs externas**:
  - Consumo del endpoint `POST /card` del backend `backendSmilbot` (`multipart/form-data`).

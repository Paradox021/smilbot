## 1. Middleware y Servicios

- [x] 1.1 Crear el middleware `src/middlewares/checkAdmin.ts` que verifique permisos de Administrador o rol `admin`/`ADMIN`, y verificar con build de TypeScript.
- [x] 1.2 Extender `src/services/cardService.ts` con el método `createCard` que reciba los datos de la carta y el buffer de la imagen, enviando `multipart/form-data` a `POST /card`.

## 2. Comando `.createcard`

- [x] 2.1 Crear el comando `src/commands/economy/createCard.ts` (o categoría admin) con el parser de comillas para el nombre, validación de rareza, resolución de imagen (adjunto vs URL) y respuesta con `createCardEmbed`.
- [x] 2.2 Registrar `createCard` en `src/commands/index.ts` y en `commandList`.

## 3. Verificación y Build

- [x] 3.1 Ejecutar `npm run build` para comprobar que la compilación de TypeScript y resolución de alias pasa sin ningún error de tipado.

## 4. Documentación (Definición de Terminado)

- [x] 4.1 Documentar el comando `.createcard` en `docs/commands/` (sintaxis, parámetros con comillas, permisos requeridos, ejemplos con adjunto y URL).
- [x] 4.2 Actualizar `docs/features/cartas-y-gacha.md` y `docs/README.md` reflejando el nuevo comando administrativo.

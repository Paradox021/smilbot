# AGENTS.md - Reglas e Instrucciones para Agentes de IA en Smilbot

Bienvenido a **Smilbot**, un bot de Discord modular desarrollado en TypeScript con Discord.js, enfocado en economía virtual, cartas gacha, mercado libre y música.

Este documento establece los principios de trabajo, la arquitectura del proyecto y las reglas obligatorias que todos los agentes de IA deben seguir al realizar cualquier cambio, refactorización o nueva implementación.

---

## 🚨 Regla de Oro: Definición de Terminado (Definition of Done)

> **NINGUNA tarea, cambio o implementación se considera completada sin haber actualizado o creado la documentación correspondiente en la Bóveda Centralizada de Obsidian.**

### 📚 Bóveda Centralizada de Obsidian (Single Source of Truth)
- **Ruta de la Bóveda:** `F:\smilbot-project\smilbot-vault` (disponible vía servidor MCP `obsidian_vault` o en disco).
- Esta bóveda es la **única fuente de verdad compartida** entre el **Bot de Discord** y el **Backend API**.

Antes de entregar una respuesta final o cerrar un cambio:
1. **Comandos y UI:** Si creaste o modificaste un comando o interacción, actualiza la nota correspondiente en `F:\smilbot-project\smilbot-vault\Bot Discord\`.
2. **Lógica de Negocio y Reglas:** Si alteraste o creaste lógica de un subsistema (ej. economía, cartas, gacha, música, rachas), actualiza `F:\smilbot-project\smilbot-vault\Modelos y Contratos\`.
3. **Contratos de API REST:** Si cambiaste endpoints, parámetros, payloads, variables de entorno o interacción con el backend, actualiza `F:\smilbot-project\smilbot-vault\Backend API\` y `.env.sample`.
4. Si agregaste una nota nueva a Obsidian, enlázala en `00 - Inicio.md`.

---

## 📁 Estructura del Proyecto

- `src/`: Código fuente en TypeScript (comandos, eventos, servicios, clientes de API, utilidades).
- `openspec/`: Especificaciones y configuraciones de OpenSpec.
- `.agents/`: Reglas, skills y flujos de trabajo para agentes de IA.
- **Documentación Técnica:** Centralizada externamente en `F:\smilbot-project\smilbot-vault`.

---

## 🛠️ Directrices Técnicas

- **Lenguaje y Tipado**: TypeScript estricto. Mantén tipos e interfaces bien definidos. No uses `any` sin justificación explícita.
- **Manejo de Errores**: Siempre captura y maneja errores adecuadamente en comandos e interacciones con la API externa, proporcionando feedback amigable al usuario en Discord.
- **Variables de Entorno**: Cualquier nueva variable requerida debe registrarse en `.env.sample` con un valor de ejemplo o explicación.
- **Consistencia**: Respeta las convenciones existentes de nombrado, estructura de carpetas y estilo de código.

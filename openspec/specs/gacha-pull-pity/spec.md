# gacha-pull-pity Specification

## Purpose

Permite notificar y mostrar el estado del sistema de pity en el comando `.getcard`, informando al usuario sobre su progreso hacia una carta mítica garantizada y alertando explícitamente cuando una tirada ha sido otorgada mediante pity.

## Requirements

### Requirement: Notificación de Pity en Tirada Garantizada
El sistema SHALL mostrar un mensaje de texto superior en Discord cuando la tirada de carta fue concedida mediante el sistema de piedad (`isPity: true`).

#### Scenario: Tirada otorgada mediante Pity
- **WHEN** un usuario ejecuta `.getcard` y la respuesta del backend indica `isPity: true`
- **THEN** el bot responde enviando en el cuerpo del mensaje (`content`) el texto `🌟 **Smilbot took pity on your bad luck and granted you a guaranteed Mythic card!**`, acompañando al Embed de la carta con sus campos y arte limpios y sin sobrecargar.

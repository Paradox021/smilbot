# user-luck-stats Specification

## Purpose

Permite a los usuarios visualizar las métricas y clasificación de suerte de gacha en el comando de perfil económico `.stats`.

## Requirements

### Requirement: Métrica de Suerte en Stats
El sistema SHALL incluir la sección de suerte de gacha (`🎲 Gacha Luck`) dentro del Embed devuelto por el comando `.stats`, reflejando la neutralización de míticas obtenidas por pity.

#### Scenario: Usuario calificado con al menos 20 tiradas
- **WHEN** un usuario ejecuta `.stats` y cuenta con 20 o más tiradas de cartas registradas
- **THEN** el Embed muestra su calificación de suerte con su emoji/tier (`Godly Luck`, `Lucky`, etc.), porcentaje de desviación respecto a la media, y el desglose de cartas obtenidas por rareza con indicadores visuales, indicando las míticas de pity neutralizadas del cálculo si el usuario tiene alguna.

#### Scenario: Usuario con tiradas insuficientes
- **WHEN** un usuario ejecuta `.stats` pero cuenta con menos de 20 tiradas registradas
- **THEN** el Embed muestra un mensaje indicando que no dispone de tiradas suficientes para calcular su suerte (ej. indicando el progreso o las 20 requeridas).

### Requirement: Visualización de Pity en Stats
El sistema SHALL mostrar la información del sistema de pity dentro del Embed devuelto por el comando `.stats`.

#### Scenario: Usuario consulta sus estadísticas
- **WHEN** un usuario ejecuta `.stats` (o `.profile`)
- **THEN** el Embed incluye los datos de pity del jugador: tiradas acumuladas desde la última mítica (`pullsSinceLastMythic`/`pityThreshold`), tiradas restantes para la mítica garantizada (`pullsUntilGuaranteed`), y cantidad histórica de míticas obtenidas por pity (`pityMythicsCount`).

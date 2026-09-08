# 🃏 Sistema de Cartas Coleccionables y Gacha

## 1. Concepto

Smilbot incluye un sistema de cartas coleccionables donde los usuarios pueden adquirir cartas aleatorias, ver su inventario personal, inspeccionar la colección de otros usuarios y consultar el catálogo global.

---

## 2. Sistema Gacha (`.getcard`)

Al ejecutar `.getcard` (o alias `.gc`, `.buycard`), el usuario intercambia **100 monedas** por una carta generada aleatoriamente según probabilidades de rareza (*RNG roll* entre 0 y 999).

### Tabla de Probabilidades y Rarezas:

| Rareza | Type ID | Rango de Roll (0-999) | Probabilidad | Color |
| :--- | :--- | :--- | :--- | :--- |
| **Common** | `0` | 0 – 599 | **60.0%** | Gris (`#808080`) |
| **Rare** | `1` | 600 – 849 | **25.0%** | Azul (`#0080ff`) |
| **Epic** | `2` | 850 – 949 | **10.0%** | Púrpura (`#a335ee`) |
| **Legendary** | `3` | 950 – 989 | **4.0%** | Naranja (`#ff8000`) |
| **Mythic** | `4` | 990 – 999 | **1.0%** | Dorado (`#e6cc80`) |

---

## 3. Inventario y Visualizador de Cartas (`.mycards` / `.show`)

* **Agrupación de Duplicados:** Cuando un usuario posee múltiples copias de la misma carta, se agrupan mostrando el contador (ej. `Carta X - (x3)`).
* **Vistas Disponibles:**
  1. **Vista Lista (Paginada):** Muestra hasta 5 cartas por página con su nombre y rareza.
  2. **Vista Detallada:** Permite ver la ilustración a pantalla completa, la descripción y el autor de la carta.
* **Seguridad de Interacción:** Los botones del visor están protegidos para que solo el propietario o el invocador del comando pueda interactuar con la sesión de navegación.

---

## 4. Catálogo Global (`.allcards`)

Permite explorar todas las cartas creadas en el juego sin importar si el usuario las posee o no, funcionando como una enciclopedia interactiva para los coleccionistas.

---

## 5. Métricas de Suerte en Gacha y Leaderboard (`.stats` / `.topluck`)

Para fomentar la competitividad sana y permitir a los usuarios medir su fortuna en los sobres abiertos, el backend calcula métricas de suerte agregadas:

### A. Neutralización Contra el Mercado
Para evitar distorsiones donde un jugador compre cartas de alta rareza en el mercado para inflar artificialmente su suerte, la métrica se neutraliza contablemente:
$$\text{Cartas de Gacha Reales} = \text{Inventario} - \text{Compras en Mercado} + \text{Ventas en Mercado}$$

### B. Escala de Clasificación (Tiers de Suerte)
La suerte se evalúa comparando la distribución real obtenida frente al valor probabilístico esperado:

| Tier Code | Nombre en Pantalla | Icono | Rango Delta (%) |
| :--- | :--- | :--- | :--- |
| `GODLY` | **Godly Luck** | 🌟 | Mayor a `+40.0%` |
| `LUCKY` | **Lucky** | 🍀 | `+15.0%` a `+40.0%` |
| `AVERAGE` | **Average** | ⚖️ | `-15.0%` a `+15.0%` |
| `UNLUCKY` | **Unlucky** | 🌧️ | `-30.0%` a `-15.0%` |
| `CURSED` | **Cursed** | 💀 | Menor a `-30.0%` |

### C. Requisito de Calificación para Leaderboard
* Se requiere un mínimo de **20 tiradas gacha** (`minPulls = 20`) para evitar anomalías estadísticas producidas por cuentas con pocas tiradas.
* El comando `.top luck` (o `.topluck`) muestra a los 5 jugadores con mayor suerte, mientras que `.top luck worst` (o `.topluck worst`) muestra a los 5 más desafortunados.

---

## 6. Creación Administrativa de Cartas (`.createcard`)

Los administradores del servidor pueden registrar nuevas cartas coleccionables para que pasen a formar parte del catálogo global y del pool gacha:

* **Control de Acceso:** Protegido por el middleware `checkAdmin`, requiriendo permiso de Administrador de Discord o un rol denominado `admin`/`ADMIN`.
* **Soporte de Nombres con Espacios:** Permite comillas dobles para nombres compuestos (ej. `"Dark Magician"`).
* **Resolución Flexible de Imagen:**
  1. Si se adjunta un archivo de imagen en el mensaje de Discord, se procesa prioritariamente.
  2. Si no hay archivo adjunto, el comando extrae la URL de imagen al final del mensaje, la descarga en memoria y elimina el enlace de la descripción para mantener un lore limpio.
* **Integración:** El bot empaqueta la imagen y los metadatos en `multipart/form-data` y los envía a `POST /card` en el backend, respondiendo con una previsualización de la carta creada (`createCardEmbed`).


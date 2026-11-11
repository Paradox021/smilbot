FROM node:22

# 1. Dependencias de audio nativas de Linux (FFmpeg + Opus) y Python para yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-venv \
    build-essential \
    libopus-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. yt-dlp en un entorno virtual aislado, accesible globalmente.
#    El extra [default] incluye yt-dlp-ejs, necesario (junto a Node) para resolver los retos JS de YouTube.
RUN python3 -m venv /opt/ytdlp \
    && /opt/ytdlp/bin/pip install --no-cache-dir --upgrade pip "yt-dlp[default]" \
    && ln -s /opt/ytdlp/bin/yt-dlp /usr/local/bin/yt-dlp \
    && chown -R node:node /opt/ytdlp

WORKDIR /usr/src/app

# 3. Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./

# 4. Instalar todas las dependencias de Node juntas
RUN npm install

# 5. Copiar código fuente y compilar TypeScript
COPY src ./src
RUN npm run build

# Configurar permisos para el usuario seguro node
RUN chown -R node:node /usr/src/app
USER node

ENV NODE_ENV=production

# YouTube cambia a menudo: se actualiza yt-dlp en cada arranque (si falla, se arranca con la versión instalada).
CMD ["sh", "-c", "/opt/ytdlp/bin/pip install --no-cache-dir --quiet --upgrade 'yt-dlp[default]' || echo 'yt-dlp update failed, using installed version'; exec node dist/index.js"]

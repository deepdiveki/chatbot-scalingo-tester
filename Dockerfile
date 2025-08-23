# Basis: Node.js 22 (Scalingo nutzt Ubuntu 22.04)
FROM node:22-slim

# Arbeitsverzeichnis
WORKDIR /usr/src/app

# System-Dependencies (Puppeteer/Playwright braucht die)
RUN apt-get update && apt-get install -y \
  libnspr4 \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libxshmfence1 \
  libpangocairo-1.0-0 \
  libgtk-3-0 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrender1 \
  libxcursor1 \
  ca-certificates \
  fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

# Package-Dateien zuerst kopieren (für Layer-Caching)
COPY package*.json ./

# Dependencies installieren
RUN npm install --omit=dev

# Restliche Dateien kopieren
COPY . .

# Port, den Scalingo bereitstellt
ENV PORT=8080

# Start-Befehl (entspricht Procfile)
CMD ["node", "app.js"]
FROM node:22-bookworm-slim
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /var/wayline-media /var/wayline-tts /var/wayline-broadcast \
 && chown -R node:node /app /var/wayline-media /var/wayline-tts /var/wayline-broadcast
USER node
ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm","start"]

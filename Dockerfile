# Etapa 1: build con Node
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variables de entorno Vite en tiempo de build.
# VITE_API_BASE_URL vacío hace que las llamadas /api/... vayan a Nginx (mismo host).
ARG VITE_API_BASE_URL=""
ARG VITE_ERROR_REPORT_URL="/api/frontend-error-report/"
ARG VITE_ENABLE_DIRECT_TELEGRAM="false"
ARG VITE_TELEGRAM_BOT_TOKEN=""
ARG VITE_TELEGRAM_CHAT_ID=""

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ERROR_REPORT_URL=$VITE_ERROR_REPORT_URL
ENV VITE_ENABLE_DIRECT_TELEGRAM=$VITE_ENABLE_DIRECT_TELEGRAM
ENV VITE_TELEGRAM_BOT_TOKEN=$VITE_TELEGRAM_BOT_TOKEN
ENV VITE_TELEGRAM_CHAT_ID=$VITE_TELEGRAM_CHAT_ID

RUN npm run build

# Etapa 2: servir con Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

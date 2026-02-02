# Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
# Лицензировано под GNU Affero General Public License v3.0
# Часть проекта генератора рассадок
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM caddy:alpine

COPY --from=build-stage /app/dist /srv

COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
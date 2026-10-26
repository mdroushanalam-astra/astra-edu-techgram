FROM node:22-bookworm-slim AS build
WORKDIR /build
COPY package.json package-lock.json ./
COPY kernel/package.json kernel/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/brainlab/package.json apps/brainlab/package.json
RUN npm ci
COPY kernel kernel
COPY apps/web apps/web
ENV VITE_CONNECTED_MODE=true
RUN npm -w @techgram/web run build

FROM nginx:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/apps/web/dist /usr/share/nginx/html
EXPOSE 80

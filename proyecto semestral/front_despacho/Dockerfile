# syntax=docker/dockerfile:1.7
# =====================================================
# Frontend React/Vite servido por Nginx
# Multi-stage build · Usuario no root · Proxy reverso
# =====================================================

# ---------- Stage 1: BUILD ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Cache de dependencias: si solo cambia src/ no se reinstala node_modules
COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Stage 2: RUNTIME (Nginx) ----------
FROM nginx:1.27-alpine

# Nginx oficial corre como root para bind al 80. Lo movemos al 8080 y usuario no root.
RUN apk add --no-cache curl \
 && sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf 2>/dev/null || true

# Plantilla con placeholders ${BACK_VENTAS_URL} y ${BACK_DESPACHOS_URL}.
# La imagen oficial de Nginx sustituye los placeholders al iniciar.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Copiar build estatico desde la etapa builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Usuario no root: el de la imagen base se llama "nginx" (uid 101)
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx \
 && touch /var/run/nginx.pid \
 && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:8080/ || exit 1

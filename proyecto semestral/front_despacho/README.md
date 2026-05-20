# Frontend Despacho · Innovatech Chile

Aplicación SPA en React 18 + Vite + Tailwind. En producción se sirve estática desde Nginx, que además actúa como **proxy reverso** hacia los dos backends Spring Boot.

## Stack

- React 18, React Router 6, React Hook Form, SweetAlert2
- Vite 5 (build), Tailwind 3 (estilos)
- Axios (cliente HTTP, centralizado en `src/api/client.js`)
- Nginx 1.27-alpine en runtime (multi-stage Docker)

## Cómo correr en desarrollo

Requisitos: Node 20+.

```bash
npm install
# En paralelo, levantar los backends en :8080 y :8081 (ver compose)
npm run dev          # http://localhost:5173
```

Vite hace proxy de `/api/v1/ventas` → `localhost:8080` y `/api/v1/despachos` → `localhost:8081` (ver `vite.config.js`), replicando el comportamiento que tendrá Nginx en producción.

## Build de producción

```bash
npm run build        # genera /dist con assets optimizados
```

## Imagen Docker

```bash
docker build -t innovatech/front-despacho:latest .
docker run -d -p 80:8080 \
  -e BACK_VENTAS_URL=http://<ip-back-ventas>:8080 \
  -e BACK_DESPACHOS_URL=http://<ip-back-despachos>:8081 \
  innovatech/front-despacho:latest
```

### Características del Dockerfile

- **Multi-stage build**: Node 20 compila → imagen Nginx 1.27-alpine ejecuta. La imagen final no incluye `node_modules` ni el toolchain de build.
- **Usuario no root** (`nginx` UID 101): cumple CIS Docker Benchmark.
- **Healthcheck** en `/` por curl cada 30s.
- **Configuración por entorno**: las URL de los backends se inyectan al iniciar el contenedor mediante el mecanismo de templates de Nginx oficial (`/etc/nginx/templates/*.template`).

## Por qué proxy reverso (no CORS)

Inicialmente el frontend invocaba a los backends por IPs literales (`http://192.168.30/api/...`). Se centralizó la configuración de Axios en [`src/api/client.js`](src/api/client.js) con **baseURL relativa**:

```js
export const apiVentas    = axios.create({ baseURL: "/api/v1/ventas" });
export const apiDespachos = axios.create({ baseURL: "/api/v1/despachos" });
```

Beneficios:

1. **Backends quedan inalcanzables desde Internet** (requisito de la rúbrica). El navegador nunca conoce sus IPs reales.
2. **Sin CORS**: mismo origen siempre.
3. **Si cambia una IP de backend, no se reconstruye el bundle** — solo se cambia una variable de entorno en el contenedor del frontend.

## Volúmenes

Este servicio **no usa volúmenes**: es stateless. Toda la información persiste en MySQL.

## Justificación de la elección del registro

Se utilizan imágenes publicadas en **GitHub Container Registry (`ghcr.io`)** por:

- Autenticación integrada con `GITHUB_TOKEN` (sin gestionar credenciales adicionales).
- Costo cero en repositorios públicos.
- Sin los límites agresivos de pull de Docker Hub anónimo.
- Trazabilidad: cada imagen queda enlazada al commit que la originó.

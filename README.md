# Innovatech Chile · Sistema de Despachos y Ventas

> **ISY1101 — Introducción a Herramientas DevOps · Evaluación Parcial N°2**
> Contenedorización con Docker, orquestación con Docker Compose, pipeline CI/CD en GitHub Actions y despliegue automatizado en AWS EC2.

## Estructura del repositorio

```
.
├── .github/workflows/ci-cd.yml          # Pipeline CI/CD (build + push GHCR + deploy SSH)
├── proyecto semestral/
│   ├── docker-compose.yml               # Orquestación local de los 4 servicios
│   ├── .env.example                     # Template de variables de entorno
│   ├── db/init.sql                      # Inicialización de la segunda BD
│   ├── front_despacho/                  # React 18 + Vite + Nginx (frontend)
│   │   ├── Dockerfile                   # multi-stage build, usuario no root
│   │   └── nginx/default.conf.template  # Proxy reverso a backends
│   ├── back-Ventas_SpringBoot/Springboot-API-REST/         # Spring Boot 3.4
│   │   └── Dockerfile
│   └── back-Despachos_SpringBoot/Springboot-API-REST-DESPACHO/
│       └── Dockerfile
└── EVIDENCIAS.md                        # Guía de capturas para el informe
```

## Arquitectura

Tres microservicios independientes que comparten una base de datos MySQL:

- **Frontend** React 18 + Vite, servido en producción por Nginx que actúa como proxy reverso hacia los backends. **Único componente expuesto a Internet.**
- **Backend Ventas** Spring Boot 3.4 (Java 17) → puerto `8080`, endpoint `/api/v1/ventas`.
- **Backend Despachos** Spring Boot 3.4 (Java 17) → puerto `8081`, endpoint `/api/v1/despachos`.
- **MySQL 8** con volumen persistente, ejecutado como contenedor.

## Cómo levantar el stack localmente

Requisitos: Docker Engine 24+ y Docker Compose v2.

```bash
cd "proyecto semestral"
cp .env.example .env       # editar credenciales si quieres
docker compose up -d --build
```

Servicios disponibles:

| Servicio          | URL local                       |
| ----------------- | ------------------------------- |
| Frontend          | http://localhost                |
| API Ventas        | http://localhost:8080/api/v1/ventas |
| API Despachos     | http://localhost:8081/api/v1/despachos |
| MySQL (debug)     | localhost:3306                  |

Apagar y conservar datos:

```bash
docker compose down              # el volumen mysql_data sobrevive
```

Apagar y borrar datos:

```bash
docker compose down -v           # destruye también el volumen
```

## Justificación del volumen (rúbrica IE2)

El stack usa **un volumen nombrado** llamado `mysql_data` montado en `/var/lib/mysql` dentro del contenedor MySQL. Se eligió **named volume** sobre **bind mount** por las siguientes razones:

| Criterio | Named volume (elegido) | Bind mount |
| -------- | ---------------------- | ---------- |
| Portabilidad | El volumen se identifica por nombre, independiente del path del host. Funciona igual en Linux, Windows y macOS, y en EC2 sin modificar nada. | Requiere que el path absoluto del host exista y sea accesible al contenedor. Diferente en cada SO. |
| Permisos | Docker maneja UID/GID automáticamente. | El UID del proceso dentro del contenedor (`mysql` UID 999) debe coincidir con un UID del host con permisos sobre el directorio. Genera errores típicos como *“can’t create test file”*. |
| Rendimiento | Driver nativo del kernel, sin overhead. | En Windows/macOS pasa por una VM con FS compartido; el rendimiento de MySQL puede degradarse. |
| Backup y migración | `docker run --rm -v mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/db.tgz /data` | Copiar un directorio del host. |
| Seguridad | El volumen no es accesible directamente desde fuera de Docker. | Cualquier proceso del host con acceso al path puede leer/modificar la BD. |
| Continuidad operativa | `docker stop mysql && docker rm mysql && docker run … -v mysql_data:/var/lib/mysql mysql:8.0` → los datos persisten. Demostrado en sección 6.6 del informe. | También persiste, pero el path queda atado a la EC2. |

Para `init.sql` sí se usa **bind mount** (`./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro`) porque es un archivo de configuración versionado que debe acompañar al código fuente, no datos productivos.

## Pipeline CI/CD

El workflow [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) se dispara con un `push` a la rama **`deploy`** (o ejecución manual desde la pestaña Actions) y ejecuta dos jobs:

1. **build-and-push** — Construye las tres imágenes en paralelo (matrix) y las publica en `ghcr.io` con tags `latest` y `sha-<commit>`.
2. **deploy** — Se conecta por SSH a las tres EC2 (usando ProxyJump para alcanzar las privadas a través del frontend) y reemplaza los contenedores con la nueva imagen.

### Secrets requeridos en GitHub

| Categoría | Nombre | Descripción |
| --------- | ------ | ----------- |
| SSH | `EC2_SSH_USER` | Usuario por defecto de la AMI (`ec2-user` en Amazon Linux 2023) |
| SSH | `EC2_SSH_PRIVATE_KEY` | Contenido completo del `.pem` |
| Hosts | `EC2_FRONT_HOST` | IP pública o DNS del frontend |
| Hosts | `EC2_BACK_VENTAS_HOST` | IP privada del backend de ventas |
| Hosts | `EC2_BACK_DESPACHOS_HOST` | IP privada del backend de despachos |
| Hosts | `EC2_BACK_VENTAS_PRIVATE_IP` | Misma IP, usada por Nginx |
| Hosts | `EC2_BACK_DESPACHOS_PRIVATE_IP` | Misma IP, usada por Nginx |
| BD | `RDS_ENDPOINT` | IP/DNS del servidor MySQL |
| BD | `RDS_USERNAME` | Usuario MySQL |
| BD | `RDS_PASSWORD` | Contraseña MySQL |
| Registry | `GHCR_PAT` | Personal Access Token con scope `read:packages` |

Configurar en: **Settings → Secrets and variables → Actions → New repository secret**.

## Despliegue manual de prueba

Para activar el pipeline por primera vez:

```bash
git checkout -b deploy
git push -u origin deploy
```

Luego verificar en la pestaña **Actions** del repositorio. El primer build toma ~5 min; los siguientes ~2 min gracias al cache de capas.

## Referencias y documentación adicional

- Informe técnico completo: `Informe_devops_EP2_Innovatech.pdf` (entregado por AVA).
- Guía paso a paso para capturar las evidencias del informe: [EVIDENCIAS.md](EVIDENCIAS.md).

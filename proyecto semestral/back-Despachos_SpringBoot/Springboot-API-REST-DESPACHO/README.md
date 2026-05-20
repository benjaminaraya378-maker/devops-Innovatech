# Backend Despachos · Innovatech Chile

API REST en Spring Boot 3.4 (Java 17) que gestiona el dominio de **despachos** (creación, asignación de camión, cierre de despacho). Persiste en MySQL 8.

## Endpoints principales

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| GET    | `/api/v1/despachos`            | Lista todos los despachos |
| GET    | `/api/v1/despachos/{id}`       | Obtiene un despacho por ID |
| POST   | `/api/v1/despachos`            | Crea un despacho asociado a una venta |
| PUT    | `/api/v1/despachos/{id}`       | Actualiza un despacho (intentos, entregado) |
| DELETE | `/api/v1/despachos/{id}`       | Elimina un despacho |

Documentación interactiva: `/swagger-ui.html`.

Puerto: **8081** (definido en `application.properties` como `server.port=8081`).

## Configuración (variables de entorno)

```properties
spring.datasource.url=jdbc:mysql://${DB_ENDPOINT}:${DB_PORT}/${DB_NAME}?...
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
```

| Variable | Default local | Descripción |
| -------- | ------------- | ----------- |
| `DB_ENDPOINT` | `mysql` | Host de la BD |
| `DB_PORT`     | `3306`  | Puerto MySQL |
| `DB_NAME`     | `despachos_db` | Nombre de la BD |
| `DB_USERNAME` | `innovatech` | Usuario |
| `DB_PASSWORD` | — | Contraseña (vía GitHub Secrets en producción) |

## Cómo correr en desarrollo

```bash
./mvnw spring-boot:run
# Disponible en http://localhost:8081
```

## Imagen Docker

```bash
docker build -t innovatech/back-despachos:latest .
docker run -d -p 8081:8081 \
  -e DB_ENDPOINT=host.docker.internal -e DB_PORT=3306 \
  -e DB_NAME=despachos_db \
  -e DB_USERNAME=innovatech -e DB_PASSWORD=*** \
  innovatech/back-despachos:latest
```

### Características del Dockerfile

- **Multi-stage build** (JDK Alpine → JRE Alpine).
- **Layered JAR** para cache eficiente entre builds.
- **Usuario no root** (`spring` UID 1001).
- **Healthcheck** sobre el endpoint REST.
- **JVM container-aware** con `MaxRAMPercentage=75`.

## Justificación de volúmenes

Servicio **stateless**, sin volúmenes propios. Persistencia delegada al contenedor MySQL (volumen nombrado `mysql_data`, descrito en el README raíz).

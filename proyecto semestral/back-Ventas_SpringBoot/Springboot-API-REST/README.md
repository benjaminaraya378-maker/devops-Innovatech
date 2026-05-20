# Backend Ventas · Innovatech Chile

API REST en Spring Boot 3.4 (Java 17) que gestiona el dominio de **ventas/compras**. Persiste en MySQL 8 y expone documentación OpenAPI vía Swagger UI.

## Endpoints principales

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| GET    | `/api/v1/ventas`               | Lista todas las ventas |
| GET    | `/api/v1/ventas/{id}`          | Obtiene una venta por ID |
| POST   | `/api/v1/ventas`               | Crea una venta |
| PUT    | `/api/v1/ventas/{id}`          | Actualiza una venta (p. ej. flag `despachoGenerado`) |
| DELETE | `/api/v1/ventas/{id}`          | Elimina una venta |

Documentación interactiva: `/swagger-ui.html`.

## Configuración (variables de entorno)

`src/main/resources/application.properties` está parametrizado:

```properties
spring.datasource.url=jdbc:mysql://${DB_ENDPOINT}:${DB_PORT}/${DB_NAME}?...
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
```

| Variable | Default local | Descripción |
| -------- | ------------- | ----------- |
| `DB_ENDPOINT` | `mysql` | Host de la BD (nombre de servicio en compose, IP/DNS en EC2) |
| `DB_PORT`     | `3306`  | Puerto MySQL |
| `DB_NAME`     | `ventas_db` | Nombre de la BD |
| `DB_USERNAME` | `innovatech` | Usuario |
| `DB_PASSWORD` | — | Contraseña (vía GitHub Secrets en producción) |

## Cómo correr en desarrollo

```bash
./mvnw spring-boot:run
# Disponible en http://localhost:8080
```

## Imagen Docker

```bash
docker build -t innovatech/back-ventas:latest .
docker run -d -p 8080:8080 \
  -e DB_ENDPOINT=host.docker.internal -e DB_PORT=3306 \
  -e DB_NAME=ventas_db \
  -e DB_USERNAME=innovatech -e DB_PASSWORD=*** \
  innovatech/back-ventas:latest
```

### Características del Dockerfile

- **Multi-stage build**: JDK 17 Alpine compila → JRE 17 Alpine ejecuta. La imagen final no incluye Maven ni el JDK completo.
- **Layered JAR (`spring-boot:layertools`)**: cuatro capas separadas (`dependencies`, `spring-boot-loader`, `snapshot-dependencies`, `application`). Si solo cambia el código, Docker reutiliza el cache de las dependencias.
- **Usuario no root** (`spring` UID 1001): cumple CIS Docker Benchmark.
- **Healthcheck** que invoca el endpoint REST.
- **`MaxRAMPercentage=75`**: la JVM respeta los límites de memoria del contenedor.

## Justificación de volúmenes

Este servicio es **stateless** y no monta volúmenes propios. Los datos se persisten en el contenedor de MySQL mediante el volumen nombrado `mysql_data` (ver README raíz, sección "Justificación del volumen").

Mantener el backend sin estado es lo que permite que en producción se pueda **destruir y recrear el contenedor con cada deploy** sin pérdida de información: el siguiente contenedor sigue viendo todos los datos al apuntar al mismo MySQL.

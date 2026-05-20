# syntax=docker/dockerfile:1.7
# =====================================================
# Backend Ventas - Spring Boot 3.4 (Java 17)
# Multi-stage build · Usuario no root · Layered JAR
# =====================================================

# ---------- Stage 1: BUILD ----------
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /build

# Copiamos primero solo los descriptores para aprovechar el cache de capas:
# si cambia el codigo pero no el pom.xml, Docker reutiliza las dependencias.
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Normalizar saltos de linea (Windows CRLF -> LF) y dar permisos
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Descargar dependencias offline para acelerar builds posteriores
RUN ./mvnw dependency:go-offline -B

# Copiar codigo fuente y compilar el JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests -B \
 && java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

# ---------- Stage 2: RUNTIME ----------
FROM eclipse-temurin:17-jre-alpine

# curl para healthcheck + usuario no root (CIS Docker Benchmark)
RUN apk add --no-cache curl \
 && addgroup -S spring -g 1001 \
 && adduser  -S spring -G spring -u 1001

WORKDIR /app

ARG EXTRACTED=/build/target/extracted
# Capas ordenadas de menor a mayor frecuencia de cambio
COPY --from=builder --chown=spring:spring ${EXTRACTED}/dependencies/          ./
COPY --from=builder --chown=spring:spring ${EXTRACTED}/spring-boot-loader/    ./
COPY --from=builder --chown=spring:spring ${EXTRACTED}/snapshot-dependencies/ ./
COPY --from=builder --chown=spring:spring ${EXTRACTED}/application/           ./

USER spring:spring
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS http://localhost:8080/api/v1/ventas || exit 1

# La JVM respeta los limites de memoria del contenedor
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]

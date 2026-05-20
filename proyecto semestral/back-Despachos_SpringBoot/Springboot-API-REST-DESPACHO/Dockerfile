# syntax=docker/dockerfile:1.7
# =====================================================
# Backend Despachos - Spring Boot 3.4 (Java 17)
# Multi-stage build · Usuario no root · Layered JAR
# =====================================================

# ---------- Stage 1: BUILD ----------
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /build

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw clean package -DskipTests -B \
 && java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

# ---------- Stage 2: RUNTIME ----------
FROM eclipse-temurin:17-jre-alpine

RUN apk add --no-cache curl \
 && addgroup -S spring -g 1001 \
 && adduser  -S spring -G spring -u 1001

WORKDIR /app

ARG EXTRACTED=/build/target/extracted
COPY --from=builder --chown=spring:spring ${EXTRACTED}/dependencies/          ./
COPY --from=builder --chown=spring:spring ${EXTRACTED}/spring-boot-loader/    ./
COPY --from=builder --chown=spring:spring ${EXTRACTED}/snapshot-dependencies/ ./
COPY --from=builder --chown=spring:spring ${EXTRACTED}/application/           ./

USER spring:spring
EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS http://localhost:8081/api/v1/despachos || exit 1

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]

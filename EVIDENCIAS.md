# Guía de evidencias para el informe

Este documento te dice **exactamente qué captura sacar para cada figura del informe**, dónde tomarla y dónde pegarla. El informe (`Informe_devops_EP2_Innovatech.pdf`) ya tiene 12 placeholders genéricos (Figuras 4 a 15) que debes reemplazar.

> **Cómo reemplazar un placeholder en Word**: clic derecho sobre la imagen del informe → **Cambiar imagen → Desde un archivo** → seleccionar tu captura. El tamaño y la caption se conservan.
>
> **Herramientas de captura**: en Windows usa `Win + Shift + S` (Snipping Tool), en macOS `Cmd + Shift + 4`. Evita fotografiar la pantalla con el celular: queda ilegible.

Guarda los originales en una carpeta `evidencias/` dentro del repo (este `.gitignore` permite agregarla; no se sube a GitHub a menos que tú quieras).

---

## Resumen visual: las 12 fotos que necesitas

| # | Figura informe | Página aprox. | Sección informe | Qué captura sacar | Dónde sacarla |
|---|----------------|---------------|-----------------|-------------------|---------------|
| 1 | **Fig. 4** | p. 21 | 6.1 Infraestructura AWS | 3 instancias EC2 en estado **running** | AWS Console → EC2 → Instances |
| 2 | **Fig. 5** | p. 22 | 6.1 Infraestructura AWS | Reglas Inbound del SG **innovatech-back-sg** | AWS Console → Security Groups → innovatech-back-sg → Inbound rules |
| 3 | **Fig. 6** | p. 22 | 6.2 Contenedores en operación | Salida de `docker compose ps` o `docker ps` con healthchecks | SSH a la EC2 → terminal |
| 4 | **Fig. 7** | p. 23 | 6.3 Frontend accesible | SPA cargada en navegador desde IP pública | Navegador local apuntando a `http://<IP_FRONT>` |
| 5 | **Fig. 8** | p. 24 | 6.4 Comunicación front→back | DevTools (F12) → Network → llamadas a `/api/v1/...` | Navegador local, F12 |
| 6 | **Fig. 9** | p. 25 | 6.5 Backends inalcanzables | `curl --max-time 5 …` con timeouts | Tu laptop (no la EC2), terminal |
| 7 | **Fig. 10** | p. 25 | 6.6 Persistencia | `docker volume ls` antes y después de borrar MySQL | SSH a la EC2 con MySQL, terminal |
| 8 | **Fig. 11** | p. 26 | 6.7 Pipeline CI/CD | Historial de runs en pestaña **Actions** | GitHub → repo → Actions |
| 9 | **Fig. 12** | p. 26 | 6.7 Pipeline CI/CD | 3 imágenes en **GHCR** con tags | GitHub → perfil → Your packages |
| 10 | **Fig. 13** | p. 27 | 6.8 GitHub Secrets | Lista de los ~11 secrets configurados | GitHub → repo → Settings → Secrets and variables → Actions |
| 11 | **Fig. 14** | p. 28 | 6.9 API docs (opcional) | Swagger UI de uno de los backends | Navegador local con port-forward SSH |
| 12 | **Fig. 15** | p. 29 | 6.10 Demo CRUD | Tablas con registros recién creados | Navegador local en el frontend en producción |

---

## Detalle paso a paso por figura

### 📸 Fig. 4 — Consola EC2 con 3 instancias running

**Dónde**: AWS Console → EC2 → Instances

**Qué debe verse**:
- Las 3 filas: `innovatech-front`, `innovatech-back-ventas`, `innovatech-back-despachos`
- Columna **Instance state** = **Running** en las 3
- Columna **Public IPv4 address**: solo el frontend tiene IP, las 2 backend tienen el campo vacío (esto demuestra que están en subred privada)

**Trampa común**: si ves IP pública en los backends, revisa que estén en una subred con `Auto-assign public IPv4` = Disable.

---

### 📸 Fig. 5 — Reglas Inbound del Security Group del backend

**Dónde**: AWS Console → EC2 → Security Groups → seleccionar `innovatech-back-sg` → tab **Inbound rules**

**Qué debe verse**:
- Reglas para puertos 8080 y 8081
- En **Source**, NO debe aparecer `0.0.0.0/0`. Debe aparecer el ID del SG del frontend (algo como `sg-xxxxxxxxxx / innovatech-front-sg`).
- Esto es la prueba clave de que solo el frontend puede llegar a los backends.

---

### 📸 Fig. 6 — `docker compose ps` mostrando los 4 contenedores

**Dónde**: SSH a una de las EC2 con contenedores corriendo. Ejecutar:

```bash
docker compose ps
# o si los contenedores están sueltos:
docker ps
```

**Qué debe verse**:
- 4 filas (o las que correspondan según la EC2): `mysql`, `back-ventas`, `back-despachos`, `front`
- Columna **STATUS**:
  - `mysql` → `Up X minutes (healthy)`
  - resto → `Up X minutes`
- Columna **PORTS** con los mappings (3306, 8080, 8081, 80→8080)

---

### 📸 Fig. 7 — Frontend cargado en el navegador

**Dónde**: en tu laptop, abrir el navegador y entrar a `http://<IP_PUBLICA_DEL_FRONTEND>`

**Qué debe verse**:
- La barra de URL con la IP pública visible (es importante para mostrar que se accede desde afuera)
- La página renderizada: navbar, carrusel, contenido principal
- **No** deben aparecer errores en consola (puedes capturar dos: una de la página y otra con la consola abierta)

---

### 📸 Fig. 8 — DevTools Network con llamadas a `/api/v1/...`

**Dónde**: con el frontend abierto, presionar **F12** → pestaña **Network** → recargar la página (Ctrl+R)

**Qué debe verse**:
- Filtrar por `api` (caja de filtro arriba de la lista)
- Aparecen requests a `/api/v1/ventas` y `/api/v1/despachos`
- Columna **Status** = `200`
- Columna **Domain** o **URL** = la misma IP del frontend (NO la IP de los backends). Esto prueba el proxy reverso de Nginx.

---

### 📸 Fig. 9 — `curl` directo a backends falla con timeout

**Dónde**: en tu laptop (no en la EC2), abrir una terminal y ejecutar:

```bash
# Intento 1: usando IP pública del frontend pero puerto del backend
curl --max-time 5 http://<IP_PUBLICA_FRONT>:8080/api/v1/ventas

# Intento 2: usando IP privada del backend (suponiendo que la conoces)
curl --max-time 5 http://<IP_PRIVADA_BACK_VENTAS>:8080/api/v1/ventas
```

**Qué debe verse**:
- Ambos comandos terminan con: `curl: (28) Connection timed out after 5000 milliseconds`
- Captura los dos en la misma imagen (recorte de terminal mostrando ambos comandos y sus errores)

Esta es la **prueba definitiva** de que los backends están aislados de Internet.

---

### 📸 Fig. 10 — Volumen persiste tras destruir contenedor

**Dónde**: SSH a la EC2 que aloja MySQL. Ejecutar en orden:

```bash
# 1. Ver el volumen
docker volume ls | grep mysql_data

# 2. Crear un registro desde el frontend antes de continuar
#    (abrir el front, crear una venta, anotar el ID)

# 3. Destruir el contenedor
docker stop innovatech-mysql && docker rm innovatech-mysql

# 4. Verificar que el volumen SIGUE existiendo
docker volume ls | grep mysql_data

# 5. Recrear el contenedor
docker compose up -d mysql

# 6. Verificar (en el frontend) que la venta sigue ahí
```

**Qué debe verse**:
- La misma captura debe mostrar las dos salidas del `docker volume ls` (antes y después), idealmente con el contenedor destruido en el medio.

---

### 📸 Fig. 11 — Historial de runs en GitHub Actions

**Dónde**: GitHub → tu repositorio `devops-Innovatech` → pestaña **Actions** → workflow **"CI/CD - Build & Deploy"**

**Qué debe verse**:
- Lista de runs ejecutados
- Cada uno con icono ✅ verde (idealmente al menos 2 o 3 runs exitosos)
- Columna con el commit asociado, fecha, duración

**Si no tienes runs aún**: haz un push a la rama `deploy`:
```bash
git checkout -b deploy
git push -u origin deploy
```

---

### 📸 Fig. 12 — Imágenes publicadas en GHCR

**Dónde**: GitHub → tu **avatar** (arriba derecha) → **Your packages**

**Qué debe verse**:
- 3 paquetes (cards): `front-despacho`, `back-ventas`, `back-despachos`
- Cada uno asociado al repositorio `devops-Innovatech`

Opcionalmente entra a uno y captura también los **tags**: deberías ver `latest` + uno o más `sha-<hash>`.

---

### 📸 Fig. 13 — GitHub Secrets configurados

**Dónde**: GitHub → repo `devops-Innovatech` → **Settings** → **Secrets and variables** → **Actions**

**Qué debe verse**:
- La lista de los ~11 secrets con sus nombres:
  - `EC2_SSH_USER`, `EC2_SSH_PRIVATE_KEY`
  - `EC2_FRONT_HOST`, `EC2_BACK_VENTAS_HOST`, `EC2_BACK_DESPACHOS_HOST`
  - `EC2_BACK_VENTAS_PRIVATE_IP`, `EC2_BACK_DESPACHOS_PRIVATE_IP`
  - `RDS_ENDPOINT`, `RDS_USERNAME`, `RDS_PASSWORD`
  - `GHCR_PAT`
- Los **valores nunca se muestran** (es la prueba de que GitHub los cifra). Solo aparecen nombre y fecha de última actualización.

---

### 📸 Fig. 14 — Swagger UI (OPCIONAL)

Esta figura es opcional. Si no la haces, puedes eliminarla del informe sin problema.

**Dónde**: necesitas hacer un túnel SSH desde tu laptop hasta el backend, porque está en subred privada:

```bash
ssh -L 8081:localhost:8081 -J ec2-user@<IP_FRONT> ec2-user@<IP_PRIVADA_BACK_DESPACHOS>
```

Mientras el túnel está abierto, abrir en tu navegador: `http://localhost:8081/swagger-ui.html`

**Qué debe verse**: la UI de Swagger con los endpoints de despachos listados y expandibles.

---

### 📸 Fig. 15 — Flujo CRUD completo

**Dónde**: en el frontend en producción (`http://<IP_FRONT>`), entrar al panel administrativo.

**Pasos**:
1. Crear una venta nueva desde el formulario
2. Asignarle un despacho desde la tabla
3. Capturar las dos tablas (Compras y Despachos) con los registros recién creados visibles

**Qué debe verse**: dos tablas pobladas, una al lado de la otra o una arriba de la otra. Si los registros recién creados están al final, hacer scroll para que se vean.

---

## Checklist antes de entregar

- [ ] Reemplazaste las 12 figuras placeholder (4 a 15) en el informe
- [ ] Las capturas se ven legibles (no fotos de pantalla con celular)
- [ ] En las URL no aparecen tokens ni contraseñas
- [ ] Los integrantes y la fecha de entrega están actualizados en la portada del informe
- [ ] Los repositorios están en GitHub con sus README.md actualizados
- [ ] El workflow CI/CD aparece en verde al menos una vez en Actions
- [ ] El informe en PDF y los repositorios están subidos a AVA

## Si algo no te funciona

| Síntoma | Causa probable | Cómo verificar |
| ------- | -------------- | -------------- |
| `docker pull` desde EC2 falla con `denied` | El paquete está como **private** en GHCR | Ir a Packages → Settings → Change visibility → Public, o configurar `GHCR_PAT` con scope `read:packages` |
| Pipeline falla en el job `deploy` | SSH key mal pegada en el secret | Asegurarte de incluir las líneas `BEGIN`/`END` y todos los saltos de línea |
| El frontend responde pero `/api/v1/...` da 502 | Las IPs privadas del backend no están bien en las variables del frontend | Revisar `BACK_VENTAS_URL` y `BACK_DESPACHOS_URL` en el comando `docker run` del workflow |
| MySQL no arranca tras destruir el volumen | `.env` con contraseñas distintas a las del volumen viejo | `docker volume rm mysql_data` y volver a levantar (perderás datos previos) |
| `docker compose up` queda en `waiting for healthy` | Spring Boot tarda más que `start_period` | Aumentar `start_period: 60s` a `90s` o `120s` |

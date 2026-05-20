import axios from "axios";

// Clientes HTTP con baseURL RELATIVA: el navegador siempre habla con el mismo
// origen del frontend (p. ej. http://<IP_PUBLICA_FRONT>) y es Nginx quien hace
// proxy_pass hacia los backends en la subred privada. Esto:
//  - Elimina problemas de CORS (mismo origen siempre).
//  - Permite cambiar la IP de los backends sin reconstruir el bundle.
//  - Mantiene a los backends inalcanzables desde Internet (rubrica).

const commonHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const apiVentas = axios.create({
  baseURL: "/api/v1/ventas",
  headers: commonHeaders,
  timeout: 10000,
});

export const apiDespachos = axios.create({
  baseURL: "/api/v1/despachos",
  headers: commonHeaders,
  timeout: 10000,
});

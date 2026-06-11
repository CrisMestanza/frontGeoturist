const DEV_DEFAULT = "http://51.81.85.35:8002";

// En Docker se construye con VITE_API_BASE_URL="" para que Nginx
// proxy /api/ al backend. En desarrollo local usa el valor por defecto.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEV_DEFAULT;

export const withApiBase = (url = "") =>
  typeof url === "string"
    ? url.replace(DEV_DEFAULT, API_BASE_URL.replace(/\/+$/, ""))
    : url;

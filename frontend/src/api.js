// Adresse du backend : définie par la variable VITE_API_URL (voir .env.example)
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status; // 0 = serveur injoignable
  }
}

export async function api(path, { method = "GET", body, form, token } = {}) {
  const headers = {};
  let payload;
  if (form) {
    payload = form; // FormData : le navigateur ajoute lui-même le Content-Type
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  if (token) headers.Authorization = `Bearer ${token}`;
  // Tunnel ngrok gratuit : évite la page d'avertissement qui bloquerait les appels du site vers l'API
  if (API_URL.includes("ngrok")) headers["ngrok-skip-browser-warning"] = "1";

  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body: payload });
  } catch {
    throw new ApiError("NETWORK", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Erreur serveur.", res.status);
  return data;
}

// Message en français (il passe ensuite par t() pour être traduit)
export function errorMessage(err) {
  if (err instanceof ApiError) {
    return err.status === 0 ? "Impossible de contacter le serveur. Réessayez plus tard." : err.message;
  }
  return "Erreur serveur.";
}

export const photoSrc = (p) => (p ? API_URL + p : null);
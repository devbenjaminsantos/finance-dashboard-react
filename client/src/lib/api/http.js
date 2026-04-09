import { clearStoredSession } from "./auth";

const API_URL = resolveApiUrl();

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");
  const hasBody = options.body != null;

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(hasBody && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar com a API. Verifique se o backend está publicado e acessível."
    );
  }

  if (response.status === 401 && token) {
    clearStoredSession();
    window.location.href = "/login";
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    let message = "Erro na requisição";

    try {
      const contentType = response.headers.get("content-type") || "";

      if (
        contentType.includes("application/json") ||
        contentType.includes("application/problem+json") ||
        contentType.includes("+json")
      ) {
        const data = await response.json();
        message =
          data?.message ||
          data?.error ||
          data?.detail ||
          data?.title ||
          message;
      } else {
        const text = (await response.text()).trim();
        if (text) {
          message = text;
        }
      }
    } catch {
      // Mantém a mensagem padrão quando a resposta não puder ser lida.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function resolveApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5278/api";
  }

  return "/api";
}

import { clearStoredSession } from "./auth";

const API_URL = "http://localhost:5278/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");
  const hasBody = options.body != null;

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(hasBody && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredSession();
    window.location.href = "/login";
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  if (!response.ok) {
    let message = "Erro na requisicao";

    try {
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        message =
          data?.message ||
          data?.error ||
          data?.title ||
          message;
      } else {
        const text = (await response.text()).trim();
        if (text) {
          message = text;
        }
      }
    } catch {
      // Mantem a mensagem padrao quando a resposta nao puder ser lida.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

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
    // Concentrei aqui o erro de conexão para não repetir fallback
    // em cada client de endpoint do front-end.
    throw new Error(
      "Não foi possível conectar com a API. Verifique se o back-end está publicado e acessível."
    );
  }

  if (response.status === 401 && token) {
    // 401 com token significa sessão expirada ou inválida.
    // Eu limpo tudo e forço o login para evitar UI inconsistente.
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
        // A API devolve tanto JSON comum quanto ProblemDetails.
        // Por isso tento ler várias chaves conhecidas antes de usar o fallback.
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
      // Se a resposta falhar ao ser lida, mantenho a mensagem padrão.
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
    // No ambiente local o back-end ASP.NET sobe nessa porta.
    return "http://localhost:5278/api";
  }

  // Em produção esse fallback só funciona quando existe proxy
  // ou API integrada no mesmo domínio.
  return "/api";
}

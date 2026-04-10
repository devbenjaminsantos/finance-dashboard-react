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
    // Concentrei aqui o erro de conexao para nao repetir fallback
    // em cada client de endpoint do frontend.
    throw new Error(
      "Nao foi possivel conectar com a API. Verifique se o backend esta publicado e acessivel."
    );
  }

  if (response.status === 401 && token) {
    // Nota para mim: 401 com token significa sessao expirada ou invalida.
    // Eu limpo tudo e forco o login para evitar UI inconsistente.
    clearStoredSession();
    window.location.href = "/login";
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  if (!response.ok) {
    let message = "Erro na requisicao";

    try {
      const contentType = response.headers.get("content-type") || "";

      if (
        contentType.includes("application/json") ||
        contentType.includes("application/problem+json") ||
        contentType.includes("+json")
      ) {
        // Nota para mim: a API devolve tanto JSON comum quanto ProblemDetails.
        // Por isso tento ler varias chaves conhecidas antes de usar o fallback.
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
      // Nota para mim: se a resposta falhar ao ser lida, mantenho a mensagem padrao.
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
    // Nota para mim: no ambiente local o backend ASP.NET sobe nessa porta.
    return "http://localhost:5278/api";
  }

  // Nota para mim: em producao esse fallback so funciona quando existe proxy
  // ou API integrada no mesmo dominio.
  return "/api";
}

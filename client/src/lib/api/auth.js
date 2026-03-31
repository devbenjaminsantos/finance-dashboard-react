import { apiRequest } from "./http";

export async function loginRequest(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user ?? null));

  return data;
}

export async function registerRequest(name, email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function logout() {
  clearStoredSession();
}

export function getStoredUser() {
  const raw = localStorage.getItem("user");

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      clearStoredSession();
      return null;
    }

    return parsed;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function getStoredToken() {
  const token = localStorage.getItem("token");
  return typeof token === "string" && token.trim() ? token : null;
}

export function isTokenExpired(token) {
  try {
    const payloadBase64 = token.split(".")[1];

    if (!payloadBase64) {
      return true;
    }

    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized));

    return !payload?.exp || payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function hasValidSession() {
  const token = getStoredToken();

  if (!token || isTokenExpired(token)) {
    clearStoredSession();
    return false;
  }

  return true;
}

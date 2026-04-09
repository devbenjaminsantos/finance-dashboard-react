import { apiRequest } from "./http";

export async function loginRequest(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  persistSession(data.token, data.user ?? null);

  return data;
}

export async function registerRequest(name, email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function forgotPasswordRequest(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordRequest(token, newPassword) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  dispatchSessionChange();
}

export function logout() {
  clearStoredSession();
}

export function persistSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user ?? null));
  dispatchSessionChange();
}

export function setStoredUser(user) {
  localStorage.setItem("user", JSON.stringify(user ?? null));
  dispatchSessionChange();
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

export function getProfile() {
  return apiRequest("/profile");
}

export async function updateProfileRequest(payload) {
  const user = await apiRequest("/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  setStoredUser(user);
  return user;
}

function dispatchSessionChange() {
  window.dispatchEvent(new Event("finova-session-change"));
}

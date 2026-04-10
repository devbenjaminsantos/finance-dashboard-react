import { apiRequest } from "./http";

export async function loginRequest(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Nota para mim: salvo token e user juntos para atualizar navbar, guards e requests
  // autenticados imediatamente depois do login.
  persistSession(data.token, data.user ?? null);

  return data;
}

export async function demoLoginRequest() {
  const data = await apiRequest("/auth/demo-login", {
    method: "POST",
  });

  // Nota para mim: a demo reaproveita o mesmo fluxo da conta real.
  // Isso evita criar excecoes de navegacao so para o modo demonstracao.
  persistSession(data.token, data.user ?? null);

  return data;
}

export async function registerRequest(name, email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function verifyEmailRequest(token) {
  return apiRequest("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendEmailVerificationRequest(email) {
  return apiRequest("/auth/resend-email-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
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
  const hadToken = localStorage.getItem("token") !== null;
  const hadUser = localStorage.getItem("user") !== null;

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (hadToken || hadUser) {
    // Nota para mim: so disparo o evento se algo mudou de verdade.
    // Isso evita loops desnecessarios nos componentes que escutam a sessao.
    dispatchSessionChange();
  }
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
      // Nota para mim: se o user salvo estiver corrompido, prefiro derrubar a sessao
      // inteira em vez de manter estado parcial.
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

    // Nota para mim: valido o exp no cliente para cortar sessao vencida
    // sem depender de uma chamada extra ao backend.
    return !payload?.exp || payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function hasValidSession() {
  const token = getStoredToken();

  if (!token) {
    const user = localStorage.getItem("user");

    if (user !== null) {
      // Nota para mim: isso cobre o caso em que sobrou user salvo sem token valido.
      clearStoredSession();
    }

    return false;
  }

  if (isTokenExpired(token)) {
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

  // Nota para mim: quando nome ou dados do perfil mudam, atualizo o user salvo
  // para a navbar refletir a mudanca sem novo login.
  setStoredUser(user);
  return user;
}

function dispatchSessionChange() {
  window.dispatchEvent(new Event("finova-session-change"));
}

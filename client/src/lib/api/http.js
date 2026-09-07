import {
  clearStoredSession,
  rememberPostLoginRedirect,
  touchSessionActivity,
} from "./auth";
import i18n from "../../i18n/i18n";

const API_URL = resolveApiUrl();
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const REQUEST_TIMEOUT_MS = 30_000;
const READ_RETRY_DELAY_MS = 1_000;
const TRANSIENT_STATUSES = new Set([502, 503, 504]);
let csrfToken = null;

const ERROR_CODE_TRANSLATIONS = {
  EMAIL_ALREADY_REGISTERED: "auth:emailAlreadyRegisteredError",
  EMAIL_NOT_CONFIRMED: "auth:emailNotConfirmedError",
  INVALID_CREDENTIALS: "auth:invalidCredentialsError",
  INVALID_RESET_TOKEN: "auth:invalidResetTokenError",
  INVALID_VERIFICATION_TOKEN: "auth:invalidVerificationTokenError",
  LOGIN_LOCKED: "auth:loginLockedError",
  PASSWORD_REUSED: "passwordPolicy:reused",
  PASSWORD_POLICY: "passwordPolicy:message",
};

const STATUS_TRANSLATIONS = {
  400: "common:requestInvalid",
  401: "common:requestUnauthorized",
  403: "common:requestForbidden",
  404: "common:requestNotFound",
  409: "common:requestConflict",
  429: "common:requestRateLimited",
};

export class ApiError extends Error {
  constructor(message, status, code = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const state = { mutationStarted: false };
  const cancel = () => controller.abort(options.signal.reason);
  let timedOut = false;
  if (options.signal?.aborted) cancel();
  else options.signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await sendApiRequest(path, { ...options, signal: controller.signal }, true, state);
  } catch (error) {
    if (controller.signal.aborted) {
      const code = timedOut ? "REQUEST_TIMEOUT" : "REQUEST_ABORTED";
      const key = state.mutationStarted ? "requestOutcomeUnknown"
        : timedOut ? "requestTimeout" : "requestAborted";
      throw new ApiError(i18n.t(`common:${key}`), 0, code);
    }
    if (error instanceof TypeError) {
      throw new ApiError(i18n.t(state.mutationStarted
        ? "common:requestOutcomeUnknown" : "common:networkError"), 0);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", cancel);
  }
}

async function sendApiRequest(path, options, canRetryCsrf, state) {
  options.signal.throwIfAborted();
  const method = (options.method || "GET").toUpperCase();
  const hadSession = localStorage.getItem("user") !== null;
  const hasBody = options.body != null;
  const requestCsrfToken = SAFE_METHODS.has(method)
    ? null
    : await getCsrfToken(options.signal);

  const headers = {
    ...(hasBody && { "Content-Type": "application/json" }),
    ...options.headers,
    ...(requestCsrfToken && { "X-CSRF-TOKEN": requestCsrfToken }),
  };

  options.signal.throwIfAborted();
  if (!SAFE_METHODS.has(method)) state.mutationStarted = true;
  const response = await fetchWithReadRetry(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && hadSession) {
    rememberPostLoginRedirect(window.location.pathname);
    clearStoredSession("expired");
    window.location.href = "/login";
    throw new ApiError(i18n.t("common:sessionExpired"), response.status);
  }

  if (!response.ok) {
    let errorPayload = null;

    try {
      const contentType = response.headers.get("content-type") || "";

      if (
        contentType.includes("application/json") ||
        contentType.includes("application/problem+json") ||
        contentType.includes("+json")
      ) {
        errorPayload = await response.json();
      }
    } catch {
      options.signal.throwIfAborted();
      // A interface usa uma mensagem localizada mesmo se a resposta for inválida.
    }

    const code = typeof errorPayload?.code === "string" ? errorPayload.code : null;

    if (code === "INVALID_CSRF_TOKEN" && canRetryCsrf && !SAFE_METHODS.has(method)) {
      state.mutationStarted = false;
      resetCsrfToken();
      return sendApiRequest(path, options, false, state);
    }

    const translationKey = (!SAFE_METHODS.has(method) && response.status >= 500
      ? "common:requestOutcomeUnknown" : null) || ERROR_CODE_TRANSLATIONS[code] ||
      STATUS_TRANSLATIONS[response.status] ||
      "common:requestFailed";

    throw new ApiError(i18n.t(translationKey), response.status, code);
  }

  if (response.status === 204) {
    touchSessionActivity();
    return null;
  }

  const data = await response.json();
  touchSessionActivity();
  return data;
}

export function resetCsrfToken() {
  csrfToken = null;
}

async function getCsrfToken(signal) {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetchWithReadRetry(`${API_URL}/auth/csrf-token`, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new ApiError(i18n.t("common:requestFailed"), response.status);
  }

  const data = await response.json();

  if (typeof data?.token !== "string" || !data.token) {
    throw new ApiError(i18n.t("common:requestFailed"), response.status);
  }

  csrfToken = data.token;
  return csrfToken;
}

// Only safe HTTP methods retry, once, within the original request deadline.
async function fetchWithReadRetry(url, options) {
  const canRetry = SAFE_METHODS.has((options.method || "GET").toUpperCase());
  for (let attempt = 0; ; attempt += 1) {
    options.signal.throwIfAborted();
    try {
      const response = await fetch(url, options);
      if (!canRetry || attempt > 0 || !TRANSIENT_STATUSES.has(response.status)) return response;
      await response.body?.cancel();
    } catch (error) {
      options.signal.throwIfAborted();
      if (!canRetry || attempt > 0 || !(error instanceof TypeError)) throw error;
    }
    await waitForReadRetry(options.signal);
  }
}

function waitForReadRetry(signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const cancel = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, READ_RETRY_DELAY_MS);
    signal.addEventListener("abort", cancel, { once: true });
  });
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

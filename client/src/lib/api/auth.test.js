import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./http", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "./http";
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  hasValidSession,
  isTokenExpired,
  persistSession,
  setStoredUser,
  updateOnboardingPreferenceRequest,
} from "./auth";

function buildToken(payload) {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `header.${encodedPayload}.signature`;
}

describe("auth storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("persists token and user together", () => {
    persistSession("token-123", { id: 1, name: "Finova" });

    expect(getStoredToken()).toBe("token-123");
    expect(getStoredUser()).toEqual({ id: 1, name: "Finova" });
  });

  it("clears corrupted stored user", () => {
    localStorage.setItem("user", "{");

    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("detects expired token from JWT payload", () => {
    const expiredToken = buildToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    const validToken = buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 });

    expect(isTokenExpired(expiredToken)).toBe(true);
    expect(isTokenExpired(validToken)).toBe(false);
  });

  it("returns false for invalid sessions and clears stale user-only storage", () => {
    localStorage.setItem("user", JSON.stringify({ id: 1 }));

    expect(hasValidSession()).toBe(false);
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("updates onboarding preference and refreshes stored user", async () => {
    apiRequest.mockResolvedValue({
      id: 7,
      name: "Finova User",
      email: "user@finova.app",
      onboardingOptIn: true,
    });

    const user = await updateOnboardingPreferenceRequest(true);

    expect(apiRequest).toHaveBeenCalledWith("/profile/onboarding-preference", {
      method: "PUT",
      body: JSON.stringify({ onboardingOptIn: true }),
    });
    expect(user.onboardingOptIn).toBe(true);
    expect(getStoredUser()).toEqual(user);
  });

  it("allows updating stored user directly", () => {
    setStoredUser({ id: 2, name: "Outro" });

    expect(getStoredUser()).toEqual({ id: 2, name: "Outro" });

    clearStoredSession();
    expect(getStoredUser()).toBeNull();
    expect(getStoredToken()).toBeNull();
  });
});

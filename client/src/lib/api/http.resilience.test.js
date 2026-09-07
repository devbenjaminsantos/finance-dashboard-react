import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../../i18n/i18n";
import { apiRequest, resetCsrfToken } from "./http";

const response = (data = {}, status = 200) => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: () => "application/json" }, json: async () => data,
});
const stalled = (signal) => new Promise((resolve, reject) => {
  signal.addEventListener("abort", () => reject(signal.reason), { once: true });
});
const unknown = "We could not confirm the result of your request. Check whether it completed before trying again.";

describe("API deadlines and safe retries", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.clear();
    resetCsrfToken();
    await i18n.changeLanguage("en-US");
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it.each(["headers", "body"])("times out stalled %s without expiring the session", async (phase) => {
    localStorage.setItem("user", JSON.stringify({ id: 1 }));
    const fetchMock = vi.fn((url, { signal }) => phase === "headers"
      ? stalled(signal) : Promise.resolve({ ...response(), json: () => stalled(signal) }));
    vi.stubGlobal("fetch", fetchMock);
    const result = expect(apiRequest("/profile")).rejects.toMatchObject({ code: "REQUEST_TIMEOUT", status: 0 });
    await vi.advanceTimersByTimeAsync(30_000);
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("user")).not.toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not send a mutation if CSRF acquisition times out", async () => {
    const fetchMock = vi.fn((url, { signal }) => stalled(signal));
    vi.stubGlobal("fetch", fetchMock);
    const result = expect(apiRequest("/auth/login", { method: "POST" }))
      .rejects.toMatchObject({ code: "REQUEST_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(30_000);
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/auth/csrf-token");
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("never retries a timed-out %s", async (method) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ token: "csrf" }))
      .mockImplementation((url, { signal }) => stalled(signal));
    vi.stubGlobal("fetch", fetchMock);
    const result = expect(apiRequest("/transactions", { method }))
      .rejects.toMatchObject({ code: "REQUEST_TIMEOUT", message: unknown });
    await vi.advanceTimersByTimeAsync(30_000);
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([502, 503, 504])("retries a read once after HTTP %s", async (status) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({}, status))
      .mockResolvedValueOnce(response({ ready: true }));
    vi.stubGlobal("fetch", fetchMock);
    const request = apiRequest("/profile");
    await vi.advanceTimersByTimeAsync(999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(request).resolves.toEqual({ ready: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("limits network failures to two read attempts", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    const result = expect(apiRequest("/profile")).rejects.toMatchObject({ status: 0 });
    await vi.advanceTimersByTimeAsync(1_000);
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([400, 403, 429, 500])("does not retry a read after HTTP %s", async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(response({}, status));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiRequest("/profile")).rejects.toMatchObject({ status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([502, 503, 504])("does not retry a mutation after HTTP %s", async (status) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ token: "csrf" }))
      .mockResolvedValueOnce(response({}, status));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiRequest("/transactions", { method: "POST" })).rejects.toMatchObject({ status });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a mutation after network failure", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ token: "csrf" }))
      .mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiRequest("/transactions", { method: "POST" })).rejects.toMatchObject({ message: unknown });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the original deadline after a slow CSRF response", async () => {
    let resolveCsrf;
    const fetchMock = vi.fn().mockImplementationOnce(() => new Promise(resolve => { resolveCsrf = resolve; }))
      .mockImplementation((url, { signal }) => stalled(signal));
    vi.stubGlobal("fetch", fetchMock);
    const result = expect(apiRequest("/auth/login", { method: "POST" }))
      .rejects.toMatchObject({ code: "REQUEST_TIMEOUT", message: unknown });
    await vi.advanceTimersByTimeAsync(20_000);
    resolveCsrf(response({ token: "csrf" }));
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("honors cancellation during retry backoff", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue(response({}, 503));
    vi.stubGlobal("fetch", fetchMock);
    const result = expect(apiRequest("/profile", { signal: controller.signal }))
      .rejects.toMatchObject({ code: "REQUEST_ABORTED" });
    await vi.advanceTimersByTimeAsync(500);
    controller.abort();
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not send an already canceled request", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiRequest("/profile", { signal: controller.signal }))
      .rejects.toMatchObject({ code: "REQUEST_ABORTED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

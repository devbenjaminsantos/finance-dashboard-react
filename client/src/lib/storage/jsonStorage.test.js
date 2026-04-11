import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadJSON, saveJSON } from "./jsonStorage";

describe("jsonStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("loads saved JSON from localStorage", () => {
    localStorage.setItem("filters", JSON.stringify({ q: "mercado" }));

    expect(loadJSON("filters", {})).toEqual({ q: "mercado" });
  });

  it("returns fallback when value is missing", () => {
    expect(loadJSON("missing", { ok: true })).toEqual({ ok: true });
  });

  it("returns fallback when JSON is invalid", () => {
    localStorage.setItem("broken", "{");

    expect(loadJSON("broken", ["fallback"])).toEqual(["fallback"]);
  });

  it("saves JSON without throwing", () => {
    saveJSON("prefs", { theme: "dark" });

    expect(localStorage.getItem("prefs")).toBe(JSON.stringify({ theme: "dark" }));
  });

  it("ignores storage failures to preserve UX", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota exceeded");
      });

    expect(() => saveJSON("prefs", { theme: "dark" })).not.toThrow();
    expect(setItemSpy).toHaveBeenCalled();
  });
});

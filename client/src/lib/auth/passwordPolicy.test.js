import { describe, expect, it } from "vitest";
import { isPasswordStrong, PASSWORD_POLICY_MESSAGE } from "./passwordPolicy";

describe("passwordPolicy", () => {
  it("accepts strong passwords", () => {
    expect(isPasswordStrong("SenhaSegura123!")).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(isPasswordStrong("12345678")).toBe(false);
    expect(isPasswordStrong("senhasegura123")).toBe(false);
    expect(isPasswordStrong("SENHASEGURA123")).toBe(false);
    expect(isPasswordStrong("SenhaSegura")).toBe(false);
  });

  it("exposes a consistent validation message", () => {
    expect(PASSWORD_POLICY_MESSAGE).toContain("10 caracteres");
  });
});

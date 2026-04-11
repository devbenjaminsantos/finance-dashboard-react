import { describe, expect, it } from "vitest";
import { formatBRLFromCents, parseMoneyToCents } from "./currency";

describe("currency helpers", () => {
  it("formats cents to BRL", () => {
    expect(formatBRLFromCents(123456)).toBe("R$ 1.234,56");
  });

  it("parses Brazilian formatted values", () => {
    expect(parseMoneyToCents("1.234,56")).toBe(123456);
    expect(parseMoneyToCents("150,00")).toBe(15000);
  });

  it("parses dot decimal values", () => {
    expect(parseMoneyToCents("150.75")).toBe(15075);
  });

  it("returns NaN for invalid values", () => {
    expect(Number.isNaN(parseMoneyToCents(""))).toBe(true);
    expect(Number.isNaN(parseMoneyToCents("abc"))).toBe(true);
  });
});

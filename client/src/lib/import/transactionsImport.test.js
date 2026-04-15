import { describe, expect, it } from "vitest";
import { parseTransactionsImport } from "./transactionsImport";

describe("transactions import format detection", () => {
  it("routes csv files to the csv parser", () => {
    const result = parseTransactionsImport(
      `Data;Descricao;Valor
14/04/2026;Mercado;-120,00`,
      "extrato.csv"
    );

    expect(result.format).toBe("csv");
    expect(result.transactions[0].type).toBe("expense");
  });

  it("routes ofx files to the ofx parser", () => {
    const result = parseTransactionsImport(
      `<OFX><STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260417000000<TRNAMT>100.00<NAME>PIX</STMTTRN></OFX>`,
      "extrato.ofx"
    );

    expect(result.format).toBe("ofx");
    expect(result.transactions[0]).toMatchObject({
      date: "2026-04-17",
      type: "income",
      amountCents: 10000,
    });
  });
});

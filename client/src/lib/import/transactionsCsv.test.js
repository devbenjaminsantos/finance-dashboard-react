import { describe, expect, it } from "vitest";
import { parseTransactionsCsv } from "./transactionsCsv";

describe("transactionsCsv import parser", () => {
  it("parses semicolon csv with pt-BR headers", () => {
    const result = parseTransactionsCsv(`Data;Descrição;Categoria;Tipo;Valor
14/04/2026;Mercado;Alimentação;Despesa;120,50
15/04/2026;Salário;Salário;Receita;5000,00`);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      date: "2026-04-14",
      description: "Mercado",
      type: "expense",
      amountCents: 12050,
    });
    expect(result[1]).toMatchObject({
      type: "income",
      amountCents: 500000,
    });
  });

  it("parses amount cents when provided directly", () => {
    const result = parseTransactionsCsv(`date,description,type,amountCents,category
2026-04-14,Pix recebido,income,18990,Reembolso`);

    expect(result[0].amountCents).toBe(18990);
  });

  it("throws when a required column is missing", () => {
    expect(() =>
      parseTransactionsCsv(`Descricao;Tipo;Valor
Mercado;Despesa;120,00`)
    ).toThrow(/Data, Descrição e Tipo/i);
  });
});

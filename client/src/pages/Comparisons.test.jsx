import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Comparisons from "./Comparisons";

vi.mock("../features/transactions/useTransactions", () => ({
  useTransactions: vi.fn(),
}));

vi.mock("../lib/api/financialAccounts", () => ({
  getFinancialAccounts: vi.fn(),
}));

import { useTransactions } from "../features/transactions/useTransactions";
import { getFinancialAccounts } from "../lib/api/financialAccounts";

describe("Comparisons page", () => {
  function renderComparisons() {
    return render(
      <MemoryRouter>
        <Comparisons />
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    getFinancialAccounts.mockResolvedValue([
      {
        id: 1,
        institutionName: "Nubank",
        accountName: "Conta principal",
        accountMask: "1234",
      },
    ]);
  });

  it("shows the forecast section when there is enough history", () => {
    useTransactions.mockReturnValue({
      isLoading: false,
      transactions: [
        {
          id: 1,
          description: "Salario",
          category: "Salario",
          amountCents: 300000,
          date: "2026-01-05",
          type: "income",
          financialAccountId: 1,
        },
        {
          id: 2,
          description: "Mercado",
          category: "Alimentacao",
          amountCents: 120000,
          date: "2026-01-10",
          type: "expense",
          financialAccountId: 1,
        },
        {
          id: 3,
          description: "Salario",
          category: "Salario",
          amountCents: 320000,
          date: "2026-02-05",
          type: "income",
          financialAccountId: 1,
        },
        {
          id: 4,
          description: "Mercado",
          category: "Alimentacao",
          amountCents: 140000,
          date: "2026-02-10",
          type: "expense",
          financialAccountId: 1,
        },
        {
          id: 5,
          description: "Salario",
          category: "Salario",
          amountCents: 340000,
          date: "2026-03-05",
          type: "income",
          financialAccountId: 1,
        },
        {
          id: 6,
          description: "Mercado",
          category: "Alimentacao",
          amountCents: 150000,
          date: "2026-03-10",
          type: "expense",
          financialAccountId: 1,
        },
      ],
    });

    renderComparisons();

    expect(screen.getByText("Previsao dos proximos meses")).toBeInTheDocument();
    expect(screen.getAllByText("Mes projetado")).toHaveLength(3);
    expect(screen.getByText("Media base de saldo")).toBeInTheDocument();
    expect(screen.getByText("Saldo global em todas as contas")).toBeInTheDocument();
  });

  it("shows an empty forecast state when there is not enough history", () => {
    useTransactions.mockReturnValue({
      isLoading: false,
      transactions: [
        {
          id: 1,
          description: "Salario",
          category: "Salario",
          amountCents: 300000,
          date: "2026-03-05",
          type: "income",
          financialAccountId: 1,
        },
        {
          id: 2,
          description: "Mercado",
          category: "Alimentacao",
          amountCents: 120000,
          date: "2026-03-10",
          type: "expense",
          financialAccountId: 1,
        },
      ],
    });

    renderComparisons();

    expect(
      screen.getByText(
        "Adicione pelo menos tres meses com movimentacoes para ativar a previsao baseada em historico."
      )
    ).toBeInTheDocument();
  });
});

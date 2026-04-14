import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

vi.mock("../features/transactions/useTransactions", () => ({
  useTransactions: vi.fn(),
}));

vi.mock("../features/dashboard/DashboardCharts", () => ({
  default: () => <div>Graficos mockados</div>,
}));

import { useTransactions } from "../features/transactions/useTransactions";

describe("Dashboard page", () => {
  function renderDashboard() {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a financial summary and charts when there are transactions", () => {
    useTransactions.mockReturnValue({
      isLoading: false,
      transactions: [
        {
          id: 1,
          description: "Salario",
          category: "Salario",
          amountCents: 500000,
          date: "2026-04-05",
          type: "income",
          isRecurring: true,
        },
        {
          id: 2,
          description: "Mercado",
          category: "Alimentacao",
          amountCents: 120000,
          date: "2026-04-10",
          type: "expense",
          isRecurring: false,
        },
      ],
    });

    renderDashboard();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Graficos do periodo")).toBeInTheDocument();
    expect(screen.getByText("Graficos mockados")).toBeInTheDocument();
  });

  it("shows an empty state when the selected period has no transactions", () => {
    useTransactions.mockReturnValue({
      isLoading: false,
      transactions: [],
    });

    renderDashboard();

    expect(screen.getByText("Nenhum dado para o periodo selecionado")).toBeInTheDocument();
  });
});

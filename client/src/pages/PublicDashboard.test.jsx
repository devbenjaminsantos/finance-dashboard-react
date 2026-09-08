import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicDashboard from "./PublicDashboard";

vi.mock("../lib/api/publicDashboard", () => ({
  getPublicDashboard: vi.fn(),
}));

vi.mock("../features/dashboard/DashboardCharts", () => ({
  default: () => <div>Graficos publicos mockados</div>,
}));

import { getPublicDashboard } from "../lib/api/publicDashboard";

describe("Public dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/compartilhado/token-publico"]}>
        <Routes>
          <Route path="/compartilhado/:token" element={<PublicDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("loads the shared charts in read-only mode", async () => {
    getPublicDashboard.mockResolvedValue({
      displayName: "Keller",
      lastTransactionDate: "2026-04-01",
      transactions: [
        {
          date: "2026-04-01",
          category: "Salario",
          amountCents: 500000,
          type: "income",
        },
        {
          date: "2026-04-01",
          category: "Moradia",
          amountCents: 150000,
          type: "expense",
        },
      ],
    });

    renderPage();

    expect(await screen.findByText("Painel público")).toBeInTheDocument();
    expect(screen.getByText("Somente leitura")).toBeInTheDocument();
    expect(
      screen.getByText("Exibe até 100 lançamentos dos últimos 12 meses, agrupados por mês.")
    ).toBeInTheDocument();

    const periodSelect = screen.getByLabelText("Período");
    await waitFor(() => expect(periodSelect).not.toBeDisabled());
    expect(screen.queryByRole("option", { name: "Todo o histórico" })).not.toBeInTheDocument();
    fireEvent.change(periodSelect, { target: { value: "last-6-months" } });

    expect(await screen.findByText("Graficos publicos mockados")).toBeInTheDocument();
  });

  it("shows an unavailable state when the link is invalid", async () => {
    getPublicDashboard.mockRejectedValue(new Error("Painel publico nao encontrado."));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Painel indisponível")).toBeInTheDocument();
    });
  });
});

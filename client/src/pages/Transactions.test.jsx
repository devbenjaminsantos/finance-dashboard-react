import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Transactions from "./Transactions";

const mockDownloadCsv = vi.fn();
const mockExportPdf = vi.fn();

vi.mock("../features/transactions/useTransactions", () => ({
  useTransactions: vi.fn(),
}));

vi.mock("../lib/export/csv", () => ({
  downloadCsv: (...args) => mockDownloadCsv(...args),
}));

vi.mock("../lib/export/pdf", () => ({
  exportTransactionsToPdf: (...args) => mockExportPdf(...args),
}));

vi.mock("../lib/storage/jsonStorage", () => ({
  loadJSON: vi.fn(() => ({
    q: "",
    typeFilter: "all",
    categoryFilter: "all",
    month: "",
    sortBy: "date_desc",
  })),
  saveJSON: vi.fn(),
}));

import { useTransactions } from "../features/transactions/useTransactions";

const transactionsFixture = [
  {
    id: 1,
    description: "Mercado",
    category: "Alimentação",
    amountCents: 15000,
    date: "2026-04-11",
    type: "expense",
    isRecurring: false,
  },
  {
    id: 2,
    description: "Salário",
    category: "Salário",
    amountCents: 500000,
    date: "2026-04-05",
    type: "income",
    isRecurring: true,
  },
];

describe("Transactions page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTransactions.mockReturnValue({
      transactions: transactionsFixture,
      addTransaction: vi.fn(),
      removeTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      isLoading: false,
    });
  });

  it("filters transactions by search text", () => {
    render(<Transactions />);

    fireEvent.change(screen.getByPlaceholderText(/buscar/i), {
      target: { value: "mercado" },
    });

    expect(screen.getByText("Mercado")).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Salário" })).not.toBeInTheDocument();
  });

  it("exports the currently filtered rows to CSV", () => {
    render(<Transactions />);

    fireEvent.change(screen.getByPlaceholderText(/buscar/i), {
      target: { value: "sal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));

    expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
    const [filename, rows] = mockDownloadCsv.mock.calls[0];

    expect(filename).toContain("finova-transacoes");
    expect(rows).toHaveLength(2);
    expect(rows[1][1]).toBe("Salário");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    tagFilter: "all",
    typeFilter: "all",
    categoryFilter: "all",
    month: "",
    sortBy: "date_desc",
  })),
  saveJSON: vi.fn(),
}));

vi.mock("../features/transactions/components/TransactionImportModal", () => ({
  default: ({ isOpen, onImport }) =>
    isOpen ? (
      <button
        type="button"
        onClick={() =>
          onImport({
            transactions: [
              {
                description: "Importada",
                category: "Outros",
                amountCents: 1000,
                date: "2026-04-20",
                type: "expense",
              },
            ],
            importFormat: "csv",
          })
        }
      >
        Confirmar importacao mock
      </button>
    ) : null,
}));

import { useTransactions } from "../features/transactions/useTransactions";

const transactionsFixture = [
  {
    id: 1,
    description: "Mercado",
    category: "Alimentacao",
    tagNames: ["casa", "essencial"],
    amountCents: 15000,
    date: "2026-04-11",
    type: "expense",
    source: "manual",
    isRecurring: false,
  },
  {
    id: 2,
    description: "Salario",
    category: "Salario",
    tagNames: ["trabalho"],
    amountCents: 500000,
    date: "2026-04-05",
    type: "income",
    source: "import_csv",
    importedAtUtc: "2026-04-16T10:30:00Z",
    isRecurring: true,
  },
];

describe("Transactions page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTransactions.mockReturnValue({
      transactions: transactionsFixture,
      addTransaction: vi.fn(),
      importTransactions: vi.fn().mockResolvedValue({ importedCount: 1 }),
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
    expect(screen.queryByRole("cell", { name: "Salario" })).not.toBeInTheDocument();
  });

  it("filters transactions by tag", () => {
    render(<Transactions />);

    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "trabalho" },
    });

    expect(screen.getAllByText("Salario").length).toBeGreaterThan(0);
    expect(screen.queryByRole("cell", { name: "Mercado" })).not.toBeInTheDocument();
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
    expect(rows[1][1]).toBe("Salario");
    expect(rows[1][3]).toBe("trabalho");
  });

  it("shows the transaction origin badges and tags", () => {
    render(<Transactions />);

    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("Importada via CSV")).toBeInTheDocument();
    expect(screen.getAllByText("#casa").length).toBeGreaterThan(0);
  });

  it("shows import feedback after confirming an import", async () => {
    render(<Transactions />);

    fireEvent.click(screen.getByRole("button", { name: "Importar arquivo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar importacao mock" }));

    expect(
      await screen.findByText("1 transacao importada com sucesso via CSV.")
    ).toBeInTheDocument();
  });
});

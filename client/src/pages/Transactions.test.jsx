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
    installmentIndex: 3,
    installmentCount: 10,
    installmentGroupId: "installment-plan-1",
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
      removeInstallmentGroup: vi.fn(),
      updateTransaction: vi.fn(),
      updateInstallmentGroup: vi.fn(),
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

  it("shows the transaction origin badges, tags and installment progress", () => {
    render(<Transactions />);

    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("Importada via CSV")).toBeInTheDocument();
    expect(screen.getAllByText("#casa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Parcela 3/10").length).toBeGreaterThan(0);
    expect(screen.getByText(/8 parcela\(s\) restantes/i)).toBeInTheDocument();
    expect(screen.getByText("Compras parceladas")).toBeInTheDocument();
    expect(screen.getByText("Valor total")).toBeInTheDocument();
    expect(screen.getByText("Ja lancado")).toBeInTheDocument();
    expect(screen.getByText("Saldo restante")).toBeInTheDocument();
  });

  it("shows import feedback after confirming an import", async () => {
    render(<Transactions />);

    fireEvent.click(screen.getByRole("button", { name: "Importar arquivo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar importacao mock" }));

    expect(
      await screen.findByText("1 transacao importada com sucesso via CSV.")
    ).toBeInTheDocument();
  });

  it("removes an installment purchase from the grouped card", () => {
    const removeInstallmentGroup = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    useTransactions.mockReturnValue({
      transactions: transactionsFixture,
      addTransaction: vi.fn(),
      importTransactions: vi.fn().mockResolvedValue({ importedCount: 1 }),
      removeTransaction: vi.fn(),
      removeInstallmentGroup,
      updateTransaction: vi.fn(),
      updateInstallmentGroup: vi.fn(),
      isLoading: false,
    });

    render(<Transactions />);

    fireEvent.click(screen.getByRole("button", { name: "Remover compra" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(removeInstallmentGroup).toHaveBeenCalledWith("installment-plan-1");
  });

  it("edits an installment purchase from the grouped card", async () => {
    const updateInstallmentGroup = vi.fn().mockResolvedValue(undefined);

    useTransactions.mockReturnValue({
      transactions: transactionsFixture,
      addTransaction: vi.fn(),
      importTransactions: vi.fn().mockResolvedValue({ importedCount: 1 }),
      removeTransaction: vi.fn(),
      removeInstallmentGroup: vi.fn(),
      updateTransaction: vi.fn(),
      updateInstallmentGroup,
      isLoading: false,
    });

    render(<Transactions />);

    fireEvent.click(screen.getByRole("button", { name: "Editar compra" }));
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Notebook" },
    });
    fireEvent.change(screen.getByLabelText("Tags", { selector: "input" }), {
      target: { value: "trabalho, tecnologia" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar compra" }));

    expect(updateInstallmentGroup).toHaveBeenCalledWith("installment-plan-1", {
      description: "Notebook",
      category: "Salario",
      tagNames: ["trabalho", "tecnologia"],
    });
  });
});

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
    installmentIndex: 1,
    installmentCount: 3,
    installmentGroupId: "installment-plan-1",
    description: "Notebook",
    category: "Tecnologia",
    tagNames: ["trabalho"],
    amountCents: 200000,
    date: "2026-03-05",
    type: "expense",
    source: "import_csv",
    importedAtUtc: "2026-04-16T10:30:00Z",
    isRecurring: false,
  },
  {
    id: 3,
    installmentIndex: 2,
    installmentCount: 3,
    installmentGroupId: "installment-plan-1",
    description: "Notebook",
    category: "Tecnologia",
    tagNames: ["trabalho"],
    amountCents: 200000,
    date: "2026-04-05",
    type: "expense",
    source: "import_csv",
    importedAtUtc: "2026-04-16T10:30:00Z",
    isRecurring: false,
  },
  {
    id: 4,
    installmentIndex: 3,
    installmentCount: 3,
    installmentGroupId: "installment-plan-1",
    description: "Notebook",
    category: "Tecnologia",
    tagNames: ["trabalho"],
    amountCents: 200000,
    date: "2026-05-05",
    type: "expense",
    source: "import_csv",
    importedAtUtc: "2026-04-16T10:30:00Z",
    isRecurring: false,
  },
];

const installmentPlansFixture = [
  {
    id: "installment-plan-1",
    description: "Notebook",
    category: "Tecnologia",
    tagNames: ["trabalho"],
    amountPerInstallmentCents: 200000,
    installmentCount: 3,
    postedInstallments: 2,
    remainingInstallments: 1,
    upcomingInstallments: 1,
    totalAmountCents: 600000,
    paidAmountCents: 400000,
    remainingAmountCents: 200000,
    nextInstallmentDate: "2026-05-05T00:00:00",
    nextInstallmentIndex: 3,
  },
];

const recurringRulesFixture = [
  {
    id: "recurring-rule-1",
    description: "Condominio",
    category: "Moradia",
    amountCents: 180000,
    type: "expense",
    startDate: "2026-04-07T00:00:00",
    endDate: "2026-12-07T00:00:00",
    nextOccurrenceDate: "2026-05-07T00:00:00",
    lastGeneratedDate: "2026-04-07T00:00:00",
    isActive: true,
    tagNames: ["casa"],
  },
];

describe("Transactions page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useTransactions.mockReturnValue({
      transactions: transactionsFixture,
      installmentPlans: installmentPlansFixture,
      recurringRules: recurringRulesFixture,
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
    expect(screen.queryByRole("cell", { name: "Notebook" })).not.toBeInTheDocument();
  });

  it("filters transactions by tag", () => {
    render(<Transactions />);

    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "trabalho" },
    });

    expect(screen.getAllByText("Notebook").length).toBeGreaterThan(0);
    expect(screen.queryByRole("cell", { name: "Mercado" })).not.toBeInTheDocument();
  });

  it("exports the currently filtered rows to CSV", () => {
    render(<Transactions />);

    fireEvent.change(screen.getByPlaceholderText(/buscar/i), {
      target: { value: "note" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));

    expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
    const [filename, rows] = mockDownloadCsv.mock.calls[0];

    expect(filename).toContain("finova-transacoes");
    expect(rows).toHaveLength(4);
    expect(rows[1][1]).toBe("Notebook");
    expect(rows[1][3]).toBe("trabalho");
  });

  it("shows the transaction origin badges, tags and installment progress", () => {
    render(<Transactions />);

    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getAllByText("Importada via CSV").length).toBeGreaterThan(0);
    expect(screen.getAllByText("#casa").length).toBeGreaterThan(0);
    expect(screen.getByText("Regras recorrentes")).toBeInTheDocument();
    expect(screen.getByText("Regras ativas")).toBeInTheDocument();
    expect(screen.getByText("Proximo ciclo previsto")).toBeInTheDocument();
    expect(screen.getByText("Condominio")).toBeInTheDocument();
    expect(screen.getByText("Proxima geracao")).toBeInTheDocument();
    expect(screen.getAllByText("Parcela 2/3").length).toBeGreaterThan(0);
    expect(screen.getByText(/1 parcela\(s\) restantes/i)).toBeInTheDocument();
    expect(screen.getByText("Compras parceladas")).toBeInTheDocument();
    expect(screen.getByText("Divida em aberto")).toBeInTheDocument();
    expect(screen.getByText("Compras em andamento")).toBeInTheDocument();
    expect(screen.getByText("Proximas parcelas")).toBeInTheDocument();
    expect(screen.getByText("Valor total")).toBeInTheDocument();
    expect(screen.getByText("Ja lancado")).toBeInTheDocument();
    expect(screen.getByText("Saldo restante")).toBeInTheDocument();
    expect(screen.getByText("Parcelas futuras")).toBeInTheDocument();
    expect(screen.getByText("Proxima parcela")).toBeInTheDocument();
    expect(screen.getByText("Progresso da quitacao")).toBeInTheDocument();
    expect(screen.getByText(/Parcela 3 em/i)).toBeInTheDocument();
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
      installmentPlans: installmentPlansFixture,
      recurringRules: recurringRulesFixture,
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
      installmentPlans: installmentPlansFixture,
      recurringRules: recurringRulesFixture,
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
    fireEvent.change(screen.getByLabelText(/descri/i), {
      target: { value: "Notebook" },
    });
    fireEvent.change(screen.getByLabelText("Tags", { selector: "input" }), {
      target: { value: "trabalho, tecnologia" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar compra" }));

    expect(updateInstallmentGroup).toHaveBeenCalledWith("installment-plan-1", {
      description: "Notebook",
      category: "Tecnologia",
      tagNames: ["trabalho", "tecnologia"],
    });
  });
});

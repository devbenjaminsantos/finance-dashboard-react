import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FinancialAccounts from "./FinancialAccounts";

vi.mock("../lib/api/financialAccounts", () => ({
  getFinancialAccounts: vi.fn(),
  createFinancialAccount: vi.fn(),
  syncFinancialAccount: vi.fn(),
}));

vi.mock("../features/transactions/useTransactions", () => ({
  useTransactions: vi.fn(),
}));

import {
  createFinancialAccount,
  getFinancialAccounts,
  syncFinancialAccount,
} from "../lib/api/financialAccounts";
import { useTransactions } from "../features/transactions/useTransactions";

describe("FinancialAccounts page", () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <FinancialAccounts />
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();

    useTransactions.mockReturnValue({
      loadAll: vi.fn().mockResolvedValue(undefined),
    });

    getFinancialAccounts.mockResolvedValue([
      {
        id: 1,
        accountType: "bank_account",
        provider: "manual",
        institutionName: "Nubank",
        institutionCode: null,
        accountName: "Conta principal",
        accountMask: "1234",
        externalAccountId: null,
        status: "pending",
        lastSyncedAtUtc: null,
      },
    ]);
  });

  it("loads and displays registered manual accounts", async () => {
    renderPage();

    expect(await screen.findByText("Nubank")).toBeInTheDocument();
    expect(screen.getByText("Conta principal")).toBeInTheDocument();
    expect(screen.getAllByText("Conta bancaria").length).toBeGreaterThan(0);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByText("Manual por enquanto")).toBeInTheDocument();
    expect(screen.getByText("Conta principal • final 1234")).toBeInTheDocument();
  });

  it("creates a new manual financial account", async () => {
    createFinancialAccount.mockResolvedValue({
      id: 2,
      accountType: "wallet",
      provider: "manual",
      institutionName: "Banco Inter",
      institutionCode: null,
      accountName: "Reserva",
      accountMask: "4321",
      externalAccountId: null,
      status: "pending",
      lastSyncedAtUtc: null,
    });

    renderPage();
    await screen.findByText("Nubank");

    fireEvent.change(screen.getByLabelText("Instituicao"), {
      target: { value: "Banco Inter" },
    });
    fireEvent.change(screen.getByLabelText("Nome da conta"), {
      target: { value: "Reserva" },
    });
    fireEvent.change(screen.getByLabelText("Mascara"), {
      target: { value: "4321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar conta" }));

    await waitFor(() => {
      expect(createFinancialAccount).toHaveBeenCalledWith({
        accountType: "bank_account",
        provider: "manual",
        institutionName: "Banco Inter",
        institutionCode: null,
        accountName: "Reserva",
        accountMask: "4321",
        externalAccountId: null,
      });
    });

    expect(await screen.findByText("Banco Inter")).toBeInTheDocument();
    expect(
      screen.getByText("Conta financeira adicionada para uso manual e futuras importacoes.")
    ).toBeInTheDocument();
  });

  it("synchronizes an account and refreshes transactions", async () => {
    const reloadTransactions = vi.fn().mockResolvedValue(undefined);
    useTransactions.mockReturnValue({
      loadAll: reloadTransactions,
    });

    syncFinancialAccount.mockResolvedValue({
      financialAccountId: 1,
      importedCount: 0,
      skippedCount: 0,
      syncedAtUtc: "2026-04-16T18:30:00Z",
      status: "connected",
      message: "Sincronizacao concluida.",
    });

    getFinancialAccounts
      .mockResolvedValueOnce([
        {
          id: 1,
          accountType: "bank_account",
          provider: "manual",
          institutionName: "Nubank",
          institutionCode: null,
          accountName: "Conta principal",
          accountMask: "1234",
          externalAccountId: null,
          status: "pending",
          lastSyncedAtUtc: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 1,
          accountType: "bank_account",
          provider: "manual",
          institutionName: "Nubank",
          institutionCode: null,
          accountName: "Conta principal",
          accountMask: "1234",
          externalAccountId: null,
          status: "connected",
          lastSyncedAtUtc: "2026-04-16T18:30:00Z",
        },
      ]);

    renderPage();
    await screen.findByText("Nubank");

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar" }));

    await waitFor(() => {
      expect(syncFinancialAccount).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(reloadTransactions).toHaveBeenCalled();
    });

    expect(await screen.findByText("Conectada")).toBeInTheDocument();
  });
});

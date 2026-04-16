import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FinancialAccounts from "./FinancialAccounts";

vi.mock("../lib/api/financialAccounts", () => ({
  getFinancialAccounts: vi.fn(),
  createFinancialAccount: vi.fn(),
  syncFinancialAccount: vi.fn(),
  createFinancialAccountConnectToken: vi.fn(),
  linkFinancialAccountItem: vi.fn(),
}));

vi.mock("../features/transactions/useTransactions", () => ({
  useTransactions: vi.fn(),
}));

vi.mock("react-pluggy-connect", () => ({
  PluggyConnect: ({ onSuccess, onClose }) => (
    <div>
      <button type="button" onClick={() => onSuccess({ item: { id: "pluggy-item-1", connector: { name: "Nubank" } } })}>
        Simular sucesso Pluggy
      </button>
      <button type="button" onClick={onClose}>
        Fechar Pluggy
      </button>
    </div>
  ),
}));

import {
  createFinancialAccount,
  createFinancialAccountConnectToken,
  getFinancialAccounts,
  linkFinancialAccountItem,
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
        provider: "pluggy",
        institutionName: "Nubank",
        institutionCode: null,
        accountName: "Conta principal",
        accountMask: "1234",
        externalAccountId: null,
        providerItemId: null,
        status: "pending",
        lastSyncedAtUtc: null,
      },
    ]);
  });

  it("loads and displays registered accounts", async () => {
    renderPage();

    expect(await screen.findByText("Nubank")).toBeInTheDocument();
    expect(screen.getByText("Conta principal")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("creates a new financial account", async () => {
    createFinancialAccount.mockResolvedValue({
      id: 2,
      provider: "pluggy",
      institutionName: "Banco Inter",
      institutionCode: null,
      accountName: "Reserva",
      accountMask: "4321",
      externalAccountId: null,
      providerItemId: null,
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
        provider: "pluggy",
        institutionName: "Banco Inter",
        institutionCode: null,
        accountName: "Reserva",
        accountMask: "4321",
        externalAccountId: null,
      });
    });

    expect(await screen.findByText("Banco Inter")).toBeInTheDocument();
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
          provider: "pluggy",
          institutionName: "Nubank",
          institutionCode: null,
          accountName: "Conta principal",
          accountMask: "1234",
          externalAccountId: null,
          providerItemId: "pluggy-item-1",
          status: "pending",
          lastSyncedAtUtc: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 1,
          provider: "pluggy",
          institutionName: "Nubank",
          institutionCode: null,
          accountName: "Conta principal",
          accountMask: "1234",
          externalAccountId: null,
          providerItemId: "pluggy-item-1",
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

  it("connects a pluggy account and links the returned item", async () => {
    createFinancialAccountConnectToken.mockResolvedValue({
      connectToken: "connect-token-1",
    });

    linkFinancialAccountItem.mockResolvedValue({
      id: 1,
      provider: "pluggy",
      institutionName: "Nubank",
      institutionCode: null,
      accountName: "Conta principal",
      accountMask: "1234",
      externalAccountId: null,
      providerItemId: "pluggy-item-1",
      status: "connected",
      lastSyncedAtUtc: null,
    });

    renderPage();
    await screen.findByText("Nubank");

    fireEvent.click(screen.getByRole("button", { name: "Conectar com Pluggy" }));

    await waitFor(() => {
      expect(createFinancialAccountConnectToken).toHaveBeenCalledWith(1);
    });

    fireEvent.click(await screen.findByRole("button", { name: "Simular sucesso Pluggy" }));

    await waitFor(() => {
      expect(linkFinancialAccountItem).toHaveBeenCalledWith(1, {
        itemId: "pluggy-item-1",
        institutionName: "Nubank",
        accountName: "Conta principal",
        accountMask: "1234",
      });
    });

    expect(await screen.findByText("Conta vinculada ao Pluggy com sucesso. Agora a sincronizacao automatica ja pode ser usada.")).toBeInTheDocument();
  });
});

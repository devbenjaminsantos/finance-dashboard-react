import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

vi.mock("../features/transactions/useTransactions", () => ({
  useTransactions: vi.fn(),
}));

vi.mock("../lib/api/auth", () => ({
  getStoredUser: vi.fn(),
  updateOnboardingPreferenceRequest: vi.fn(),
}));

vi.mock("../lib/api/budgetGoals", () => ({
  getBudgetGoals: vi.fn(),
}));

vi.mock("../features/dashboard/BudgetGoalsSection", () => ({
  default: () => <div>Metas mockadas</div>,
}));

vi.mock("../features/dashboard/DashboardCharts", () => ({
  default: () => <div>Graficos mockados</div>,
}));

import { useTransactions } from "../features/transactions/useTransactions";
import { getStoredUser, updateOnboardingPreferenceRequest } from "../lib/api/auth";
import { getBudgetGoals } from "../lib/api/budgetGoals";

const baseTransactions = [
  {
    id: 1,
    description: "Salário",
    category: "Salário",
    amountCents: 500000,
    date: "2026-04-05",
    type: "income",
    isRecurring: true,
  },
  {
    id: 2,
    description: "Mercado",
    category: "Alimentação",
    amountCents: 160000,
    date: "2026-04-10",
    type: "expense",
    isRecurring: false,
  },
  {
    id: 3,
    description: "Aluguel",
    category: "Moradia",
    amountCents: 180000,
    date: "2026-04-08",
    type: "expense",
    isRecurring: true,
  },
  {
    id: 4,
    description: "Freelancer",
    category: "Freelancer",
    amountCents: 120000,
    date: "2026-03-10",
    type: "income",
    isRecurring: false,
  },
];

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTransactions.mockReturnValue({
      isLoading: false,
      transactions: baseTransactions,
    });
    getBudgetGoals.mockResolvedValue([{ id: 1 }]);
  });

  it("shows onboarding prompt when user has not chosen yet", () => {
    getStoredUser.mockReturnValue({
      id: 1,
      name: "User",
      isDemo: false,
      onboardingOptIn: null,
    });

    render(<Dashboard />);

    expect(
      screen.getByText("Quer ajuda para configurar seu Finova?")
    ).toBeInTheDocument();
  });

  it("persists onboarding choice when user opts in", async () => {
    getStoredUser.mockReturnValue({
      id: 1,
      name: "User",
      isDemo: false,
      onboardingOptIn: null,
    });
    updateOnboardingPreferenceRequest.mockResolvedValue({
      id: 1,
      name: "User",
      isDemo: false,
      onboardingOptIn: true,
    });

    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Quero ajuda" }));

    await waitFor(() => {
      expect(updateOnboardingPreferenceRequest).toHaveBeenCalledWith(true);
    });
  });

  it("shows automatic insights and prescriptive guidance", async () => {
    getStoredUser.mockReturnValue({
      id: 1,
      name: "User",
      isDemo: false,
      onboardingOptIn: true,
    });

    render(<Dashboard />);

    await act(async () => {});

    expect(screen.getByText("Insights automáticos")).toBeInTheDocument();
    expect(screen.getByText("Categoria mais representativa")).toBeInTheDocument();
    expect(screen.queryByText("Ação prioritária")).not.toBeInTheDocument();
    expect(screen.getByText("Categoria que pede atenção")).toBeInTheDocument();
  });

  it("shows demo information instead of onboarding for demo user", () => {
    getStoredUser.mockReturnValue({
      id: 999,
      name: "Demo",
      isDemo: true,
      onboardingOptIn: false,
    });

    render(<Dashboard />);

    expect(screen.getByText("Conta de demonstração")).toBeInTheDocument();
    expect(
      screen.queryByText("Quer ajuda para configurar seu Finova?")
    ).not.toBeInTheDocument();
  });

  it("automatically hides onboarding after all initial steps are completed", async () => {
    getStoredUser.mockReturnValue({
      id: 1,
      name: "User",
      isDemo: false,
      onboardingOptIn: true,
    });
    updateOnboardingPreferenceRequest.mockResolvedValue({
      id: 1,
      name: "User",
      isDemo: false,
      onboardingOptIn: false,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(updateOnboardingPreferenceRequest).toHaveBeenCalledWith(false);
    });

    expect(screen.queryByText("Guia inicial")).not.toBeInTheDocument();
    expect(screen.queryByText("Mostrar guia inicial")).not.toBeInTheDocument();
  });
});

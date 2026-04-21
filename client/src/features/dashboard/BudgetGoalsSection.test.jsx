import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BudgetGoalsSection from "./BudgetGoalsSection";

vi.mock("../../lib/api/budgetGoals", () => ({
  createBudgetGoal: vi.fn(),
  deleteBudgetGoal: vi.fn(),
  getBudgetGoals: vi.fn(),
  updateBudgetGoal: vi.fn(),
}));

import { getBudgetGoals } from "../../lib/api/budgetGoals";

const transactions = [
  {
    id: 1,
    description: "Mercado",
    category: "Alimentacao",
    amountCents: 90000,
    date: "2026-04-10",
    type: "expense",
  },
  {
    id: 2,
    description: "Aluguel",
    category: "Moradia",
    amountCents: 180000,
    date: "2026-04-05",
    type: "expense",
  },
  {
    id: 3,
    description: "Salario",
    category: "Salario",
    amountCents: 500000,
    date: "2026-04-05",
    type: "income",
  },
];

describe("BudgetGoalsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("highlights uncovered spending categories as suggestions", async () => {
    getBudgetGoals.mockResolvedValue([
      { id: 1, month: "2026-04", category: "", amountCents: 300000 },
      { id: 2, month: "2026-04", category: "Alimentacao", amountCents: 120000 },
    ]);

    render(<BudgetGoalsSection transactions={transactions} />);

    expect(
      await screen.findByText((content) => content.toLowerCase().includes("merecem meta"))
    ).toBeInTheDocument();

    const suggestionButton = screen.getByRole("button", { name: /Moradia/i });
    fireEvent.click(suggestionButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Categoria")).toHaveValue("Moradia");
    });
  });

  it("reloads goals when navigating between months", async () => {
    getBudgetGoals.mockResolvedValue([]);

    render(<BudgetGoalsSection transactions={transactions} />);

    await waitFor(() => {
      expect(getBudgetGoals).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /Proximo mes/i }));

    await waitFor(() => {
      expect(getBudgetGoals).toHaveBeenCalledTimes(2);
    });
  });
});

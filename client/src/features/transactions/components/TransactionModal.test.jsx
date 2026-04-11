import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TransactionModal from "./TransactionModal";

describe("TransactionModal", () => {
  it("shows recurring fields when recurrence is enabled", () => {
    render(
      <TransactionModal
        mode="create"
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initial={null}
      />
    );

    expect(screen.queryByLabelText("Repetir até")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Recorrência mensal"));

    expect(screen.getByLabelText("Repetir até")).toBeInTheDocument();
  });

  it("sends recurrence data on submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TransactionModal
        mode="create"
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        initial={null}
      />
    );

    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Condomínio" },
    });
    fireEvent.change(screen.getByLabelText("Valor"), {
      target: { value: "450,00" },
    });
    fireEvent.click(screen.getByLabelText("Recorrência mensal"));
    fireEvent.change(screen.getByLabelText("Repetir até"), {
      target: { value: "2026-12-05" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Adicionar transação" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Condomínio",
          amountCents: 45000,
          isRecurring: true,
          recurrenceEndDate: "2026-12-05",
        })
      );
    });
  });
});

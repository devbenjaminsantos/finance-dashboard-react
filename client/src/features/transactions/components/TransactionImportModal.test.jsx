import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TransactionImportModal from "./TransactionImportModal";

describe("TransactionImportModal", () => {
  it("starts with duplicate rows unselected and labels historical duplicates", async () => {
    const file = new File(
      [
        `Data;Descricao;Valor
14/04/2026;Mercado;-120,00
15/04/2026;Pix recebido;350,00`,
      ],
      "extrato.csv",
      { type: "text/csv" }
    );

    render(
      <TransactionImportModal
        isOpen={true}
        onClose={vi.fn()}
        onImport={vi.fn()}
        existingTransactions={[
          {
            id: 1,
            date: "2026-04-14",
            description: "Mercado",
            type: "expense",
            amountCents: 12000,
          },
        ]}
      />
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    await fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getAllByText(/Já existe no histórico/i).length).toBeGreaterThan(0);
    });

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it("lets the user remove a row from the preview", async () => {
    const file = new File(
      [
        `Data;Descricao;Valor
14/04/2026;Mercado;-120,00
15/04/2026;Pix recebido;350,00`,
      ],
      "extrato.csv",
      { type: "text/csv" }
    );

    render(
      <TransactionImportModal
        isOpen={true}
        onClose={vi.fn()}
        onImport={vi.fn()}
        existingTransactions={[]}
      />
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    await fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Mercado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[0]);

    await waitFor(() => {
      expect(screen.queryByText("Mercado")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Pix recebido")).toBeInTheDocument();
  });

  it("deselects all suggested duplicates at once", async () => {
    const file = new File(
      [
        `Data;Descricao;Valor
14/04/2026;Padaria;-120,00
14/04/2026;Padaria;-120,00
15/04/2026;Pix recebido;350,00`,
      ],
      "extrato.csv",
      { type: "text/csv" }
    );

    render(
      <TransactionImportModal
        isOpen={true}
        onClose={vi.fn()}
        onImport={vi.fn()}
        existingTransactions={[]}
      />
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    await fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getAllByText(/Repetida no arquivo/i).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /Desmarcar duplicatas sugeridas/i }));

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });
});

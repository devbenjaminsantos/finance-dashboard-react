import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import i18n from "../i18n/i18n";
import { resetCsrfToken } from "../lib/api/http";
import ResetPassword from "./ResetPassword";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("releases the form after timeout and warns about the unknown result", async () => {
  vi.useFakeTimers();
  resetCsrfToken();
  await i18n.changeLanguage("pt-BR");
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ token: "csrf" }) })
    .mockImplementation((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }));
  vi.stubGlobal("fetch", fetchMock);
  render(<MemoryRouter initialEntries={["/reset-password?token=test-token"]}><ResetPassword /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "NovaSenha123!" } });
  fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "NovaSenha123!" } });
  fireEvent.click(screen.getByRole("button", { name: "Redefinir senha" }));
  expect(screen.getByRole("button", { name: "Redefinindo senha..." })).toBeDisabled();
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
  expect(screen.getByRole("alert")).toHaveTextContent("Confira se ela foi concluída antes de tentar novamente.");
  expect(screen.getByRole("button", { name: "Redefinir senha" })).toBeEnabled();
  expect(screen.getByLabelText("Nova senha")).toHaveValue("NovaSenha123!");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

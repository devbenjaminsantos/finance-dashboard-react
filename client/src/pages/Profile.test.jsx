import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Profile from "./Profile";

vi.mock("../lib/api/auth", () => ({
  getProfile: vi.fn(),
  updateProfileRequest: vi.fn(),
}));

import { getProfile, updateProfileRequest } from "../lib/api/auth";

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getProfile.mockResolvedValue({
      id: 7,
      name: "Keller",
      email: "keller@finova.app",
      emailGoalAlertsEnabled: true,
      goalAlertThresholdPercent: 90,
    });
  });

  it("loads email alert preferences from the profile", async () => {
    render(<Profile />);

    expect(await screen.findByText("Alertas por e-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Receber alertas")).toBeChecked();
    expect(screen.getByLabelText("Quando enviar o aviso")).toHaveValue("90");
  });

  it("submits updated email alert preferences", async () => {
    updateProfileRequest.mockResolvedValue({
      id: 7,
      name: "Keller",
      email: "keller@finova.app",
      emailGoalAlertsEnabled: false,
      goalAlertThresholdPercent: 60,
    });

    render(<Profile />);
    await screen.findByText("Alertas por e-mail");

    fireEvent.click(screen.getByLabelText("Receber alertas"));
    fireEvent.change(screen.getByLabelText("Quando enviar o aviso"), {
      target: { value: "60" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar perfil" }));

    await waitFor(() => {
      expect(updateProfileRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Keller",
          emailGoalAlertsEnabled: false,
          goalAlertThresholdPercent: 60,
        })
      );
    });
  });
});

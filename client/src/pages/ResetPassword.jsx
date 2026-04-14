import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPasswordRequest } from "../lib/api/auth";
import {
  isPasswordStrong,
  PASSWORD_POLICY_MESSAGE,
} from "../lib/auth/passwordPolicy";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Link de redefinição inválido.");
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação da senha não confere.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordRequest(token, newPassword);
      setSuccess("Senha redefinida com sucesso. Você já pode fazer login.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Não foi possível redefinir sua senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="finova-page d-flex align-items-center justify-content-center px-3">
      <div className="finova-auth-shell finova-auth-shell-md">
        <div className="text-center mb-4">
          <h1 className="finova-title finova-brand mb-2">Finova</h1>
          <p className="finova-subtitle mb-0">Crie uma nova senha segura.</p>
        </div>

        <div className="finova-card p-4 p-md-5">
          <div className="mb-4 text-center">
            <h2 className="finova-title h4 mb-2">Redefinir senha</h2>
            <p className="finova-subtitle mb-0">
              O link de redefinição expira em 30 minutos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label text-dark fw-medium">Nova senha</label>
              <input
                type="password"
                className="form-control finova-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting || !!success}
                required
              />
              <div className="form-text">{PASSWORD_POLICY_MESSAGE}</div>
            </div>

            <div>
              <label className="form-label text-dark fw-medium">
                Confirmar senha
              </label>
              <input
                type="password"
                className="form-control finova-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting || !!success}
                required
              />
            </div>

            {error ? (
              <div className="alert alert-danger py-2 mb-0" role="alert">
                {error}
              </div>
            ) : null}

            {!error && success ? (
              <div className="alert alert-success py-2 mb-0" role="status">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              className="btn finova-btn-primary"
              disabled={isSubmitting || !!success}
            >
              {isSubmitting ? "Redefinindo senha..." : "Redefinir senha"}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link to="/login" className="text-decoration-none fw-semibold">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

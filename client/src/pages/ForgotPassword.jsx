import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../lib/api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setResetUrl("");
    setIsSubmitting(true);

    try {
      const response = await forgotPasswordRequest(email);
      setSuccess(
        response.message ||
          "Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição."
      );
      setResetUrl(response.resetUrl || "");
    } catch (err) {
      setError(err.message || "Não foi possível solicitar a redefinição.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="finova-page d-flex align-items-center justify-content-center px-3">
      <div className="w-100" style={{ maxWidth: 500 }}>
        <div className="text-center mb-4">
          <h1 className="finova-title finova-brand mb-2">Finova</h1>
          <p className="finova-subtitle mb-0">
            Informe seu e-mail para receber um link de redefinição.
          </p>
        </div>

        <div className="finova-card p-4 p-md-5">
          <div className="mb-4 text-center">
            <h2 className="finova-title h4 mb-2">Recuperar senha</h2>
            <p className="finova-subtitle mb-0">
              Enviaremos as instruções se encontrarmos uma conta vinculada ao
              e-mail informado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label text-dark fw-medium">E-mail</label>
              <input
                type="email"
                className="form-control finova-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                disabled={isSubmitting}
                required
              />
            </div>

            {error ? (
              <div className="alert alert-danger py-2 mb-0">{error}</div>
            ) : null}

            {success ? (
              <div className="alert alert-success py-2 mb-0">
                {success}
                {resetUrl ? (
                  <div className="mt-2">
                    <Link to={new URL(resetUrl).pathname + new URL(resetUrl).search}>
                      Abrir link de redefinição
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              className="btn finova-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar instruções"}
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

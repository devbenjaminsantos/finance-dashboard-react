import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { hasValidSession, loginRequest } from "../lib/api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (hasValidSession()) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await loginRequest(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Falha ao fazer login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="finova-page d-flex align-items-center justify-content-center px-3">
      <div className="w-100" style={{ maxWidth: 460 }}>
        <div className="text-center mb-4">
          <h1 className="finova-title finova-brand mb-2">Finova</h1>
          <p className="finova-subtitle mb-0">
            Seu painel financeiro pessoal, com clareza e controle.
          </p>
        </div>

        <div className="finova-card p-4 p-md-5">
          <div className="mb-4 text-center">
            <h2 className="finova-title h4 mb-2">Entrar</h2>
            <p className="finova-subtitle mb-0">
              Acesse sua conta para visualizar suas transações.
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

            <div>
              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label text-dark fw-medium">Senha</label>
                <Link
                  to="/forgot-password"
                  className="small text-decoration-none fw-semibold mb-2"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                type="password"
                className="form-control finova-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                disabled={isSubmitting}
                required
              />
            </div>

            {error ? (
              <div className="alert alert-danger py-2 mb-0">{error}</div>
            ) : null}

            <button
              type="submit"
              className="btn finova-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="finova-subtitle small">
              Ainda não tem uma conta?{" "}
              <Link to="/register" className="text-decoration-none fw-semibold">
                Criar conta
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  demoLoginRequest,
  hasValidSession,
  loginRequest,
  resendEmailVerificationRequest,
} from "../lib/api/auth";

const demoHighlights = [
  "Conheca o dashboard com dados prontos e metas ja preenchidas",
  "Teste filtros, relatorios e fluxos sem criar conta",
  "Explore autenticacao, recuperacao de senha e perfil em minutos",
];

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  if (hasValidSession()) {
    return <Navigate to="/" replace />;
  }

  const shouldShowResendVerification =
    error.toLowerCase().includes("confirme seu e-mail") && email.trim();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setIsSubmitting(true);

    try {
      await loginRequest(email, password);
      setInfo("Login realizado com sucesso. Redirecionando...");
      navigate("/");
    } catch (requestError) {
      setError(requestError.message || "Falha ao fazer login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setInfo("Preparando a demonstracao...");
    setIsDemoSubmitting(true);

    try {
      await demoLoginRequest();
      setInfo("Demonstracao pronta. Redirecionando...");
      navigate("/");
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel abrir a demonstracao.");
      setInfo("");
    } finally {
      setIsDemoSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (!email.trim()) {
      return;
    }

    setIsResendingVerification(true);

    try {
      const response = await resendEmailVerificationRequest(email);
      setInfo(
        response.message ||
          "Se a conta existir e ainda nao estiver confirmada, enviaremos um novo link."
      );
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel reenviar a confirmacao.");
    } finally {
      setIsResendingVerification(false);
    }
  }

  return (
    <div className="finova-page d-flex align-items-center justify-content-center px-3">
      <div className="w-100" style={{ maxWidth: 540 }}>
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
              Acesse sua conta para visualizar suas transacoes.
            </p>
          </div>

          <div
            className="p-4 rounded-4 mb-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(13,110,253,0.10), rgba(25,135,84,0.08))",
              border: "1px solid rgba(13,110,253,0.12)",
            }}
          >
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start">
              <div>
                <div className="small text-uppercase fw-semibold text-primary mb-2">
                  Experimente antes de se cadastrar
                </div>
                <h3 className="finova-title h5 mb-2">Explore a conta demo</h3>
                <p className="finova-subtitle mb-3">
                  Explore todas as funcionalidades sem criar conta e sem preencher cadastro.
                </p>
                <div className="d-grid gap-2">
                  {demoHighlights.map((item) => (
                    <div key={item} className="small text-muted">
                      - {item}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn finova-btn-primary px-4"
                onClick={handleDemoLogin}
                disabled={isSubmitting || isDemoSubmitting || isResendingVerification}
              >
                {isDemoSubmitting ? "Abrindo demonstracao..." : "Entrar como demonstracao"}
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 mb-4">
            <hr className="flex-grow-1" />
            <span className="finova-subtitle small">ou use sua conta</span>
            <hr className="flex-grow-1" />
          </div>

          <form onSubmit={handleSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label text-dark fw-medium">E-mail</label>
              <input
                type="email"
                className="form-control finova-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@exemplo.com"
                disabled={isSubmitting || isDemoSubmitting || isResendingVerification}
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
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                disabled={isSubmitting || isDemoSubmitting || isResendingVerification}
                required
              />
            </div>

            {error ? (
              <div className="alert alert-danger py-2 mb-0" role="alert">
                <div>{error}</div>
                {shouldShowResendVerification ? (
                  <button
                    type="button"
                    className="btn btn-link px-0 mt-2 text-decoration-none fw-semibold"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                  >
                    {isResendingVerification
                      ? "Reenviando confirmacao..."
                      : "Reenviar e-mail de confirmacao"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {!error && info ? (
              <div className="alert alert-info py-2 mb-0" role="status">
                {info}
              </div>
            ) : null}

            <button
              type="submit"
              className="btn finova-btn-primary"
              disabled={isSubmitting || isDemoSubmitting || isResendingVerification}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="finova-subtitle small">
              Ainda nao tem uma conta?{" "}
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

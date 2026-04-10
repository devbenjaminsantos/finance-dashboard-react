import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { demoLoginRequest, hasValidSession, loginRequest } from "../lib/api/auth";

const demoHighlights = [
  "Dashboard preenchido com receitas e despesas realistas",
  "Categorias organizadas para apresentar os gráficos",
  "Fluxo completo de autenticação e recuperação de senha",
];

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);

  if (hasValidSession()) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsSubmitting(true);

    try {
      await loginRequest(email, password);
      setInfo("Login realizado com sucesso. Redirecionando...");
      navigate("/");
    } catch (err) {
      setError(err.message || "Falha ao fazer login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setInfo("Preparando a demonstração...");
    setIsDemoSubmitting(true);

    try {
      await demoLoginRequest();
      setInfo("Demonstração pronta. Redirecionando...");
      navigate("/");
    } catch (err) {
      setError(err.message || "Não foi possível abrir a demonstração.");
      setInfo("");
    } finally {
      setIsDemoSubmitting(false);
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
              Acesse sua conta para visualizar suas transações.
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
                  Prévia do produto
                </div>
                <h3 className="finova-title h5 mb-2">Explore a conta demo</h3>
                <p className="finova-subtitle mb-3">
                  Entre em segundos e veja o Finova com dados prontos para apresentação.
                </p>
                <div className="d-grid gap-2">
                  {demoHighlights.map((item) => (
                    <div key={item} className="small text-muted">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn finova-btn-primary px-4"
                onClick={handleDemoLogin}
                disabled={isSubmitting || isDemoSubmitting}
              >
                {isDemoSubmitting ? "Abrindo demonstração..." : "Entrar como demonstração"}
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                disabled={isSubmitting || isDemoSubmitting}
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
                disabled={isSubmitting || isDemoSubmitting}
                required
              />
            </div>

            {error ? (
              <div className="alert alert-danger py-2 mb-0" role="alert">
                {error}
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
              disabled={isSubmitting || isDemoSubmitting}
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

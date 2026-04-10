import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { hasValidSession, registerRequest } from "../lib/api/auth";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (hasValidSession()) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await registerRequest(name, email, password);
      setSuccess("Conta criada com sucesso. Redirecionando para o login...");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.message || "Não foi possível criar sua conta.");
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
            Crie sua conta e comece a organizar sua vida financeira.
          </p>
        </div>

        <div className="finova-card p-4 p-md-5">
          <div className="mb-4 text-center">
            <h2 className="finova-title h4 mb-2">Criar conta</h2>
            <p className="finova-subtitle mb-0">
              Cadastre-se para acessar seu painel financeiro.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label text-dark fw-medium">Nome</label>
              <input
                type="text"
                className="form-control finova-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                disabled={isSubmitting}
                required
              />
            </div>

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
              <label className="form-label text-dark fw-medium">Senha</label>
              <input
                type="password"
                className="form-control finova-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crie uma senha"
                disabled={isSubmitting}
                required
              />
              <div className="form-text">Use pelo menos 6 caracteres.</div>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="finova-subtitle small">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-decoration-none fw-semibold">
                Entrar
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../lib/api/auth";

export default function Login() {
const navigate = useNavigate();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

async function handleSubmit(e) {
e.preventDefault();
setError("");
setIsSubmitting(true);

try {
  await loginRequest(email, password);
  navigate("/");
} catch (err) {
  setError(err.message || "Falha no login.");
} finally {
  setIsSubmitting(false);
}


}

return (
<div className="row justify-content-center">
<div className="col-12 col-md-8 col-lg-5">
<div className="card shadow-sm">
<div className="card-body p-4">
<h1 className="h3 mb-3 text-center">Entrar</h1>

        <form onSubmit={handleSubmit} className="d-grid gap-3">
          <div>
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>

          <div>
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error ? (
            <div className="alert alert-danger py-2 mb-0">{error}</div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  </div>
</div>

);
}
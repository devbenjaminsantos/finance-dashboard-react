import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmailRequest } from "../lib/api/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(true);

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        setError("Link de confirmacao invalido.");
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await verifyEmailRequest(token);

        if (!active) {
          return;
        }

        setSuccess(response.message || "E-mail confirmado com sucesso.");
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(requestError.message || "Nao foi possivel confirmar o seu e-mail.");
      } finally {
        if (active) {
          setIsSubmitting(false);
        }
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="finova-page d-flex align-items-center justify-content-center px-3">
      <div className="w-100" style={{ maxWidth: 500 }}>
        <div className="text-center mb-4">
          <h1 className="finova-title finova-brand mb-2">Finova</h1>
          <p className="finova-subtitle mb-0">
            Estamos validando seu e-mail para liberar o acesso.
          </p>
        </div>

        <div className="finova-card p-4 p-md-5 text-center">
          <h2 className="finova-title h4 mb-3">Confirmacao de e-mail</h2>

          {isSubmitting ? (
            <div className="alert alert-info py-2 mb-0" role="status">
              Confirmando seu e-mail...
            </div>
          ) : null}

          {!isSubmitting && error ? (
            <div className="alert alert-danger py-2 mb-0" role="alert">
              {error}
            </div>
          ) : null}

          {!isSubmitting && !error && success ? (
            <div className="alert alert-success py-2 mb-0" role="status">
              {success}
            </div>
          ) : null}

          <div className="mt-4">
            <Link to="/login" className="text-decoration-none fw-semibold">
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

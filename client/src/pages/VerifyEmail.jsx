import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useI18n } from "../i18n/LanguageProvider";
import { verifyEmailRequest } from "../lib/api/auth";

export default function VerifyEmail() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(true);

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        setError(t("auth.verifyInvalidLink"));
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await verifyEmailRequest(token);
        if (!active) {
          return;
        }

        setSuccess(response.message || t("auth.verifySuccess"));
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(requestError.message || t("auth.verifyError"));
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
  }, [token, t]);

  return (
    <div className="finova-page d-flex align-items-center justify-content-center px-3">
      <div className="finova-auth-shell finova-auth-shell-md">
        <div className="text-center mb-4">
          <h1 className="finova-title finova-brand mb-2">Finova</h1>
          <p className="finova-subtitle mb-0">{t("auth.verifySubtitle")}</p>
        </div>

        <div className="finova-card p-4 p-md-5 text-center">
          <h2 className="finova-title h4 mb-3">{t("auth.verifyTitle")}</h2>

          {isSubmitting ? (
            <div className="alert alert-info py-2 mb-0" role="status">
              {t("auth.verifySubmitting")}
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

          <div className="text-center mt-4">
            <Link to="/login" className="text-decoration-none fw-semibold">
              {t("auth.goToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

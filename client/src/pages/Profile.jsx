import { useEffect, useState } from "react";
import { getProfile, updateProfileRequest } from "../lib/api/auth";
import {
  isPasswordStrong,
  PASSWORD_POLICY_MESSAGE,
} from "../lib/auth/passwordPolicy";

export default function Profile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await getProfile();
        setForm((current) => ({
          ...current,
          name: user.name ?? "",
          email: user.email ?? "",
        }));
      } catch (err) {
        setError(err.message || "Não foi possível carregar seu perfil.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Informe seu nome.");
      return;
    }

    const wantsToChangePassword =
      form.currentPassword.trim() ||
      form.newPassword.trim() ||
      form.confirmPassword.trim();

    if (wantsToChangePassword) {
      if (!form.currentPassword.trim()) {
        setError("Informe sua senha atual.");
        return;
      }

      if (!form.newPassword.trim()) {
        setError("Informe uma nova senha.");
        return;
      }

      if (!isPasswordStrong(form.newPassword)) {
        setError(PASSWORD_POLICY_MESSAGE);
        return;
      }

      if (form.newPassword !== form.confirmPassword) {
        setError("A confirmação da senha não confere.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const user = await updateProfileRequest({
        name: form.name,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setForm((current) => ({
        ...current,
        name: user.name ?? current.name,
        email: user.email ?? current.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setSuccess("Perfil atualizado com sucesso.");
    } catch (err) {
      setError(err.message || "Não foi possível atualizar seu perfil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="finova-section-space">
      <div className="mb-4">
        <h1 className="finova-title mb-1">Perfil</h1>
        <p className="finova-subtitle mb-0">
          Atualize seus dados pessoais e altere sua senha quando precisar.
        </p>
      </div>

      <div className="finova-card p-4 p-md-5" style={{ maxWidth: 760 }}>
        {isLoading ? (
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border spinner-border-sm text-primary" />
            <p className="finova-subtitle mb-0">Carregando perfil...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label text-dark fw-medium">Nome</label>
              <input
                type="text"
                className="form-control finova-input"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label text-dark fw-medium">E-mail</label>
              <input
                type="email"
                className="form-control finova-input"
                value={form.email}
                disabled
                readOnly
              />
            </div>

            <div className="col-12">
              <hr className="my-2" />
              <h2 className="finova-title h5 mb-1">Alterar senha</h2>
              <p className="finova-subtitle small mb-0">
                Preencha os campos abaixo apenas se quiser trocar sua senha atual.
              </p>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label text-dark fw-medium">Senha atual</label>
              <input
                type="password"
                className="form-control finova-input"
                value={form.currentPassword}
                onChange={(e) => updateField("currentPassword", e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label text-dark fw-medium">Nova senha</label>
              <input
                type="password"
                className="form-control finova-input"
                value={form.newPassword}
                onChange={(e) => updateField("newPassword", e.target.value)}
                disabled={isSubmitting}
              />
              <div className="form-text">{PASSWORD_POLICY_MESSAGE}</div>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label text-dark fw-medium">Confirmar senha</label>
              <input
                type="password"
                className="form-control finova-input"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {error ? (
              <div className="col-12">
                <div className="alert alert-danger py-2 mb-0" role="alert">
                  {error}
                </div>
              </div>
            ) : null}

            {!error && success ? (
              <div className="col-12">
                <div className="alert alert-success py-2 mb-0" role="status">
                  {success}
                </div>
              </div>
            ) : null}

            <div className="col-12">
              <div className="finova-actions-row finova-actions-row-end pt-2">
                <button
                  type="submit"
                  className="btn finova-btn-primary px-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Salvando alterações..." : "Salvar perfil"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

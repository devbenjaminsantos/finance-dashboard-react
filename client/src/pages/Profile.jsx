import { useEffect, useState } from "react";
import PasswordToggleButton from "../components/PasswordToggleButton";
import { useI18n } from "../i18n/LanguageProvider";
import { getProfile, updateProfileRequest } from "../lib/api/auth";
import { isPasswordStrong } from "../lib/auth/passwordPolicy";

export default function Profile() {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
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
        setError(err.message || t("profile.loadError"));
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [t]);

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
      setError(t("profile.emptyNameError"));
      return;
    }

    const wantsToChangePassword =
      form.currentPassword.trim() || form.newPassword.trim() || form.confirmPassword.trim();

    if (wantsToChangePassword) {
      if (!form.currentPassword.trim()) {
        setError(t("profile.currentPasswordError"));
        return;
      }

      if (!form.newPassword.trim()) {
        setError(t("profile.newPasswordError"));
        return;
      }

      if (!isPasswordStrong(form.newPassword)) {
        setError(t("passwordPolicy.message"));
        return;
      }

      if (form.newPassword !== form.confirmPassword) {
        setError(t("profile.confirmMismatchError"));
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
      setSuccess(t("profile.success"));
    } catch (err) {
      setError(err.message || t("profile.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("profile.title")}</h1>
          <p className="finova-subtitle mb-0">{t("profile.subtitle")}</p>
        </div>
      </div>

      <div className="finova-card p-4 p-md-5" style={{ maxWidth: 760 }}>
        {isLoading ? (
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border spinner-border-sm text-primary" />
            <p className="finova-subtitle mb-0">{t("profile.loading")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label text-dark fw-medium">{t("common.name")}</label>
              <input
                type="text"
                className="form-control finova-input"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder={t("common.preferredNamePlaceholder")}
                disabled={isSubmitting}
                required
              />
              <div className="form-text">{t("common.preferredNameHelp")}</div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label text-dark fw-medium">{t("common.email")}</label>
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
              <h2 className="finova-title h5 mb-1">{t("profile.changePasswordTitle")}</h2>
              <p className="finova-subtitle small mb-0">{t("profile.changePasswordSubtitle")}</p>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label text-dark fw-medium">{t("common.currentPassword")}</label>
              <div className="input-group">
                <input
                  type={isCurrentPasswordVisible ? "text" : "password"}
                  className="form-control finova-input"
                  value={form.currentPassword}
                  onChange={(e) => updateField("currentPassword", e.target.value)}
                  disabled={isSubmitting}
                />
                <PasswordToggleButton
                  isVisible={isCurrentPasswordVisible}
                  onToggle={() => setIsCurrentPasswordVisible((current) => !current)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label text-dark fw-medium">{t("common.newPassword")}</label>
              <div className="input-group">
                <input
                  type={isNewPasswordVisible ? "text" : "password"}
                  className="form-control finova-input"
                  value={form.newPassword}
                  onChange={(e) => updateField("newPassword", e.target.value)}
                  disabled={isSubmitting}
                />
                <PasswordToggleButton
                  isVisible={isNewPasswordVisible}
                  onToggle={() => setIsNewPasswordVisible((current) => !current)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-text">{t("passwordPolicy.message")}</div>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label text-dark fw-medium">{t("common.confirmPassword")}</label>
              <div className="input-group">
                <input
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  className="form-control finova-input"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  disabled={isSubmitting}
                />
                <PasswordToggleButton
                  isVisible={isConfirmPasswordVisible}
                  onToggle={() => setIsConfirmPasswordVisible((current) => !current)}
                  disabled={isSubmitting}
                />
              </div>
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
                  {isSubmitting ? t("profile.savingButton") : t("profile.saveButton")}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

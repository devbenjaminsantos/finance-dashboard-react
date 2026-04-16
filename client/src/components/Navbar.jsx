import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/LanguageProvider";
import { getStoredUser, hasValidSession, logout } from "../lib/api/auth";
import { useTheme } from "../theme/ThemeProvider";

export default function Navbar() {
  const navigate = useNavigate();
  const { theme, isDark, toggleTheme } = useTheme();
  const { language, languages, setLanguage, t } = useI18n();
  const [hasSession, setHasSession] = useState(() => hasValidSession());
  const [user, setUser] = useState(() => getStoredUser());

  const linkClass = ({ isActive }) =>
    "nav-link px-3" + (isActive ? " fw-semibold text-white" : " text-white-50");

  useEffect(() => {
    function syncSession() {
      setHasSession(hasValidSession());
      setUser(getStoredUser());
    }

    syncSession();
    window.addEventListener("finova-session-change", syncSession);

    return () => {
      window.removeEventListener("finova-session-change", syncSession);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav
      className="navbar navbar-expand-lg border-bottom"
      style={{ background: "var(--primary)", borderColor: "var(--nav-border)" }}
    >
      <div className="container">
        <NavLink className="navbar-brand text-white finova-brand" to="/">
          Finova
        </NavLink>

        <div className="d-flex align-items-center order-lg-2 ms-auto finova-navbar-actions">
          <button
            type="button"
            className="btn finova-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? t("navbar.openLight") : t("navbar.openDark")}
            title={isDark ? t("navbar.openLight") : t("navbar.openDark")}
          >
            <span className="finova-theme-toggle-icon" aria-hidden="true">
              {theme === "dark" ? "\u2600" : "\u263E"}
            </span>
          </button>

          <select
            className="form-select finova-select finova-language-select"
            aria-label={t("common.languageLabel")}
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            {languages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            className="navbar-toggler finova-navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#nav"
            aria-controls="nav"
            aria-expanded="false"
            aria-label={t("navbar.toggleNav")}
          >
            <span className="navbar-toggler-icon" />
          </button>
        </div>

        <div className="collapse navbar-collapse order-lg-1" id="nav">
          <div className="navbar-nav ms-auto align-items-lg-center finova-navbar-links">
            {hasSession ? (
              <>
                <NavLink className={linkClass} to="/">
                  {t("navbar.home")}
                </NavLink>
                <NavLink className={linkClass} to="/graficos">
                  {t("navbar.charts")}
                </NavLink>
                <NavLink className={linkClass} to="/transacoes">
                  {t("navbar.transactions")}
                </NavLink>
                <NavLink className={linkClass} to="/insights">
                  {t("navbar.insights")}
                </NavLink>
                <NavLink className={linkClass} to="/comparativos">
                  {t("navbar.comparisons")}
                </NavLink>
                <NavLink className={linkClass} to="/metas">
                  {t("navbar.goals")}
                </NavLink>
                <NavLink className={linkClass} to="/contas">
                  {t("navbar.accounts")}
                </NavLink>
                <NavLink className={linkClass} to="/historico">
                  {t("navbar.history")}
                </NavLink>
                <NavLink className={linkClass} to="/perfil">
                  {t("navbar.profile")}
                </NavLink>

                <span className="text-white-50 small ms-lg-3 me-lg-3 mt-2 mt-lg-0 finova-navbar-user">
                  {user?.name}
                </span>

                <button
                  className="btn finova-btn-light btn-sm mt-2 mt-lg-0 finova-navbar-logout"
                  onClick={handleLogout}
                >
                  {t("navbar.logout")}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}

import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getStoredUser, hasValidSession, logout } from "../lib/api/auth";
import { useTheme } from "../theme/ThemeProvider";

export default function Navbar() {
  const navigate = useNavigate();
  const { theme, isDark, toggleTheme } = useTheme();
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

        <div className="d-flex align-items-center gap-2 order-lg-2 ms-auto">
          <button
            type="button"
            className="btn finova-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
          >
            <span className="finova-theme-toggle-icon" aria-hidden="true">
              {theme === "dark" ? "\u2600" : "\u263E"}
            </span>
          </button>

          <button
            className="navbar-toggler finova-navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#nav"
            aria-controls="nav"
            aria-expanded="false"
            aria-label="Alternar navegacao"
          >
            <span className="navbar-toggler-icon" />
          </button>
        </div>

        <div className="collapse navbar-collapse order-lg-1" id="nav">
          <div className="navbar-nav ms-auto align-items-lg-center">
            {hasSession ? (
              <>
                <NavLink className={linkClass} to="/">
                  Home
                </NavLink>
                <NavLink className={linkClass} to="/dashboard">
                  Dashboard
                </NavLink>
                <NavLink className={linkClass} to="/transacoes">
                  Transacoes
                </NavLink>
                <NavLink className={linkClass} to="/insights">
                  Insights
                </NavLink>
                <NavLink className={linkClass} to="/comparativos">
                  Comparativos
                </NavLink>
                <NavLink className={linkClass} to="/metas">
                  Metas
                </NavLink>
                <NavLink className={linkClass} to="/historico">
                  Historico
                </NavLink>
                <NavLink className={linkClass} to="/perfil">
                  Perfil
                </NavLink>

                <span className="text-white-50 small ms-lg-3 me-lg-3 mt-2 mt-lg-0">
                  {user?.name}
                </span>

                <button
                  className="btn finova-btn-light btn-sm mt-2 mt-lg-0"
                  onClick={handleLogout}
                >
                  Sair
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}

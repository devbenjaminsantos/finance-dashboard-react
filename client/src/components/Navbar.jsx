import { NavLink, useNavigate } from "react-router-dom";
import { getStoredUser, hasValidSession, logout } from "../lib/api/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const hasSession = hasValidSession();
  const user = getStoredUser();

  const linkClass = ({ isActive }) =>
    "nav-link px-3" + (isActive ? " fw-semibold text-white" : " text-white-50");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav
      className="navbar navbar-expand-lg border-bottom"
      style={{ background: "var(--primary)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="container">
        <NavLink className="navbar-brand text-white finova-brand" to="/">
          Finova
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
          aria-controls="nav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="nav">
          <div className="navbar-nav ms-auto align-items-lg-center">
            {hasSession ? (
              <>
                <NavLink className={linkClass} to="/">
                  Dashboard
                </NavLink>
                <NavLink className={linkClass} to="/transacoes">
                  Transações
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

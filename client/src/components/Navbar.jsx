import { NavLink, useNavigate } from "react-router-dom";
import { getStoredToken, logout } from "../lib/api/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const hasToken = !!getStoredToken();

const linkClass = ({ isActive }) =>
"nav-link" + (isActive ? " active fw-semibold" : "");

function handleLogout() {
logout();
navigate("/login");
}

return (
<nav className="navbar navbar-expand-lg navbar-dark bg-dark">
<div className="container">
<NavLink className="navbar-brand fw-bold" to="/">
Dashboard Financeiro
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
        {hasToken ? (
          <>
            <NavLink className={linkClass} to="/">
              Dashboard
            </NavLink>
            <NavLink className={linkClass} to="/transacoes">
              Transações
            </NavLink>
            <button
              className="btn btn-outline-light btn-sm ms-lg-3 mt-2 mt-lg-0"
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
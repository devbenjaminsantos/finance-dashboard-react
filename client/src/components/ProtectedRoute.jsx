import { Navigate } from "react-router-dom";
import { hasValidSession, logout } from "../lib/api/auth";

export default function ProtectedRoute({ children }) {
  if (!hasValidSession()) {
    logout();
    return <Navigate to="/login" replace />;
  }

  return children;
}

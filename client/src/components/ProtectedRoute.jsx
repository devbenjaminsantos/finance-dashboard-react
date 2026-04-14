import { Navigate, useLocation } from "react-router-dom";
import {
  hasValidSession,
  rememberPostLoginRedirect,
} from "../lib/api/auth";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasValidSession()) {
    rememberPostLoginRedirect(location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
}

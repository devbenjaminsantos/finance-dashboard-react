import { Navigate } from "react-router-dom";
import { getStoredToken } from "../lib/api/auth";

export default function ProtectedRoute({ children }) {
const token = getStoredToken();

if (!token) {
return <Navigate to="/login" replace />;
}

return children;
}
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { TransactionsProvider } from "./features/transactions/TransactionsProvider";
import {
  hasValidSession,
  syncSessionFromStorageEvent,
  touchSessionActivity,
} from "./lib/api/auth";
import Analyses from "./pages/Analyses";
import AuditLogs from "./pages/AuditLogs";
import Dashboard from "./pages/Dashboard";
import FinancialAccounts from "./pages/FinancialAccounts";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import PublicDashboard from "./pages/PublicDashboard";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Transactions from "./pages/Transactions";
import VerifyEmail from "./pages/VerifyEmail";

export default function App() {
  useEffect(() => {
    function handleStorage(event) {
      syncSessionFromStorageEvent(event);
    }

    function handleActivity() {
      if (hasValidSession()) {
        touchSessionActivity();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("focus", handleActivity);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("focus", handleActivity);
    };
  }, []);

  return (
    <div className="finova-page">
      <Navbar />

      <main className="container py-4">
        <TransactionsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/compartilhado/:token" element={<PublicDashboard />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/graficos"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/dashboard" element={<Navigate to="/graficos" replace />} />

            <Route
              path="/transacoes"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analises"
              element={
                <ProtectedRoute>
                  <Analyses />
                </ProtectedRoute>
              }
            />
            <Route path="/insights" element={<Navigate to="/analises" replace />} />
            <Route path="/comparativos" element={<Navigate to="/analises" replace />} />
            <Route path="/metas" element={<Navigate to="/analises" replace />} />

            <Route
              path="/contas"
              element={
                <ProtectedRoute>
                  <FinancialAccounts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/historico"
              element={
                <ProtectedRoute>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            <Route path="/auditoria" element={<Navigate to="/historico" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TransactionsProvider>
      </main>
    </div>
  );
}

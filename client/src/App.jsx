import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Login from "./pages/Login";

export default function App() {
return (
<div className="min-vh-100 bg-light">
<Navbar />

  <main className="container py-4">
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transacoes"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </main>
</div>

);
}
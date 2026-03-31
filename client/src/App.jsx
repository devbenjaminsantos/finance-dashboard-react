import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { TransactionsProvider } from "./features/transactions/TransactionsProvider";


export default function App() {
  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
  
  <main className="container py-4">
    <TransactionsProvider>
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

        <Route path="/register" element={<Register />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TransactionsProvider>
  </main>
</div>
);
}
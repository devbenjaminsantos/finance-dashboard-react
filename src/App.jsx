import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import { TransactionsProvider } from "./features/transactions/TransactionsProvider";

export default function App() {
  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <main className="container py-4">
        <TransactionsProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transacoes" element={<Transactions />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TransactionsProvider>
      </main>
    </div>
  );
}
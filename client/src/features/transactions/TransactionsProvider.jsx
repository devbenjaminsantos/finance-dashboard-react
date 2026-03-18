import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loadTransactions,
  saveTransactions,
} from "../../lib/storage/transactionsStorage";

const TransactionsContext = createContext(null);

function uid() {
  return crypto?.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState(() => loadTransactions());

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  function addTransaction(data) {
    const tx = { id: uid(), ...data };
    setTransactions((prev) => [tx, ...prev]);
  }

  function removeTransaction(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTransaction(id, patch) {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const v = Number(t.amountCents) || 0;
      if (t.type === "income") income += v;
      else expense += v;
    }

    return { income, expense, balance: income - expense };
  }, [transactions]);

  const value = useMemo(
    () => ({ transactions, addTransaction, removeTransaction, updateTransaction, summary }),
    [transactions, summary]
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error("useTransactions must be used within <TransactionsProvider />");
  }
  return ctx;
}
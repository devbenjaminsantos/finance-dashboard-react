import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../lib/api/transactions";

const TransactionsContext = createContext(null);

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadAll() {
    setIsLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
      } catch (error) {
        console.error("Erro ao carregar transações:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
  }

    useEffect(() => {
      
      loadAll();
    }, []);

    async function addTransaction(data) {
      const created = await createTransaction(data);
      setTransactions((prev) => [created, ...prev]);
    }

    async function removeTransaction(id) {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }

    async function editTransaction(id, data) {
      const updated = await updateTransaction(id, data);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
    }

    const summary = useMemo(() => {
      let income = 0;
      let expense = 0;

      for (const t of transactions) {
        const value = Number(t.amountCents) || 0;
        if (t.type === "income") income += value;
        else expense += value;
      }

      return {
        income,
        expense,
        balance: income - expense,
      };
    }, [transactions]);

    const value = {
      transactions,
      isLoading,
      loadAll,
      addTransaction,
      removeTransaction,
      editTransaction,
      updateTransaction: editTransaction,
      summary,
    };

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
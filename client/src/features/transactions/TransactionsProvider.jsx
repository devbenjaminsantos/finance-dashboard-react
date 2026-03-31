import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../lib/api/transactions";
import { hasValidSession } from "../../lib/api/auth";
import { TransactionsContext } from "./TransactionsContext";

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!hasValidSession()) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Erro ao carregar transacoes:", error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addTransaction = useCallback(async (data) => {
    const created = await createTransaction(data);
    setTransactions((prev) => [created, ...prev]);
  }, []);

  const removeTransaction = useCallback(async (id) => {
    await deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTransactionItem = useCallback(async (id, data) => {
    const updated = await updateTransaction(id, data);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? updated : t))
    );
  }, []);

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

  const value = useMemo(
    () => ({
      transactions,
      isLoading,
      loadAll,
      addTransaction,
      removeTransaction,
      updateTransaction: updateTransactionItem,
      summary,
    }),
    [
      transactions,
      isLoading,
      loadAll,
      addTransaction,
      removeTransaction,
      updateTransactionItem,
      summary,
    ]
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

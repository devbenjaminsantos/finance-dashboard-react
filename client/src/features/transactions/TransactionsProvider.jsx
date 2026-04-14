import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  importTransactions,
  updateTransaction,
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
      console.error("Erro ao carregar transações:", error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    function handleSessionChange() {
      loadAll();
    }

    window.addEventListener("finova-session-change", handleSessionChange);

    return () => {
      window.removeEventListener("finova-session-change", handleSessionChange);
    };
  }, [loadAll]);

  const addTransaction = useCallback(async (data) => {
    await createTransaction(data);
    await loadAll();
  }, [loadAll]);

  const importTransactionsBatch = useCallback(async (items) => {
    const result = await importTransactions(items);
    await loadAll();
    return result;
  }, [loadAll]);

  const removeTransaction = useCallback(async (id) => {
    await deleteTransaction(id);
    setTransactions((current) => current.filter((transaction) => transaction.id !== id));
  }, []);

  const updateTransactionItem = useCallback(async (id, data) => {
    const updated = await updateTransaction(id, data);
    setTransactions((current) =>
      current.map((transaction) => (transaction.id === id ? updated : transaction))
    );
  }, []);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const transaction of transactions) {
      const value = Number(transaction.amountCents) || 0;

      if (transaction.type === "income") {
        income += value;
      } else {
        expense += value;
      }
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
      importTransactions: importTransactionsBatch,
      removeTransaction,
      updateTransaction: updateTransactionItem,
      summary,
    }),
    [
      transactions,
      isLoading,
      loadAll,
      addTransaction,
      importTransactionsBatch,
      removeTransaction,
      updateTransactionItem,
      summary,
    ]
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

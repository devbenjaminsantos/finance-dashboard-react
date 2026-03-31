import { useContext } from "react";
import { TransactionsContext } from "./TransactionsContext";

export function useTransactions() {
  const ctx = useContext(TransactionsContext);

  if (!ctx) {
    throw new Error("useTransactions must be used within <TransactionsProvider />");
  }

  return ctx;
}

import { useEffect, useMemo, useState } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import TransactionModal from "../features/transactions/components/TransactionModal";
import TransactionsFilters from "../features/transactions/components/TransactionsFilters";
import TransactionsTable from "../features/transactions/components/TransactionsTable";
import { loadJSON, saveJSON } from "../lib/storage/jsonStorage";

const FILTERS_KEY = "fd_tx_filters_v1";
export default function Transactions() {
  const { transactions, addTransaction, removeTransaction, updateTransaction } =
    useTransactions();

function currentMonthISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

  // filtros
  const saved = loadJSON(FILTERS_KEY, {
    q: "",
    typeFilter: "all",
    categoryFilter: "all",
    month: "currentMonthISO",
    sortBy: "date_desc",
    });

  const [q, setQ] = useState(() => saved.q);
  const [typeFilter, setTypeFilter] = useState(() => saved.typeFilter);
  const [categoryFilter, setCategoryFilter] = useState(() => saved.categoryFilter);
  const [month, setMonth] = useState(() => saved.month);
  const [sortBy, setSortBy] = useState(() => saved.sortBy);
    useEffect(() => {
      saveJSON(FILTERS_KEY, {
        q: q.trim(),
        typeFilter,
        categoryFilter,
        month,
        sortBy,
      });
    }, [q, typeFilter, categoryFilter, month, sortBy]);

  // modal
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [selected, setSelected] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(set);
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((t) =>
        (t.description || "").toLowerCase().includes(s)
      );
    }

    if (typeFilter !== "all") {
      list = list.filter((t) => t.type === typeFilter);
    }

    if (categoryFilter !== "all") {
      list = list.filter((t) => t.category === categoryFilter);
    }

    if (month) {
      list = list.filter((t) => (t.date || "").startsWith(month));
    }

    switch (sortBy) {
      case "date_asc":
        list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        break;
      case "amount_desc":
        list.sort(
          (a, b) =>
            (Number(b.amountCents) || 0) - (Number(a.amountCents) || 0)
        );
        break;
      case "amount_asc":
        list.sort(
          (a, b) =>
            (Number(a.amountCents) || 0) - (Number(b.amountCents) || 0)
        );
        break;
      case "date_desc":
      default:
        list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        break;
    }

    return list;
  }, [transactions, q, typeFilter, categoryFilter, month, sortBy]);

  function openCreate() {
    setMode("create");
    setSelected(null);
    setIsOpen(true);
  }

  function openEdit(t) {
    setMode("edit");
    setSelected(t);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  function handleSubmit(data) {
    if (mode === "edit" && selected) {
      updateTransaction(selected.id, data);
    } else {
      addTransaction(data);
    }
  }

  function handleRemove(id) {
    if (confirm("Remover esta transação?")) removeTransaction(id);
  }

   function resetFilters() {
    setQ("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setMonth("");
    setSortBy("date_desc");

    saveJSON(FILTERS_KEY, {
      q: "",
      typeFilter: "all",
      categoryFilter: "all",
      month: "",
      sortBy: "date_desc",
   });
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-0">Transações</h1>
          <div className="text-muted small">
            {filtered.length} item(ns)
            {filtered.length !== transactions.length
              ? ` (de ${transactions.length})`
              : ""}
          </div>
        </div>

        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          + Nova transação
        </button>
      </div>

      <TransactionModal
        mode={mode}
        isOpen={isOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initial={selected}
      />

      <TransactionsFilters
        q={q}
        setQ={setQ}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        month={month}
        setMonth={setMonth}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categories}
        onReset={resetFilters}
      />

      <TransactionsTable
        transactions={filtered}
        totalTransactionsCount={transactions.length}
        onEdit={openEdit}
        onRemove={handleRemove}
      />
    </>
  );
}
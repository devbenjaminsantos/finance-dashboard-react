import { useEffect, useMemo, useState } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import TransactionModal from "../features/transactions/components/TransactionModal";
import TransactionsFilters from "../features/transactions/components/TransactionsFilters";
import TransactionsTable from "../features/transactions/components/TransactionsTable";
import { loadJSON, saveJSON } from "../lib/storage/jsonStorage";

const FILTERS_KEY = "fd_tx_filters_v1";

export default function Transactions() {
  const {
    transactions,
    addTransaction,
    removeTransaction,
    updateTransaction,
    isLoading,
  } = useTransactions();

  const saved = loadJSON(FILTERS_KEY, {
    q: "",
    typeFilter: "all",
    categoryFilter: "all",
    month: "",
    sortBy: "date_desc",
  });

  const [q, setQ] = useState(() => saved.q);
  const [typeFilter, setTypeFilter] = useState(() => saved.typeFilter);
  const [categoryFilter, setCategoryFilter] = useState(
    () => saved.categoryFilter
  );
  const [month, setMonth] = useState(() => saved.month);
  const [sortBy, setSortBy] = useState(() => saved.sortBy);

  useEffect(() => {
    saveJSON(FILTERS_KEY, { q, typeFilter, categoryFilter, month, sortBy });
  }, [q, typeFilter, categoryFilter, month, sortBy]);

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(set);
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (q.trim()) {
      const search = q.trim().toLowerCase();
      list = list.filter((t) =>
        (t.description || "").toLowerCase().includes(search)
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

  function openEdit(transaction) {
    setMode("edit");
    setSelected(transaction);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  async function handleSubmit(data) {
    if (mode === "edit" && selected) {
      await updateTransaction(selected.id, data);
    } else {
      await addTransaction(data);
    }
  }

  async function handleRemove(id) {
    if (confirm("Remover esta transação?")) {
      await removeTransaction(id);
    }
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
    <section className="finova-section-space">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h1 className="finova-title mb-1">Transações</h1>
          <p className="finova-subtitle mb-0">
            Gerencie receitas e despesas com controle total do seu fluxo
            financeiro.
          </p>
        </div>

        <button className="btn finova-btn-primary px-4" onClick={openCreate}>
          Nova transação
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

      <div className="mt-4">
        <TransactionsTable
          transactions={filtered}
          totalTransactionsCount={transactions.length}
          onEdit={openEdit}
          onRemove={handleRemove}
          isLoading={isLoading}
        />
      </div>  
    </section>
  );
}
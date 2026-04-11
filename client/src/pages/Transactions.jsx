import { useEffect, useMemo, useState } from "react";
import TransactionModal from "../features/transactions/components/TransactionModal";
import TransactionsFilters from "../features/transactions/components/TransactionsFilters";
import TransactionsTable from "../features/transactions/components/TransactionsTable";
import { useTransactions } from "../features/transactions/useTransactions";
import { getTransactionCategories } from "../lib/constants/transactionCategories";
import { formatBRLFromCents } from "../lib/format/currency";
import { formatBRDate } from "../lib/format/date";
import { downloadCsv } from "../lib/export/csv";
import { exportTransactionsToPdf } from "../lib/export/pdf";
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

  const saved = useMemo(
    () =>
      loadJSON(FILTERS_KEY, {
        q: "",
        typeFilter: "all",
        categoryFilter: "all",
        month: "",
        sortBy: "date_desc",
      }),
    []
  );

  const [q, setQ] = useState(() => saved.q);
  const [typeFilter, setTypeFilter] = useState(() => saved.typeFilter);
  const [categoryFilter, setCategoryFilter] = useState(() => saved.categoryFilter);
  const [month, setMonth] = useState(() => saved.month);
  const [sortBy, setSortBy] = useState(() => saved.sortBy);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    saveJSON(FILTERS_KEY, { q, typeFilter, categoryFilter, month, sortBy });
  }, [q, typeFilter, categoryFilter, month, sortBy]);

  const categories = useMemo(() => {
    const baseCategories =
      typeFilter === "all"
        ? [
            ...getTransactionCategories("expense"),
            ...getTransactionCategories("income"),
          ]
        : getTransactionCategories(typeFilter);

    const set = new Set(baseCategories);

    for (const transaction of transactions) {
      if (!transaction.category) {
        continue;
      }

      if (typeFilter === "all" || transaction.type === typeFilter) {
        set.add(transaction.category);
      }
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [transactions, typeFilter]);

  useEffect(() => {
    if (categoryFilter !== "all" && !categories.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categories, categoryFilter]);

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (q.trim()) {
      const search = q.trim().toLowerCase();
      list = list.filter((transaction) =>
        (transaction.description || "").toLowerCase().includes(search)
      );
    }

    if (typeFilter !== "all") {
      list = list.filter((transaction) => transaction.type === typeFilter);
    }

    if (categoryFilter !== "all") {
      list = list.filter((transaction) => transaction.category === categoryFilter);
    }

    if (month) {
      list = list.filter((transaction) => (transaction.date || "").startsWith(month));
    }

    switch (sortBy) {
      case "date_asc":
        list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        break;
      case "amount_desc":
        list.sort(
          (a, b) => (Number(b.amountCents) || 0) - (Number(a.amountCents) || 0)
        );
        break;
      case "amount_asc":
        list.sort(
          (a, b) => (Number(a.amountCents) || 0) - (Number(b.amountCents) || 0)
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
    if (isMutating) {
      return;
    }

    setMode("create");
    setSelected(null);
    setIsOpen(true);
  }

  function openEdit(transaction) {
    if (isMutating) {
      return;
    }

    setMode("edit");
    setSelected(transaction);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  async function handleSubmit(data) {
    setIsMutating(true);

    try {
      if (mode === "edit" && selected) {
        await updateTransaction(selected.id, data);
      } else {
        await addTransaction(data);
      }
    } finally {
      setIsMutating(false);
    }
  }

  async function handleRemove(id) {
    if (!window.confirm("Remover esta transacao?")) {
      return;
    }

    setIsMutating(true);

    try {
      await removeTransaction(id);
    } finally {
      setIsMutating(false);
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

  function getExportRows() {
    return filtered.map((transaction) => [
      formatBRDate(transaction.date),
      transaction.description || "",
      transaction.category || "Sem categoria",
      transaction.type === "income" ? "Receita" : "Despesa",
      formatBRLFromCents(transaction.amountCents),
      Number(transaction.amountCents) || 0,
    ]);
  }

  function exportFilteredTransactionsCsv() {
    const rows = [
      ["Data", "Descricao", "Categoria", "Tipo", "Valor", "Valor em centavos"],
      ...getExportRows(),
    ];

    const monthLabel = month || "todos";
    downloadCsv(`finova-transacoes-${monthLabel}.csv`, rows);
  }

  function exportFilteredTransactionsPdf() {
    const monthLabel = month || "todos";

    exportTransactionsToPdf({
      filename: `finova-transacoes-${monthLabel}.pdf`,
      title: "Relatorio de transacoes",
      subtitle: month
        ? `Periodo filtrado: ${month} | ${filtered.length} registro(s)`
        : `Todos os periodos | ${filtered.length} registro(s)`,
      columns: ["Data", "Descricao", "Categoria", "Tipo", "Valor", "Centavos"],
      rows: getExportRows(),
    });
  }

  return (
    <section className="finova-section-space">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h1 className="finova-title mb-1">Transacoes</h1>
          <p className="finova-subtitle mb-0">
            Gerencie receitas e despesas com controle total do seu fluxo financeiro.
          </p>
        </div>

        <button
          className="btn finova-btn-primary px-4"
          onClick={openCreate}
          disabled={isMutating}
        >
          Nova transacao
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
          onExportCsv={exportFilteredTransactionsCsv}
          onExportPdf={exportFilteredTransactionsPdf}
          isLoading={isLoading}
          isMutating={isMutating}
        />
      </div>
    </section>
  );
}

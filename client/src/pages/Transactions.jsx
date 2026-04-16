import { useEffect, useMemo, useState } from "react";
import TransactionImportModal from "../features/transactions/components/TransactionImportModal";
import TransactionModal from "../features/transactions/components/TransactionModal";
import TransactionsFilters from "../features/transactions/components/TransactionsFilters";
import TransactionsTable from "../features/transactions/components/TransactionsTable";
import { useTransactions } from "../features/transactions/useTransactions";
import { getTransactionCategories } from "../lib/constants/transactionCategories";
import { downloadCsv } from "../lib/export/csv";
import { exportTransactionsToPdf } from "../lib/export/pdf";
import { loadJSON, saveJSON } from "../lib/storage/jsonStorage";
import { useI18n } from "../i18n/LanguageProvider";

const FILTERS_KEY = "fd_tx_filters_v1";

export default function Transactions() {
  const { t, formatCurrencyFromCents, formatDate } = useI18n();
  const {
    transactions,
    addTransaction,
    importTransactions,
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [isMutating, setIsMutating] = useState(false);
  const [importFeedback, setImportFeedback] = useState("");
  const [highlightImportedSince, setHighlightImportedSince] = useState("");

  useEffect(() => {
    saveJSON(FILTERS_KEY, { q, typeFilter, categoryFilter, month, sortBy });
  }, [q, typeFilter, categoryFilter, month, sortBy]);

  const categories = useMemo(() => {
    const baseCategories =
      typeFilter === "all"
        ? [...getTransactionCategories("expense"), ...getTransactionCategories("income")]
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
        list.sort((a, b) => (Number(b.amountCents) || 0) - (Number(a.amountCents) || 0));
        break;
      case "amount_asc":
        list.sort((a, b) => (Number(a.amountCents) || 0) - (Number(b.amountCents) || 0));
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

  function openImport() {
    if (isMutating) {
      return;
    }

    setImportFeedback("");
    setIsImportOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  function closeImport() {
    setIsImportOpen(false);
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

  async function handleImportSubmit(items) {
    setIsMutating(true);

    try {
      const result = await importTransactions(items);
      const importedCount = Number(result?.importedCount) || 0;
      const importLabel = items.importFormat?.toUpperCase() || "CSV";
      const importStartedAt = new Date().toISOString();

      setImportFeedback(
        importedCount > 0
          ? importedCount === 1
            ? t("pages.importSuccessSingle", { format: importLabel })
            : t("pages.importSuccessPlural", { count: importedCount, format: importLabel })
          : t("pages.importNoNew", { format: importLabel })
      );
      setHighlightImportedSince(importedCount > 0 ? importStartedAt : "");

      return result;
    } finally {
      setIsMutating(false);
    }
  }

  async function handleRemove(id) {
    if (!window.confirm(t("pages.removeTransactionConfirm"))) {
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
      formatDate(transaction.date),
      transaction.description || "",
      transaction.category || t("transactions.noCategory"),
      transaction.type === "income" ? t("transactions.income") : t("transactions.expense"),
      formatCurrencyFromCents(transaction.amountCents),
      Number(transaction.amountCents) || 0,
    ]);
  }

  function exportFilteredTransactionsCsv() {
    const rows = [
      [
        t("common.date"),
        t("common.description"),
        t("common.category"),
        t("common.type"),
        t("common.value"),
        "Cents",
      ],
      ...getExportRows(),
    ];

    const monthLabel = month || "todos";
    downloadCsv(`finova-transacoes-${monthLabel}.csv`, rows);
  }

  function exportFilteredTransactionsPdf() {
    const monthLabel = month || "todos";

    exportTransactionsToPdf({
      filename: `finova-transacoes-${monthLabel}.pdf`,
      title: t("pages.transactionsTitle"),
      subtitle: month
        ? `Periodo filtrado: ${month} | ${filtered.length} registro(s)`
        : `Todos os periodos | ${filtered.length} registro(s)`,
      columns: [
        t("common.date"),
        t("common.description"),
        t("common.category"),
        t("common.type"),
        t("common.value"),
        "Cents",
      ],
      rows: getExportRows(),
    });
  }

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("pages.transactionsTitle")}</h1>
          <p className="finova-subtitle mb-0">{t("pages.transactionsSubtitle")}</p>
        </div>

        <div className="finova-page-header-actions">
          <button className="btn finova-btn-light px-4" onClick={openImport} disabled={isMutating}>
            {t("pages.importFile")}
          </button>

          <button
            className="btn finova-btn-primary px-4"
            onClick={openCreate}
            disabled={isMutating}
          >
            {t("pages.newTransaction")}
          </button>
        </div>
      </div>

      <TransactionModal
        mode={mode}
        isOpen={isOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initial={selected}
      />

      <TransactionImportModal
        isOpen={isImportOpen}
        onClose={closeImport}
        onImport={handleImportSubmit}
        existingTransactions={transactions}
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

      <div>
        {importFeedback ? (
          <div className="alert alert-success mb-4" role="status">
            {importFeedback}
          </div>
        ) : null}

        <TransactionsTable
          transactions={filtered}
          totalTransactionsCount={transactions.length}
          onEdit={openEdit}
          onRemove={handleRemove}
          onExportCsv={exportFilteredTransactionsCsv}
          onExportPdf={exportFilteredTransactionsPdf}
          highlightImportedSince={highlightImportedSince}
          isLoading={isLoading}
          isMutating={isMutating}
        />
      </div>
    </section>
  );
}

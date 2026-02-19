import { useMemo, useState } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import { formatBRLFromCents } from "../lib/format/currency";
import { formatBRDate } from "../lib/format/date";
import TransactionModal from "../features/transactions/components/TransactionModal";

export default function Transactions() {
  const { transactions, addTransaction, removeTransaction, updateTransaction } = useTransactions();

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all | income | expense
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [month, setMonth] = useState(""); // "YYYY-MM" ou ""
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc | date_asc | amount_desc | amount_asc
  
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [selected, setSelected] = useState(null);

  const totalCount = useMemo(() => transactions.length, [transactions.length]);

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

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-0">Transações</h1>
          <div className="text-muted small">
  {filtered.length} item(ns){filtered.length !== transactions.length ? ` (de ${transactions.length})` : ""}
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

            <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label">Buscar</label>
              <input
                className="form-control"
                placeholder="Ex: mercado"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                {Array.from(new Set(transactions.map((t) => t.category)))
                  .filter(Boolean)
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label">Mês</label>
              <input
                type="month"
                className="form-control"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label">Ordenar</label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Data (recente)</option>
                <option value="date_asc">Data (antiga)</option>
                <option value="amount_desc">Valor (maior)</option>
                <option value="amount_asc">Valor (menor)</option>
              </select>
            </div>

            <div className="col-12 d-flex justify-content-end">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setQ("");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                  setMonth("");
                  setSortBy("date_desc");
                }}
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th className="text-end">Valor</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                   <td colSpan="6" className="text-center text-muted py-4">
                      {transactions.length === 0
                      ? "Nenhuma transação ainda."
                       : "Nenhuma transação encontrada com os filtros atuais."}
                    </td>
                   </tr> ) : (
                  filtered.map((t) => (
                    <tr key={t.id}>
                      <td>{formatBRDate(t.date)}</td>
                      <td>{t.description}</td>

                      <td className="text-end">{formatBRLFromCents(t.amountCents)}</td>

                      <td>
                        <span
                          className={
                            "badge " +
                            (t.type === "income" ? "text-bg-success" : "text-bg-danger")
                          }
                        >
                          {t.type === "income" ? "Receita" : "Despesa"}
                        </span>
                      </td>

                      <td>{t.category}</td>

                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => openEdit(t)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-outline-danger"
                             onClick={() => {
                                 if (confirm("Remover esta transação?")) removeTransaction(t.id);
                                  }}>
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        </div>
      </div>
    </>
  );
}
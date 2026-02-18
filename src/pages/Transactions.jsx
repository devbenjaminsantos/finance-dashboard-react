import { useMemo, useState } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import { formatBRLFromCents, parseMoneyToCents } from "../lib/format/currency";

const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Assinaturas",
  "Outros",
];

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Transactions() {
  const { transactions, addTransaction, removeTransaction } = useTransactions();

  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const totalCount = useMemo(() => transactions.length, [transactions.length]);

  function onSubmit(e) {
    e.preventDefault();
    setError("");

    const amountCents = parseMoneyToCents(amount);

    if (!description.trim()) return setError("Informe uma descrição.");
    if (!date) return setError("Informe uma data.");
    if (!Number.isFinite(amountCents) || amountCents <= 0)
      return setError("Informe um valor válido (ex: 150,00).");

    addTransaction({
      date,
      description: description.trim(),
      type,
      category,
      amountCents,
    });

    setDescription("");
    setAmount("");
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-0">Transações</h1>
          <div className="text-muted small">{totalCount} item(ns)</div>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h2 className="h6 mb-3">Nova transação</h2>

          <form className="row g-2" onSubmit={onSubmit}>
            <div className="col-12 col-md-2">
              <label className="form-label">Data</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Descrição</label>
              <input
                className="form-control"
                placeholder="Ex: Mercado"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-2">
              <label className="form-label">Valor</label>
              <input
                className="form-control"
                inputMode="decimal"
                placeholder="150,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {error ? (
              <div className="col-12">
                <div className="alert alert-danger py-2 mb-0">{error}</div>
              </div>
            ) : null}

            <div className="col-12 d-flex justify-content-end">
              <button className="btn btn-primary">Adicionar</button>
            </div>
          </form>
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
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      Nenhuma transação ainda.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td>{t.description}</td>
                      <td className="text-end">
                        {formatBRLFromCents(t.amountCents)}
                      </td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (t.type === "income"
                              ? "text-bg-success"
                              : "text-bg-danger")
                          }
                        >
                          {t.type === "income" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                      <td>{t.category}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeTransaction(t.id)}
                        >
                          Remover
                        </button>
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
import { useEffect, useState } from "react";
import { parseMoneyToCents } from "../../../lib/format/currency";

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

function centsToInputBRL(cents) {
  const v = (Number(cents) || 0) / 100;
  // retorna "150,00" (string) pra editar no input
  return v.toFixed(2).replace(".", ",");
}

export default function TransactionModal({
  mode, // "create" | "edit"
  isOpen,
  onClose,
  onSubmit, // (data) => void
  initial, // transaction quando edit
}) {
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  // Quando abrir, preencher campos (create vs edit)
  useEffect(() => {
    if (!isOpen) return;

    setError("");

    if (mode === "edit" && initial) {
      setDate(initial.date || todayISO());
      setDescription(initial.description || "");
      setType(initial.type || "expense");
      setCategory(initial.category || CATEGORIES[0]);
      setAmount(centsToInputBRL(initial.amountCents));
    } else {
      setDate(todayISO());
      setDescription("");
      setType("expense");
      setCategory(CATEGORIES[0]);
      setAmount("");
    }
  }, [isOpen, mode, initial]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const amountCents = parseMoneyToCents(amount);

    if (!description.trim()) return setError("Informe uma descrição.");
    if (!date) return setError("Informe uma data.");
    if (!Number.isFinite(amountCents) || amountCents <= 0)
      return setError("Informe um valor válido (ex: 150,00).");

    onSubmit({
      date,
      description: description.trim(),
      type,
      category,
      amountCents,
    });

    onClose();
  }

  // Controla exibição do modal via classes Bootstrap
  return (
    <>
      <div
        className={"modal fade" + (isOpen ? " show" : "")}
        style={{ display: isOpen ? "block" : "none" }}
        tabIndex="-1"
        role="dialog"
        aria-modal={isOpen ? "true" : "false"}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {mode === "edit" ? "Editar transação" : "Nova transação"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-2">
                  <div className="col-12 col-md-4">
                    <label className="form-label">Data</label>
                    <input
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-8">
                    <label className="form-label">Descrição</label>
                    <input
                      className="form-control"
                      placeholder="Ex: Mercado"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="col-6">
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

                  <div className="col-6">
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

                  <div className="col-12">
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
                      <div className="alert alert-danger py-2 mb-0">
                        {error}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {mode === "edit" ? "Salvar" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* backdrop */}
      {isOpen ? <div className="modal-backdrop fade show" /> : null}
    </>
  );
}
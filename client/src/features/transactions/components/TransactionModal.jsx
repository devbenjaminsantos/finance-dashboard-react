import { useEffect, useMemo, useRef, useState } from "react";
import { parseMoneyToCents } from "../../../lib/format/currency";
import { getTransactionCategories } from "../../../lib/constants/transactionCategories";

function todayISO() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function centsToInput(value) {
  if (!Number.isFinite(Number(value))) {
    return "";
  }

  return (Number(value) / 100).toFixed(2).replace(".", ",");
}

export default function TransactionModal({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initial,
}) {
  const isEdit = mode === "edit";

  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState(getTransactionCategories("expense")[0]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const descriptionInputRef = useRef(null);

  const title = useMemo(
    () => (isEdit ? "Editar transação" : "Nova transação"),
    [isEdit]
  );
  const categories = useMemo(() => getTransactionCategories(type), [type]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isEdit && initial) {
      const nextType = initial.type || "expense";
      const nextCategories = getTransactionCategories(nextType);

      setDate((initial.date || "").slice(0, 10) || todayISO());
      setDescription(initial.description || "");
      setType(nextType);
      setCategory(initial.category || nextCategories[0]);
      setAmount(centsToInput(initial.amountCents));
    } else {
      setDate(todayISO());
      setDescription("");
      setType("expense");
      setCategory(getTransactionCategories("expense")[0]);
      setAmount("");
    }

    setError("");
    setIsSubmitting(false);
  }, [isOpen, isEdit, initial]);

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    descriptionInputRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isSubmitting, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const amountCents = parseMoneyToCents(amount);

    if (!description.trim()) {
      setError("Informe uma descrição.");
      setIsSubmitting(false);
      return;
    }

    if (!date) {
      setError("Informe uma data.");
      setIsSubmitting(false);
      return;
    }

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Informe um valor válido (ex: 150,00).");
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        date,
        description: description.trim(),
        type,
        category,
        amountCents,
      });

      onClose();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar a transação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ background: "rgba(15, 23, 42, 0.45)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0" style={{ borderRadius: "16px" }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <div>
              <h2 className="finova-title h4 mb-1">{title}</h2>
              <p className="finova-subtitle small mb-0">
                Preencha os dados da movimentação financeira.
              </p>
            </div>

            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              onClick={onClose}
            />
          </div>

          <div className="modal-body px-4 pb-4 pt-3">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label text-dark fw-medium">Data</label>
                <input
                  type="date"
                  className="form-control finova-input"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>

              <div className="col-12 col-md-8">
                <label className="form-label text-dark fw-medium">Descrição</label>
                <input
                  ref={descriptionInputRef}
                  type="text"
                  className="form-control finova-input"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ex: Mercado do mês"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label text-dark fw-medium">Tipo</label>
                <select
                  className="form-select finova-select"
                  value={type}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    const nextCategories = getTransactionCategories(nextType);
                    setType(nextType);
                    setCategory(nextCategories[0]);
                  }}
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label text-dark fw-medium">Categoria</label>
                <select
                  className="form-select finova-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label text-dark fw-medium">Valor</label>
                <input
                  type="text"
                  className="form-control finova-input"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="150,00"
                  inputMode="decimal"
                />
              </div>

              {error ? (
                <div className="col-12">
                  <div className="alert alert-danger py-2 mb-0">{error}</div>
                </div>
              ) : null}

              <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn finova-btn-light px-4"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn finova-btn-primary px-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Salvando..."
                    : isEdit
                      ? "Salvar alterações"
                      : "Adicionar transação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

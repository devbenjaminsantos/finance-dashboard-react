import { useEffect, useMemo, useRef, useState } from "react";
import { getTransactionCategories } from "../../../lib/constants/transactionCategories";

function formatTagNamesForInput(tagNames) {
  return Array.isArray(tagNames) ? tagNames.join(", ") : "";
}

function parseTagNames(rawValue) {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (item, index, array) =>
        array.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index
    );
}

export default function InstallmentGroupModal({
  isOpen,
  onClose,
  onSubmit,
  initial,
}) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagNamesInput, setTagNamesInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const descriptionInputRef = useRef(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set([
          ...getTransactionCategories("expense"),
          ...getTransactionCategories("income"),
          initial?.category || "",
        ].filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [initial?.category]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDescription(initial?.description || "");
    setCategory(initial?.category || categories[0] || "");
    setTagNamesInput(formatTagNamesForInput(initial?.tagNames));
    setError("");
    setIsSubmitting(false);
  }, [isOpen, initial, categories]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    descriptionInputRef.current?.focus();
  }, [isOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!description.trim()) {
      setError("Informe uma descrição.");
      setIsSubmitting(false);
      return;
    }

    if (!category.trim()) {
      setError("Escolha uma categoria.");
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        description: description.trim(),
        category: category.trim(),
        tagNames: parseTagNames(tagNamesInput),
      });
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar a compra parcelada.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal d-block finova-modal-backdrop"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: "16px" }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <div>
              <h2 className="finova-title h4 mb-1">Editar compra parcelada</h2>
              <p className="finova-subtitle small mb-0">
                Atualize descrição, categoria e tags para todas as parcelas deste plano.
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
              <div className="col-12">
                <label className="form-label text-dark fw-medium" htmlFor="installment-group-description">
                  Descrição
                </label>
                <input
                  id="installment-group-description"
                  ref={descriptionInputRef}
                  type="text"
                  className="form-control finova-input"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label text-dark fw-medium" htmlFor="installment-group-category">
                  Categoria
                </label>
                <select
                  id="installment-group-category"
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

              <div className="col-12">
                <label className="form-label text-dark fw-medium" htmlFor="installment-group-tags">
                  Tags
                </label>
                <input
                  id="installment-group-tags"
                  type="text"
                  className="form-control finova-input"
                  value={tagNamesInput}
                  onChange={(event) => setTagNamesInput(event.target.value)}
                  placeholder="Ex: viagem, trabalho, reembolsavel"
                />
              </div>

              {error ? (
                <div className="col-12">
                  <div className="alert alert-danger py-2 mb-0">{error}</div>
                </div>
              ) : null}

              <div className="col-12">
                <div className="finova-actions-row finova-actions-row-end pt-2">
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
                    {isSubmitting ? "Salvando..." : "Salvar compra"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

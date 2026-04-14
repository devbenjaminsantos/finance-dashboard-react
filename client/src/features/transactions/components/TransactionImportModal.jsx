import { useEffect, useMemo, useRef, useState } from "react";
import { formatBRLFromCents } from "../../../lib/format/currency";
import { parseTransactionsCsv } from "../../../lib/import/transactionsCsv";

export default function TransactionImportModal({ isOpen, onClose, onImport }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFileName("");
    setPreview([]);
    setError("");
    setFeedback("");
    setIsSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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

  const previewRows = useMemo(() => preview.slice(0, 8), [preview]);
  const summary = useMemo(() => {
    return preview.reduce(
      (accumulator, transaction) => {
        if (transaction.type === "income") {
          accumulator.incomeCount += 1;
        } else {
          accumulator.expenseCount += 1;
        }

        accumulator.categories.add(transaction.category);
        return accumulator;
      },
      {
        incomeCount: 0,
        expenseCount: 0,
        categories: new Set(),
      }
    );
  }, [preview]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      const content = await file.text();
      const parsed = parseTransactionsCsv(content);

      setFileName(file.name);
      setPreview(parsed);
      setFeedback(`${parsed.length} transações prontas para revisão.`);
    } catch (requestError) {
      setFileName(file.name);
      setPreview([]);
      setError(requestError.message || "Não foi possível ler o CSV.");
    }
  }

  async function handleImport() {
    if (preview.length === 0) {
      setError("Selecione um CSV válido antes de importar.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onImport(preview);
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível concluir a importação.");
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
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0" style={{ borderRadius: "16px" }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <div>
              <h2 className="finova-title h4 mb-1">Importar CSV</h2>
              <p className="finova-subtitle small mb-0">
                Envie um extrato em CSV, revise as linhas e confirme a importação.
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
            <div className="finova-card-soft p-3 mb-4">
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                <div>
                  <div className="finova-title h6 mb-1">Arquivo CSV</div>
                  <p className="finova-subtitle mb-0">
                    Cabeçalhos aceitos: Data, Descrição, Categoria, Tipo, Valor ou Valor em centavos.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="form-control finova-input"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {fileName ? (
              <div className="mb-3">
                <span className="finova-badge-neutral">{fileName}</span>
              </div>
            ) : null}

            {error ? <div className="alert alert-danger py-2">{error}</div> : null}
            {feedback ? <div className="alert alert-success py-2">{feedback}</div> : null}

            {preview.length > 0 ? (
              <>
                <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                  <div>
                    <h3 className="finova-title h5 mb-1">Prévia da importação</h3>
                    <p className="finova-subtitle mb-0">
                      Mostrando {previewRows.length} de {preview.length} linhas prontas para entrar no sistema.
                    </p>
                  </div>
                  <span className="finova-badge-primary">{preview.length} transações</span>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-4">
                    <div className="finova-card-soft p-3 h-100">
                      <div className="finova-subtitle small mb-1">Receitas</div>
                      <div className="finova-title h5 mb-0">{summary.incomeCount}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="finova-card-soft p-3 h-100">
                      <div className="finova-subtitle small mb-1">Despesas</div>
                      <div className="finova-title h5 mb-0">{summary.expenseCount}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="finova-card-soft p-3 h-100">
                      <div className="finova-subtitle small mb-1">Categorias lidas</div>
                      <div className="finova-title h5 mb-0">{summary.categories.size}</div>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table finova-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th className="text-end">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((transaction, index) => (
                        <tr key={`${transaction.date}-${transaction.description}-${index}`}>
                          <td>{transaction.date}</td>
                          <td>{transaction.description}</td>
                          <td>{transaction.category}</td>
                          <td>{transaction.type === "income" ? "Receita" : "Despesa"}</td>
                          <td className="text-end fw-semibold">
                            {formatBRLFromCents(transaction.amountCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="finova-card-soft p-4">
                <h3 className="finova-title h6 mb-2">Nenhuma linha carregada ainda</h3>
                <p className="finova-subtitle mb-0">
                  Selecione um arquivo CSV para gerar a prévia e revisar antes de confirmar.
                </p>
              </div>
            )}

            <div className="finova-actions-row finova-actions-row-end pt-4">
              <button
                type="button"
                className="btn finova-btn-light px-4"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn finova-btn-primary px-4"
                onClick={handleImport}
                disabled={isSubmitting || preview.length === 0}
              >
                {isSubmitting ? "Importando..." : "Confirmar importação"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

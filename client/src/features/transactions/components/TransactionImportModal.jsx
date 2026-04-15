import { useEffect, useMemo, useRef, useState } from "react";
import { formatBRLFromCents } from "../../../lib/format/currency";
import {
  buildDefaultImportSelection,
  detectImportDuplicates,
} from "../../../lib/import/transactionDuplicates";
import { parseTransactionsImport } from "../../../lib/import/transactionsImport";

export default function TransactionImportModal({
  isOpen,
  onClose,
  onImport,
  existingTransactions = [],
}) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [importFormat, setImportFormat] = useState("");
  const [preview, setPreview] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFileName("");
    setImportFormat("");
    setPreview([]);
    setSelectedIndexes(new Set());
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

  const reconciledPreview = useMemo(
    () => detectImportDuplicates(preview, existingTransactions),
    [preview, existingTransactions]
  );
  const previewRows = useMemo(
    () =>
      reconciledPreview
        .slice(0, 8)
        .map((transaction, index) => ({ transaction, originalIndex: index })),
    [reconciledPreview]
  );
  const selectedTransactions = useMemo(
    () => reconciledPreview.filter((_, index) => selectedIndexes.has(index)),
    [reconciledPreview, selectedIndexes]
  );

  const summary = useMemo(() => {
    return reconciledPreview.reduce(
      (accumulator, transaction, index) => {
        if (transaction.type === "income") {
          accumulator.incomeCount += 1;
        } else {
          accumulator.expenseCount += 1;
        }

        if (transaction.isPossibleDuplicate) {
          accumulator.duplicateCount += 1;
        }

        if (transaction.duplicateSource === "existing") {
          accumulator.existingDuplicateCount += 1;
        }

        if (transaction.duplicateSource === "import") {
          accumulator.importDuplicateCount += 1;
        }

        if (transaction.duplicateSource === "existing_and_import") {
          accumulator.existingDuplicateCount += 1;
          accumulator.importDuplicateCount += 1;
        }

        if (selectedIndexes.has(index)) {
          accumulator.selectedCount += 1;
        }

        accumulator.categories.add(transaction.category);
        return accumulator;
      },
      {
        incomeCount: 0,
        expenseCount: 0,
        duplicateCount: 0,
        existingDuplicateCount: 0,
        importDuplicateCount: 0,
        selectedCount: 0,
        categories: new Set(),
      }
    );
  }, [reconciledPreview, selectedIndexes]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      const content = await file.text();
      const { format, transactions } = parseTransactionsImport(content, file.name);
      const reconciled = detectImportDuplicates(transactions, existingTransactions);

      setFileName(file.name);
      setImportFormat(format);
      setPreview(transactions);
      setSelectedIndexes(buildDefaultImportSelection(reconciled));
      setFeedback(`${transactions.length} transações lidas e prontas para revisão.`);
    } catch (requestError) {
      setFileName(file.name);
      setImportFormat("");
      setPreview([]);
      setSelectedIndexes(new Set());
      setError(requestError.message || "Não foi possível ler o arquivo de importação.");
    }
  }

  function toggleSelection(index) {
    setSelectedIndexes((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }

  function deselectSuggestedDuplicates() {
    setSelectedIndexes((current) => {
      const next = new Set(current);

      reconciledPreview.forEach((transaction, index) => {
        if (transaction.isPossibleDuplicate) {
          next.delete(index);
        }
      });

      return next;
    });
  }

  function selectAllRows() {
    setSelectedIndexes(new Set(reconciledPreview.map((_, index) => index)));
  }

  function removePreviewRow(indexToRemove) {
    setPreview((current) => current.filter((_, index) => index !== indexToRemove));
    setSelectedIndexes((current) => {
      const next = new Set();

      for (const index of current) {
        if (index === indexToRemove) {
          continue;
        }

        next.add(index > indexToRemove ? index - 1 : index);
      }

      return next;
    });
  }

  async function handleImport() {
    if (selectedTransactions.length === 0) {
      setError("Selecione pelo menos uma transação para importar.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onImport(selectedTransactions);
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível concluir a importação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderDuplicateStatus(transaction) {
    if (!transaction.isPossibleDuplicate) {
      return <span className="finova-badge-primary">Nova</span>;
    }

    if (transaction.duplicateSource === "existing") {
      return <span className="finova-badge-neutral">Já existe no histórico</span>;
    }

    if (transaction.duplicateSource === "import") {
      return <span className="finova-badge-neutral">Repetida no arquivo</span>;
    }

    if (transaction.duplicateSource === "existing_and_import") {
      return <span className="finova-badge-neutral">Histórico e arquivo</span>;
    }

    return <span className="finova-badge-neutral">Possível duplicata</span>;
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
              <h2 className="finova-title h4 mb-1">Importar arquivo bancário</h2>
              <p className="finova-subtitle small mb-0">
                Envie um extrato em CSV ou OFX, revise as linhas e confirme apenas o que deve
                entrar no sistema.
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
                  <div className="finova-title h6 mb-1">Arquivo CSV ou OFX</div>
                  <p className="finova-subtitle mb-0">
                    O Finova tenta reconhecer cabeçalhos bancários, detectar possíveis duplicatas
                    e deixar a decisão final de revisão com você.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.ofx,text/csv,application/x-ofx"
                  className="form-control finova-input"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {fileName ? (
              <div className="mb-3 d-flex flex-wrap gap-2">
                <span className="finova-badge-neutral">{fileName}</span>
                {importFormat ? (
                  <span className="finova-badge-primary text-uppercase">{importFormat}</span>
                ) : null}
              </div>
            ) : null}

            {error ? <div className="alert alert-danger py-2">{error}</div> : null}
            {feedback ? <div className="alert alert-success py-2">{feedback}</div> : null}

            {reconciledPreview.length > 0 ? (
              <>
                <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                  <div>
                    <h3 className="finova-title h5 mb-1">Prévia da importação</h3>
                    <p className="finova-subtitle mb-0">
                      Mostrando {previewRows.length} de {reconciledPreview.length} linhas. As
                      sugestões agora diferenciam o que já existe no histórico do que veio repetido
                      dentro do próprio arquivo.
                    </p>
                  </div>
                  <span className="finova-badge-primary">
                    {summary.selectedCount} selecionadas
                  </span>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-3">
                    <div className="finova-card-soft p-3 h-100">
                      <div className="finova-subtitle small mb-1">Receitas</div>
                      <div className="finova-title h5 mb-0">{summary.incomeCount}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="finova-card-soft p-3 h-100">
                      <div className="finova-subtitle small mb-1">Despesas</div>
                      <div className="finova-title h5 mb-0">{summary.expenseCount}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="finova-card-soft p-3 h-100">
                      <div className="finova-subtitle small mb-1">Duplicatas no histórico</div>
                      <div className="finova-title h5 mb-0">{summary.existingDuplicateCount}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="finova-card-soft p-3 h-100">
                      <div className="finova-subtitle small mb-1">Repetidas no arquivo</div>
                      <div className="finova-title h5 mb-0">{summary.importDuplicateCount}</div>
                    </div>
                  </div>
                </div>

                <div className="finova-actions-row mb-3">
                  <button
                    type="button"
                    className="btn finova-btn-light"
                    onClick={deselectSuggestedDuplicates}
                    disabled={isSubmitting || summary.duplicateCount === 0}
                  >
                    Desmarcar duplicatas sugeridas
                  </button>
                  <button
                    type="button"
                    className="btn finova-btn-light"
                    onClick={selectAllRows}
                    disabled={isSubmitting || reconciledPreview.length === 0}
                  >
                    Selecionar todas
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table finova-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: "72px" }}>Importar</th>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th className="text-end">Valor</th>
                        <th className="text-end">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map(({ transaction, originalIndex }) => {
                        const isSelected = selectedIndexes.has(originalIndex);

                        return (
                          <tr
                            key={`${transaction.date}-${transaction.description}-${originalIndex}`}
                          >
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isSelected}
                                onChange={() => toggleSelection(originalIndex)}
                                aria-label={`Selecionar ${transaction.description}`}
                              />
                            </td>
                            <td>{transaction.date}</td>
                            <td>
                              <div>{transaction.description}</div>
                              {transaction.duplicateReason ? (
                                <div className="small text-muted">{transaction.duplicateReason}</div>
                              ) : null}
                            </td>
                            <td>{transaction.category}</td>
                            <td>{transaction.type === "income" ? "Receita" : "Despesa"}</td>
                            <td>{renderDuplicateStatus(transaction)}</td>
                            <td className="text-end fw-semibold">
                              {formatBRLFromCents(transaction.amountCents)}
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm finova-btn-light"
                                onClick={() => removePreviewRow(originalIndex)}
                                disabled={isSubmitting}
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="finova-card-soft p-4">
                <h3 className="finova-title h6 mb-2">Nenhuma linha carregada ainda</h3>
                <p className="finova-subtitle mb-0">
                  Selecione um arquivo CSV ou OFX para gerar a prévia e revisar antes de
                  confirmar.
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
                disabled={isSubmitting || selectedTransactions.length === 0}
              >
                {isSubmitting
                  ? "Importando..."
                  : `Confirmar importação (${selectedTransactions.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

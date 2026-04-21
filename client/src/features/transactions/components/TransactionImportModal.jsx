import { useEffect, useMemo, useRef, useState } from "react";
import { getTransactionCategories } from "../../../lib/constants/transactionCategories";
import { formatBRLFromCents } from "../../../lib/format/currency";
import {
  buildDefaultImportSelection,
  detectImportDuplicates,
} from "../../../lib/import/transactionDuplicates";
import { parseTransactionsImport } from "../../../lib/import/transactionsImport";

const PREVIEW_FILTERS = [
  { key: "all", label: "Todas" },
  { key: "new", label: "Novas" },
  { key: "duplicates", label: "Duplicatas" },
  { key: "selected", label: "Selecionadas" },
];

export default function TransactionImportModal({
  isOpen,
  onClose,
  onImport,
  existingTransactions = [],
  accounts = [],
}) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [importFormat, setImportFormat] = useState("");
  const [preview, setPreview] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFilter, setPreviewFilter] = useState("all");
  const [previewSearch, setPreviewSearch] = useState("");
  const [bulkType, setBulkType] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkDescriptionPrefix, setBulkDescriptionPrefix] = useState("");
  const [bulkDescriptionReplace, setBulkDescriptionReplace] = useState("");
  const [financialAccountId, setFinancialAccountId] = useState("all");

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
    setPreviewFilter("all");
    setPreviewSearch("");
    setBulkType("");
    setBulkCategory("");
    setBulkDescriptionPrefix("");
    setBulkDescriptionReplace("");
    setFinancialAccountId("all");
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
  const filteredPreview = useMemo(() => {
    const normalizedSearch = previewSearch.trim().toLowerCase();

    return reconciledPreview.filter((transaction, index) => {
      if (previewFilter === "new" && transaction.isPossibleDuplicate) {
        return false;
      }

      if (previewFilter === "duplicates" && !transaction.isPossibleDuplicate) {
        return false;
      }

      if (previewFilter === "selected" && !selectedIndexes.has(index)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [transaction.description, transaction.category, transaction.date]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [previewFilter, previewSearch, reconciledPreview, selectedIndexes]);
  const previewRows = useMemo(
    () =>
      filteredPreview.map((transaction) => ({
        transaction,
        originalIndex: reconciledPreview.indexOf(transaction),
      })),
    [filteredPreview, reconciledPreview]
  );
  const selectedTransactions = useMemo(
    () => reconciledPreview.filter((_, index) => selectedIndexes.has(index)),
    [reconciledPreview, selectedIndexes]
  );
  const selectedAccountLabel = useMemo(() => {
    if (financialAccountId === "all") {
      return "Sem conta vinculada";
    }

    return (
      accounts.find((account) => String(account.id) === financialAccountId)?.label ||
      "Conta selecionada"
    );
  }, [accounts, financialAccountId]);

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

        if (transaction.categoryConfidence === "low") {
          accumulator.lowConfidenceCount += 1;
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
          accumulator.selectedAmount += Number(transaction.amountCents) || 0;
          accumulator.selectedTypes.add(transaction.type);
          if (transaction.categoryConfidence === "low") {
            accumulator.lowConfidenceSelectedCount += 1;
          }
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
        selectedAmount: 0,
        selectedTypes: new Set(),
        lowConfidenceCount: 0,
        lowConfidenceSelectedCount: 0,
        categories: new Set(),
      }
    );
  }, [reconciledPreview, selectedIndexes]);

  const selectedType = useMemo(() => {
    if (summary.selectedTypes.size !== 1) {
      return "";
    }

    return Array.from(summary.selectedTypes)[0] || "";
  }, [summary.selectedTypes]);

  const bulkCategoryOptions = useMemo(
    () => (selectedType ? getTransactionCategories(selectedType) : []),
    [selectedType]
  );

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

  function selectOnlyNewRows() {
    setSelectedIndexes(
      new Set(
        reconciledPreview
          .map((transaction, index) => ({ transaction, index }))
          .filter(({ transaction }) => !transaction.isPossibleDuplicate)
          .map(({ index }) => index)
      )
    );
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

  function updatePreviewRow(indexToUpdate, updater) {
    setPreview((current) =>
      current.map((transaction, index) => {
        if (index !== indexToUpdate) {
          return transaction;
        }

        return typeof updater === "function"
          ? updater(transaction)
          : { ...transaction, ...updater };
      })
    );
  }

  function updateTransactionType(indexToUpdate, nextType) {
    updatePreviewRow(indexToUpdate, (transaction) => {
      const availableCategories = getTransactionCategories(nextType);

      return {
        ...transaction,
        type: nextType,
        category: availableCategories.includes(transaction.category)
          ? transaction.category
          : availableCategories[availableCategories.length - 1],
      };
    });
  }

  function updateTransactionCategory(indexToUpdate, nextCategory) {
    updatePreviewRow(indexToUpdate, { category: nextCategory });
  }

  function applyBulkType() {
    if (!bulkType || summary.selectedCount === 0) {
      return;
    }

    setPreview((current) =>
      current.map((transaction, index) => {
        if (!selectedIndexes.has(index)) {
          return transaction;
        }

        const availableCategories = getTransactionCategories(bulkType);
        return {
          ...transaction,
          type: bulkType,
          category: availableCategories.includes(transaction.category)
            ? transaction.category
            : availableCategories[availableCategories.length - 1],
        };
      })
    );

    setBulkCategory("");
  }

  function applyBulkCategory() {
    if (!bulkCategory || summary.selectedCount === 0 || !selectedType) {
      return;
    }

    setPreview((current) =>
      current.map((transaction, index) =>
        selectedIndexes.has(index)
          ? {
              ...transaction,
              category: bulkCategory,
              categoryConfidence: "high",
              categorySource: "manual_review",
            }
          : transaction
      )
    );
  }

  function applyBulkDescriptionPrefix() {
    const normalizedPrefix = bulkDescriptionPrefix.trim();

    if (!normalizedPrefix || summary.selectedCount === 0) {
      return;
    }

    setPreview((current) =>
      current.map((transaction, index) => {
        if (!selectedIndexes.has(index)) {
          return transaction;
        }

        if (
          transaction.description
            .toLowerCase()
            .startsWith(`${normalizedPrefix.toLowerCase()} `)
        ) {
          return transaction;
        }

        return {
          ...transaction,
          description: `${normalizedPrefix} ${transaction.description}`.trim(),
        };
      })
    );
  }

  function applyBulkDescriptionReplace() {
    const normalizedDescription = bulkDescriptionReplace.trim();

    if (!normalizedDescription || summary.selectedCount === 0) {
      return;
    }

    setPreview((current) =>
      current.map((transaction, index) =>
        selectedIndexes.has(index)
          ? {
              ...transaction,
              description: normalizedDescription,
            }
          : transaction
      )
    );
  }

  function removeSelectedRows() {
    if (summary.selectedCount === 0) {
      return;
    }

    setPreview((current) => current.filter((_, index) => !selectedIndexes.has(index)));
    setSelectedIndexes(new Set());
  }

  async function handleImport() {
    if (selectedTransactions.length === 0) {
      setError("Selecione pelo menos uma transação para importar.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onImport({
        transactions: selectedTransactions.map((transaction) => ({
          ...transaction,
          financialAccountId: financialAccountId === "all" ? null : Number(financialAccountId),
        })),
        importFormat,
      });
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
              title="Fechar"
              data-tooltip="Fechar"
              onClick={onClose}
            />
          </div>

          <div className="modal-body px-4 pb-4 pt-3">
            <div className="finova-card-soft p-3 mb-4">
              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-8">
                  <label className="form-label text-dark fw-medium" htmlFor="transaction-import-account">
                    Conta de destino
                  </label>
                  <select
                    id="transaction-import-account"
                    className="form-select finova-select"
                    value={financialAccountId}
                    onChange={(event) => setFinancialAccountId(event.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="all">Sem conta vinculada</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={String(account.id)}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-lg-4">
                  <p className="form-text mb-0">
                    Todas as transacoes selecionadas serao importadas para esta conta.
                  </p>
                </div>

                <div className="col-12">
                  <div className="small text-muted">
                    <strong>Destino atual:</strong> {selectedAccountLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="finova-card-soft p-3 mb-4">
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                <div>
                  <div className="finova-title h6 mb-1">Arquivo CSV ou OFX</div>
                  <p className="finova-subtitle mb-0">
                    O Finova reconhece cabeçalhos bancários, sugere possíveis duplicatas e agora
                    também permite filtrar e editar em lote antes da confirmação.
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
                      Revise, filtre e ajuste em lote antes de confirmar. As sugestões diferenciam
                      o que já existe no histórico do que veio repetido no próprio arquivo.
                    </p>
                    {summary.lowConfidenceCount > 0 ? (
                      <div className="small text-muted mt-2">
                        {summary.lowConfidenceCount} linha
                        {summary.lowConfidenceCount === 1 ? "" : "s"} ainda pedem revisão manual
                        de categoria.
                      </div>
                    ) : null}
                  </div>

                  <div className="d-flex flex-column align-items-end gap-2">
                    <span className="finova-badge-primary">
                      {summary.selectedCount} selecionadas
                    </span>
                    <span className="finova-badge-neutral">
                      Total selecionado: {formatBRLFromCents(summary.selectedAmount)}
                    </span>
                  </div>
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
                    onClick={selectOnlyNewRows}
                    disabled={isSubmitting || reconciledPreview.length === 0}
                  >
                    Selecionar apenas novas
                  </button>
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
                  <button
                    type="button"
                    className="btn finova-btn-light"
                    onClick={removeSelectedRows}
                    disabled={isSubmitting || summary.selectedCount === 0}
                  >
                    Remover selecionadas
                  </button>
                </div>

                <div className="finova-card-soft p-3 mb-3">
                  <div className="row g-3 align-items-end">
                    <div className="col-12 col-xl-4">
                      <label
                        className="form-label text-dark fw-medium"
                        htmlFor="import-preview-search"
                      >
                        Buscar na prévia
                      </label>
                      <input
                        id="import-preview-search"
                        type="text"
                        className="form-control finova-input"
                        placeholder="Descrição, categoria ou data"
                        value={previewSearch}
                        onChange={(event) => setPreviewSearch(event.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="col-12 col-xl-8">
                      <label className="form-label text-dark fw-medium">Filtrar linhas</label>
                      <div className="finova-segmented-actions">
                        {PREVIEW_FILTERS.map((filter) => (
                          <button
                            key={filter.key}
                            type="button"
                            className={
                              previewFilter === filter.key
                                ? "btn finova-btn-primary"
                                : "btn finova-btn-light"
                            }
                            onClick={() => setPreviewFilter(filter.key)}
                            disabled={isSubmitting}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="finova-card-soft p-3 mb-3">
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <div className="finova-title h6 mb-1">Edição em lote</div>
                      <p className="finova-subtitle mb-0">
                        Ajuste o tipo ou a categoria das linhas selecionadas sem editar uma por
                        uma.
                      </p>
                      {summary.lowConfidenceSelectedCount > 0 ? (
                        <div className="small text-muted mt-2">
                          {summary.lowConfidenceSelectedCount} linha
                          {summary.lowConfidenceSelectedCount === 1 ? "" : "s"} selecionada
                          {summary.lowConfidenceSelectedCount === 1 ? "" : "s"} com categoria de
                          baixa confiança.
                        </div>
                      ) : null}
                    </div>

                    <div className="row g-3 align-items-end">
                      <div className="col-12 col-lg-6">
                        <label
                          className="form-label text-dark fw-medium"
                          htmlFor="bulk-import-description-prefix"
                        >
                          Prefixar descrição
                        </label>
                        <input
                          id="bulk-import-description-prefix"
                          type="text"
                          className="form-control finova-input"
                          placeholder="Ex.: Cartao, Reembolso, Ajustado"
                          value={bulkDescriptionPrefix}
                          onChange={(event) => setBulkDescriptionPrefix(event.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="col-12 col-lg-2">
                        <button
                          type="button"
                          className="btn finova-btn-light w-100"
                          onClick={applyBulkDescriptionPrefix}
                          disabled={
                            isSubmitting ||
                            !bulkDescriptionPrefix.trim() ||
                            summary.selectedCount === 0
                          }
                        >
                          Aplicar texto
                        </button>
                      </div>

                      <div className="col-12 col-lg-6">
                        <label
                          className="form-label text-dark fw-medium"
                          htmlFor="bulk-import-description-replace"
                        >
                          Substituir descrição
                        </label>
                        <input
                          id="bulk-import-description-replace"
                          type="text"
                          className="form-control finova-input"
                          placeholder="Ex.: Compra cartão final 1234"
                          value={bulkDescriptionReplace}
                          onChange={(event) => setBulkDescriptionReplace(event.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="col-12 col-lg-2">
                        <button
                          type="button"
                          className="btn finova-btn-light w-100"
                          onClick={applyBulkDescriptionReplace}
                          disabled={
                            isSubmitting ||
                            !bulkDescriptionReplace.trim() ||
                            summary.selectedCount === 0
                          }
                        >
                          Substituir
                        </button>
                      </div>

                      <div className="col-12 col-lg-4">
                        <label
                          className="form-label text-dark fw-medium"
                          htmlFor="bulk-import-type"
                        >
                          Aplicar tipo
                        </label>
                        <select
                          id="bulk-import-type"
                          className="form-select finova-select"
                          value={bulkType}
                          onChange={(event) => setBulkType(event.target.value)}
                          disabled={isSubmitting}
                        >
                          <option value="">Selecione</option>
                          <option value="expense">Despesa</option>
                          <option value="income">Receita</option>
                        </select>
                      </div>

                      <div className="col-12 col-lg-2">
                        <button
                          type="button"
                          className="btn finova-btn-light w-100"
                          onClick={applyBulkType}
                          disabled={isSubmitting || !bulkType || summary.selectedCount === 0}
                        >
                          Aplicar tipo
                        </button>
                      </div>

                      <div className="col-12 col-lg-4">
                        <label
                          className="form-label text-dark fw-medium"
                          htmlFor="bulk-import-category"
                        >
                          Aplicar categoria
                        </label>
                        <select
                          id="bulk-import-category"
                          className="form-select finova-select"
                          value={bulkCategory}
                          onChange={(event) => setBulkCategory(event.target.value)}
                          disabled={
                            isSubmitting || summary.selectedCount === 0 || !selectedType
                          }
                        >
                          <option value="">
                            {selectedType
                              ? "Selecione"
                              : "Selecione linhas do mesmo tipo"}
                          </option>
                          {bulkCategoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-12 col-lg-2">
                        <button
                          type="button"
                          className="btn finova-btn-light w-100"
                          onClick={applyBulkCategory}
                          disabled={
                            isSubmitting ||
                            !bulkCategory ||
                            summary.selectedCount === 0 ||
                            !selectedType
                          }
                        >
                          Aplicar cat.
                        </button>
                      </div>
                    </div>
                  </div>
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
                          <tr key={`${transaction.date}-${transaction.description}-${originalIndex}`}>
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
                              <div className="mt-1 d-flex flex-wrap gap-2">
                                {transaction.categoryConfidence === "low" ? (
                                  <span className="finova-badge-warning">
                                    Revisar categoria
                                  </span>
                                ) : null}
                              </div>
                              {transaction.duplicateReason ? (
                                <div className="small text-muted">{transaction.duplicateReason}</div>
                              ) : null}
                            </td>
                            <td>
                              <select
                                className="form-select form-select-sm finova-select"
                                value={transaction.category}
                                onChange={(event) =>
                                  updateTransactionCategory(originalIndex, event.target.value)
                                }
                                disabled={isSubmitting}
                              >
                                {getTransactionCategories(transaction.type).map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className="form-select form-select-sm finova-select"
                                value={transaction.type}
                                onChange={(event) =>
                                  updateTransactionType(originalIndex, event.target.value)
                                }
                                disabled={isSubmitting}
                              >
                                <option value="expense">Despesa</option>
                                <option value="income">Receita</option>
                              </select>
                            </td>
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

                {previewRows.length === 0 ? (
                  <div className="finova-page-note mt-3">
                    Nenhuma linha corresponde ao filtro atual. Ajuste a busca, troque o recorte ou
                    reative outras linhas selecionadas.
                  </div>
                ) : null}
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

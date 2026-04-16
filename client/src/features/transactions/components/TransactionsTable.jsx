import { formatBRLFromCents } from "../../../lib/format/currency";
import { formatBRDate, formatDateTimeBR } from "../../../lib/format/date";

function getTransactionOriginMeta(transaction) {
  switch (transaction.source) {
    case "import_ofx":
      return { label: "Importada via OFX", className: "finova-badge-primary" };
    case "import_csv":
      return { label: "Importada via CSV", className: "finova-badge-primary" };
    case "bank_sync":
      return { label: "Sincronizada", className: "finova-badge-income" };
    case "manual":
    default:
      return { label: "Manual", className: "finova-badge-neutral" };
  }
}

export default function TransactionsTable({
  transactions,
  totalTransactionsCount,
  onEdit,
  onRemove,
  onExportCsv,
  onExportPdf,
  highlightImportedSince = "",
  isLoading = false,
  isMutating = false,
}) {
  const summaryLabel =
    transactions.length === 1 ? "1 transação" : `${transactions.length} transações`;

  if (isLoading) {
    return (
      <div className="finova-card p-4">
        <p className="finova-subtitle mb-0">Carregando transações...</p>
      </div>
    );
  }

  return (
    <div className="finova-card p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <h2 className="finova-title h5 mb-1">Histórico financeiro</h2>
          <p className="finova-subtitle small mb-0">
            {summaryLabel}
            {transactions.length !== totalTransactionsCount
              ? ` de ${totalTransactionsCount} no total`
              : ""}
          </p>
        </div>

        <div className="finova-actions-row">
          <button
            type="button"
            className="btn finova-btn-light"
            onClick={onExportCsv}
            disabled={transactions.length === 0}
          >
            Exportar CSV
          </button>

          <button
            type="button"
            className="btn finova-btn-light"
            onClick={onExportPdf}
            disabled={transactions.length === 0}
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-5">
          <h3 className="finova-title h6 mb-2">Nenhuma transação encontrada</h3>
          <p className="finova-subtitle mb-0">
            {totalTransactionsCount === 0
              ? "Adicione sua primeira movimentação para começar a acompanhar seu saldo."
              : "Tente ajustar ou limpar os filtros para visualizar outras movimentações."}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table finova-table align-middle mb-0">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th className="text-end">Valor</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => {
                const isRecentlyImported =
                  transaction.importedAtUtc &&
                  highlightImportedSince &&
                  new Date(transaction.importedAtUtc).getTime() >=
                    new Date(highlightImportedSince).getTime() - 10000;

                return (
                <tr
                  key={transaction.id}
                  className={isRecentlyImported ? "finova-row-highlight" : undefined}
                >
                  <td>{formatBRDate(transaction.date)}</td>

                  <td>
                    <div className="fw-medium text-dark">{transaction.description}</div>
                    <div className="mt-1 d-flex flex-wrap gap-2">
                      <span className={getTransactionOriginMeta(transaction).className}>
                        {getTransactionOriginMeta(transaction).label}
                      </span>
                      {transaction.isRecurring ? (
                        <span className="finova-badge-neutral">Recorrente mensal</span>
                      ) : null}
                    </div>
                    {transaction.importedAtUtc ? (
                      <div className="small text-muted mt-2">
                        Entrou no sistema em {formatDateTimeBR(transaction.importedAtUtc)}
                      </div>
                    ) : null}
                    {isRecentlyImported ? (
                      <div className="small mt-2">
                        <span className="finova-badge-warning">Nova nesta importação</span>
                      </div>
                    ) : null}
                  </td>

                  <td>
                    <span className="finova-subtitle">
                      {transaction.category || "Sem categoria"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        transaction.type === "income"
                          ? "finova-badge-income"
                          : "finova-badge-expense"
                      }
                    >
                      {transaction.type === "income" ? "Receita" : "Despesa"}
                    </span>
                  </td>

                  <td className="text-end fw-semibold">
                    {formatBRLFromCents(transaction.amountCents)}
                  </td>

                  <td className="text-end">
                    <div className="finova-actions-row finova-actions-row-end">
                      <button
                        type="button"
                        className="btn finova-btn-light btn-sm"
                        onClick={() => onEdit(transaction)}
                        disabled={isMutating}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onRemove(transaction.id)}
                        disabled={isMutating}
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

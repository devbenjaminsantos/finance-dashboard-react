import { formatBRLFromCents } from "../../../lib/format/currency";
import { formatBRDate } from "../../../lib/format/date";

export default function TransactionsTable({
  transactions,
  totalTransactionsCount,
  onEdit,
  onRemove,
  onExportCsv,
  onExportPdf,
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
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatBRDate(transaction.date)}</td>

                  <td>
                    <div className="fw-medium text-dark">{transaction.description}</div>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

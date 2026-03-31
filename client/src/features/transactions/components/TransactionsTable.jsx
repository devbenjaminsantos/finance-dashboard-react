import { formatBRLFromCents } from "../../../lib/format/currency";
import { formatBRDate } from "../../../lib/format/date";

export default function TransactionsTable({
  transactions,
  totalTransactionsCount,
  onEdit,
  onRemove,
  isLoading = false,
  isMutating = false,
}) {
  if (isLoading) {
    return (
      <div className="finova-card p-4">
        <p className="finova-subtitle mb-0">Carregando transações...</p>
      </div>
    );
  }

  return (
    <div className="finova-card p-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h2 className="finova-title h5 mb-1">Histórico financeiro</h2>
          <p className="finova-subtitle small mb-0">
            {transactions.length} transação(ões)
            {transactions.length !== totalTransactionsCount
              ? ` de ${totalTransactionsCount}`
              : ""}
          </p>
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
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{formatBRDate(t.date)}</td>
                  
                  <td>
                    <div className="fw-medium text-dark">{t.description}</div>
                  </td>

                  <td>  
                    <span className="finova-subtitle">{t.category || "Sem categoria"}</span>
                  </td>

                  <td>
                    <span
                      className={
                        t.type === "income"
                          ? "finova-badge-income"
                          : "finova-badge-expense"
                      }
                    >
                      {t.type === "income" ? "Receita" : "Despesa"}
                    </span>
                  </td>

                  <td className="text-end fw-semibold">
                    {formatBRLFromCents(t.amountCents)}
                  </td>

                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <button
                        type="button"
                        className="btn finova-btn-light btn-sm"
                        onClick={() => onEdit(t)}
                        disabled={isMutating}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onRemove(t.id)}
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

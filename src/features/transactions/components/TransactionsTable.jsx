import { formatBRLFromCents } from "../../../lib/format/currency";
import { formatBRDate } from "../../../lib/format/date";

export default function TransactionsTable({
  transactions,
  totalTransactionsCount,
  onEdit,
  onRemove,
}) {
  return (
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
                    {totalTransactionsCount === 0
                      ? "Nenhuma transação ainda."
                      : "Nenhuma transação encontrada com os filtros atuais."}
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{formatBRDate(t.date)}</td>
                    <td>{t.description}</td>
                    <td className="text-end">{formatBRLFromCents(t.amountCents)}</td>
                    <td>
                      <span
                        className={
                          "badge " +
                          (t.type === "income" ? "text-bg-success" : "text-bg-danger")
                        }
                      >
                        {t.type === "income" ? "Receita" : "Despesa"}
                      </span>
                    </td>
                    <td>{t.category}</td>

                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => onEdit(t)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => onRemove(t.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
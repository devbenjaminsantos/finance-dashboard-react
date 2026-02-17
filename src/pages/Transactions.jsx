export default function Transactions() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Transações</h1>
        <button className="btn btn-primary btn-sm">+ Nova transação</button>
      </div>

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
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    Nenhuma transação ainda.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
export default function App() {
  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">
            Dashboard Financeiro
          </a>
          <span className="navbar-text text-white-50">
            React + Bootstrap
          </span>
        </div>
      </nav>

      <main className="container py-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted">Receitas</div>
                <div className="fs-3 fw-bold">R$ 0,00</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted">Despesas</div>
                <div className="fs-3 fw-bold">R$ 0,00</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted">Saldo</div>
                <div className="fs-3 fw-bold">R$ 0,00</div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Transações</h5>
                  <button className="btn btn-primary btn-sm">
                    + Nova transação
                  </button>
                </div>

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
          </div>
        </div>
      </main>
    </div>
  );
}
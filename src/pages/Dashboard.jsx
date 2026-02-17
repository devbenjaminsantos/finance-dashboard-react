export default function Dashboard() {
  return (
    <>
      <h1 className="h3 mb-3">Dashboard</h1>

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
      </div>
    </>
  );
}
import { useTransactions } from "../features/transactions/useTransactions";
import { formatBRLFromCents } from "../lib/format/currency";
import DashboardCharts from "../features/dashboard/DashboardCharts";

export default function Dashboard() {
  const { summary } = useTransactions();

  return (
    <>
      <h1 className="h3 mb-3">Dashboard</h1>

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted">Receitas</div>
              <div className="fs-3 fw-bold">
                {formatBRLFromCents(summary.income)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted">Despesas</div>
              <div className="fs-3 fw-bold">
                {formatBRLFromCents(summary.expense)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted">Saldo</div>
              <div className="fs-3 fw-bold">
                {formatBRLFromCents(summary.balance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <DashboardCharts />
      </div>
    </>
  );
}
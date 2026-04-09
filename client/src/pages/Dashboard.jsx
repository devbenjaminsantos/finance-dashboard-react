import { useTransactions } from "../features/transactions/useTransactions";
import { formatBRLFromCents } from "../lib/format/currency";
import DashboardCharts from "../features/dashboard/DashboardCharts";

function SummaryCard({ label, value, tone = "default" }) {
  const toneMap = {
    default: {
      bg: "var(--surface)",
      border: "var(--border)",
      text: "var(--text)",
    },
    income: {
      bg: "rgba(34, 197, 94, 0.08)",
      border: "rgba(34, 197, 94, 0.14)",
      text: "var(--success-dark)",
    },
    expense: {
      bg: "rgba(239, 68, 68, 0.06)",
      border: "rgba(239, 68, 68, 0.12)",
      text: "#dc2626",
    },
  };

  const styles = toneMap[tone] || toneMap.default;

  return (
    <div className="col-12 col-md-4">
      <div
        className="finova-card-soft h-100 p-4"
        style={{
          background: styles.bg,
          borderColor: styles.border,
        }}
      >
        <div className="finova-subtitle small mb-2">{label}</div>
        <div
          className="finova-title mb-0"
          style={{
            fontSize: "1.75rem",
            color: styles.text,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { summary, isLoading, transactions } = useTransactions();

  return (
    <section className="finova-section-space">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-2">
        <div>
          <h1 className="finova-title mb-1">Dashboard</h1>
          <p className="finova-subtitle mb-0">
            Visualize seu saldo, acompanhe receitas e monitore despesas com
            clareza.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="finova-card p-4">
          <p className="finova-subtitle mb-0">Carregando dados financeiros...</p>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <SummaryCard
              label="Receitas"
              value={formatBRLFromCents(summary.income)}
              tone="income"
            />
            <SummaryCard
              label="Despesas"
              value={formatBRLFromCents(summary.expense)}
              tone="expense"
            />
            <SummaryCard
              label="Saldo"
              value={formatBRLFromCents(summary.balance)}
              tone="default"
            />
          </div>

          {transactions.length === 0 ? (
            <div className="finova-card p-4">
              <h2 className="finova-subtitle h5 mb-2">
                Nenhum dado financeiro ainda
              </h2>
              <p className="finova-subtitle mb-0">
                Adicione sua primeira transação para começar a visualizar seu
                desempenho financeiro.
              </p>
            </div>
          ) : (
            <div className="mt-2">
              <DashboardCharts />
            </div>
          )}
        </>
      )}
    </section>
  );
}

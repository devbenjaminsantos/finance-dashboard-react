import { useMemo, useState } from "react";
import BudgetGoalsSection from "../features/dashboard/BudgetGoalsSection";
import DashboardCharts from "../features/dashboard/DashboardCharts";
import { useTransactions } from "../features/transactions/useTransactions";
import { formatBRLFromCents } from "../lib/format/currency";

const PERIOD_OPTIONS = [
  { value: "current-month", label: "Mes atual" },
  { value: "last-3-months", label: "Ultimos 3 meses" },
  { value: "last-6-months", label: "Ultimos 6 meses" },
  { value: "all", label: "Todo o historico" },
];

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

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonthsISO(n) {
  const months = [];
  const d = new Date();
  d.setDate(1);

  for (let i = 0; i < n; i++) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }

  return months.reverse();
}

function getMonthsForPeriod(period) {
  switch (period) {
    case "current-month":
      return [currentMonthISO()];
    case "last-3-months":
      return lastNMonthsISO(3);
    case "last-6-months":
      return lastNMonthsISO(6);
    case "all":
    default:
      return [];
  }
}

export default function Dashboard() {
  const { isLoading, transactions } = useTransactions();
  const [period, setPeriod] = useState("current-month");

  const selectedPeriodLabel = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Mes atual",
    [period]
  );

  const chartMonths = useMemo(
    () => (period === "all" ? lastNMonthsISO(6) : getMonthsForPeriod(period)),
    [period]
  );

  const filteredTransactions = useMemo(() => {
    if (period === "all") {
      return transactions;
    }

    const allowedMonths = new Set(getMonthsForPeriod(period));
    return transactions.filter((transaction) =>
      allowedMonths.has((transaction.date || "").slice(0, 7))
    );
  }, [transactions, period]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const transaction of filteredTransactions) {
      const value = Number(transaction.amountCents) || 0;

      if (transaction.type === "income") {
        income += value;
      } else {
        expense += value;
      }
    }

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  return (
    <section className="finova-section-space">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h1 className="finova-title mb-1">Dashboard</h1>
          <p className="finova-subtitle mb-0">
            Visualize seu saldo, acompanhe receitas e monitore despesas com clareza.
          </p>
        </div>

        <div style={{ minWidth: 220 }}>
          <label className="form-label text-dark fw-medium">Periodo</label>
          <select
            className="form-select finova-select"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

          <BudgetGoalsSection transactions={transactions} />

          {filteredTransactions.length === 0 ? (
            <div className="finova-card p-4">
              <h2 className="finova-subtitle h5 mb-2">
                Nenhum dado financeiro para o periodo selecionado
              </h2>
              <p className="finova-subtitle mb-0">
                Ajuste o periodo ou adicione novas transacoes para acompanhar o seu desempenho.
              </p>
            </div>
          ) : (
            <div className="mt-2">
              <DashboardCharts
                transactions={filteredTransactions}
                chartMonths={chartMonths}
                periodLabel={selectedPeriodLabel}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

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

const COMPARISON_RANGE_OPTIONS = [
  { value: 1, label: "1 mes" },
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
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

function ComparisonCard({
  label,
  currentValue,
  previousValue,
  currentRangeLabel,
  previousRangeLabel,
}) {
  const delta = currentValue - previousValue;
  const hasPreviousData = previousValue > 0;
  const percentChange = hasPreviousData
    ? Math.round((delta / previousValue) * 100)
    : null;

  const toneClass =
    delta > 0
      ? "finova-badge-income"
      : delta < 0
        ? "finova-badge-expense"
        : "finova-badge-primary";

  const toneText =
    delta > 0 ? "Subiu" : delta < 0 ? "Caiu" : "Sem variacao";

  return (
    <div className="col-12 col-md-4">
      <div className="finova-card-soft h-100 p-4">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
          <div>
            <div className="finova-subtitle small mb-1">{label}</div>
            <div className="finova-title h5 mb-0">{formatBRLFromCents(currentValue)}</div>
          </div>
          <span className={toneClass}>{toneText}</span>
        </div>

        <div className="small finova-subtitle mb-2">
          Base anterior ({previousRangeLabel}): {formatBRLFromCents(previousValue)}
        </div>

        <div className="small">
          {hasPreviousData ? (
            <span className="fw-semibold">
              {percentChange > 0 ? "+" : ""}
              {percentChange}% em relacao a {previousRangeLabel}
            </span>
          ) : (
            <span className="finova-subtitle">
              Sem base anterior suficiente para comparar {currentRangeLabel}.
            </span>
          )}
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

function getRelativeMonthsISO(offset, count) {
  const months = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);

  for (let i = 0; i < count; i++) {
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

function summarizeTransactions(transactions) {
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
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
}

export default function Dashboard() {
  const { isLoading, transactions } = useTransactions();
  const [period, setPeriod] = useState("current-month");
  const [comparisonRange, setComparisonRange] = useState(3);

  const selectedPeriodLabel = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Mes atual",
    [period]
  );

  const selectedComparisonRangeLabel = useMemo(
    () =>
      COMPARISON_RANGE_OPTIONS.find((option) => option.value === comparisonRange)?.label ??
      "3 meses",
    [comparisonRange]
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

  const summary = useMemo(
    () => summarizeTransactions(filteredTransactions),
    [filteredTransactions]
  );

  const monthComparison = useMemo(() => {
    const currentMonths = getRelativeMonthsISO(0, comparisonRange);
    const previousMonths = getRelativeMonthsISO(comparisonRange, comparisonRange);
    const currentSet = new Set(currentMonths);
    const previousSet = new Set(previousMonths);

    const currentTransactions = transactions.filter((transaction) =>
      currentSet.has((transaction.date || "").slice(0, 7))
    );
    const previousTransactions = transactions.filter((transaction) =>
      previousSet.has((transaction.date || "").slice(0, 7))
    );

    return {
      currentRangeLabel: selectedComparisonRangeLabel,
      previousRangeLabel: `${selectedComparisonRangeLabel} anteriores`,
      current: summarizeTransactions(currentTransactions),
      previous: summarizeTransactions(previousTransactions),
    };
  }, [transactions, comparisonRange, selectedComparisonRangeLabel]);

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

          <div className="finova-card p-4 mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-3">
              <div>
                <h2 className="finova-title h5 mb-1">Comparativo entre meses</h2>
                <p className="finova-subtitle mb-0">
                  Compare a janela atual com a imediatamente anterior para identificar mudancas
                  mais rapido.
                </p>
              </div>

              <div style={{ minWidth: 180 }}>
                <label className="form-label text-dark fw-medium">Janela de comparacao</label>
                <select
                  className="form-select finova-select"
                  value={comparisonRange}
                  onChange={(event) => setComparisonRange(Number(event.target.value))}
                >
                  {COMPARISON_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row g-3">
              <ComparisonCard
                label="Receitas na janela atual"
                currentValue={monthComparison.current.income}
                previousValue={monthComparison.previous.income}
                currentRangeLabel={monthComparison.currentRangeLabel}
                previousRangeLabel={monthComparison.previousRangeLabel}
              />
              <ComparisonCard
                label="Despesas na janela atual"
                currentValue={monthComparison.current.expense}
                previousValue={monthComparison.previous.expense}
                currentRangeLabel={monthComparison.currentRangeLabel}
                previousRangeLabel={monthComparison.previousRangeLabel}
              />
              <ComparisonCard
                label="Saldo na janela atual"
                currentValue={monthComparison.current.balance}
                previousValue={monthComparison.previous.balance}
                currentRangeLabel={monthComparison.currentRangeLabel}
                previousRangeLabel={monthComparison.previousRangeLabel}
              />
            </div>
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

import { useMemo, useState } from "react";
import { SummaryCard } from "../features/dashboard/DashboardCards";
import DashboardCharts from "../features/dashboard/DashboardCharts";
import {
  getMonthsForPeriod,
  lastNMonthsISO,
  PERIOD_OPTIONS,
  summarizeTransactions,
} from "../features/dashboard/dashboardAnalytics";
import { useTransactions } from "../features/transactions/useTransactions";
import { useI18n } from "../i18n/LanguageProvider";

export default function Dashboard() {
  const { t, formatCurrencyFromCents } = useI18n();
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

  const summary = useMemo(() => summarizeTransactions(filteredTransactions), [filteredTransactions]);

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("pages.dashboardTitle")}</h1>
          <p className="finova-subtitle mb-0">{t("pages.dashboardSubtitle")}</p>
        </div>

        <div className="finova-page-header-side">
          <label className="form-label text-dark fw-medium">{t("pages.dashboardPeriod")}</label>
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
          <p className="finova-subtitle mb-0">{t("common.loading")}</p>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <SummaryCard
              label={t("transactions.incomePlural")}
              value={formatCurrencyFromCents(summary.income)}
              tone="income"
            />
            <SummaryCard
              label={t("transactions.expensePlural")}
              value={formatCurrencyFromCents(summary.expense)}
              tone="expense"
            />
            <SummaryCard
              label="Saldo"
              value={formatCurrencyFromCents(summary.balance)}
              tone="default"
            />
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="finova-card p-4">
              <h2 className="finova-title h5 mb-2">{t("pages.dashboardEmptyTitle")}</h2>
              <p className="finova-subtitle mb-0">{t("pages.dashboardEmptySubtitle")}</p>
            </div>
          ) : (
            <div className="finova-card p-4">
              <div className="mb-3">
                <h2 className="finova-title h5 mb-1">{t("pages.dashboardCardTitle")}</h2>
                <p className="finova-subtitle mb-0">
                  {t("pages.dashboardCardSubtitle", {
                    period: selectedPeriodLabel.toLowerCase(),
                  })}
                </p>
              </div>

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

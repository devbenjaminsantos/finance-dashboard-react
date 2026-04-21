import { useEffect, useMemo, useState } from "react";
import { SummaryCard } from "../features/dashboard/DashboardCards";
import DashboardCharts from "../features/dashboard/DashboardCharts";
import {
  getMonthsForPeriod,
  lastNMonthsISO,
  PERIOD_OPTIONS,
  summarizeTransactions,
} from "../features/dashboard/dashboardAnalytics";
import { useTransactions } from "../features/transactions/useTransactions";
import { getFinancialAccounts } from "../lib/api/financialAccounts";
import { formatFinancialAccountLabel } from "../lib/financialAccounts/presentation";
import { useI18n } from "../i18n/LanguageProvider";

export default function Dashboard() {
  const { t, formatCurrencyFromCents } = useI18n();
  const { isLoading, transactions } = useTransactions();
  const [period, setPeriod] = useState("current-month");
  const [accountFilter, setAccountFilter] = useState("all");
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      try {
        const data = await getFinancialAccounts();
        if (active) {
          setAccounts(
            (Array.isArray(data) ? data : []).map((account) => ({
              ...account,
              label: formatFinancialAccountLabel(account),
            }))
          );
        }
      } catch {
        if (active) {
          setAccounts([]);
        }
      }
    }

    loadAccounts();

    return () => {
      active = false;
    };
  }, []);

  const selectedPeriodLabel = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Mes atual",
    [period]
  );

  const chartMonths = useMemo(
    () => (period === "all" ? lastNMonthsISO(6) : getMonthsForPeriod(period)),
    [period]
  );

  const filteredTransactions = useMemo(() => {
    let scopedTransactions = transactions;

    if (accountFilter === "unassigned") {
      scopedTransactions = scopedTransactions.filter((transaction) => transaction.financialAccountId == null);
    } else if (accountFilter !== "all") {
      scopedTransactions = scopedTransactions.filter(
        (transaction) => String(transaction.financialAccountId) === accountFilter
      );
    }

    if (period === "all") {
      return scopedTransactions;
    }

    const allowedMonths = new Set(getMonthsForPeriod(period));
    return scopedTransactions.filter((transaction) =>
      allowedMonths.has((transaction.date || "").slice(0, 7))
    );
  }, [transactions, period, accountFilter]);

  const summary = useMemo(() => summarizeTransactions(filteredTransactions), [filteredTransactions]);

  const selectedAccountLabel = useMemo(() => {
    if (accountFilter === "all") {
      return "Saldo global em todas as contas";
    }

    if (accountFilter === "unassigned") {
      return "Movimentacoes sem conta vinculada";
    }

    return accounts.find((account) => String(account.id) === accountFilter)?.label || "Conta selecionada";
  }, [accounts, accountFilter]);

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("pages.dashboardTitle")}</h1>
          <p className="finova-subtitle mb-0">{t("pages.dashboardSubtitle")}</p>
          <p className="finova-subtitle small mt-2 mb-0">{selectedAccountLabel}</p>
        </div>

        <div className="finova-page-header-side">
          <div className="d-grid gap-2">
            <div>
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

            <div>
              <label className="form-label text-dark fw-medium">Conta exibida</label>
              <select
                className="form-select finova-select"
                value={accountFilter}
                onChange={(event) => setAccountFilter(event.target.value)}
              >
                <option value="all">Todas as contas (saldo global)</option>
                <option value="unassigned">Sem conta vinculada</option>
                {accounts.map((account) => (
                  <option key={account.id} value={String(account.id)}>
                    {account.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
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

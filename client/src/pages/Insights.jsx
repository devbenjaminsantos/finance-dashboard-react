import { useMemo, useState } from "react";
import { InsightCard } from "../features/dashboard/DashboardCards";
import {
  getAutomaticInsights,
  getMonthsForPeriod,
  getPrescriptiveInsights,
  PERIOD_OPTIONS,
} from "../features/dashboard/dashboardAnalytics";
import { useTransactions } from "../features/transactions/useTransactions";
import {
  filterTransactionsByFinancialAccount,
  getFinancialAccountScopeLabel,
} from "../lib/financialAccounts/scope";
import { useFinancialAccountOptions } from "../lib/financialAccounts/useFinancialAccountOptions";
import { useI18n } from "../i18n/LanguageProvider";

export default function Insights() {
  const { t } = useI18n();
  const { isLoading, transactions } = useTransactions();
  const [period, setPeriod] = useState("current-month");
  const [accountFilter, setAccountFilter] = useState("all");
  const accounts = useFinancialAccountOptions();

  const filteredTransactions = useMemo(() => {
    const scopedTransactions = filterTransactionsByFinancialAccount(transactions, accountFilter);

    if (period === "all") {
      return scopedTransactions;
    }

    const allowedMonths = new Set(getMonthsForPeriod(period));
    return scopedTransactions.filter((transaction) =>
      allowedMonths.has((transaction.date || "").slice(0, 7))
    );
  }, [transactions, period, accountFilter]);

  const selectedAccountLabel = useMemo(
    () => getFinancialAccountScopeLabel(accountFilter, accounts),
    [accountFilter, accounts]
  );

  const automaticInsights = useMemo(
    () => getAutomaticInsights(filteredTransactions),
    [filteredTransactions]
  );

  const prescriptiveInsights = useMemo(
    () => getPrescriptiveInsights(filteredTransactions),
    [filteredTransactions]
  );

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("pages.insightsTitle")}</h1>
          <p className="finova-subtitle mb-0">{t("pages.insightsSubtitle")}</p>
          <p className="finova-subtitle small mt-2 mb-0">{selectedAccountLabel}</p>
        </div>

        <div className="finova-page-header-side">
          <div className="d-grid gap-2">
            <div>
              <label className="form-label text-dark fw-medium">{t("pages.insightsPeriod")}</label>
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

      <div className="finova-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Leitura automatica</div>
              <div className="finova-title h6 mb-2">O que mais se destacou</div>
              <p className="finova-subtitle mb-0">
                O Finova interpreta concentracao de gastos, folga financeira e impacto das
                recorrencias.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Leitura prescritiva</div>
              <div className="finova-title h6 mb-2">O que vale fazer agora</div>
              <p className="finova-subtitle mb-0">
                As recomendacoes priorizam ajustes rapidos quando a folga esta curta ou uma
                categoria comeca a pesar demais.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Dica pratica</div>
              <div className="finova-title h6 mb-2">Use junto com metas</div>
              <p className="finova-subtitle mb-0">
                Depois de ler os insights, vale abrir a area de metas para transformar a analise em
                um plano concreto.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="finova-card p-4">
        {isLoading ? (
          <p className="finova-subtitle mb-0">Carregando insights...</p>
        ) : automaticInsights.length === 0 && prescriptiveInsights.length === 0 ? (
          <div className="text-center py-4">
            <h2 className="finova-title h6 mb-2">Ainda nao ha dados suficientes</h2>
            <p className="finova-subtitle mb-0">
              Adicione transacoes para que o Finova consiga interpretar padroes e sugerir acoes.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <h2 className="finova-title h5 mb-1">Leitura do periodo</h2>
              <p className="finova-subtitle mb-0">
                Aqui ficam os sinais automaticos e as sugestoes objetivas para o recorte
                selecionado.
              </p>
            </div>

            <div className="row g-3">
              {automaticInsights.map((insight) => (
                <InsightCard
                  key={insight.key}
                  title={insight.title}
                  description={insight.description}
                  badge={insight.badge}
                  tone={insight.tone}
                />
              ))}

              {prescriptiveInsights.map((insight) => (
                <InsightCard
                  key={insight.key}
                  title={insight.title}
                  description={insight.description}
                  badge={insight.badge}
                  tone={insight.tone}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

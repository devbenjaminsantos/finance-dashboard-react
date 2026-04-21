import { useMemo, useState } from "react";
import BudgetGoalsSection from "../features/dashboard/BudgetGoalsSection";
import {
  CategoryInsightCard,
  ComparisonCard,
  InsightCard,
  SummaryCard,
} from "../features/dashboard/DashboardCards";
import {
  COMPARISON_RANGE_OPTIONS,
  getAutomaticInsights,
  getCategoryLeaders,
  getForecastSnapshot,
  getMonthsForPeriod,
  getPrescriptiveInsights,
  getRelativeMonthsISO,
  PERIOD_OPTIONS,
  summarizeTransactions,
} from "../features/dashboard/dashboardAnalytics";
import { useTransactions } from "../features/transactions/useTransactions";
import {
  filterTransactionsByFinancialAccount,
  getFinancialAccountScopeLabel,
} from "../lib/financialAccounts/scope";
import { useFinancialAccountOptions } from "../lib/financialAccounts/useFinancialAccountOptions";
import { useI18n } from "../i18n/LanguageProvider";

function formatMonthLabel(month, locale) {
  const [year, monthNumber] = String(month || "").split("-").map(Number);

  if (!year || !monthNumber) {
    return month;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

function AnalysisOverviewCard({ eyebrow, title, description, badgeClass = "finova-badge-primary", badge }) {
  return (
    <div className="col-12 col-lg-4">
      <div className="finova-card-soft p-3 h-100">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
          <div className="finova-subtitle small">{eyebrow}</div>
          {badge ? <span className={badgeClass}>{badge}</span> : null}
        </div>
        <div className="finova-title h6 mb-2">{title}</div>
        <p className="finova-subtitle mb-0">{description}</p>
      </div>
    </div>
  );
}

function AnalysisSectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-3">
      <div className="finova-subtitle small text-uppercase mb-1">{eyebrow}</div>
      <h2 className="finova-title h5 mb-1">{title}</h2>
      <p className="finova-subtitle mb-0">{description}</p>
    </div>
  );
}

export default function Analyses() {
  const { locale, t, formatCurrencyFromCents } = useI18n();
  const { isLoading, transactions } = useTransactions();
  const [period, setPeriod] = useState("current-month");
  const [comparisonRange, setComparisonRange] = useState(3);
  const [accountFilter, setAccountFilter] = useState("all");
  const accounts = useFinancialAccountOptions();

  const scopedTransactions = useMemo(
    () => filterTransactionsByFinancialAccount(transactions, accountFilter),
    [transactions, accountFilter]
  );

  const filteredTransactions = useMemo(() => {
    if (period === "all") {
      return scopedTransactions;
    }

    const allowedMonths = new Set(getMonthsForPeriod(period));
    return scopedTransactions.filter((transaction) =>
      allowedMonths.has((transaction.date || "").slice(0, 7))
    );
  }, [scopedTransactions, period]);

  const selectedAccountLabel = useMemo(
    () => getFinancialAccountScopeLabel(accountFilter, accounts),
    [accountFilter, accounts]
  );

  const selectedComparisonRangeLabel = useMemo(
    () =>
      COMPARISON_RANGE_OPTIONS.find((option) => option.value === comparisonRange)?.label ??
      "3 meses",
    [comparisonRange]
  );

  const selectedPeriodLabel = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Mes atual",
    [period]
  );

  const summary = useMemo(() => summarizeTransactions(filteredTransactions), [filteredTransactions]);

  const automaticInsights = useMemo(
    () => getAutomaticInsights(filteredTransactions),
    [filteredTransactions]
  );

  const prescriptiveInsights = useMemo(
    () => getPrescriptiveInsights(filteredTransactions),
    [filteredTransactions]
  );

  const comparison = useMemo(() => {
    const currentMonths = getRelativeMonthsISO(0, comparisonRange);
    const previousMonths = getRelativeMonthsISO(comparisonRange, comparisonRange);
    const currentSet = new Set(currentMonths);
    const previousSet = new Set(previousMonths);

    const currentTransactions = scopedTransactions.filter((transaction) =>
      currentSet.has((transaction.date || "").slice(0, 7))
    );
    const previousTransactions = scopedTransactions.filter((transaction) =>
      previousSet.has((transaction.date || "").slice(0, 7))
    );

    return {
      currentRangeLabel: selectedComparisonRangeLabel,
      previousRangeLabel: `${selectedComparisonRangeLabel} anteriores`,
      current: summarizeTransactions(currentTransactions),
      previous: summarizeTransactions(previousTransactions),
      categoryLeaders: getCategoryLeaders(currentTransactions, previousTransactions),
    };
  }, [scopedTransactions, comparisonRange, selectedComparisonRangeLabel]);

  const forecast = useMemo(
    () =>
      getForecastSnapshot(scopedTransactions, {
        historyMonths: Math.max(3, comparisonRange),
        horizon: 3,
      }),
    [scopedTransactions, comparisonRange]
  );

  const totalInsightCount = automaticInsights.length + prescriptiveInsights.length;
  const highlightBadgeClass =
    summary.balance < 0
      ? "finova-badge-expense"
      : totalInsightCount > 0
        ? "finova-badge-primary"
        : "finova-badge-income";
  const highlightBadgeLabel =
    summary.balance < 0
      ? "Atencao"
      : totalInsightCount > 0
        ? `${totalInsightCount} sinais`
        : "Estavel";

  const confidenceBadgeClass =
    forecast.confidence.tone === "income"
      ? "finova-badge-income"
      : forecast.confidence.tone === "primary"
        ? "finova-badge-primary"
        : "finova-badge-neutral";

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("pages.analysesTitle")}</h1>
          <p className="finova-subtitle mb-0">{t("pages.analysesSubtitle")}</p>
          <p className="finova-subtitle small mt-2 mb-0">{selectedAccountLabel}</p>
        </div>

        <div className="finova-page-header-side">
          <div className="d-grid gap-2">
            <div>
              <label className="form-label text-dark fw-medium">{t("pages.analysesPeriod")}</label>
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
              <label className="form-label text-dark fw-medium">{t("pages.analysesRange")}</label>
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
              <div className="finova-subtitle small mb-1">Leitura do periodo</div>
              <div className="finova-title h6 mb-2">Contexto e prioridade</div>
              <p className="finova-subtitle mb-0">
                Reunimos sinais automaticos, comparativos e metas na mesma area para facilitar a
                tomada de decisao.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Recorte atual</div>
              <div className="finova-title h6 mb-2">{selectedPeriodLabel}</div>
              <p className="finova-subtitle mb-0">
                O bloco de insights e o resumo financeiro respeitam esse periodo selecionado.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Janela comparativa</div>
              <div className="finova-title h6 mb-2">{selectedComparisonRangeLabel}</div>
              <p className="finova-subtitle mb-0">
                Os comparativos usam a janela atual contra a imediatamente anterior do mesmo tamanho.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="finova-card p-4">
          <p className="finova-subtitle mb-0">Carregando analises...</p>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <AnalysisOverviewCard
              eyebrow="Momento atual"
              title={selectedPeriodLabel}
              description={`A leitura atual considera ${filteredTransactions.length} movimentacao${filteredTransactions.length === 1 ? "" : "es"} no recorte selecionado.`}
              badgeClass={highlightBadgeClass}
              badge={highlightBadgeLabel}
            />
            <AnalysisOverviewCard
              eyebrow="Comparacao"
              title={selectedComparisonRangeLabel}
              description={`A janela atual sera comparada com os ${selectedComparisonRangeLabel.toLowerCase()} anteriores para identificar mudancas de ritmo.`}
              badgeClass="finova-badge-neutral"
              badge="Tendencia"
            />
            <AnalysisOverviewCard
              eyebrow="Projecao"
              title={
                forecast.hasEnoughData
                  ? `Confianca ${forecast.confidence.label.toLowerCase()}`
                  : "Historico insuficiente"
              }
              description={
                forecast.hasEnoughData
                  ? "A previsao dos proximos meses ja pode apoiar ajustes de metas e prioridades."
                  : "Adicione mais meses de movimentacao para destravar a leitura preditiva."
              }
              badgeClass={confidenceBadgeClass}
              badge={forecast.hasEnoughData ? forecast.confidence.label : "Aguardando base"}
            />
          </div>

          <div className="finova-card p-4 mb-4">
            <AnalysisSectionHeader
              eyebrow="Leitura automatica"
              title="Insights do periodo"
              description="Sinais automaticos e recomendacoes objetivas para o recorte selecionado."
            />

            <div className="row g-3 mb-4">
              <SummaryCard
                label="Receitas"
                value={formatCurrencyFromCents(summary.income)}
                tone="income"
              />
              <SummaryCard
                label="Despesas"
                value={formatCurrencyFromCents(summary.expense)}
                tone="expense"
              />
              <SummaryCard
                label="Saldo"
                value={formatCurrencyFromCents(summary.balance)}
                tone="default"
              />
            </div>

            {automaticInsights.length === 0 && prescriptiveInsights.length === 0 ? (
              <div className="text-center py-4">
                <h3 className="finova-title h6 mb-2">Ainda nao ha dados suficientes</h3>
                <p className="finova-subtitle mb-0">
                  Adicione transacoes para que o Finova consiga interpretar padroes e sugerir acoes.
                </p>
              </div>
            ) : (
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
            )}
          </div>

          <div className="finova-card p-4 mb-4">
            <AnalysisSectionHeader
              eyebrow="Mudanca de ritmo"
              title="Comparativos"
              description="Entenda o que mudou entre a janela atual e a anterior, com previsao dos proximos meses."
            />

            <div className="row g-3 mb-3">
              <ComparisonCard
                label="Receitas na janela atual"
                currentValue={comparison.current.income}
                previousValue={comparison.previous.income}
                currentRangeLabel={comparison.currentRangeLabel}
                previousRangeLabel={comparison.previousRangeLabel}
              />
              <ComparisonCard
                label="Despesas na janela atual"
                currentValue={comparison.current.expense}
                previousValue={comparison.previous.expense}
                currentRangeLabel={comparison.currentRangeLabel}
                previousRangeLabel={comparison.previousRangeLabel}
              />
              <ComparisonCard
                label="Saldo na janela atual"
                currentValue={comparison.current.balance}
                previousValue={comparison.previous.balance}
                currentRangeLabel={comparison.currentRangeLabel}
                previousRangeLabel={comparison.previousRangeLabel}
              />
            </div>

            <div className="row g-3 mb-4">
              <CategoryInsightCard
                title="Categoria que mais pesou"
                category={comparison.categoryLeaders.biggestIncrease.category}
                value={comparison.categoryLeaders.biggestIncrease.value}
                tone="up"
              />
              <CategoryInsightCard
                title="Categoria que mais aliviou"
                category={comparison.categoryLeaders.biggestDrop.category}
                value={comparison.categoryLeaders.biggestDrop.value}
                tone="down"
              />
            </div>

            <div className="pt-4 border-top">
              <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
                <div>
                  <h3 className="finova-title h5 mb-1">{t("pages.comparisonsForecastTitle")}</h3>
                  <p className="finova-subtitle mb-0">
                    {t("pages.comparisonsForecastSubtitle", {
                      months: forecast.historyMonths || Math.max(3, comparisonRange),
                    })}
                  </p>
                </div>
                <div className="d-flex align-items-start">
                  <span className={confidenceBadgeClass}>
                    {t("pages.comparisonsForecastConfidence")} {forecast.confidence.label}
                  </span>
                </div>
              </div>

              {forecast.hasEnoughData ? (
                <>
                  <div className="row g-3 mb-3">
                    {forecast.forecast.map((item) => (
                      <div className="col-12 col-lg-4" key={item.month}>
                        <div className="finova-card-soft h-100 p-4">
                          <div className="finova-subtitle small mb-1">
                            {t("pages.comparisonsForecastMonth")}
                          </div>
                          <div className="finova-title h5 mb-3">
                            {formatMonthLabel(item.month, locale)}
                          </div>

                          <div className="d-grid gap-2 small">
                            <div className="d-flex justify-content-between gap-3">
                              <span className="finova-subtitle">
                                {t("pages.comparisonsForecastIncome")}
                              </span>
                              <span className="fw-semibold">
                                {formatCurrencyFromCents(item.income)}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between gap-3">
                              <span className="finova-subtitle">
                                {t("pages.comparisonsForecastExpense")}
                              </span>
                              <span className="fw-semibold">
                                {formatCurrencyFromCents(item.expense)}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between gap-3">
                              <span className="finova-subtitle">
                                {t("pages.comparisonsForecastBalance")}
                              </span>
                              <span className="fw-semibold">
                                {formatCurrencyFromCents(item.balance)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="finova-card-soft p-3">
                    <div className="row g-3">
                      <div className="col-12 col-lg-4">
                        <div className="finova-subtitle small mb-1">
                          {t("pages.comparisonsForecastAverageIncome")}
                        </div>
                        <div className="finova-title h6 mb-0">
                          {formatCurrencyFromCents(forecast.averageIncome)}
                        </div>
                      </div>
                      <div className="col-12 col-lg-4">
                        <div className="finova-subtitle small mb-1">
                          {t("pages.comparisonsForecastAverageExpense")}
                        </div>
                        <div className="finova-title h6 mb-0">
                          {formatCurrencyFromCents(forecast.averageExpense)}
                        </div>
                      </div>
                      <div className="col-12 col-lg-4">
                        <div className="finova-subtitle small mb-1">
                          {t("pages.comparisonsForecastAverageBalance")}
                        </div>
                        <div className="finova-title h6 mb-0">
                          {formatCurrencyFromCents(forecast.averageBalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="finova-card-soft p-4">
                  <p className="finova-subtitle mb-0">
                    {t("pages.comparisonsForecastEmpty")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="finova-card p-4">
            <AnalysisSectionHeader
              eyebrow="Planejamento mensal"
              title="Metas do mes"
              description="Revise o orcamento mensal geral e por categoria sem sair da mesma area de analise."
            />

            <BudgetGoalsSection transactions={scopedTransactions} />
          </div>
        </>
      )}
    </section>
  );
}

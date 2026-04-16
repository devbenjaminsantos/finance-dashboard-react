import { useMemo, useState } from "react";
import {
  CategoryInsightCard,
  ComparisonCard,
} from "../features/dashboard/DashboardCards";
import { useI18n } from "../i18n/LanguageProvider";
import {
  COMPARISON_RANGE_OPTIONS,
  getCategoryLeaders,
  getRelativeMonthsISO,
  summarizeTransactions,
} from "../features/dashboard/dashboardAnalytics";
import { useTransactions } from "../features/transactions/useTransactions";

export default function Comparisons() {
  const { t } = useI18n();
  const { isLoading, transactions } = useTransactions();
  const [comparisonRange, setComparisonRange] = useState(3);

  const selectedComparisonRangeLabel = useMemo(
    () =>
      COMPARISON_RANGE_OPTIONS.find((option) => option.value === comparisonRange)?.label ??
      "3 meses",
    [comparisonRange]
  );

  const comparison = useMemo(() => {
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
      categoryLeaders: getCategoryLeaders(currentTransactions, previousTransactions),
    };
  }, [transactions, comparisonRange, selectedComparisonRangeLabel]);

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("pages.comparisonsTitle")}</h1>
          <p className="finova-subtitle mb-0">{t("pages.comparisonsSubtitle")}</p>
        </div>

        <div className="finova-page-header-side">
          <label className="form-label text-dark fw-medium">{t("pages.comparisonsRange")}</label>
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

      <div className="finova-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Leitura comparativa</div>
              <div className="finova-title h6 mb-2">O que mudou de uma janela para outra</div>
              <p className="finova-subtitle mb-0">
                Use este bloco para detectar rapidamente oscilacoes em receitas, despesas e saldo.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Categoria em destaque</div>
              <div className="finova-title h6 mb-2">Onde o periodo pesou mais</div>
              <p className="finova-subtitle mb-0">
                O comparativo tambem aponta qual categoria puxou o resultado para cima ou para
                baixo.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Uso recomendado</div>
              <div className="finova-title h6 mb-2">Cruze com insights e metas</div>
              <p className="finova-subtitle mb-0">
                Depois de encontrar uma mudanca forte, vale abrir os insights ou revisar as metas
                da categoria envolvida.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="finova-card p-4">
        {isLoading ? (
          <p className="finova-subtitle mb-0">Carregando comparativos...</p>
        ) : (
          <>
            <div className="mb-3">
              <h2 className="finova-title h5 mb-1">Resumo da comparacao</h2>
              <p className="finova-subtitle mb-0">
                A janela atual e sempre comparada com a imediatamente anterior de mesmo tamanho.
              </p>
            </div>

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

            <div className="row g-3">
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
          </>
        )}
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";
import { InsightCard } from "../features/dashboard/DashboardCards";
import {
  getAutomaticInsights,
  getMonthsForPeriod,
  getPrescriptiveInsights,
  PERIOD_OPTIONS,
} from "../features/dashboard/dashboardAnalytics";
import { useTransactions } from "../features/transactions/useTransactions";

export default function Insights() {
  const { isLoading, transactions } = useTransactions();
  const [period, setPeriod] = useState("current-month");

  const filteredTransactions = useMemo(() => {
    if (period === "all") {
      return transactions;
    }

    const allowedMonths = new Set(getMonthsForPeriod(period));
    return transactions.filter((transaction) =>
      allowedMonths.has((transaction.date || "").slice(0, 7))
    );
  }, [transactions, period]);

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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h1 className="finova-title mb-1">Insights</h1>
          <p className="finova-subtitle mb-0">
            Veja padrões, sinais de atenção e próximos passos sugeridos com base nas suas
            movimentações.
          </p>
        </div>

        <div style={{ minWidth: 220 }}>
          <label className="form-label text-dark fw-medium">Período</label>
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

      <div className="finova-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Leitura automática</div>
              <div className="finova-title h6 mb-2">O que mais se destacou</div>
              <p className="finova-subtitle mb-0">
                O Finova interpreta concentração de gastos, folga financeira e impacto das
                recorrências.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Leitura prescritiva</div>
              <div className="finova-title h6 mb-2">O que vale fazer agora</div>
              <p className="finova-subtitle mb-0">
                As recomendações priorizam ajustes rápidos quando a folga está curta ou uma
                categoria começa a pesar demais.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Dica prática</div>
              <div className="finova-title h6 mb-2">Use junto com metas</div>
              <p className="finova-subtitle mb-0">
                Depois de ler os insights, vale abrir a área de metas para transformar a análise em
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
            <h2 className="finova-title h6 mb-2">Ainda não há dados suficientes</h2>
            <p className="finova-subtitle mb-0">
              Adicione transações para que o Finova consiga interpretar padrões e sugerir ações.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <h2 className="finova-title h5 mb-1">Leitura do período</h2>
              <p className="finova-subtitle mb-0">
                Aqui ficam os sinais automáticos e as sugestões objetivas para o recorte
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

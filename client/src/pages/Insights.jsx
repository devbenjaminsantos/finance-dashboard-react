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
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">Insights</h1>
          <p className="finova-subtitle mb-0">
            Veja padroes, sinais de atencao e proximos passos sugeridos com base nas suas
            movimentacoes.
          </p>
        </div>

        <div className="finova-page-header-side">
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

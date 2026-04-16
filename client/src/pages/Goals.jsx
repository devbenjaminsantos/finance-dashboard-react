import BudgetGoalsSection from "../features/dashboard/BudgetGoalsSection";
import { useTransactions } from "../features/transactions/useTransactions";

export default function Goals() {
  const { isLoading, transactions } = useTransactions();

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">Metas</h1>
          <p className="finova-subtitle mb-0">
            Organize seu orcamento mensal com metas gerais e por categoria em uma area propria,
            mais focada e facil de revisar.
          </p>
        </div>
      </div>

      <div className="finova-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Meta geral</div>
              <div className="finova-title h6 mb-2">Visao ampla do mes</div>
              <p className="finova-subtitle mb-0">
                Ideal para entender se o conjunto das despesas esta compativel com o orcamento do
                periodo.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Metas por categoria</div>
              <div className="finova-title h6 mb-2">Controle mais preciso</div>
              <p className="finova-subtitle mb-0">
                Use metas especificas para acompanhar exatamente onde o orcamento aperta e onde ele
                ainda tem margem.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Dica pratica</div>
              <div className="finova-title h6 mb-2">Revise mes a mes</div>
              <p className="finova-subtitle mb-0">
                Vale acompanhar a navegacao mensal para ajustar limites a medida que os habitos
                mudam.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="finova-card p-4">
          <p className="finova-subtitle mb-0">Carregando metas...</p>
        </div>
      ) : (
        <BudgetGoalsSection transactions={transactions} />
      )}
    </section>
  );
}

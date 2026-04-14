import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SummaryCard } from "../features/dashboard/DashboardCards";
import DashboardCharts from "../features/dashboard/DashboardCharts";
import {
  getMonthsForPeriod,
  lastNMonthsISO,
  PERIOD_OPTIONS,
  summarizeTransactions,
  currentMonthISO,
} from "../features/dashboard/dashboardAnalytics";
import { useTransactions } from "../features/transactions/useTransactions";
import { getStoredUser, updateOnboardingPreferenceRequest } from "../lib/api/auth";
import { getBudgetGoals } from "../lib/api/budgetGoals";
import { formatBRLFromCents } from "../lib/format/currency";

function DemoInfoCard() {
  return (
    <div className="finova-card p-4 mb-4 finova-demo-panel">
      <h2 className="finova-title h5 mb-2">Conta de demonstração</h2>
      <p className="finova-subtitle mb-0">
        Você está explorando uma conta com dados fictícios. Navegue pelo dashboard, veja seus
        atalhos rápidos e visite as áreas de insights, comparativos e metas para conhecer o fluxo
        completo.
      </p>
    </div>
  );
}

function OnboardingPromptCard({ isSaving, onChoose }) {
  return (
    <div className="finova-card p-4 mb-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
        <div>
          <h2 className="finova-title h5 mb-2">Quer ajuda para configurar seu Finova?</h2>
          <p className="finova-subtitle mb-0">
            Posso te guiar pelos primeiros passos para deixar o dashboard útil mais rápido.
          </p>
        </div>

        <div className="finova-actions-row">
          <button
            type="button"
            className="btn finova-btn-primary"
            disabled={isSaving}
            onClick={() => onChoose(true)}
          >
            {isSaving ? "Salvando..." : "Quero ajuda"}
          </button>
          <button
            type="button"
            className="btn finova-btn-light"
            disabled={isSaving}
            onClick={() => onChoose(false)}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

function OnboardingChecklistCard({
  transactionsCount,
  recurringCount,
  goalsCount,
  isSaving,
  onHide,
  onShowAgain,
  isVisible,
  isCompleted,
}) {
  const items = [
    {
      key: "transactions",
      label: "Registrar a primeira transação",
      description: "Adicione pelo menos uma receita ou despesa para começar a alimentar o painel.",
      done: transactionsCount > 0,
    },
    {
      key: "goals",
      label: "Criar a primeira meta mensal",
      description: "Defina um limite geral ou por categoria para ativar os alertas visuais.",
      done: goalsCount > 0,
    },
    {
      key: "recurring",
      label: "Automatizar um lançamento recorrente",
      description: "Cadastre salário, aluguel, condomínio ou assinaturas como recorrentes.",
      done: recurringCount > 0,
    },
  ];

  const completedCount = items.filter((item) => item.done).length;

  if (!isVisible && isCompleted) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="finova-card p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="finova-title h6 mb-1">Guia inicial oculto</h2>
            <p className="finova-subtitle mb-0">
              Se quiser, você pode reabrir o checklist a qualquer momento.
            </p>
          </div>

          <button
            type="button"
            className="btn finova-btn-light"
            disabled={isSaving}
            onClick={onShowAgain}
          >
            {isSaving ? "Salvando..." : "Mostrar guia inicial"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="finova-card p-4 mb-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3 mb-4">
        <div>
          <h2 className="finova-title h5 mb-2">Guia inicial</h2>
          <p className="finova-subtitle mb-0">
            {completedCount === items.length
              ? "Tudo pronto. Seu espaço já tem a base ideal para gerar valor."
              : "Siga estes passos para deixar sua conta útil desde os primeiros acessos."}
          </p>
        </div>

        <div className="finova-actions-row">
          <span className="finova-badge-primary">
            {completedCount}/{items.length} concluídos
          </span>
          <button
            type="button"
            className="btn finova-btn-light"
            disabled={isSaving}
            onClick={onHide}
          >
            Ocultar guia
          </button>
        </div>
      </div>

      <div className="row g-3">
        {items.map((item) => (
          <div className="col-12 col-lg-4" key={item.key}>
            <div className="finova-card-soft h-100 p-3">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <h3 className="finova-title h6 mb-0">{item.label}</h3>
                <span className={item.done ? "finova-badge-income" : "finova-badge-neutral"}>
                  {item.done ? "Feito" : "Pendente"}
                </span>
              </div>
              <p className="finova-subtitle small mb-0">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionShortcutCard({ title, description, to, cta }) {
  return (
    <div className="col-12 col-lg-4">
      <div className="finova-card-soft h-100 p-4 d-flex flex-column">
        <h2 className="finova-title h5 mb-2">{title}</h2>
        <p className="finova-subtitle mb-4">{description}</p>
        <div className="mt-auto">
          <Link to={to} className="btn finova-btn-light">
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isLoading, transactions } = useTransactions();
  const [period, setPeriod] = useState("current-month");
  const [user, setUser] = useState(() => getStoredUser());
  const [goalsCount, setGoalsCount] = useState(0);
  const [isApplyingOnboarding, setIsApplyingOnboarding] = useState(false);
  const [goalsRefreshKey, setGoalsRefreshKey] = useState(0);

  useEffect(() => {
    function handleSessionChange() {
      setUser(getStoredUser());
    }

    function handleBudgetGoalsChange() {
      setGoalsRefreshKey((current) => current + 1);
    }

    window.addEventListener("finova-session-change", handleSessionChange);
    window.addEventListener("finova-budget-goals-change", handleBudgetGoalsChange);
    return () => {
      window.removeEventListener("finova-session-change", handleSessionChange);
      window.removeEventListener("finova-budget-goals-change", handleBudgetGoalsChange);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadGoalsForOnboarding() {
      if (!user || user.isDemo) {
        setGoalsCount(0);
        return;
      }

      try {
        const goals = await getBudgetGoals(currentMonthISO());

        if (active) {
          setGoalsCount(Array.isArray(goals) ? goals.length : 0);
        }
      } catch {
        if (active) {
          setGoalsCount(0);
        }
      }
    }

    loadGoalsForOnboarding();

    return () => {
      active = false;
    };
  }, [user, transactions, goalsRefreshKey]);

  const selectedPeriodLabel = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Mês atual",
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

  const recurringTransactionsCount = useMemo(
    () => transactions.filter((transaction) => transaction.isRecurring).length,
    [transactions]
  );

  const onboardingCompleted = useMemo(
    () => transactions.length > 0 && recurringTransactionsCount > 0 && goalsCount > 0,
    [transactions.length, recurringTransactionsCount, goalsCount]
  );

  async function handleOnboardingChoice(onboardingOptIn) {
    setIsApplyingOnboarding(true);

    try {
      const updatedUser = await updateOnboardingPreferenceRequest(onboardingOptIn);
      setUser(updatedUser);
    } finally {
      setIsApplyingOnboarding(false);
    }
  }

  useEffect(() => {
    if (!user || user.isDemo || user.onboardingOptIn !== true || !onboardingCompleted) {
      return;
    }

    let active = true;

    async function autoCompleteOnboarding() {
      setIsApplyingOnboarding(true);

      try {
        const updatedUser = await updateOnboardingPreferenceRequest(false);

        if (active) {
          setUser(updatedUser);
        }
      } finally {
        if (active) {
          setIsApplyingOnboarding(false);
        }
      }
    }

    autoCompleteOnboarding();

    return () => {
      active = false;
    };
  }, [user, onboardingCompleted]);

  return (
    <section className="finova-section-space">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h1 className="finova-title mb-1">Dashboard</h1>
          <p className="finova-subtitle mb-0">
            Sua visão geral financeira com atalhos para os blocos mais importantes do produto.
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

      {isLoading ? (
        <div className="finova-card p-4">
          <p className="finova-subtitle mb-0">Carregando dados financeiros...</p>
        </div>
      ) : (
        <>
          {user?.isDemo ? (
            <DemoInfoCard />
          ) : user?.onboardingOptIn == null ? (
            <OnboardingPromptCard
              isSaving={isApplyingOnboarding}
              onChoose={handleOnboardingChoice}
            />
          ) : (
            <OnboardingChecklistCard
              transactionsCount={transactions.length}
              recurringCount={recurringTransactionsCount}
              goalsCount={goalsCount}
              isSaving={isApplyingOnboarding}
              onHide={() => handleOnboardingChoice(false)}
              onShowAgain={() => handleOnboardingChoice(true)}
              isVisible={Boolean(user.onboardingOptIn)}
              isCompleted={onboardingCompleted}
            />
          )}

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
            <div className="mb-3">
              <h2 className="finova-title h5 mb-1">Áreas dedicadas</h2>
              <p className="finova-subtitle mb-0">
                Agora cada bloco analítico ganhou uma página própria para deixar a navegação mais
                clara.
              </p>
            </div>

            <div className="row g-3">
              <SectionShortcutCard
                title="Insights"
                description="Veja padrões automáticos, sinais de atenção e recomendações do período."
                to="/insights"
                cta="Abrir insights"
              />
              <SectionShortcutCard
                title="Comparativos"
                description="Compare janelas entre meses e descubra quais categorias mais mudaram."
                to="/comparativos"
                cta="Abrir comparativos"
              />
              <SectionShortcutCard
                title="Metas"
                description="Gerencie orçamento geral e metas por categoria em uma área própria."
                to="/metas"
                cta="Abrir metas"
              />
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="finova-card p-4">
              <h2 className="finova-subtitle h5 mb-2">
                Nenhum dado financeiro para o período selecionado
              </h2>
              <p className="finova-subtitle mb-0">
                Ajuste o período ou adicione novas transações para acompanhar seu desempenho.
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

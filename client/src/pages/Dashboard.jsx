import { useEffect, useMemo, useState } from "react";
import BudgetGoalsSection from "../features/dashboard/BudgetGoalsSection";
import DashboardCharts from "../features/dashboard/DashboardCharts";
import { useTransactions } from "../features/transactions/useTransactions";
import { updateOnboardingPreferenceRequest, getStoredUser } from "../lib/api/auth";
import { getBudgetGoals } from "../lib/api/budgetGoals";
import { formatBRLFromCents } from "../lib/format/currency";

const PERIOD_OPTIONS = [
  { value: "current-month", label: "Mês atual" },
  { value: "last-3-months", label: "Últimos 3 meses" },
  { value: "last-6-months", label: "Últimos 6 meses" },
  { value: "all", label: "Todo o histórico" },
];

const COMPARISON_RANGE_OPTIONS = [
  { value: 1, label: "1 mês" },
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
    delta > 0 ? "Subiu" : delta < 0 ? "Caiu" : "Sem variação";

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
              {percentChange}% em relação a {previousRangeLabel}
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

function CategoryInsightCard({ title, category, value, tone }) {
  const badgeClass =
    tone === "up"
      ? "finova-badge-expense"
      : tone === "down"
        ? "finova-badge-income"
        : "finova-badge-primary";

  const badgeText =
    tone === "up"
      ? "Maior peso"
      : tone === "down"
        ? "Maior alívio"
        : "Sem destaque";

  return (
    <div className="col-12 col-md-6">
      <div className="finova-card-soft h-100 p-4">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
          <div>
            <div className="finova-subtitle small mb-1">{title}</div>
            <div className="finova-title h5 mb-1">{category || "Sem categoria dominante"}</div>
            <div className="finova-subtitle small">
              {value > 0
                ? formatBRLFromCents(value)
                : "Ainda não há despesas suficientes para destacar uma categoria."}
            </div>
          </div>
          <span className={badgeClass}>{badgeText}</span>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, description, badge, tone = "primary" }) {
  const badgeClass =
    tone === "income"
      ? "finova-badge-income"
      : tone === "expense"
        ? "finova-badge-expense"
        : tone === "neutral"
          ? "finova-badge-neutral"
          : "finova-badge-primary";

  return (
    <div className="col-12 col-lg-4">
      <div className="finova-card-soft h-100 p-4">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <h2 className="finova-title h6 mb-0">{title}</h2>
          <span className={badgeClass}>{badge}</span>
        </div>
        <p className="finova-subtitle mb-0">{description}</p>
      </div>
    </div>
  );
}

function DemoInfoCard() {
  return (
    <div className="finova-card p-4 mb-4 finova-demo-panel">
      <h2 className="finova-title h5 mb-2">Conta de demonstração</h2>
      <p className="finova-subtitle mb-0">
        Você está explorando uma conta com dados fictícios. Navegue pelo dashboard,
        teste os filtros, veja metas prontas e entenda o fluxo completo do produto.
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
}) {
  const items = [
    {
      key: "transactions",
      label: "Registrar a primeira transação",
      description: "Adicione pelo menos uma receita ou despesa para começar a alimentar o dashboard.",
      done: transactionsCount > 0,
    },
    {
      key: "goals",
      label: "Criar a primeira meta mensal",
      description: "Defina um limite geral ou por categoria para começar a receber alertas visuais.",
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
              ? "Tudo pronto. Seu espaço já tem a base ideal para gerar valor no dashboard."
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

function buildExpenseTotalsByCategory(transactions) {
  const totals = new Map();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const category = transaction.category || "Outros";
    totals.set(category, (totals.get(category) || 0) + (Number(transaction.amountCents) || 0));
  }

  return totals;
}

function getCategoryLeaders(currentTransactions, previousTransactions) {
  const currentTotals = buildExpenseTotalsByCategory(currentTransactions);
  const previousTotals = buildExpenseTotalsByCategory(previousTransactions);
  const allCategories = new Set([...currentTotals.keys(), ...previousTotals.keys()]);

  let biggestIncrease = { category: "", value: 0 };
  let biggestDrop = { category: "", value: 0 };

  for (const category of allCategories) {
    const delta = (currentTotals.get(category) || 0) - (previousTotals.get(category) || 0);

    if (delta > biggestIncrease.value) {
      biggestIncrease = { category, value: delta };
    }

    if (delta < biggestDrop.value) {
      biggestDrop = { category, value: Math.abs(delta) };
    }
  }

  return {
    biggestIncrease,
    biggestDrop,
  };
}

function getAutomaticInsights(transactions) {
  const incomeTransactions = transactions.filter((transaction) => transaction.type === "income");
  const expenseTransactions = transactions.filter((transaction) => transaction.type === "expense");

  const totalIncome = incomeTransactions.reduce(
    (sum, transaction) => sum + (Number(transaction.amountCents) || 0),
    0
  );
  const totalExpense = expenseTransactions.reduce(
    (sum, transaction) => sum + (Number(transaction.amountCents) || 0),
    0
  );
  const balance = totalIncome - totalExpense;

  const topExpenseCategory = Array.from(buildExpenseTotalsByCategory(transactions).entries())
    .sort((a, b) => b[1] - a[1])[0];

  const recurringExpenses = expenseTransactions.filter((transaction) => transaction.isRecurring);
  const recurringExpenseTotal = recurringExpenses.reduce(
    (sum, transaction) => sum + (Number(transaction.amountCents) || 0),
    0
  );

  const recurringIncomes = incomeTransactions.filter((transaction) => transaction.isRecurring);
  const recurringIncomeTotal = recurringIncomes.reduce(
    (sum, transaction) => sum + (Number(transaction.amountCents) || 0),
    0
  );

  const insights = [];

  if (topExpenseCategory && totalExpense > 0) {
    const [categoryName, categoryValue] = topExpenseCategory;
    const share = Math.round((categoryValue / totalExpense) * 100);

    insights.push({
      key: "top-category",
      title: "Categoria mais representativa",
      badge: `${share}%`,
      tone: "expense",
      description: `${categoryName} concentra ${share}% das despesas do período e merece atenção extra.`,
    });
  }

  if (totalIncome > 0) {
    const savingsRate = Math.round((balance / totalIncome) * 100);
    const tone =
      savingsRate >= 20 ? "income" : savingsRate < 0 ? "expense" : "primary";
    const badge =
      savingsRate > 0 ? `+${savingsRate}%` : `${savingsRate}%`;

    insights.push({
      key: "savings-rate",
      title: "Ritmo de sobra no período",
      badge,
      tone,
      description:
        savingsRate >= 20
          ? "Seu saldo está preservando uma parcela saudável das receitas neste recorte."
          : savingsRate >= 0
            ? "O saldo ainda está positivo, mas há espaço para aumentar a folga financeira."
            : "As despesas superaram as receitas neste período e pedem correção rápida.",
    });
  }

  if (recurringExpenses.length > 0 || recurringIncomes.length > 0) {
    const recurringNet = recurringIncomeTotal - recurringExpenseTotal;
    const tone =
      recurringNet > 0 ? "income" : recurringNet < 0 ? "expense" : "neutral";

    insights.push({
      key: "recurring",
      title: "Compromissos recorrentes",
      badge: `${recurringExpenses.length + recurringIncomes.length} itens`,
      tone,
      description:
        recurringNet >= 0
          ? `Os lançamentos recorrentes deixam ${formatBRLFromCents(recurringNet)} de margem entre entradas e saídas fixas.`
          : `Os lançamentos recorrentes já comprometem ${formatBRLFromCents(Math.abs(recurringNet))} além das entradas fixas.`,
    });
  } else {
    const biggestExpense = [...expenseTransactions].sort(
      (left, right) => (Number(right.amountCents) || 0) - (Number(left.amountCents) || 0)
    )[0];

    if (biggestExpense) {
      insights.push({
        key: "biggest-expense",
        title: "Maior despesa avulsa",
        badge: biggestExpense.category || "Despesa",
        tone: "expense",
        description: `${biggestExpense.description} foi o maior lançamento de saída do período, totalizando ${formatBRLFromCents(biggestExpense.amountCents)}.`,
      });
    }
  }

  return insights.slice(0, 3);
}

function getPrescriptiveInsights(transactions) {
  const incomeTransactions = transactions.filter((transaction) => transaction.type === "income");
  const expenseTransactions = transactions.filter((transaction) => transaction.type === "expense");

  const totalIncome = incomeTransactions.reduce(
    (sum, transaction) => sum + (Number(transaction.amountCents) || 0),
    0
  );
  const totalExpense = expenseTransactions.reduce(
    (sum, transaction) => sum + (Number(transaction.amountCents) || 0),
    0
  );
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : null;

  const topExpenseCategory = Array.from(buildExpenseTotalsByCategory(transactions).entries())
    .sort((a, b) => b[1] - a[1])[0];

  const recurringExpenses = expenseTransactions.filter((transaction) => transaction.isRecurring);
  const recurringExpenseTotal = recurringExpenses.reduce(
    (sum, transaction) => sum + (Number(transaction.amountCents) || 0),
    0
  );

  const recurringIncomes = incomeTransactions.filter((transaction) => transaction.isRecurring);
  const recurringIncomeTotal = recurringIncomes.reduce(
    (sum, transaction) => sum + (Number(transaction.amountCents) || 0),
    0
  );

  const recommendations = [];

  if (savingsRate !== null) {
    if (savingsRate < 0) {
      recommendations.push({
        key: "prescriptive-balance-negative",
        title: "Ação prioritária",
        badge: "Ajuste imediato",
        tone: "expense",
        description:
          "As despesas passaram das receitas neste período. Vale revisar as saídas variáveis primeiro e congelar gastos menos essenciais até o saldo voltar a respirar.",
      });
    } else if (savingsRate < 10) {
      recommendations.push({
        key: "prescriptive-balance-low",
        title: "Próximo movimento sugerido",
        badge: "Baixa folga",
        tone: "primary",
        description:
          "Sua folga está curta. Um bom próximo passo é transformar pelo menos uma despesa previsível em lançamento recorrente e definir uma meta mensal para a categoria mais pesada.",
      });
    } else if (savingsRate >= 20) {
      recommendations.push({
        key: "prescriptive-balance-healthy",
        title: "Oportunidade clara",
        badge: "Saldo saudável",
        tone: "income",
        description:
          "O período está com boa sobra. Este é um momento favorável para reforçar metas, antecipar despesas previsíveis ou criar uma reserva para os próximos meses.",
      });
    }
  }

  if (topExpenseCategory && totalExpense > 0) {
    const [categoryName, categoryValue] = topExpenseCategory;
    const share = Math.round((categoryValue / totalExpense) * 100);

    if (share >= 35) {
      recommendations.push({
        key: "prescriptive-top-category",
        title: "Categoria que pede atenção",
        badge: categoryName,
        tone: "expense",
        description: `${categoryName} já representa ${share}% das despesas deste recorte. Vale criar ou revisar uma meta específica para essa categoria antes que ela dite o resultado do mês sozinha.`,
      });
    }
  }

  if (recurringExpenses.length > 0 || recurringIncomes.length > 0) {
    const recurringNet = recurringIncomeTotal - recurringExpenseTotal;

    if (recurringNet < 0) {
      recommendations.push({
        key: "prescriptive-recurring-negative",
        title: "Estrutura fixa pressionada",
        badge: "Recorrência",
        tone: "expense",
        description:
          "As saídas recorrentes já superam as entradas recorrentes. A melhor alavanca aqui é renegociar compromissos fixos ou aumentar uma entrada previsível antes de ampliar novos gastos.",
      });
    }
  }

  if (recommendations.length === 0 && totalIncome + totalExpense > 0) {
    recommendations.push({
      key: "prescriptive-default",
      title: "Próximo passo sugerido",
      badge: "Organização",
      tone: "neutral",
      description:
        "Seu cenário está relativamente equilibrado. O próximo ganho prático costuma vir de manter recorrências em dia e revisar o comparativo entre meses para identificar mudanças cedo.",
    });
  }

  return recommendations.slice(0, 3);
}

export default function Dashboard() {
  const { isLoading, transactions } = useTransactions();
  const [period, setPeriod] = useState("current-month");
  const [comparisonRange, setComparisonRange] = useState(3);
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

  const recurringTransactionsCount = useMemo(
    () => transactions.filter((transaction) => transaction.isRecurring).length,
    [transactions]
  );

  const automaticInsights = useMemo(
    () => getAutomaticInsights(filteredTransactions),
    [filteredTransactions]
  );

  const prescriptiveInsights = useMemo(
    () => getPrescriptiveInsights(filteredTransactions),
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
      categoryLeaders: getCategoryLeaders(currentTransactions, previousTransactions),
    };
  }, [transactions, comparisonRange, selectedComparisonRangeLabel]);

  async function handleOnboardingChoice(onboardingOptIn) {
    setIsApplyingOnboarding(true);

    try {
      const updatedUser = await updateOnboardingPreferenceRequest(onboardingOptIn);
      setUser(updatedUser);
    } finally {
      setIsApplyingOnboarding(false);
    }
  }

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

          {automaticInsights.length > 0 || prescriptiveInsights.length > 0 ? (
            <div className="finova-card p-4 mb-4">
              <div className="mb-3">
                <h2 className="finova-title h5 mb-1">Insights automáticos</h2>
                <p className="finova-subtitle mb-0">
                  Leitura rápida do período selecionado com padrões e próximos movimentos sugeridos.
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
            </div>
          ) : null}

          <div className="finova-card p-4 mb-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-3">
              <div>
                <h2 className="finova-title h5 mb-1">Comparativo entre meses</h2>
                <p className="finova-subtitle mb-0">
                  Compare a janela atual com a imediatamente anterior para identificar mudanças
                  mais rápido.
                </p>
              </div>

              <div style={{ minWidth: 180 }}>
                <label className="form-label text-dark fw-medium">Janela de comparação</label>
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

            <div className="row g-3 mb-3">
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

            <div className="row g-3">
              <CategoryInsightCard
                title="Categoria que mais pesou"
                category={monthComparison.categoryLeaders.biggestIncrease.category}
                value={monthComparison.categoryLeaders.biggestIncrease.value}
                tone="up"
              />
              <CategoryInsightCard
                title="Categoria que mais aliviou"
                category={monthComparison.categoryLeaders.biggestDrop.category}
                value={monthComparison.categoryLeaders.biggestDrop.value}
                tone="down"
              />
            </div>
          </div>

          <BudgetGoalsSection transactions={transactions} />

          {filteredTransactions.length === 0 ? (
            <div className="finova-card p-4">
              <h2 className="finova-subtitle h5 mb-2">
                Nenhum dado financeiro para o período selecionado
              </h2>
              <p className="finova-subtitle mb-0">
                Ajuste o período ou adicione novas transações para acompanhar o seu desempenho.
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

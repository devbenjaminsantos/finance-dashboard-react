import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CategoryInsightCard,
  ComparisonCard,
  InsightCard,
  SummaryCard,
} from "../features/dashboard/DashboardCards";
import {
  COMPARISON_RANGE_OPTIONS,
  currentMonthISO,
  getAutomaticInsights,
  getCategoryLeaders,
  getMonthsForPeriod,
  getPrescriptiveInsights,
  getRelativeMonthsISO,
  PERIOD_OPTIONS,
  summarizeTransactions,
} from "../features/dashboard/dashboardAnalytics";
import {
  formatActionLabel,
  formatAuditDate,
  getActionToneClass,
  VISIBLE_AUDIT_ACTIONS,
} from "../features/history/auditLogPresentation";
import { useTransactions } from "../features/transactions/useTransactions";
import {
  getStoredUser,
  updateOnboardingPreferenceRequest,
} from "../lib/api/auth";
import { getAuditLogs } from "../lib/api/auditLogs";
import { getBudgetGoals } from "../lib/api/budgetGoals";
import { formatBRLFromCents } from "../lib/format/currency";
import {
  DEFAULT_HOME_WIDGETS,
  HOME_WIDGET_OPTIONS,
  loadHomeWidgets,
  saveHomeWidgets,
} from "../lib/home/homePreferences";
import { useI18n } from "../i18n/LanguageProvider";

function DemoInfoCard() {
  return (
    <div className="finova-card p-4 finova-demo-panel">
      <h2 className="finova-title h5 mb-2">Conta de demonstracao</h2>
      <p className="finova-subtitle mb-0">
        Voce esta explorando um ambiente com dados ficticios. Use esta Home como vitrine dos
        blocos que mais importam para voce e aprofunde a analise nas paginas dedicadas.
      </p>
    </div>
  );
}

function OnboardingPromptCard({ isSaving, onChoose }) {
  return (
    <div className="finova-card p-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
        <div>
          <h2 className="finova-title h5 mb-2">Quer ajuda para configurar seu Finova?</h2>
          <p className="finova-subtitle mb-0">
            Posso te orientar pelos primeiros passos para deixar sua Home util desde os primeiros
            acessos.
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
            Agora nao
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
      label: "Registrar a primeira transacao",
      description: "Adicione pelo menos uma receita ou despesa para alimentar o painel inicial.",
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
      label: "Automatizar um lancamento recorrente",
      description: "Cadastre salario, aluguel, condominio ou assinaturas como recorrentes.",
      done: recurringCount > 0,
    },
  ];

  const completedCount = items.filter((item) => item.done).length;

  if (!isVisible && isCompleted) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="finova-card p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="finova-title h6 mb-1">Guia inicial oculto</h2>
            <p className="finova-subtitle mb-0">
              Se voce quiser, o checklist pode voltar para a Home a qualquer momento.
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
    <div className="finova-card p-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3 mb-4">
        <div>
          <h2 className="finova-title h5 mb-2">Guia inicial</h2>
          <p className="finova-subtitle mb-0">
            {completedCount === items.length
              ? "Tudo pronto. Sua base inicial ja esta montada."
              : "Siga estes passos para transformar a Home em um ponto de apoio real no dia a dia."}
          </p>
        </div>

        <div className="finova-actions-row">
          <span className="finova-badge-primary">
            {completedCount}/{items.length} concluidos
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

function HomeWidgetCard({ title, description, children }) {
  return (
    <div className="finova-card p-4 h-100">
      <div className="mb-3">
        <h2 className="finova-title h5 mb-1">{title}</h2>
        {description ? <p className="finova-subtitle mb-0">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function ShortcutTile({ title, description, to }) {
  return (
    <div className="col-12 col-md-6 col-xl-3">
      <Link to={to} className="finova-home-shortcut text-decoration-none">
        <div className="finova-card-soft h-100 p-3">
          <div className="finova-title h6 mb-2">{title}</div>
          <p className="finova-subtitle mb-0">{description}</p>
        </div>
      </Link>
    </div>
  );
}

function HomeCustomizationCard({ widgets, onToggle, onReset }) {
  return (
    <div className="finova-card p-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3">
        <div>
          <h2 className="finova-title h5 mb-1">Personalize sua Home</h2>
          <p className="finova-subtitle mb-0">
            Escolha os blocos que merecem ficar logo de entrada. O restante continua nas paginas
            dedicadas.
          </p>
        </div>

        <button type="button" className="btn finova-btn-light" onClick={onReset}>
          Restaurar padrao
        </button>
      </div>

      <div className="row g-2">
        {HOME_WIDGET_OPTIONS.map((option) => (
          <div className="col-12 col-md-6 col-xl-4" key={option.key}>
            <label className="finova-widget-toggle">
              <input
                type="checkbox"
                checked={widgets[option.key]}
                onChange={() => onToggle(option.key)}
              />
              <span>{option.label}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsPreview({ goalsCount, goalsRiskCount }) {
  return (
    <HomeWidgetCard
      title="Metas do mes"
      description="Um resumo rapido para saber se o planejamento ja esta armado."
    >
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <div className="finova-card-soft p-3 h-100">
            <div className="finova-subtitle small mb-1">Metas configuradas</div>
            <div className="finova-title h4 mb-1">{goalsCount}</div>
            <div className="finova-subtitle small mb-0">
              Entre meta geral e limites por categoria.
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="finova-card-soft p-3 h-100">
            <div className="finova-subtitle small mb-1">Metas em atencao</div>
            <div className="finova-title h4 mb-1">{goalsRiskCount}</div>
            <div className="finova-subtitle small mb-0">
              Metas no limite ou ja ultrapassadas no mes atual.
            </div>
          </div>
        </div>
      </div>

      <Link to="/metas" className="btn finova-btn-light">
        Abrir metas
      </Link>
    </HomeWidgetCard>
  );
}

function HistoryPreview({ logs, isLoading }) {
  return (
    <HomeWidgetCard
      title="Historico recente"
      description="As ultimas acoes mais relevantes da sua conta, sem a parte tecnica."
    >
      {isLoading ? (
        <p className="finova-subtitle mb-0">Carregando historico...</p>
      ) : logs.length === 0 ? (
        <p className="finova-subtitle mb-0">
          Assim que voce usar o sistema, as principais acoes aparecem aqui.
        </p>
      ) : (
        <div className="d-grid gap-2">
          {logs.map((log) => (
            <div key={log.id} className="finova-card-soft p-3">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <span className={getActionToneClass(log.action)}>
                  {formatActionLabel(log.action)}
                </span>
                <span className="finova-subtitle small">{formatAuditDate(log.createdAtUtc)}</span>
              </div>
              <div className="fw-medium small">{log.summary}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        <Link to="/historico" className="btn finova-btn-light">
          Ver historico completo
        </Link>
      </div>
    </HomeWidgetCard>
  );
}

export default function Home() {
  const { t } = useI18n();
  const { isLoading, transactions } = useTransactions();
  const [user, setUser] = useState(() => getStoredUser());
  const [period, setPeriod] = useState("current-month");
  const [widgets, setWidgets] = useState(() => loadHomeWidgets(getStoredUser()));
  const [isApplyingOnboarding, setIsApplyingOnboarding] = useState(false);
  const [goals, setGoals] = useState([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    function handleSessionChange() {
      const nextUser = getStoredUser();
      setUser(nextUser);
      setWidgets(loadHomeWidgets(nextUser));
      setIsLoadingGoals(true);
      setIsLoadingHistory(true);
    }

    function handleBudgetGoalsChange() {
      setIsLoadingGoals(true);
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

    async function loadGoals() {
      if (!user || user.isDemo) {
        if (active) {
          setGoals([]);
          setIsLoadingGoals(false);
        }
        return;
      }

      try {
        const data = await getBudgetGoals(currentMonthISO());
        if (active) {
          setGoals(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setGoals([]);
        }
      } finally {
        if (active) {
          setIsLoadingGoals(false);
        }
      }
    }

    loadGoals();

    return () => {
      active = false;
    };
  }, [user, isLoadingGoals]);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (!user) {
        if (active) {
          setHistoryLogs([]);
          setIsLoadingHistory(false);
        }
        return;
      }

      try {
        const data = await getAuditLogs(10);
        if (active) {
          const visible = (Array.isArray(data) ? data : [])
            .filter((log) => VISIBLE_AUDIT_ACTIONS.has(log.action))
            .slice(0, 4);
          setHistoryLogs(visible);
        }
      } catch {
        if (active) {
          setHistoryLogs([]);
        }
      } finally {
        if (active) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [user]);

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

  const goalsCount = goals.length;

  const goalsRiskCount = useMemo(() => {
    const currentMonthTransactions = transactions.filter(
      (transaction) =>
        transaction.type === "expense" &&
        (transaction.date || "").slice(0, 7) === currentMonthISO()
    );

    return goals.filter((goal) => {
      const spent = currentMonthTransactions
        .filter((transaction) =>
          goal.category ? transaction.category === goal.category : true
        )
        .reduce((sum, transaction) => sum + (Number(transaction.amountCents) || 0), 0);

      return spent >= goal.amountCents;
    }).length;
  }, [goals, transactions]);

  const onboardingCompleted = useMemo(
    () => transactions.length > 0 && recurringTransactionsCount > 0 && goalsCount > 0,
    [transactions.length, recurringTransactionsCount, goalsCount]
  );

  const selectedPeriodLabel = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Mes atual",
    [period]
  );

  const automaticInsights = useMemo(
    () => getAutomaticInsights(filteredTransactions).slice(0, 2),
    [filteredTransactions]
  );

  const prescriptiveInsights = useMemo(
    () => getPrescriptiveInsights(filteredTransactions).slice(0, 1),
    [filteredTransactions]
  );

  const comparison = useMemo(() => {
    const range = COMPARISON_RANGE_OPTIONS[0].value;
    const currentMonths = getRelativeMonthsISO(0, range);
    const previousMonths = getRelativeMonthsISO(range, range);
    const currentSet = new Set(currentMonths);
    const previousSet = new Set(previousMonths);

    const currentTransactions = transactions.filter((transaction) =>
      currentSet.has((transaction.date || "").slice(0, 7))
    );
    const previousTransactions = transactions.filter((transaction) =>
      previousSet.has((transaction.date || "").slice(0, 7))
    );

    return {
      current: summarizeTransactions(currentTransactions),
      previous: summarizeTransactions(previousTransactions),
      categoryLeaders: getCategoryLeaders(currentTransactions, previousTransactions),
      currentRangeLabel: "Mes atual",
      previousRangeLabel: "Mes anterior",
    };
  }, [transactions]);

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

  function handleToggleWidget(widgetKey) {
    const nextWidgets = saveHomeWidgets(user, {
      ...widgets,
      [widgetKey]: !widgets[widgetKey],
    });
    setWidgets(nextWidgets);
  }

  function handleResetWidgets() {
    const nextWidgets = saveHomeWidgets(user, DEFAULT_HOME_WIDGETS);
    setWidgets(nextWidgets);
  }

  const visibleWidgetCount = Object.values(widgets).filter(Boolean).length;

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("pages.homeTitle")}</h1>
          <p className="finova-subtitle mb-0">{t("pages.homeSubtitle")}</p>
        </div>

        <div className="finova-page-header-side">
          <label className="form-label text-dark fw-medium">{t("pages.homePeriod")}</label>
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

      <div className="d-grid gap-4">
        <HomeCustomizationCard
          widgets={widgets}
          onToggle={handleToggleWidget}
          onReset={handleResetWidgets}
        />

        {visibleWidgetCount === 0 ? (
          <div className="finova-card p-4 text-center">
            <h2 className="finova-title h5 mb-2">Sua Home esta vazia</h2>
            <p className="finova-subtitle mb-3">
              Reative pelo menos um bloco para transformar esta pagina em um ponto de apoio util.
            </p>
            <button type="button" className="btn finova-btn-primary" onClick={handleResetWidgets}>
              Restaurar blocos padrao
            </button>
          </div>
        ) : null}

        {widgets.context ? (
          user?.isDemo ? (
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
              isVisible={Boolean(user?.onboardingOptIn)}
              isCompleted={onboardingCompleted}
            />
          )
        ) : null}

        {widgets.summary ? (
          <div className="finova-card p-4">
            <div className="mb-3">
              <h2 className="finova-title h5 mb-1">Resumo financeiro</h2>
              <p className="finova-subtitle mb-0">
                Uma leitura rapida do recorte {selectedPeriodLabel.toLowerCase()}.
              </p>
            </div>

            {isLoading ? (
              <p className="finova-subtitle mb-0">Carregando resumo...</p>
            ) : (
              <div className="row g-3">
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
            )}
          </div>
        ) : null}

        {widgets.shortcuts ? (
          <HomeWidgetCard
            title="Atalhos principais"
            description="Cada area ganhou uma pagina propria. Deixe aqui os caminhos que voce mais usa."
          >
            <div className="row g-3">
              <ShortcutTile
                title="Graficos"
                description="Acompanhe graficos e resumo geral do periodo."
                to="/graficos"
              />
              <ShortcutTile
                title="Insights"
                description="Leia sinais automaticos e recomendacoes do periodo."
                to="/insights"
              />
              <ShortcutTile
                title="Comparativos"
                description="Veja como os ultimos recortes se comportaram."
                to="/comparativos"
              />
              <ShortcutTile
                title="Metas"
                description="Organize limites gerais e por categoria."
                to="/metas"
              />
            </div>
          </HomeWidgetCard>
        ) : null}

        <div className="row g-4">
          {widgets.insights ? (
            <div className="col-12 col-xxl-6">
              <HomeWidgetCard
                title="Insights em destaque"
                description="Um recorte rapido do que mais chama atencao agora."
              >
                {isLoading ? (
                  <p className="finova-subtitle mb-0">Carregando insights...</p>
                ) : automaticInsights.length === 0 && prescriptiveInsights.length === 0 ? (
                  <p className="finova-subtitle mb-0">
                    Adicione mais movimentacoes para ativar os insights da Home.
                  </p>
                ) : (
                  <>
                    <div className="row g-3">
                      {[...automaticInsights, ...prescriptiveInsights].map((insight) => (
                        <InsightCard
                          key={insight.key}
                          title={insight.title}
                          description={insight.description}
                          badge={insight.badge}
                          tone={insight.tone}
                        />
                      ))}
                    </div>

                    <div className="mt-3">
                      <Link to="/insights" className="btn finova-btn-light">
                        Abrir insights completos
                      </Link>
                    </div>
                  </>
                )}
              </HomeWidgetCard>
            </div>
          ) : null}

          {widgets.comparisons ? (
            <div className="col-12 col-xxl-6">
              <HomeWidgetCard
                title="Comparativo rapido"
                description="Um resumo do mes atual contra o mes anterior."
              >
                {isLoading ? (
                  <p className="finova-subtitle mb-0">Carregando comparativo...</p>
                ) : (
                  <>
                    <div className="row g-3 mb-3">
                      <ComparisonCard
                        label="Receitas"
                        currentValue={comparison.current.income}
                        previousValue={comparison.previous.income}
                        currentRangeLabel={comparison.currentRangeLabel}
                        previousRangeLabel={comparison.previousRangeLabel}
                      />
                      <ComparisonCard
                        label="Despesas"
                        currentValue={comparison.current.expense}
                        previousValue={comparison.previous.expense}
                        currentRangeLabel={comparison.currentRangeLabel}
                        previousRangeLabel={comparison.previousRangeLabel}
                      />
                      <ComparisonCard
                        label="Saldo"
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

                    <div className="mt-3">
                      <Link to="/comparativos" className="btn finova-btn-light">
                        Abrir comparativos completos
                      </Link>
                    </div>
                  </>
                )}
              </HomeWidgetCard>
            </div>
          ) : null}
        </div>

        <div className="row g-4">
          {widgets.goals ? (
            <div className="col-12 col-xl-6">
              <GoalsPreview
                goalsCount={isLoadingGoals ? "-" : goalsCount}
                goalsRiskCount={isLoadingGoals ? "-" : goalsRiskCount}
              />
            </div>
          ) : null}

          {widgets.history ? (
            <div className="col-12 col-xl-6">
              <HistoryPreview logs={historyLogs} isLoading={isLoadingHistory} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

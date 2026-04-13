import { useEffect, useMemo, useState } from "react";
import {
  createBudgetGoal,
  deleteBudgetGoal,
  getBudgetGoals,
  updateBudgetGoal,
} from "../../lib/api/budgetGoals";
import { EXPENSE_TRANSACTION_CATEGORIES } from "../../lib/constants/transactionCategories";
import { formatBRLFromCents, parseMoneyToCents } from "../../lib/format/currency";

function dispatchBudgetGoalsChange() {
  window.dispatchEvent(new Event("finova-budget-goals-change"));
}

function currentMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month, delta) {
  const [year, rawMonth] = month.split("-").map(Number);
  const date = new Date(year, rawMonth - 1, 1);
  date.setMonth(date.getMonth() + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month) {
  const [year, rawMonth] = month.split("-");
  const date = new Date(Number(year), Number(rawMonth) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function centsToInput(value) {
  if (!Number.isFinite(Number(value))) {
    return "";
  }

  return (Number(value) / 100).toFixed(2).replace(".", ",");
}

function normalizeCategory(value) {
  return value === "__overall__" ? "" : value;
}

function sortGoals(left, right) {
  if (!left.category && right.category) {
    return -1;
  }

  if (left.category && !right.category) {
    return 1;
  }

  return (left.category || "").localeCompare(right.category || "", "pt-BR");
}

function getGoalTone(progress) {
  if (progress >= 1) {
    return "danger";
  }

  if (progress >= 0.8) {
    return "warning";
  }

  return "safe";
}

function getGoalStatus(progress) {
  if (progress >= 1) {
    return "Meta ultrapassada";
  }

  if (progress >= 0.8) {
    return "Atenção ao limite";
  }

  return "Dentro do planejado";
}

function GoalCard({ goal, spentCents, onEdit, onDelete, isDeleting }) {
  const progress = goal.amountCents > 0 ? spentCents / goal.amountCents : 0;
  const tone = getGoalTone(progress);
  const percent = Math.round(progress * 100);
  const remaining = goal.amountCents - spentCents;

  return (
    <div className="finova-card-soft p-3 h-100">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <div className="finova-title h6 mb-1">
            {goal.category || "Orçamento geral"}
          </div>
          <div className={`finova-goal-pill finova-goal-pill-${tone}`}>
            {getGoalStatus(progress)}
          </div>
        </div>

        <div className="finova-actions-row finova-actions-row-end">
          <button
            type="button"
            className="btn btn-sm finova-btn-light"
            onClick={() => onEdit(goal)}
          >
            Editar
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => onDelete(goal.id)}
            disabled={isDeleting}
          >
            {isDeleting ? "Removendo..." : "Excluir"}
          </button>
        </div>
      </div>

      <div className="d-flex justify-content-between small mb-2">
        <span className="finova-subtitle">Gasto atual</span>
        <strong>{formatBRLFromCents(spentCents)}</strong>
      </div>
      <div className="d-flex justify-content-between small mb-2">
        <span className="finova-subtitle">Meta</span>
        <strong>{formatBRLFromCents(goal.amountCents)}</strong>
      </div>
      <div className="d-flex justify-content-between small mb-3">
        <span className="finova-subtitle">
          {remaining >= 0 ? "Saldo disponível" : "Excedente"}
        </span>
        <strong className={remaining >= 0 ? "" : "text-danger"}>
          {formatBRLFromCents(Math.abs(remaining))}
        </strong>
      </div>

      <div className="finova-goal-progress mb-2">
        <div
          className={`finova-goal-progress-bar finova-goal-progress-bar-${tone}`}
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>

      <div className="small finova-subtitle">
        {percent}% da meta consumida neste mês.
      </div>
    </div>
  );
}

function GoalSummaryStat({ label, value, helper }) {
  return (
    <div className="finova-card-soft p-3 h-100">
      <div className="finova-subtitle small mb-1">{label}</div>
      <div className="finova-title h5 mb-1">{value}</div>
      <div className="finova-subtitle small mb-0">{helper}</div>
    </div>
  );
}

export default function BudgetGoalsSection({ transactions }) {
  const [month, setMonth] = useState(currentMonthISO);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [category, setCategory] = useState("__overall__");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const availableCategories = useMemo(() => {
    const categorySet = new Set(EXPENSE_TRANSACTION_CATEGORIES);

    for (const transaction of transactions) {
      if (transaction.type === "expense" && transaction.category) {
        categorySet.add(transaction.category);
      }
    }

    return Array.from(categorySet).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [transactions]);

  const monthlyExpenses = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.type === "expense" &&
          (transaction.date || "").slice(0, 7) === month
      ),
    [transactions, month]
  );

  const spentByCategory = useMemo(() => {
    const totals = new Map();

    for (const transaction of monthlyExpenses) {
      const key = transaction.category || "Outros";
      totals.set(key, (totals.get(key) || 0) + (Number(transaction.amountCents) || 0));
    }

    return totals;
  }, [monthlyExpenses]);

  const totalSpent = useMemo(
    () =>
      monthlyExpenses.reduce(
        (sum, item) => sum + (Number(item.amountCents) || 0),
        0
      ),
    [monthlyExpenses]
  );

  const overallGoal = useMemo(
    () => goals.find((goal) => !goal.category) || null,
    [goals]
  );

  const categoryGoals = useMemo(
    () => goals.filter((goal) => goal.category),
    [goals]
  );

  const categoryGoalSet = useMemo(
    () => new Set(categoryGoals.map((goal) => goal.category)),
    [categoryGoals]
  );

  const categoriesWithExpenses = useMemo(
    () =>
      Array.from(spentByCategory.entries())
        .filter(([, value]) => value > 0)
        .map(([goalCategory]) => goalCategory)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [spentByCategory]
  );

  const uncoveredCategorySuggestions = useMemo(
    () =>
      Array.from(spentByCategory.entries())
        .filter(([goalCategory, value]) => value > 0 && !categoryGoalSet.has(goalCategory))
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([goalCategory, spentCents]) => ({ category: goalCategory, spentCents })),
    [spentByCategory, categoryGoalSet]
  );

  const categoriesOverLimitCount = useMemo(
    () =>
      categoryGoals.filter((goal) => (spentByCategory.get(goal.category) || 0) >= goal.amountCents)
        .length,
    [categoryGoals, spentByCategory]
  );

  useEffect(() => {
    let active = true;

    async function loadGoals() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getBudgetGoals(month);

        if (active) {
          setGoals(Array.isArray(data) ? [...data].sort(sortGoals) : []);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Não foi possível carregar as metas do mês.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadGoals();

    return () => {
      active = false;
    };
  }, [month]);

  function resetForm() {
    setEditingGoalId(null);
    setCategory("__overall__");
    setAmount("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFeedback("");

    const amountCents = parseMoneyToCents(amount);

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Informe um valor de meta válido.");
      return;
    }

    const payload = {
      month,
      category: normalizeCategory(category) || null,
      amountCents,
    };

    setIsSaving(true);

    try {
      if (editingGoalId) {
        const updated = await updateBudgetGoal(editingGoalId, payload);
        setGoals((current) =>
          current
            .map((goal) => (goal.id === editingGoalId ? updated : goal))
            .sort(sortGoals)
        );
        setFeedback("Meta atualizada com sucesso.");
      } else {
        const created = await createBudgetGoal(payload);
        setGoals((current) => [...current, created].sort(sortGoals));
        setFeedback("Meta adicionada com sucesso.");
      }

      dispatchBudgetGoalsChange();
      resetForm();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível salvar a meta.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(goal) {
    setEditingGoalId(goal.id);
    setCategory(goal.category || "__overall__");
    setAmount(centsToInput(goal.amountCents));
    setError("");
    setFeedback("");
  }

  function handleCancelEdit() {
    resetForm();
    setError("");
    setFeedback("");
  }

  async function handleDelete(id) {
    if (!window.confirm("Remover esta meta mensal?")) {
      return;
    }

    setDeletingId(id);
    setError("");
    setFeedback("");

    try {
      await deleteBudgetGoal(id);
      setGoals((current) => current.filter((goal) => goal.id !== id));
      dispatchBudgetGoalsChange();

      if (editingGoalId === id) {
        handleCancelEdit();
      }

      setFeedback("Meta removida com sucesso.");
    } catch (requestError) {
      setError(requestError.message || "Não foi possível remover a meta.");
    } finally {
      setDeletingId(null);
    }
  }

  function handlePickSuggestedCategory(nextCategory) {
    setCategory(nextCategory);
    setEditingGoalId(null);
    setError("");
    setFeedback("");
  }

  const monthLabel = formatMonthLabel(month);
  const currentMonth = currentMonthISO();
  const isCurrentMonth = month === currentMonth;

  return (
    <div className="finova-card p-4 mb-4">
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-end gap-3 mb-4">
        <div>
          <h2 className="finova-title h4 mb-1">Metas de orçamento</h2>
          <p className="finova-subtitle mb-0">
            Trabalhe o orçamento geral e, quando fizer sentido, distribua limites por categoria
            para acompanhar onde o mês realmente está apertando.
          </p>
        </div>

        <div className="finova-actions-row align-items-center">
          <button
            type="button"
            className="btn finova-btn-light"
            onClick={() => setMonth((currentValue) => shiftMonth(currentValue, -1))}
          >
            Mês anterior
          </button>
          <div className="finova-goal-summary text-center">
            <span className="finova-subtitle small d-block">Mês em foco</span>
            <strong className="text-capitalize">{monthLabel}</strong>
          </div>
          <button
            type="button"
            className="btn finova-btn-light"
            onClick={() => setMonth((currentValue) => shiftMonth(currentValue, 1))}
          >
            Próximo mês
          </button>
          {!isCurrentMonth ? (
            <button
              type="button"
              className="btn finova-btn-light"
              onClick={() => setMonth(currentMonth)}
            >
              Voltar ao mês atual
            </button>
          ) : null}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <GoalSummaryStat
            label="Despesas no mês"
            value={formatBRLFromCents(totalSpent)}
            helper="Base usada para medir o avanço das metas."
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <GoalSummaryStat
            label="Categorias com meta"
            value={String(categoryGoals.length)}
            helper="Categorias com limite específico configurado."
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <GoalSummaryStat
            label="Categorias sem meta"
            value={String(Math.max(categoriesWithExpenses.length - categoryGoals.length, 0))}
            helper="Categorias com gasto no mês e ainda sem limite próprio."
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <GoalSummaryStat
            label="Metas em risco"
            value={String(categoriesOverLimitCount)}
            helper="Categorias já estouradas ou no limite do valor definido."
          />
        </div>
      </div>

      {uncoveredCategorySuggestions.length > 0 ? (
        <div className="finova-card-soft p-3 mb-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h3 className="finova-title h6 mb-1">Categorias que merecem meta própria</h3>
              <p className="finova-subtitle mb-0">
                Estas categorias já estão pesando em {monthLabel} e ainda não têm meta
                específica.
              </p>
            </div>

            <div className="finova-suggestion-list">
              {uncoveredCategorySuggestions.map((item) => (
                <button
                  key={item.category}
                  type="button"
                  className="btn finova-goal-suggestion"
                  onClick={() => handlePickSuggestedCategory(item.category)}
                >
                  <span>{item.category}</span>
                  <strong>{formatBRLFromCents(item.spentCents)}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <form className="row g-3 mb-4" onSubmit={handleSubmit}>
        <div className="col-12 col-lg-5">
          <label className="form-label text-dark fw-medium" htmlFor="budget-goal-category">
            Categoria
          </label>
          <select
            id="budget-goal-category"
            className="form-select finova-select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={isSaving}
          >
            <option value="__overall__">Orçamento geral do mês</option>
            {availableCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-lg-4">
          <label className="form-label text-dark fw-medium" htmlFor="budget-goal-amount">
            Valor da meta
          </label>
          <input
            id="budget-goal-amount"
            type="text"
            className="form-control finova-input"
            placeholder="Ex: 1500,00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            disabled={isSaving}
          />
        </div>

        <div className="col-12 col-lg-3 d-flex align-items-end gap-2">
          <button
            type="submit"
            className="btn finova-btn-primary flex-grow-1"
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : editingGoalId ? "Salvar meta" : "Adicionar meta"}
          </button>

          {editingGoalId ? (
            <button
              type="button"
              className="btn finova-btn-light"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {feedback ? <div className="alert alert-success py-2">{feedback}</div> : null}

      {isLoading ? (
        <div className="finova-subtitle">Carregando metas do mês...</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
              <div>
                <h3 className="finova-title h5 mb-1">Visão geral do mês</h3>
                <p className="finova-subtitle mb-0">
                  A meta geral ajuda a entender se o conjunto das despesas está no ritmo esperado.
                </p>
              </div>
            </div>

            {overallGoal ? (
              <GoalCard
                goal={overallGoal}
                spentCents={totalSpent}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deletingId === overallGoal.id}
              />
            ) : (
              <div className="finova-card-soft p-4">
                <h4 className="finova-title h6 mb-2">Ainda não há meta geral para {monthLabel}</h4>
                <p className="finova-subtitle mb-0">
                  Se quiser uma leitura mais ampla do mês, comece criando um orçamento geral antes
                  de detalhar as categorias.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
              <div>
                <h3 className="finova-title h5 mb-1">Metas por categoria</h3>
                <p className="finova-subtitle mb-0">
                  Aqui é onde a análise fica mais precisa: cada categoria mostra o quanto já
                  consumiu e quanto ainda resta.
                </p>
              </div>
              <span className="finova-badge-primary">
                {categoryGoals.length} configurada{categoryGoals.length === 1 ? "" : "s"}
              </span>
            </div>

            {categoryGoals.length === 0 ? (
              <div className="finova-card-soft p-4">
                <h4 className="finova-title h6 mb-2">Nenhuma meta por categoria neste mês</h4>
                <p className="finova-subtitle mb-0">
                  Crie metas para as categorias mais relevantes e acompanhe onde o orçamento aperta
                  com mais clareza.
                </p>
              </div>
            ) : (
              <div className="row g-3">
                {categoryGoals.map((goal) => (
                  <div className="col-12 col-xl-6" key={goal.id}>
                    <GoalCard
                      goal={goal}
                      spentCents={spentByCategory.get(goal.category) || 0}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isDeleting={deletingId === goal.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  createBudgetGoal,
  deleteBudgetGoal,
  getBudgetGoals,
  updateBudgetGoal,
} from "../../lib/api/budgetGoals";
import { EXPENSE_TRANSACTION_CATEGORIES } from "../../lib/constants/transactionCategories";
import { formatBRLFromCents, parseMoneyToCents } from "../../lib/format/currency";

function currentMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

function getGoalTone(progress) {
  // Esse mapeamento controla o estado visual da meta no card
  // e me ajuda a deixar o status entendível sem depender só do texto.
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

        <div className="d-flex gap-2">
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

export default function BudgetGoalsSection({ transactions }) {
  const month = currentMonthISO();
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
    // Metas foram pensadas apenas para despesas.
    // Mesmo assim eu junto categorias vindas do banco para suportar histórico antigo
    // ou categorias personalizadas que não estejam na lista base.
    const categorySet = new Set(EXPENSE_TRANSACTION_CATEGORIES);

    for (const transaction of transactions) {
      if (transaction.category) {
        categorySet.add(transaction.category);
      }
    }

    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const currentMonthExpenses = useMemo(
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

    for (const transaction of currentMonthExpenses) {
      const key = transaction.category || "Outros";
      totals.set(key, (totals.get(key) || 0) + (Number(transaction.amountCents) || 0));
    }

    return totals;
  }, [currentMonthExpenses]);

  const totalSpent = useMemo(
    () => currentMonthExpenses.reduce((sum, item) => sum + (Number(item.amountCents) || 0), 0),
    [currentMonthExpenses]
  );

  useEffect(() => {
    let active = true;

    async function loadGoals() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getBudgetGoals(month);

        if (active) {
          setGoals(data);
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

    // Categoria null representa a meta geral do mês.
    // Com categoria preenchida, a meta vale só para aquele grupo.
    setIsSaving(true);

    try {
      if (editingGoalId) {
        const updated = await updateBudgetGoal(editingGoalId, payload);
        setGoals((current) =>
          current.map((goal) => (goal.id === editingGoalId ? updated : goal))
        );
        setFeedback("Meta atualizada com sucesso.");
      } else {
        const created = await createBudgetGoal(payload);
        setGoals((current) =>
          [...current, created].sort((a, b) =>
            (a.category || "").localeCompare(b.category || "")
          )
        );
        setFeedback("Meta adicionada com sucesso.");
      }

      setEditingGoalId(null);
      setCategory("__overall__");
      setAmount("");
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
    setEditingGoalId(null);
    setCategory("__overall__");
    setAmount("");
    setError("");
    setFeedback("");
  }

  async function handleDelete(id) {
    // A exclusão impacta o dashboard na hora.
    // Deixo a confirmação para evitar apagar meta por clique acidental.
    if (!window.confirm("Remover esta meta mensal?")) {
      return;
    }

    setDeletingId(id);
    setError("");
    setFeedback("");

    try {
      await deleteBudgetGoal(id);
      setGoals((current) => current.filter((goal) => goal.id !== id));

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

  return (
    <div className="finova-card p-4 mb-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
          <h2 className="finova-title h4 mb-1">Metas de orçamento</h2>
          <p className="finova-subtitle mb-0">
            Defina limites para {formatMonthLabel(month)} e acompanhe os alertas de gasto em tempo real.
          </p>
        </div>

        <div className="finova-goal-summary">
          <span className="finova-subtitle small d-block">Despesas do mês atual</span>
          <strong>{formatBRLFromCents(totalSpent)}</strong>
        </div>
      </div>

      <form className="row g-3 mb-4" onSubmit={handleSubmit}>
        <div className="col-12 col-lg-5">
          <label className="form-label text-dark fw-medium">Categoria</label>
          <select
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
          <label className="form-label text-dark fw-medium">Valor da meta</label>
          <input
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
          <button type="submit" className="btn finova-btn-primary flex-grow-1" disabled={isSaving}>
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
      ) : goals.length === 0 ? (
        <div className="finova-card-soft p-4">
          <h3 className="finova-title h6 mb-2">Nenhuma meta cadastrada para este mês</h3>
          <p className="finova-subtitle mb-0">
            Crie uma meta geral ou por categoria para receber alertas visuais quando os gastos se aproximarem do limite.
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {goals.map((goal) => {
            const spentCents = goal.category
              ? spentByCategory.get(goal.category) || 0
              : totalSpent;

            return (
              <div className="col-12 col-xl-6" key={goal.id}>
                <GoalCard
                  goal={goal}
                  spentCents={spentCents}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={deletingId === goal.id}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

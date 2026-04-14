import { formatBRLFromCents } from "../../lib/format/currency";

export const PERIOD_OPTIONS = [
  { value: "current-month", label: "Mês atual" },
  { value: "last-3-months", label: "Últimos 3 meses" },
  { value: "last-6-months", label: "Últimos 6 meses" },
  { value: "all", label: "Todo o histórico" },
];

export const COMPARISON_RANGE_OPTIONS = [
  { value: 1, label: "1 mês" },
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
];

export function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function lastNMonthsISO(n) {
  const months = [];
  const d = new Date();
  d.setDate(1);

  for (let i = 0; i < n; i += 1) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }

  return months.reverse();
}

export function getRelativeMonthsISO(offset, count) {
  const months = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);

  for (let i = 0; i < count; i += 1) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }

  return months.reverse();
}

export function getMonthsForPeriod(period) {
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

export function summarizeTransactions(transactions) {
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

export function buildExpenseTotalsByCategory(transactions) {
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

export function getCategoryLeaders(currentTransactions, previousTransactions) {
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

export function getAutomaticInsights(transactions) {
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

  const topExpenseCategory = Array.from(buildExpenseTotalsByCategory(transactions).entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

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
    const tone = savingsRate >= 20 ? "income" : savingsRate < 0 ? "expense" : "primary";
    const badge = savingsRate > 0 ? `+${savingsRate}%` : `${savingsRate}%`;

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
    const tone = recurringNet > 0 ? "income" : recurringNet < 0 ? "expense" : "neutral";

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

export function getPrescriptiveInsights(transactions) {
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

  const topExpenseCategory = Array.from(buildExpenseTotalsByCategory(transactions).entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

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

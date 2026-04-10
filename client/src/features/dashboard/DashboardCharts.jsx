import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { formatBRLFromCents } from "../../lib/format/currency";

function currentMonthISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function lastNMonthsISO(n = 6) {
  const out = [];
  const d = new Date();
  d.setDate(1);

  for (let i = 0; i < n; i++) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${yyyy}-${mm}`);
    d.setMonth(d.getMonth() - 1);
  }

  return out.reverse();
}

function monthLabel(yyyyMM) {
  const [y, m] = yyyyMM.split("-");
  return `${m}/${y}`;
}

function cents(n) {
  return Number(n) || 0;
}

function formatAxisValue(value) {
  const amount = Number(value) || 0;
  const brl = amount / 100;

  if (Math.abs(brl) >= 1000) {
    return `R$ ${(brl / 1000).toFixed(1)}k`;
  }

  return `R$ ${brl.toFixed(0)}`;
}

function buildExpenseByCategory(transactions) {
  const map = new Map();

  for (const t of transactions) {
    if (t.type !== "expense") continue;

    const cat = t.category || "Outros";
    map.set(cat, (map.get(cat) || 0) + cents(t.amountCents));
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildIncomeVsExpenseByMonth(transactions, months) {
  const base = new Map(
    months.map((month) => [month, { month, income: 0, expense: 0 }])
  );

  for (const t of transactions) {
    const month = (t.date || "").slice(0, 7);

    if (!base.has(month)) continue;

    if (t.type === "income") {
      base.get(month).income += cents(t.amountCents);
    } else {
      base.get(month).expense += cents(t.amountCents);
    }
  }

  return months.map((month) => base.get(month));
}

export default function DashboardCharts({
  transactions,
  chartMonths,
  periodLabel,
}) {
  const expenseByCategory = useMemo(
    () => buildExpenseByCategory(transactions),
    [transactions]
  );

  const incomeVsExpense = useMemo(
    () => buildIncomeVsExpenseByMonth(transactions, chartMonths),
    [transactions, chartMonths]
  );

  const hasIncomeVsExpenseData = useMemo(
    () => incomeVsExpense.some((item) => item.income > 0 || item.expense > 0),
    [incomeVsExpense]
  );

  const pieColors = [
    "#0d6efd",
    "#198754",
    "#dc3545",
    "#ffc107",
    "#6f42c1",
    "#20c997",
    "#fd7e14",
    "#6c757d",
  ];

  const pieLegend = useMemo(
    () =>
      expenseByCategory.map((item) => ({
        ...item,
        label: `${item.name} - ${formatBRLFromCents(item.value)}`,
      })),
    [expenseByCategory]
  );

  const categoryCaption =
    periodLabel === "Todos os períodos"
      ? "Todas as despesas registradas"
      : periodLabel;

  return (
    <div className="row g-3">
      <div className="col-12 col-lg-5">
        <div className="finova-card h-100">
          <div className="p-4">
            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <h2 className="finova-title h5 mb-0">Despesas por categoria</h2>
              <span className="text-muted small">{categoryCaption}</span>
            </div>

            {expenseByCategory.length === 0 ? (
              <div className="finova-subtitle">
                Sem despesas registradas no período selecionado.
              </div>
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Tooltip formatter={(value) => formatBRLFromCents(value)} />
                    <Pie
                      data={pieLegend}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {expenseByCategory.map((_, idx) => (
                        <Cell
                          key={expenseByCategory[idx].name}
                          fill={pieColors[idx % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-7">
        <div className="finova-card h-100">
          <div className="p-4">
            <h2 className="finova-title h5 mb-2">Receitas vs despesas</h2>
            <p className="finova-subtitle small mb-3">{periodLabel}</p>

            {hasIncomeVsExpenseData ? (
              <>
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={incomeVsExpense} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={monthLabel} />
                      <YAxis tickFormatter={formatAxisValue} width={70} />
                      <Tooltip
                        formatter={(value) => formatBRLFromCents(value)}
                        labelFormatter={monthLabel}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Receitas" fill="#198754" />
                      <Bar dataKey="expense" name="Despesas" fill="#dc3545" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-muted small">
                  Valores em BRL com base nas transações salvas no período selecionado.
                </div>
              </>
            ) : (
              <div className="finova-subtitle">
                Sem movimentações suficientes para exibir o comparativo do período selecionado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

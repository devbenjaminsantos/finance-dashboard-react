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
import { useTransactions } from "../transactions/useTransactions";
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

function buildExpenseByCategory(transactions, month) {
  const map = new Map();

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (month && !(t.date || "").startsWith(month)) continue;

    const cat = t.category || "Outros";
    map.set(cat, (map.get(cat) || 0) + cents(t.amountCents));
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildIncomeVsExpenseByMonth(transactions, months) {
  const base = new Map(months.map((m) => [m, { month: m, income: 0, expense: 0 }]));

  for (const t of transactions) {
    const m = (t.date || "").slice(0, 7);
    if (!base.has(m)) continue;

    if (t.type === "income") base.get(m).income += cents(t.amountCents);
    else base.get(m).expense += cents(t.amountCents);
  }

  return months.map((m) => base.get(m));
}

export default function DashboardCharts() {
  const { transactions } = useTransactions();

  const month = useMemo(() => currentMonthISO(), []);
  const months = useMemo(() => lastNMonthsISO(6), []);

  const expenseByCategory = useMemo(
    () => buildExpenseByCategory(transactions, month),
    [transactions, month]
  );

  const incomeVsExpense = useMemo(
    () => buildIncomeVsExpenseByMonth(transactions, months),
    [transactions, months]
  );

  // paleta simples (sem “fixar cor” do matplotlib — aqui é Recharts, ok)
  const PIE_COLORS = ["#0d6efd", "#198754", "#dc3545", "#ffc107", "#6f42c1", "#20c997", "#fd7e14", "#6c757d"];

  const pieLegend = expenseByCategory.map((x) => ({
    ...x,
    label: `${x.name} — ${formatBRLFromCents(x.value)}`,
  }));

  return (
    <div className="row g-3">
      {/* Pizza */}
      <div className="col-12 col-lg-5">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <h2 className="h6 mb-0">Despesas por categoria</h2>
              <span className="text-muted small">{monthLabel(month)}</span>
            </div>

            {expenseByCategory.length === 0 ? (
              <div className="text-muted">Sem despesas no mês atual.</div>
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Tooltip
                      formatter={(v) => formatBRLFromCents(v)}
                    />
                    <Pie
                      data={pieLegend}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {expenseByCategory.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
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

      {/* Barras */}
      <div className="col-12 col-lg-7">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <h2 className="h6 mb-2">Receitas vs Despesas (últimos 6 meses)</h2>

            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={incomeVsExpense} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={monthLabel} />
                  <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                  <Tooltip formatter={(v) => formatBRLFromCents(v)} labelFormatter={monthLabel} />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#198754" />
                  <Bar dataKey="expense" name="Despesas" fill="#dc3545" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-muted small">
              Valores em BRL (centavos → reais). Baseado nas transações salvas no navegador.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
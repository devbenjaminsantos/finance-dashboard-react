export default function TransactionsFilters({
  q,
  setQ,
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  month,
  setMonth,
  sortBy,
  setSortBy,
  categories,
  onReset,
}) {
  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label">Buscar</label>
            <input
              className="form-control"
              placeholder="Ex: mercado"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Categoria</label>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Mês</label>
            <input
              type="month"
              className="form-control"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Ordenar</label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Data (recente)</option>
              <option value="date_asc">Data (antiga)</option>
              <option value="amount_desc">Valor (maior)</option>
              <option value="amount_asc">Valor (menor)</option>
            </select>
          </div>

          <div className="col-12 d-flex justify-content-end">
            <button className="btn btn-outline-secondary btn-sm" onClick={onReset}>
              Limpar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
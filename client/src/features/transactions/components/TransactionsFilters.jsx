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
    <div className="finova-card p-4 mb-4">
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <label className="form-label text-dark fw-medium">Buscar</label>
          <input
            type="text"
            className="form-control finova-input"
            placeholder="Buscar por descrição..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium">Tipo</label>
          <select
            className="form-select finova-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium">Categoria</label>
          <select
            className="form-select finova-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium">Mês</label>
          <input
            type="month"
            className="form-control finova-input"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium">Ordenar</label>
          <select
            className="form-select finova-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date_desc">Mais recentes</option>
            <option value="date_asc">Mais antigas</option>
            <option value="amount_desc">Maior valor</option>
            <option value="amount_asc">Menor valor</option>
          </select>
        </div>

        <div className="col-12 d-flex justify-content-end">
          <button
            type="button"
            className="btn finova-btn-light"
            onClick={onReset}
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  );
}

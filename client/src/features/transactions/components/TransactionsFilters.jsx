import { useI18n } from "../../../i18n/LanguageProvider";

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
  const { t } = useI18n();

  return (
    <div className="finova-card p-4 mb-4">
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <label className="form-label text-dark fw-medium">{t("common.search")}</label>
          <input
            type="text"
            className="form-control finova-input"
            placeholder={t("transactions.searchPlaceholder")}
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium">{t("common.type")}</label>
          <select
            className="form-select finova-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">{t("transactions.allTypes")}</option>
            <option value="income">{t("transactions.incomePlural")}</option>
            <option value="expense">{t("transactions.expensePlural")}</option>
          </select>
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium">{t("common.category")}</label>
          <select
            className="form-select finova-select"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">{t("transactions.allCategories")}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium">{t("common.month")}</label>
          <input
            type="month"
            className="form-control finova-input"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium">{t("common.sort")}</label>
          <select
            className="form-select finova-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="date_desc">{t("transactions.sortRecent")}</option>
            <option value="date_asc">{t("transactions.sortOldest")}</option>
            <option value="amount_desc">{t("transactions.sortHighest")}</option>
            <option value="amount_asc">{t("transactions.sortLowest")}</option>
          </select>
        </div>

        <div className="col-12">
          <div className="finova-actions-row finova-actions-row-end">
            <button type="button" className="btn finova-btn-light" onClick={onReset}>
              {t("common.clearFilters")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useI18n } from "../../../i18n/LanguageProvider";

export default function TransactionsFilters({
  q,
  setQ,
  accountFilter,
  setAccountFilter,
  tagFilter,
  setTagFilter,
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  month,
  setMonth,
  sortBy,
  setSortBy,
  categories,
  tags,
  accounts,
  onReset,
}) {
  const { t } = useI18n();

  return (
    <div className="finova-card p-4 mb-4 finova-toolbar-surface">
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <label className="form-label text-dark fw-medium" htmlFor="transactions-search">
            {t("common.search")}
          </label>
          <input
            id="transactions-search"
            type="text"
            className="form-control finova-input"
            placeholder={t("transactions.searchPlaceholder")}
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium" htmlFor="transactions-account-filter">
            {t("transactions.accountFilterLabel")}
          </label>
          <select
            id="transactions-account-filter"
            className="form-select finova-select"
            value={accountFilter}
            onChange={(event) => setAccountFilter(event.target.value)}
          >
            <option value="all">{t("pages.allAccountsScope")}</option>
            <option value="unassigned">{t("pages.unassignedScope")}</option>
            {accounts.map((account) => (
              <option key={account.id} value={String(account.id)}>
                {account.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-lg-2">
          <label className="form-label text-dark fw-medium" htmlFor="transactions-type-filter">
            {t("common.type")}
          </label>
          <select
            id="transactions-type-filter"
            className="form-select finova-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">{t("transactions.allTypes")}</option>
            <option value="income">{t("transactions.incomePlural")}</option>
            <option value="expense">{t("transactions.expensePlural")}</option>
          </select>
        </div>

        <div className="col-6 col-lg-1">
          <label className="form-label text-dark fw-medium" htmlFor="transactions-category-filter">
            {t("common.category")}
          </label>
          <select
            id="transactions-category-filter"
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

        <div className="col-6 col-lg-1">
          <label className="form-label text-dark fw-medium" htmlFor="transactions-tag-filter">
            {t("common.tags")}
          </label>
          <select
            id="transactions-tag-filter"
            className="form-select finova-select"
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
          >
            <option value="all">{t("transactions.allTags")}</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-lg-1">
          <label className="form-label text-dark fw-medium" htmlFor="transactions-month-filter">
            {t("common.month")}
          </label>
          <input
            id="transactions-month-filter"
            type="month"
            className="form-control finova-input"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </div>

        <div className="col-6 col-lg-1">
          <label className="form-label text-dark fw-medium" htmlFor="transactions-sort-filter">
            {t("common.sort")}
          </label>
          <select
            id="transactions-sort-filter"
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

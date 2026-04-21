import { useMemo, useState } from "react";
import BudgetGoalsSection from "../features/dashboard/BudgetGoalsSection";
import { useTransactions } from "../features/transactions/useTransactions";
import {
  filterTransactionsByFinancialAccount,
  getFinancialAccountScopeLabel,
} from "../lib/financialAccounts/scope";
import { useFinancialAccountOptions } from "../lib/financialAccounts/useFinancialAccountOptions";
import { useI18n } from "../i18n/LanguageProvider";

export default function Goals() {
  const { t } = useI18n();
  const { isLoading, transactions } = useTransactions();
  const [accountFilter, setAccountFilter] = useState("all");
  const accounts = useFinancialAccountOptions();
  const filteredTransactions = useMemo(
    () => filterTransactionsByFinancialAccount(transactions, accountFilter),
    [transactions, accountFilter]
  );
  const selectedAccountLabel = useMemo(
    () => getFinancialAccountScopeLabel(accountFilter, accounts),
    [accountFilter, accounts]
  );

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("pages.goalsTitle")}</h1>
          <p className="finova-subtitle mb-0">{t("pages.goalsSubtitle")}</p>
          <p className="finova-subtitle small mt-2 mb-0">{selectedAccountLabel}</p>
        </div>

        <div className="finova-page-header-side">
          <label className="form-label text-dark fw-medium">Conta exibida</label>
          <select
            className="form-select finova-select"
            value={accountFilter}
            onChange={(event) => setAccountFilter(event.target.value)}
          >
            <option value="all">Todas as contas (saldo global)</option>
            <option value="unassigned">Sem conta vinculada</option>
            {accounts.map((account) => (
              <option key={account.id} value={String(account.id)}>
                {account.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="finova-card p-4 mb-4">
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Meta geral</div>
              <div className="finova-title h6 mb-2">Visao ampla do mes</div>
              <p className="finova-subtitle mb-0">
                Ideal para entender se o conjunto das despesas esta compativel com o orcamento do
                periodo.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Metas por categoria</div>
              <div className="finova-title h6 mb-2">Controle mais preciso</div>
              <p className="finova-subtitle mb-0">
                Use metas especificas para acompanhar exatamente onde o orcamento aperta e onde ele
                ainda tem margem.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="finova-card-soft p-3 h-100">
              <div className="finova-subtitle small mb-1">Dica pratica</div>
              <div className="finova-title h6 mb-2">Revise mes a mes</div>
              <p className="finova-subtitle mb-0">
                Vale acompanhar a navegacao mensal para ajustar limites a medida que os habitos
                mudam.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="finova-card p-4">
          <p className="finova-subtitle mb-0">Carregando metas...</p>
        </div>
      ) : (
        <BudgetGoalsSection transactions={filteredTransactions} />
      )}
    </section>
  );
}

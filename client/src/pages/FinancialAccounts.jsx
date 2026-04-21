import { useEffect, useMemo, useState } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import { useI18n } from "../i18n/LanguageProvider";
import {
  createFinancialAccount,
  deleteFinancialAccount,
  getFinancialAccounts,
  syncFinancialAccount,
  updateFinancialAccount,
} from "../lib/api/financialAccounts";
import { formatFinancialAccountLabel } from "../lib/financialAccounts/presentation";
import { formatDateTimeBR } from "../lib/format/date";

const PROVIDER_OPTIONS = [
  {
    value: "manual",
    label: "Manual",
    description: "Conta pensada para importacao por arquivo e conciliacao assistida.",
  },
];

const ACCOUNT_TYPE_OPTIONS = [
  {
    value: "bank_account",
    label: "Conta bancaria",
    description: "Conta corrente, conta digital ou conta principal do dia a dia.",
  },
  {
    value: "wallet",
    label: "Carteira",
    description: "Carteira digital, saldo separado ou conta de uso pontual.",
  },
  {
    value: "cash",
    label: "Dinheiro fisico",
    description: "Valores em especie para controle fora do banco.",
  },
  {
    value: "credit_card",
    label: "Cartao de credito",
    description: "Conta voltada para compras no credito e futuros parcelamentos.",
  },
];

const INITIAL_FORM = {
  accountType: ACCOUNT_TYPE_OPTIONS[0].value,
  provider: PROVIDER_OPTIONS[0].value,
  institutionName: "",
  institutionCode: "",
  accountName: "",
  accountMask: "",
  externalAccountId: "",
};

function getStatusMeta(status) {
  switch ((status || "").toLowerCase()) {
    case "connected":
      return { label: "Conectada", className: "finova-badge-income" };
    case "error":
      return { label: "Com erro", className: "finova-badge-danger" };
    case "disconnected":
      return { label: "Desconectada", className: "finova-badge-neutral" };
    case "pending":
    default:
      return { label: "Pendente", className: "finova-badge-warning" };
  }
}

function getAccountTypeMeta(accountType) {
  switch ((accountType || "").toLowerCase()) {
    case "wallet":
      return { label: "Carteira", className: "finova-badge-primary" };
    case "cash":
      return { label: "Dinheiro", className: "finova-badge-warning" };
    case "credit_card":
      return { label: "Cartao de credito", className: "finova-badge-danger" };
    case "bank_account":
    default:
      return { label: "Conta bancaria", className: "finova-badge-income" };
  }
}

function formatProviderLabel(provider) {
  return PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider;
}

function sortAccounts(list) {
  return [...list].sort((a, b) => {
    const institutionCompare = (a.institutionName || "").localeCompare(b.institutionName || "");
    if (institutionCompare !== 0) {
      return institutionCompare;
    }

    return (a.accountName || "").localeCompare(b.accountName || "");
  });
}

export default function FinancialAccounts() {
  const { t } = useI18n();
  const { loadAll: reloadTransactions } = useTransactions();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [removingAccountId, setRemovingAccountId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAccounts() {
    setIsLoading(true);

    try {
      const data = await getFinancialAccounts();
      setAccounts(sortAccounts(Array.isArray(data) ? data : []));
    } catch (err) {
      setAccounts([]);
      setError(err.message || "Nao foi possivel carregar as contas financeiras.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const summary = useMemo(() => {
    const connectedCount = accounts.filter((account) => account.status === "connected").length;
    const pendingCount = accounts.filter((account) => account.status === "pending").length;
    const syncedCount = accounts.filter((account) => account.lastSyncedAtUtc).length;
    const creditCardCount = accounts.filter((account) => account.accountType === "credit_card").length;

    return {
      total: accounts.length,
      connected: connectedCount,
      pending: pendingCount,
      synced: syncedCount,
      creditCards: creditCardCount,
    };
  }, [accounts]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function handleStartEdit(account) {
    setEditingAccountId(account.id);
    setForm({
      accountType: account.accountType,
      provider: account.provider,
      institutionName: account.institutionName || "",
      institutionCode: account.institutionCode || "",
      accountName: account.accountName || "",
      accountMask: account.accountMask || "",
      externalAccountId: account.externalAccountId || "",
    });
    setError("");
    setSuccess("");
  }

  function handleCancelEdit() {
    setEditingAccountId(null);
    setForm(INITIAL_FORM);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.institutionName.trim()) {
      setError("Informe a instituicao financeira.");
      return;
    }

    if (!form.accountName.trim()) {
      setError("Informe um nome para identificar a conta.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        accountType: form.accountType,
        provider: form.provider,
        institutionName: form.institutionName.trim(),
        institutionCode: form.institutionCode.trim() || null,
        accountName: form.accountName.trim(),
        accountMask: form.accountMask.trim() || null,
        externalAccountId: form.externalAccountId.trim() || null,
      };

      if (editingAccountId) {
        const updated = await updateFinancialAccount(editingAccountId, payload);
        setAccounts((current) =>
          sortAccounts(current.map((account) => (account.id === editingAccountId ? updated : account)))
        );
        setSuccess("Conta financeira atualizada com sucesso.");
      } else {
        const created = await createFinancialAccount(payload);
        setAccounts((current) => sortAccounts([...current, created]));
        setSuccess("Conta financeira adicionada para uso manual e futuras importacoes.");
      }

      setEditingAccountId(null);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(
        err.message ||
          (editingAccountId
            ? "Nao foi possivel atualizar a conta financeira."
            : "Nao foi possivel adicionar a conta financeira.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSync(account) {
    setError("");
    setSuccess("");
    setSyncingAccountId(account.id);

    try {
      const result = await syncFinancialAccount(account.id);
      await loadAccounts();
      await reloadTransactions();
      setSuccess(
        result?.message ||
          `Sincronizacao executada para ${account.institutionName} - ${account.accountName}.`
      );
    } catch (err) {
      setError(err.message || "Nao foi possivel sincronizar esta conta.");
    } finally {
      setSyncingAccountId(null);
    }
  }

  async function handleRemove(account) {
    const message =
      account.linkedTransactionsCount > 0
        ? `Remover ${account.institutionName} - ${account.accountName}? As ${account.linkedTransactionsCount} transacoes vinculadas continuarao no sistema, mas ficarao sem conta associada.`
        : `Remover ${account.institutionName} - ${account.accountName}?`;

    if (!window.confirm(message)) {
      return;
    }

    setRemovingAccountId(account.id);
    setError("");
    setSuccess("");

    try {
      await deleteFinancialAccount(account.id);
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      await reloadTransactions();

      if (editingAccountId === account.id) {
        handleCancelEdit();
      }

      setSuccess(
        account.linkedTransactionsCount > 0
          ? "Conta removida. As transacoes foram preservadas e seguiram sem vinculacao."
          : "Conta removida com sucesso."
      );
    } catch (err) {
      setError(err.message || "Nao foi possivel remover esta conta.");
    } finally {
      setRemovingAccountId(null);
    }
  }

  return (
    <section className="finova-section-space">
      <div className="finova-page-header">
        <div className="finova-page-header-copy">
          <h1 className="finova-title">{t("pages.accountsTitle")}</h1>
          <p className="finova-subtitle mb-0">{t("pages.accountsSubtitle")}</p>
        </div>
      </div>

      <div className="d-grid gap-4">
        <div className="finova-card p-4">
          <div className="row g-3">
            <div className="col-12 col-md-6 col-xl-3">
              <div className="finova-card-soft p-3 h-100">
                <div className="finova-subtitle small mb-1">Contas cadastradas</div>
                <div className="finova-title h4 mb-0">{summary.total}</div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="finova-card-soft p-3 h-100">
                <div className="finova-subtitle small mb-1">Contas conectadas</div>
                <div className="finova-title h4 mb-0">{summary.connected}</div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="finova-card-soft p-3 h-100">
                <div className="finova-subtitle small mb-1">Aguardando acao</div>
                <div className="finova-title h4 mb-0">{summary.pending}</div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="finova-card-soft p-3 h-100">
                <div className="finova-subtitle small mb-1">Com historico de sync</div>
                <div className="finova-title h4 mb-0">{summary.synced}</div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="finova-card-soft p-3 h-100">
                <div className="finova-subtitle small mb-1">Cartoes de credito</div>
                <div className="finova-title h4 mb-0">{summary.creditCards}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-xxl-5">
            <div className="finova-card p-4 h-100">
              <div className="mb-3">
                <h2 className="finova-title h5 mb-1">
                  {editingAccountId ? "Editar conta" : "Adicionar conta"}
                </h2>
                <p className="finova-subtitle mb-0">
                  {editingAccountId
                    ? "Atualize os dados da conta selecionada sem perder o historico ja vinculado."
                    : "Cadastre contas e cartoes manualmente enquanto a integracao de Open Finance aguarda liberacao."}
                </p>
              </div>

              <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-12">
                  <label className="form-label text-dark fw-medium" htmlFor="financial-account-type">
                    Tipo da conta
                  </label>
                  <select
                    id="financial-account-type"
                    className="form-select finova-select"
                    value={form.accountType}
                    onChange={(event) => updateField("accountType", event.target.value)}
                    disabled={isSubmitting}
                  >
                    {ACCOUNT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    {ACCOUNT_TYPE_OPTIONS.find((option) => option.value === form.accountType)?.description}
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label text-dark fw-medium" htmlFor="financial-provider">
                    Provedor
                  </label>
                  <select
                    id="financial-provider"
                    className="form-select finova-select"
                    value={form.provider}
                    onChange={(event) => updateField("provider", event.target.value)}
                    disabled={isSubmitting}
                  >
                    {PROVIDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    {PROVIDER_OPTIONS.find((option) => option.value === form.provider)?.description}
                  </div>
                </div>

                <div className="col-12 col-md-7">
                  <label
                    className="form-label text-dark fw-medium"
                    htmlFor="financial-institution-name"
                  >
                    Instituicao
                  </label>
                  <input
                    id="financial-institution-name"
                    type="text"
                    className="form-control finova-input"
                    value={form.institutionName}
                    onChange={(event) => updateField("institutionName", event.target.value)}
                    placeholder="Ex.: Nubank, Itau, Banco do Brasil"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-12 col-md-5">
                  <label
                    className="form-label text-dark fw-medium"
                    htmlFor="financial-institution-code"
                  >
                    Codigo da instituicao
                  </label>
                  <input
                    id="financial-institution-code"
                    type="text"
                    className="form-control finova-input"
                    value={form.institutionCode}
                    onChange={(event) => updateField("institutionCode", event.target.value)}
                    placeholder="Opcional"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-dark fw-medium" htmlFor="financial-account-name">
                    Nome da conta
                  </label>
                  <input
                    id="financial-account-name"
                    type="text"
                    className="form-control finova-input"
                    value={form.accountName}
                    onChange={(event) => updateField("accountName", event.target.value)}
                    placeholder="Ex.: Conta principal, Cartao, Reserva"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label text-dark fw-medium" htmlFor="financial-account-mask">
                    Mascara
                  </label>
                  <input
                    id="financial-account-mask"
                    type="text"
                    className="form-control finova-input"
                    value={form.accountMask}
                    onChange={(event) => updateField("accountMask", event.target.value)}
                    placeholder="1234"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label
                    className="form-label text-dark fw-medium"
                    htmlFor="financial-account-external-id"
                  >
                    ID externo
                  </label>
                  <input
                    id="financial-account-external-id"
                    type="text"
                    className="form-control finova-input"
                    value={form.externalAccountId}
                    onChange={(event) => updateField("externalAccountId", event.target.value)}
                    placeholder="Opcional"
                    disabled={isSubmitting}
                  />
                </div>

                {error ? (
                  <div className="col-12">
                    <div className="alert alert-danger py-2 mb-0" role="alert">
                      {error}
                    </div>
                  </div>
                ) : null}

                {!error && success ? (
                  <div className="col-12">
                    <div className="alert alert-success py-2 mb-0" role="status">
                      {success}
                    </div>
                  </div>
                ) : null}

                <div className="col-12">
                  <div className="finova-actions-row finova-actions-row-end pt-2">
                    {editingAccountId ? (
                      <button
                        type="button"
                        className="btn finova-btn-light"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        Cancelar edicao
                      </button>
                    ) : null}
                    <button type="submit" className="btn finova-btn-primary px-4" disabled={isSubmitting}>
                      {isSubmitting
                        ? editingAccountId
                          ? "Salvando conta..."
                          : "Adicionando conta..."
                        : editingAccountId
                          ? "Salvar alteracoes"
                          : "Adicionar conta"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="col-12 col-xxl-7">
            <div className="finova-card p-4 h-100">
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3">
                <div>
                  <h2 className="finova-title h5 mb-1">Contas cadastradas</h2>
                  <p className="finova-subtitle mb-0">
                    As contas ficam separadas por instituicao e nome, prontas para leitura por conta, saldo global e futuras importacoes.
                  </p>
                </div>

                <button type="button" className="btn finova-btn-light" onClick={loadAccounts} disabled={isLoading}>
                  {isLoading ? "Atualizando..." : "Atualizar lista"}
                </button>
              </div>

              <div className="finova-card-soft p-3 mb-3">
                <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                  <div>
                    <div className="finova-title h6 mb-1">Open Finance em espera</div>
                    <p className="finova-subtitle mb-0">
                      Enquanto a liberacao externa nao chega, o Finova segue com contas manuais e organizacao por carteira, banco e cartao.
                    </p>
                  </div>
                  <span className="finova-badge-warning align-self-start">Manual por enquanto</span>
                </div>
              </div>

              <div className="finova-page-note mb-3">
                Remover uma conta nao apaga suas transacoes. Os lancamentos continuam no sistema e
                apenas deixam de ficar vinculados a essa conta.
              </div>

              {isLoading ? (
                <div className="d-flex align-items-center gap-3">
                  <div className="spinner-border spinner-border-sm text-primary" />
                  <p className="finova-subtitle mb-0">Carregando contas financeiras...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="finova-card-soft p-4 text-center">
                  <h3 className="finova-title h6 mb-2">Nenhuma conta cadastrada</h3>
                  <p className="finova-subtitle mb-0">
                    Assim que voce cadastrar a primeira conta, ela passa a aparecer aqui com status, historico de sync e acoes de conexao.
                  </p>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {accounts.map((account) => {
                    const statusMeta = getStatusMeta(account.status);
                    const accountTypeMeta = getAccountTypeMeta(account.accountType);
                    const isSyncing = syncingAccountId === account.id;
                    const isRemoving = removingAccountId === account.id;
                    const canSync = account.provider === "manual";

                    return (
                      <div key={account.id} className="finova-card-soft p-3">
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3">
                          <div className="flex-grow-1">
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                              <h3 className="finova-title h6 mb-0">{account.institutionName}</h3>
                              <span className={statusMeta.className}>{statusMeta.label}</span>
                              <span className={accountTypeMeta.className}>{accountTypeMeta.label}</span>
                              <span className="finova-badge-neutral">
                                {formatProviderLabel(account.provider)}
                              </span>
                            </div>

                            <div className="finova-subtitle small mb-2">
                              {formatFinancialAccountLabel(account)}
                            </div>

                            <div className="finova-financial-account-meta">
                              <span>
                                <strong>Conta:</strong> {account.accountName}
                              </span>
                              <span>
                                <strong>Tipo:</strong> {accountTypeMeta.label}
                              </span>
                              {account.accountMask ? (
                                <span>
                                  <strong>Final:</strong> {account.accountMask}
                                </span>
                              ) : null}
                              <span>
                                <strong>Transacoes:</strong> {account.linkedTransactionsCount ?? 0}
                              </span>
                              <span>
                                <strong>Ultimo sync:</strong>{" "}
                                {account.lastSyncedAtUtc
                                  ? formatDateTimeBR(account.lastSyncedAtUtc)
                                  : "Ainda nao sincronizada"}
                              </span>
                            </div>

                            {account.linkedTransactionsCount > 0 ? (
                              <div className="finova-page-note mt-3">
                                Esta conta possui {account.linkedTransactionsCount} transacao(oes)
                                vinculada(s). Se voce remover a conta, os lancamentos serao
                                preservados e continuarao no historico sem vinculacao.
                              </div>
                            ) : null}
                          </div>

                          <div className="finova-actions-row">
                            <button
                              type="button"
                              className="btn finova-btn-light"
                              onClick={() => handleStartEdit(account)}
                              disabled={isSyncing || isRemoving}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn finova-btn-light"
                              onClick={() => handleSync(account)}
                              disabled={isSyncing || isRemoving || !canSync}
                            >
                              {isSyncing ? "Sincronizando..." : "Sincronizar"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleRemove(account)}
                              disabled={isSyncing || isRemoving}
                            >
                              {isRemoving ? "Removendo..." : "Remover"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

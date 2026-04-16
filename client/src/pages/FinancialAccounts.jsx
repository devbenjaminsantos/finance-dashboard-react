import { useEffect, useMemo, useState } from "react";
import {
  createFinancialAccount,
  getFinancialAccounts,
  syncFinancialAccount,
} from "../lib/api/financialAccounts";
import { formatDateTimeBR } from "../lib/format/date";
import { useTransactions } from "../features/transactions/useTransactions";

const PROVIDER_OPTIONS = [
  {
    value: "pluggy",
    label: "Pluggy",
    description: "Boa base para a futura integracao bancaria automatica.",
  },
  {
    value: "belvo",
    label: "Belvo",
    description: "Alternativa comum para agregacao de contas e extratos.",
  },
  {
    value: "manual",
    label: "Manual",
    description: "Conta preparada para importacao assistida e futuras conexoes.",
  },
];

const INITIAL_FORM = {
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
    case "pending":
    default:
      return { label: "Pendente", className: "finova-badge-warning" };
  }
}

function formatProviderLabel(provider) {
  return PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider;
}

export default function FinancialAccounts() {
  const { loadAll: reloadTransactions } = useTransactions();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAccounts() {
    setIsLoading(true);

    try {
      const data = await getFinancialAccounts();
      setAccounts(Array.isArray(data) ? data : []);
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

    return {
      total: accounts.length,
      connected: connectedCount,
      pending: pendingCount,
      synced: syncedCount,
    };
  }, [accounts]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
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
      const created = await createFinancialAccount({
        provider: form.provider,
        institutionName: form.institutionName.trim(),
        institutionCode: form.institutionCode.trim() || null,
        accountName: form.accountName.trim(),
        accountMask: form.accountMask.trim() || null,
        externalAccountId: form.externalAccountId.trim() || null,
      });

      setAccounts((current) => [...current, created].sort((a, b) => {
        const institutionCompare = (a.institutionName || "").localeCompare(b.institutionName || "");
        if (institutionCompare !== 0) {
          return institutionCompare;
        }

        return (a.accountName || "").localeCompare(b.accountName || "");
      }));
      setForm(INITIAL_FORM);
      setSuccess("Conta financeira adicionada. Agora ja podemos usar essa base na evolucao da integracao.");
    } catch (err) {
      setError(err.message || "Nao foi possivel adicionar a conta financeira.");
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

  return (
    <section className="finova-section-space">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
        <div>
          <h1 className="finova-title mb-1">Contas financeiras</h1>
          <p className="finova-subtitle mb-0">
            Organize as contas que vao participar da futura integracao bancaria e centralize as sincronizacoes em uma area propria.
          </p>
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
                <div className="finova-subtitle small mb-1">Aguardando sync</div>
                <div className="finova-title h4 mb-0">{summary.pending}</div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="finova-card-soft p-3 h-100">
                <div className="finova-subtitle small mb-1">Com historico de sync</div>
                <div className="finova-title h4 mb-0">{summary.synced}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-xxl-5">
            <div className="finova-card p-4 h-100">
              <div className="mb-3">
                <h2 className="finova-title h5 mb-1">Adicionar conta</h2>
                <p className="finova-subtitle mb-0">
                  Cadastre a instituicao e deixe a conta pronta para a sincronizacao automatica das proximas etapas.
                </p>
              </div>

              <form className="row g-3" onSubmit={handleSubmit}>
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
                    placeholder="Ex.: Banco do Brasil, Nubank, Itau"
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
                  <label className="form-label text-dark fw-medium" htmlFor="financial-account-external-id">
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
                    <button type="submit" className="btn finova-btn-primary px-4" disabled={isSubmitting}>
                      {isSubmitting ? "Adicionando conta..." : "Adicionar conta"}
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
                    Cada conta mostra o status atual e o ultimo ponto de sincronizacao conhecido.
                  </p>
                </div>

                <button type="button" className="btn finova-btn-light" onClick={loadAccounts} disabled={isLoading}>
                  {isLoading ? "Atualizando..." : "Atualizar lista"}
                </button>
              </div>

              <div className="finova-card-soft p-3 mb-3">
                <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                  <div>
                    <div className="finova-title h6 mb-1">Etapa atual da integracao</div>
                    <p className="finova-subtitle mb-0">
                      Esta tela ja prepara o cadastro, o status e o disparo de sync. A conexao bancaria real entra na proxima fase da V5.
                    </p>
                  </div>
                  <span className="finova-badge-primary align-self-start">Base pronta para evoluir</span>
                </div>
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
                    Assim que voce cadastrar a primeira conta, ela passa a aparecer aqui com status, historico de sync e proximos passos.
                  </p>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {accounts.map((account) => {
                    const statusMeta = getStatusMeta(account.status);
                    const isSyncing = syncingAccountId === account.id;

                    return (
                      <div key={account.id} className="finova-card-soft p-3">
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3">
                          <div className="flex-grow-1">
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                              <h3 className="finova-title h6 mb-0">{account.institutionName}</h3>
                              <span className={statusMeta.className}>{statusMeta.label}</span>
                              <span className="finova-badge-neutral">
                                {formatProviderLabel(account.provider)}
                              </span>
                            </div>

                            <div className="finova-financial-account-meta">
                              <span>
                                <strong>Conta:</strong> {account.accountName}
                              </span>
                              {account.accountMask ? (
                                <span>
                                  <strong>Final:</strong> {account.accountMask}
                                </span>
                              ) : null}
                              {account.institutionCode ? (
                                <span>
                                  <strong>Codigo:</strong> {account.institutionCode}
                                </span>
                              ) : null}
                              <span>
                                <strong>Ultimo sync:</strong>{" "}
                                {account.lastSyncedAtUtc
                                  ? formatDateTimeBR(account.lastSyncedAtUtc)
                                  : "Ainda nao sincronizada"}
                              </span>
                            </div>
                          </div>

                          <div className="finova-actions-row">
                            <button
                              type="button"
                              className="btn finova-btn-light"
                              onClick={() => handleSync(account)}
                              disabled={isSyncing}
                            >
                              {isSyncing ? "Sincronizando..." : "Sincronizar"}
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

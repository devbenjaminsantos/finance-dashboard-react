import { useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "../lib/api/auditLogs";

function formatAuditDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatActionLabel(action) {
  const labels = {
    "auth.registered": "Conta criada",
    "auth.login-succeeded": "Login realizado",
    "auth.login-blocked-unconfirmed-email": "Login bloqueado por e-mail nao confirmado",
    "auth.demo-login": "Acesso pela conta demo",
    "auth.verification-resent": "Reenvio de confirmacao de e-mail",
    "auth.email-confirmed": "E-mail confirmado",
    "auth.password-reset-requested": "Recuperacao de senha solicitada",
    "auth.password-reset-completed": "Senha redefinida",
    "transaction.created": "Transacao criada",
    "transaction.updated": "Transacao atualizada",
    "transaction.deleted": "Transacao removida",
    "budget-goal.created": "Meta criada",
    "budget-goal.updated": "Meta atualizada",
    "budget-goal.deleted": "Meta removida",
    "profile.updated": "Perfil atualizado",
    "profile.password-changed": "Senha alterada",
  };

  return labels[action] || action;
}

function getActionToneClass(action) {
  if (action?.includes("deleted")) {
    return "finova-badge-danger";
  }

  if (action?.includes("updated") || action?.includes("changed")) {
    return "finova-badge-warning";
  }

  return "finova-badge-primary";
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [limit, setLimit] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAuditLogs() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getAuditLogs(limit);

        if (active) {
          setLogs(Array.isArray(data) ? data : []);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Nao foi possivel carregar o historico.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadAuditLogs();

    return () => {
      active = false;
    };
  }, [limit]);

  const groupedLogs = useMemo(() => logs, [logs]);

  return (
    <section className="finova-section-space">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h1 className="finova-title mb-1">Historico de atividades</h1>
          <p className="finova-subtitle mb-0">
            Consulte as acoes mais importantes realizadas na sua conta.
          </p>
        </div>

        <div style={{ minWidth: 180 }}>
          <label className="form-label text-dark fw-medium">Exibir</label>
          <select
            className="form-select finova-select"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          >
            <option value={25}>Ultimos 25 registros</option>
            <option value={50}>Ultimos 50 registros</option>
            <option value={100}>Ultimos 100 registros</option>
          </select>
        </div>
      </div>

      <div className="finova-card p-4">
        {isLoading ? (
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border spinner-border-sm text-primary" />
            <p className="finova-subtitle mb-0">Carregando historico...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger py-2 mb-0" role="alert">
            {error}
          </div>
        ) : groupedLogs.length === 0 ? (
          <div className="text-center py-4">
            <h2 className="finova-title h6 mb-2">Nenhum registro encontrado</h2>
            <p className="finova-subtitle mb-0">
              As acoes importantes da conta aparecerao aqui conforme voce usa o sistema.
            </p>
          </div>
        ) : (
          <div className="d-grid gap-3">
            {groupedLogs.map((log) => (
              <div key={log.id} className="finova-card-soft p-3">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-2">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className={getActionToneClass(log.action)}>
                      {formatActionLabel(log.action)}
                    </span>
                    <span className="finova-subtitle small">
                      {log.entityType}
                      {log.entityId ? ` #${log.entityId}` : ""}
                    </span>
                  </div>

                  <span className="finova-subtitle small">
                    {formatAuditDate(log.createdAtUtc)}
                  </span>
                </div>

                <div className="fw-medium mb-1">{log.summary}</div>

                {log.ipAddress ? (
                  <div className="finova-subtitle small">IP: {log.ipAddress}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "../lib/api/auditLogs";

const VISIBLE_ACTIONS = new Set([
  "auth.registered",
  "auth.login-succeeded",
  "auth.login-blocked-unconfirmed-email",
  "auth.login-locked-out",
  "auth.login-blocked-locked-out",
  "auth.email-confirmed",
  "auth.password-reset-requested",
  "auth.password-reset-completed",
  "auth.demo-login",
  "transaction.created",
  "transaction.updated",
  "transaction.deleted",
  "budget-goal.created",
  "budget-goal.updated",
  "budget-goal.deleted",
  "profile.updated",
  "profile.updated-with-password",
]);

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
    "auth.login-blocked-unconfirmed-email": "Login bloqueado por e-mail não confirmado",
    "auth.login-locked-out": "Conta bloqueada por excesso de tentativas",
    "auth.login-blocked-locked-out": "Novo acesso bloqueado temporariamente",
    "auth.demo-login": "Entrada na conta de demonstração",
    "auth.email-confirmed": "E-mail confirmado",
    "auth.password-reset-requested": "Recuperação de senha solicitada",
    "auth.password-reset-completed": "Senha redefinida",
    "transaction.created": "Transação adicionada",
    "transaction.updated": "Transação editada",
    "transaction.deleted": "Transação removida",
    "budget-goal.created": "Meta criada",
    "budget-goal.updated": "Meta editada",
    "budget-goal.deleted": "Meta removida",
    "profile.updated": "Perfil atualizado",
    "profile.updated-with-password": "Perfil e senha atualizados",
  };

  return labels[action] || "Atividade registrada";
}

function getActionGroup(action) {
  if (action.startsWith("transaction.")) {
    return "Transações";
  }

  if (action.startsWith("budget-goal.")) {
    return "Metas";
  }

  if (action.startsWith("profile.")) {
    return "Perfil";
  }

  return "Acesso e segurança";
}

function getActionToneClass(action) {
  if (action?.includes("deleted") || action?.includes("locked-out")) {
    return "finova-badge-danger";
  }

  if (action?.includes("updated") || action?.includes("changed")) {
    return "finova-badge-warning";
  }

  if (action?.includes("password-reset") || action?.includes("confirmed")) {
    return "finova-badge-income";
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
          setError(requestError.message || "Não foi possível carregar o histórico.");
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

  const visibleLogs = useMemo(
    () => logs.filter((log) => VISIBLE_ACTIONS.has(log.action)),
    [logs]
  );

  const hiddenLogsCount = logs.length - visibleLogs.length;

  return (
    <section className="finova-section-space">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h1 className="finova-title mb-1">Histórico da conta</h1>
          <p className="finova-subtitle mb-0">
            Acompanhe as ações mais relevantes da sua conta, como acessos, mudanças de perfil,
            transações e metas.
          </p>
        </div>

        <div style={{ minWidth: 180 }}>
          <label className="form-label text-dark fw-medium">Exibir</label>
          <select
            className="form-select finova-select"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          >
            <option value={25}>Últimos 25 registros</option>
            <option value={50}>Últimos 50 registros</option>
            <option value={100}>Últimos 100 registros</option>
          </select>
        </div>
      </div>

      <div className="finova-card p-4">
        {isLoading ? (
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border spinner-border-sm text-primary" />
            <p className="finova-subtitle mb-0">Carregando histórico...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger py-2 mb-0" role="alert">
            {error}
          </div>
        ) : visibleLogs.length === 0 ? (
          <div className="text-center py-4">
            <h2 className="finova-title h6 mb-2">Nenhum registro relevante encontrado</h2>
            <p className="finova-subtitle mb-0">
              As principais ações da sua conta aparecerão aqui conforme você usa o sistema.
            </p>
          </div>
        ) : (
          <div className="d-grid gap-3">
            {hiddenLogsCount > 0 ? (
              <div className="alert alert-info py-2 mb-0" role="status">
                {hiddenLogsCount} registro{hiddenLogsCount === 1 ? "" : "s"} mais técnico
                {hiddenLogsCount === 1 ? " foi ocultado" : "s foram ocultados"} para manter este
                histórico mais direto.
              </div>
            ) : null}

            {visibleLogs.map((log) => (
              <div key={log.id} className="finova-card-soft p-3">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-2">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className={getActionToneClass(log.action)}>
                      {formatActionLabel(log.action)}
                    </span>
                    <span className="finova-badge-neutral">
                      {getActionGroup(log.action)}
                    </span>
                  </div>

                  <span className="finova-subtitle small">
                    {formatAuditDate(log.createdAtUtc)}
                  </span>
                </div>

                <div className="fw-medium">{log.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

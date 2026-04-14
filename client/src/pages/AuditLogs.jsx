import { useEffect, useMemo, useState } from "react";
import {
  formatActionLabel,
  formatAuditDate,
  getActionGroup,
  getActionToneClass,
  VISIBLE_AUDIT_ACTIONS,
} from "../features/history/auditLogPresentation";
import { getAuditLogs } from "../lib/api/auditLogs";

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

  const visibleLogs = useMemo(
    () => logs.filter((log) => VISIBLE_AUDIT_ACTIONS.has(log.action)),
    [logs]
  );

  const hiddenLogsCount = logs.length - visibleLogs.length;

  return (
    <section className="finova-section-space">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h1 className="finova-title mb-1">Historico da conta</h1>
          <p className="finova-subtitle mb-0">
            Acompanhe as acoes mais relevantes da sua conta, como acessos, mudancas de perfil,
            transacoes e metas.
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
        ) : visibleLogs.length === 0 ? (
          <div className="text-center py-4">
            <h2 className="finova-title h6 mb-2">Nenhum registro relevante encontrado</h2>
            <p className="finova-subtitle mb-0">
              As principais acoes da sua conta aparecerao aqui conforme voce usa o sistema.
            </p>
          </div>
        ) : (
          <div className="d-grid gap-3">
            {hiddenLogsCount > 0 ? (
              <div className="alert alert-info py-2 mb-0" role="status">
                {hiddenLogsCount} registro{hiddenLogsCount === 1 ? "" : "s"} mais tecnico
                {hiddenLogsCount === 1 ? " foi ocultado" : "s foram ocultados"} para manter este
                historico mais direto.
              </div>
            ) : null}

            {visibleLogs.map((log) => (
              <div key={log.id} className="finova-card-soft p-3">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-2">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className={getActionToneClass(log.action)}>
                      {formatActionLabel(log.action)}
                    </span>
                    <span className="finova-badge-neutral">{getActionGroup(log.action)}</span>
                  </div>

                  <span className="finova-subtitle small">{formatAuditDate(log.createdAtUtc)}</span>
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

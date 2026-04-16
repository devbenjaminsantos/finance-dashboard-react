import { useI18n } from "../../i18n/LanguageProvider";

export function SummaryCard({ label, value, tone = "default" }) {
  const toneMap = {
    default: {
      bg: "var(--surface)",
      border: "var(--border)",
      text: "var(--text)",
    },
    income: {
      bg: "rgba(34, 197, 94, 0.08)",
      border: "rgba(34, 197, 94, 0.14)",
      text: "var(--success-dark)",
    },
    expense: {
      bg: "rgba(239, 68, 68, 0.06)",
      border: "rgba(239, 68, 68, 0.12)",
      text: "#dc2626",
    },
  };

  const styles = toneMap[tone] || toneMap.default;

  return (
    <div className="col-12 col-md-4">
      <div
        className="finova-card-soft h-100 p-4"
        style={{
          background: styles.bg,
          borderColor: styles.border,
        }}
      >
        <div className="finova-subtitle small mb-2">{label}</div>
        <div
          className="finova-title mb-0"
          style={{
            fontSize: "1.75rem",
            color: styles.text,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function ComparisonCard({
  label,
  currentValue,
  previousValue,
  currentRangeLabel,
  previousRangeLabel,
}) {
  const { formatCurrencyFromCents } = useI18n();
  const delta = currentValue - previousValue;
  const hasPreviousData = previousValue > 0;
  const percentChange = hasPreviousData ? Math.round((delta / previousValue) * 100) : null;

  const toneClass =
    delta > 0
      ? "finova-badge-income"
      : delta < 0
        ? "finova-badge-expense"
        : "finova-badge-primary";

  const toneText = delta > 0 ? "Subiu" : delta < 0 ? "Caiu" : "Sem variacao";

  return (
    <div className="col-12 col-md-4">
      <div className="finova-card-soft h-100 p-4">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
          <div>
            <div className="finova-subtitle small mb-1">{label}</div>
            <div className="finova-title h5 mb-0">{formatCurrencyFromCents(currentValue)}</div>
          </div>
          <span className={toneClass}>{toneText}</span>
        </div>

        <div className="small finova-subtitle mb-2">
          Base anterior ({previousRangeLabel}): {formatCurrencyFromCents(previousValue)}
        </div>

        <div className="small">
          {hasPreviousData ? (
            <span className="fw-semibold">
              {percentChange > 0 ? "+" : ""}
              {percentChange}% em relacao a {previousRangeLabel}
            </span>
          ) : (
            <span className="finova-subtitle">
              Sem base anterior suficiente para comparar {currentRangeLabel}.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CategoryInsightCard({ title, category, value, tone }) {
  const { formatCurrencyFromCents } = useI18n();
  const badgeClass =
    tone === "up"
      ? "finova-badge-expense"
      : tone === "down"
        ? "finova-badge-income"
        : "finova-badge-primary";

  const badgeText = tone === "up" ? "Maior peso" : tone === "down" ? "Maior alivio" : "Sem destaque";

  return (
    <div className="col-12 col-md-6">
      <div className="finova-card-soft h-100 p-4">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
          <div>
            <div className="finova-subtitle small mb-1">{title}</div>
            <div className="finova-title h5 mb-1">{category || "Sem categoria dominante"}</div>
            <div className="finova-subtitle small">
              {value > 0
                ? formatCurrencyFromCents(value)
                : "Ainda nao ha despesas suficientes para destacar uma categoria."}
            </div>
          </div>
          <span className={badgeClass}>{badgeText}</span>
        </div>
      </div>
    </div>
  );
}

export function InsightCard({ title, description, badge, tone = "primary" }) {
  const badgeClass =
    tone === "income"
      ? "finova-badge-income"
      : tone === "expense"
        ? "finova-badge-expense"
        : tone === "neutral"
          ? "finova-badge-neutral"
          : "finova-badge-primary";

  return (
    <div className="col-12 col-lg-4">
      <div className="finova-card-soft h-100 p-4">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <h2 className="finova-title h6 mb-0">{title}</h2>
          <span className={badgeClass}>{badge}</span>
        </div>
        <p className="finova-subtitle mb-0">{description}</p>
      </div>
    </div>
  );
}

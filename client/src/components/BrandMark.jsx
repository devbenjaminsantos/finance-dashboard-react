import logo from "../assets/icone/logo.png";

export default function BrandMark({
  subtitle,
  className = "",
  size = "default",
  centered = false,
  showWordmark = true,
}) {
  const classes = [
    "finova-brand-mark",
    size ? `finova-brand-mark-${size}` : "",
    centered ? "finova-brand-mark-centered" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <img src={logo} alt="Finova" className="finova-brand-logo" />

      {showWordmark ? (
        <div className="finova-brand-copy">
          <span className="finova-brand-wordmark">Finova</span>
          {subtitle ? <span className="finova-brand-caption">{subtitle}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

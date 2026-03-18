export function formatBRLFromCents(cents) {
  const value = (Number(cents) || 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// aceita "150", "150,00", "150.00", "1.234,56", "1,234.56"
export function parseMoneyToCents(input) {
  if (input == null) return NaN;

  let s = String(input).trim();
  if (!s) return NaN;

  // remove R$, espaços e caracteres estranhos (mantém dígitos, ponto, vírgula, sinal)
  s = s.replace(/[R$\s]/g, "").replace(/[^\d,.\-]/g, "");

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  // define qual é o separador decimal (o que aparece por último)
  let decimalSep = null;
  if (lastComma !== -1 || lastDot !== -1) {
    decimalSep = lastComma > lastDot ? "," : ".";
  }

  if (decimalSep) {
    const thousandsSep = decimalSep === "," ? "." : ",";
    // remove separadores de milhar
    s = s.split(thousandsSep).join("");
    // troca decimal pra ponto
    if (decimalSep === ",") s = s.replace(",", ".");
  } else {
    // sem decimal: remove qualquer separador
    s = s.replace(/[.,]/g, "");
  }

  const value = Number(s);
  if (!Number.isFinite(value)) return NaN;

  return Math.round(value * 100);
}
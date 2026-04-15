import { getTransactionCategories } from "../constants/transactionCategories";
import { parseMoneyToCents } from "../format/currency";

const CATEGORY_KEYWORDS = {
  expense: {
    Alimentacao: [
      "aliment",
      "mercad",
      "supermerc",
      "padaria",
      "restaurante",
      "lanch",
      "ifood",
      "delivery",
      "cafe",
      "acougue",
      "feira",
    ],
    Transporte: [
      "uber",
      "99app",
      "taxi",
      "posto",
      "combust",
      "gasolina",
      "etanol",
      "onibus",
      "metro",
      "estacion",
      "pedagio",
      "mobilidade",
      "shell",
    ],
    Moradia: [
      "alug",
      "condom",
      "energia",
      "luz",
      "agua",
      "saneamento",
      "gas",
      "moradia",
      "iptu",
      "internet",
    ],
    Lazer: [
      "cinema",
      "show",
      "viagem",
      "bar",
      "lazer",
      "jogo",
      "ingresso",
    ],
    Saude: [
      "saude",
      "medic",
      "farm",
      "hospital",
      "clinica",
      "consulta",
      "odont",
      "exame",
    ],
    Educacao: [
      "educ",
      "curso",
      "facul",
      "escola",
      "livro",
      "mensalidade",
      "treinamento",
    ],
    Assinaturas: [
      "assin",
      "netflix",
      "spotify",
      "amazon prime",
      "youtube",
      "adobe",
      "microsoft",
      "icloud",
      "google one",
    ],
  },
  income: {
    Salario: [
      "salario",
      "folha",
      "pagamento",
      "provento",
      "holerite",
      "credito em conta",
      "credito conta",
      "deposito",
      "transferencia recebida",
    ],
    Freelancer: ["freelancer", "freela", "projeto", "servico"],
    Comissao: ["comissao", "bonus venda", "premiacao"],
    Investimentos: ["dividendo", "rendimento", "juros", "invest", "aplicacao"],
    Reembolso: ["reembolso", "estorno", "devolucao"],
    Vendas: ["venda", "recebimento venda", "loja", "marketplace"],
  },
};

export function normalizeImportText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeImportKey(value) {
  return normalizeImportText(value).replace(/\s+/g, "");
}

export function normalizeImportType(value) {
  const normalized = normalizeImportKey(value);

  if (["income", "receita", "entrada", "credito", "credit", "deposit"].includes(normalized)) {
    return "income";
  }

  if (["expense", "despesa", "saida", "debito", "debit", "payment"].includes(normalized)) {
    return "expense";
  }

  return "";
}

export function normalizeImportDate(value) {
  const raw = String(value ?? "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }

  const compactMatch = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  }

  return "";
}

export function parseImportMoneyToCents(value) {
  const parsed = parseMoneyToCents(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function mapCategoryByName(type, value) {
  const categories = getTransactionCategories(type);
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  return (
    categories.find((category) => normalizeImportKey(category) === normalizeImportKey(raw)) || ""
  );
}

function inferCategory(type, categoryValue, description) {
  const haystack = `${categoryValue || ""} ${description || ""}`.trim();
  const normalizedHaystack = normalizeImportText(haystack);
  const keywordMap = CATEGORY_KEYWORDS[type] || {};

  for (const [categoryKey, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => normalizedHaystack.includes(normalizeImportText(keyword)))) {
      return mapCategoryByName(type, categoryKey);
    }
  }

  return "";
}

export function normalizeImportCategory(type, value, description) {
  const categories = getTransactionCategories(type);
  const raw = String(value ?? "").trim();

  const exactCategory = mapCategoryByName(type, raw);
  if (exactCategory) {
    return exactCategory;
  }

  const inferredCategory = inferCategory(type, raw, description);
  if (inferredCategory) {
    return inferredCategory;
  }

  return raw || categories[categories.length - 1] || "Outros";
}

import { getTransactionCategories } from "../constants/transactionCategories";
import { parseMoneyToCents } from "../format/currency";

const CATEGORY_SIGNALS = {
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
      "burger",
      "pizza",
      "sorvete",
      "habibs",
      "mcdonald",
      "bk brasil",
      "outback",
      "hortifruti",
      "zé delivery",
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
      "ipiranga",
      "sem parar",
      "conectcar",
      "localiza",
      "movida",
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
      "enel",
      "sabesp",
      "copasa",
      "vivo fibra",
      "claro net",
      "tim live",
    ],
    Lazer: [
      "cinema",
      "show",
      "viagem",
      "bar",
      "lazer",
      "jogo",
      "ingresso",
      "steam",
      "epic games",
      "playstation",
      "xbox",
      "spotify show",
      "hotel",
      "airbnb",
      "decolar",
      "booking",
      "cinemark",
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
      "unimed",
      "amil",
      "bradesco saude",
      "droga",
      "drogasil",
      "droga raia",
      "pague menos",
      "notredame",
    ],
    Educacao: [
      "educ",
      "curso",
      "facul",
      "escola",
      "livro",
      "mensalidade",
      "treinamento",
      "alura",
      "udemy",
      "ebac",
      "cultura inglesa",
      "wizard",
      "kumon",
      "estacio",
      "anhanguera",
    ],
    Assinaturas: [
      "assin",
      "netflix",
      "spotify",
      "amazon prime",
      "prime video",
      "youtube premium",
      "adobe",
      "microsoft",
      "icloud",
      "google one",
      "chatgpt",
      "openai",
      "dropbox",
      "notion",
      "canva",
      "deezer",
      "max ",
      "disney",
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
      "deposito salario",
      "empresa",
      "folha pg",
      "transferencia empregador",
    ],
    Freelancer: [
      "freelancer",
      "freela",
      "projeto",
      "servico",
      "prestacao",
      "cliente",
      "honorario",
      "consultoria",
    ],
    Comissao: ["comissao", "bonus venda", "premiacao", "premio", "variavel"],
    Investimentos: [
      "dividendo",
      "rendimento",
      "juros",
      "invest",
      "aplicacao",
      "tesouro",
      "cdb",
      "fii",
      "acoes",
    ],
    Reembolso: [
      "reembolso",
      "estorno",
      "devolucao",
      "cashback",
      "chargeback",
      "cancelamento",
    ],
    Vendas: [
      "venda",
      "recebimento venda",
      "loja",
      "marketplace",
      "mercado livre",
      "shopee",
      "elo7",
      "pagseguro",
      "stone",
      "infinitepay",
      "maquininha",
      "pix cliente",
    ],
  },
};

const CATEGORY_PRIORITY = {
  expense: [
    "Alimentacao",
    "Transporte",
    "Moradia",
    "Saude",
    "Educacao",
    "Assinaturas",
    "Lazer",
  ],
  income: [
    "Salario",
    "Freelancer",
    "Comissao",
    "Investimentos",
    "Reembolso",
    "Vendas",
  ],
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

function computeSignalScore(haystack, signal) {
  const normalizedSignal = normalizeImportText(signal);

  if (!normalizedSignal || !haystack.includes(normalizedSignal)) {
    return 0;
  }

  const exactWordMatch = haystack.match(new RegExp(`\\b${normalizedSignal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"));
  if (exactWordMatch?.length) {
    return 3 * exactWordMatch.length;
  }

  return 1;
}

function inferCategory(type, categoryValue, description) {
  const haystack = normalizeImportText(`${categoryValue || ""} ${description || ""}`.trim());
  const categorySignals = CATEGORY_SIGNALS[type] || {};
  const categories = CATEGORY_PRIORITY[type] || [];

  let bestCategory = "";
  let bestScore = 0;

  for (const categoryKey of categories) {
    const signals = categorySignals[categoryKey] || [];
    const score = signals.reduce((sum, signal) => sum + computeSignalScore(haystack, signal), 0);

    if (score > bestScore) {
      bestScore = score;
      bestCategory = categoryKey;
    }
  }

  if (!bestCategory || bestScore === 0) {
    return {
      category: "",
      confidence: "low",
      source: "fallback",
      score: 0,
    };
  }

  const mappedCategory = mapCategoryByName(type, bestCategory);

  return {
    category: mappedCategory,
    confidence: bestScore >= 3 ? "high" : "low",
    source: "inferred",
    score: bestScore,
  };
}

export function normalizeImportCategory(type, value, description) {
  return resolveImportCategory(type, value, description).category;
}

export function resolveImportCategory(type, value, description) {
  const categories = getTransactionCategories(type);
  const raw = String(value ?? "").trim();

  const exactCategory = mapCategoryByName(type, raw);
  if (exactCategory) {
    return {
      category: exactCategory,
      confidence: "high",
      source: "explicit",
      score: 999,
    };
  }

  const inferredCategory = inferCategory(type, raw, description);
  if (inferredCategory.category) {
    return inferredCategory;
  }

  return {
    category: raw || categories[categories.length - 1] || "Outros",
    confidence: "low",
    source: raw ? "provided_unknown" : "fallback",
    score: 0,
  };
}

import { getTransactionCategories } from "../constants/transactionCategories";
import { parseMoneyToCents } from "../format/currency";

const HEADER_ALIASES = {
  data: "date",
  date: "date",
  historico: "description",
  descricao: "description",
  description: "description",
  lancamento: "description",
  detalhes: "description",
  memo: "description",
  categoria: "category",
  category: "category",
  tipo: "type",
  type: "type",
  valor: "amount",
  amount: "amount",
  credito: "creditAmount",
  credit: "creditAmount",
  debito: "debitAmount",
  debit: "debitAmount",
  valorcentavos: "amountCents",
  amountcents: "amountCents",
};

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
    ],
    Freelancer: ["freelancer", "freela", "projeto", "servico"],
    Comissao: ["comissao", "bonus venda", "premiacao"],
    Investimentos: ["dividendo", "rendimento", "juros", "invest", "aplicacao"],
    Reembolso: ["reembolso", "estorno", "devolucao"],
    Vendas: ["venda", "recebimento venda", "loja", "marketplace"],
  },
};

function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectDelimiter(text) {
  const firstLine = String(text ?? "").split(/\r?\n/).find((line) => line.trim());

  if (!firstLine) {
    return ";";
  }

  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  return semicolonCount >= commaCount ? ";" : ",";
}

function splitCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function normalizeType(value) {
  const normalized = normalizeHeader(value);

  if (["income", "receita", "entrada", "credito", "credit"].includes(normalized)) {
    return "income";
  }

  if (["expense", "despesa", "saida", "debito", "debit"].includes(normalized)) {
    return "expense";
  }

  return "";
}

function normalizeDate(value) {
  const raw = String(value ?? "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  return "";
}

function mapCategoryByName(type, value) {
  const categories = getTransactionCategories(type);
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  return (
    categories.find((category) => normalizeHeader(category) === normalizeHeader(raw)) || ""
  );
}

function inferCategory(type, categoryValue, description) {
  const haystack = `${categoryValue || ""} ${description || ""}`.trim();
  const normalizedHaystack = normalizeSearchText(haystack);
  const keywordMap = CATEGORY_KEYWORDS[type] || {};

  for (const [categoryKey, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => normalizedHaystack.includes(normalizeSearchText(keyword)))) {
      return mapCategoryByName(type, categoryKey);
    }
  }

  return "";
}

function normalizeCategory(type, value, description) {
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

function mapHeaders(headerRow) {
  return headerRow.map((header) => HEADER_ALIASES[normalizeHeader(header)] || "");
}

function getValue(row, headers, key) {
  const index = headers.indexOf(key);
  return index >= 0 ? row[index] ?? "" : "";
}

function parseRawAmount(value) {
  const parsed = parseMoneyToCents(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseRawCents(value) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseAmountData(row, headers) {
  const centsValue = parseRawCents(getValue(row, headers, "amountCents"));
  if (Number.isFinite(centsValue) && centsValue !== 0) {
    return {
      amountCents: Math.abs(centsValue),
      inferredType: centsValue >= 0 ? "income" : "expense",
    };
  }

  const creditValue = parseRawAmount(getValue(row, headers, "creditAmount"));
  if (Number.isFinite(creditValue) && creditValue > 0) {
    return {
      amountCents: creditValue,
      inferredType: "income",
    };
  }

  const debitValue = parseRawAmount(getValue(row, headers, "debitAmount"));
  if (Number.isFinite(debitValue) && debitValue > 0) {
    return {
      amountCents: debitValue,
      inferredType: "expense",
    };
  }

  const amountValue = parseRawAmount(getValue(row, headers, "amount"));
  if (Number.isFinite(amountValue) && amountValue !== 0) {
    return {
      amountCents: Math.abs(amountValue),
      inferredType: amountValue >= 0 ? "income" : "expense",
    };
  }

  return {
    amountCents: NaN,
    inferredType: "",
  };
}

export function parseTransactionsCsv(text) {
  const normalizedText = String(text ?? "").trim();

  if (!normalizedText) {
    throw new Error("O arquivo CSV esta vazio.");
  }

  const delimiter = detectDelimiter(normalizedText);
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("O CSV precisa ter cabecalho e pelo menos uma linha de dados.");
  }

  const headers = mapHeaders(splitCsvLine(lines[0], delimiter));

  if (!headers.includes("date") || !headers.includes("description")) {
    throw new Error("O CSV precisa conter as colunas Data e Descricao.");
  }

  if (
    !headers.includes("amount") &&
    !headers.includes("amountCents") &&
    !headers.includes("creditAmount") &&
    !headers.includes("debitAmount")
  ) {
    throw new Error(
      "O CSV precisa conter uma coluna de Valor, Valor em centavos, Credito ou Debito."
    );
  }

  return lines.slice(1).map((line, lineIndex) => {
    const row = splitCsvLine(line, delimiter);
    const explicitType = normalizeType(getValue(row, headers, "type"));
    const date = normalizeDate(getValue(row, headers, "date"));
    const description = String(getValue(row, headers, "description")).trim();
    const { amountCents, inferredType } = parseAmountData(row, headers);
    const type = explicitType || inferredType;
    const category = normalizeCategory(type, getValue(row, headers, "category"), description);

    if (!type || !date || !description || !Number.isFinite(amountCents) || amountCents <= 0) {
      throw new Error(`A linha ${lineIndex + 2} do CSV esta invalida e precisa ser revisada.`);
    }

    return {
      date,
      description,
      type,
      category,
      amountCents,
      isRecurring: false,
      recurrenceEndDate: null,
    };
  });
}

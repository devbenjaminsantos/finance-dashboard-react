import { getTransactionCategories } from "../constants/transactionCategories";
import { parseMoneyToCents } from "../format/currency";

const HEADER_ALIASES = {
  data: "date",
  date: "date",
  descricao: "description",
  descrição: "description",
  description: "description",
  categoria: "category",
  category: "category",
  tipo: "type",
  type: "type",
  valor: "amount",
  amount: "amount",
  valorcentavos: "amountCents",
  amountcents: "amountCents",
};

function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
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

  if (["income", "receita", "entrada"].includes(normalized)) {
    return "income";
  }

  if (["expense", "despesa", "saida", "saída"].includes(normalized)) {
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

function normalizeCategory(type, value) {
  const raw = String(value ?? "").trim();
  const categories = getTransactionCategories(type);

  if (!raw) {
    return categories[categories.length - 1] || "Outros";
  }

  const exact = categories.find(
    (category) => normalizeHeader(category) === normalizeHeader(raw)
  );

  return exact || raw;
}

function mapHeaders(headerRow) {
  return headerRow.map((header) => HEADER_ALIASES[normalizeHeader(header)] || "");
}

function parseAmountToCents(row, headers) {
  const centsIndex = headers.indexOf("amountCents");
  if (centsIndex >= 0 && row[centsIndex]) {
    const parsed = Number(row[centsIndex]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const amountIndex = headers.indexOf("amount");
  return amountIndex >= 0 ? parseMoneyToCents(row[amountIndex]) : NaN;
}

export function parseTransactionsCsv(text) {
  const normalizedText = String(text ?? "").trim();

  if (!normalizedText) {
    throw new Error("O arquivo CSV está vazio.");
  }

  const delimiter = detectDelimiter(normalizedText);
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("O CSV precisa ter cabeçalho e pelo menos uma linha de dados.");
  }

  const headers = mapHeaders(splitCsvLine(lines[0], delimiter));
  const requiredHeaders = ["date", "description", "type"];

  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error("O CSV precisa conter as colunas Data, Descrição e Tipo.");
  }

  if (!headers.includes("amount") && !headers.includes("amountCents")) {
    throw new Error("O CSV precisa conter uma coluna de Valor ou Valor em centavos.");
  }

  const transactions = lines.slice(1).map((line, lineIndex) => {
    const row = splitCsvLine(line, delimiter);
    const getValue = (key) => {
      const index = headers.indexOf(key);
      return index >= 0 ? row[index] ?? "" : "";
    };

    const type = normalizeType(getValue("type"));
    const date = normalizeDate(getValue("date"));
    const description = String(getValue("description")).trim();
    const amountCents = parseAmountToCents(row, headers);
    const category = normalizeCategory(type, getValue("category"));

    if (!type || !date || !description || !Number.isFinite(amountCents) || amountCents <= 0) {
      throw new Error(`A linha ${lineIndex + 2} do CSV está inválida e precisa ser revisada.`);
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

  return transactions;
}

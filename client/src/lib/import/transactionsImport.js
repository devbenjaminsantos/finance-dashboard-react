import { parseTransactionsCsv } from "./transactionsCsv";
import { parseTransactionsOfx } from "./transactionsOfx";

function detectImportFormat(fileName, content) {
  const normalizedName = String(fileName ?? "").trim().toLowerCase();
  const normalizedContent = String(content ?? "").trim().toUpperCase();

  if (normalizedName.endsWith(".ofx") || normalizedContent.includes("<OFX>")) {
    return "ofx";
  }

  return "csv";
}

export function parseTransactionsImport(content, fileName = "") {
  const format = detectImportFormat(fileName, content);

  if (format === "ofx") {
    return {
      format,
      transactions: parseTransactionsOfx(content),
    };
  }

  return {
    format,
    transactions: parseTransactionsCsv(content),
  };
}

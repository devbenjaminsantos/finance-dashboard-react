function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function exportTransactionsToPdf({
  filename,
  title,
  subtitle,
  columns,
  rows,
}) {
  const reportWindow = window.open("", "_blank", "noopener,noreferrer,width=1080,height=900");

  if (!reportWindow) {
    throw new Error("Nao foi possivel abrir a janela de impressao. Verifique se o navegador bloqueou pop-ups.");
  }

  const tableHeader = columns
    .map((column) => `<th>${escapeHtml(column)}</th>`)
    .join("");

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("");

  reportWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(filename)}</title>
        <style>
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 32px;
            font-family: Inter, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 24px;
          }

          .brand {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.03em;
            margin: 0 0 8px;
          }

          .title {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 6px;
          }

          .subtitle {
            margin: 0;
            color: #64748b;
            font-size: 14px;
          }

          .generated-at {
            color: #64748b;
            font-size: 13px;
            text-align: right;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
          }

          th,
          td {
            border: 1px solid #e2e8f0;
            padding: 12px 10px;
            text-align: left;
            vertical-align: top;
            font-size: 13px;
          }

          th {
            background: #f8fafc;
            color: #475569;
            font-weight: 700;
          }

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .empty {
            margin-top: 24px;
            padding: 24px;
            border: 1px dashed #cbd5e1;
            border-radius: 16px;
            color: #64748b;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand">Finova</h1>
            <h2 class="title">${escapeHtml(title)}</h2>
            <p class="subtitle">${escapeHtml(subtitle)}</p>
          </div>

          <div class="generated-at">
            Gerado em<br />
            ${escapeHtml(new Date().toLocaleString("pt-BR"))}
          </div>
        </div>

        ${
          rows.length === 0
            ? `<div class="empty">Nenhuma transacao encontrada para os filtros selecionados.</div>`
            : `<table>
                <thead>
                  <tr>${tableHeader}</tr>
                </thead>
                <tbody>${tableRows}</tbody>
              </table>`
        }
      </body>
    </html>
  `);

  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

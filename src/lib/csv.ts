/**
 * Dependency-free CSV helpers (RFC 4180).
 * - parseCsv handles quoted fields, "" escapes, embedded commas/newlines,
 *   CRLF/LF line endings and a UTF-8 BOM (which Excel adds on export).
 * - toCsv / downloadCsv write a BOM so Excel opens ₹ and non-ASCII text
 *   correctly, and keep values raw (no ₹ / thousands separators) so numbers
 *   stay numeric in spreadsheets.
 */

export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < source.length) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      // \r\n or bare \r ends the row; a lone \n is handled below.
      if (source[i + 1] === "\n") i += 1;
      endRow();
      i += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  // Flush the final field/row unless the file ended with a newline.
  if (field !== "" || row.length > 0) endRow();
  return rows;
}

/** Header row → objects keyed by header (trimmed, empty cells become ""). */
export function csvToRecords(text: string): { headers: string[]; records: Record<string, string>[] } {
  const rows = parseCsv(text).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map((header) => header.trim());
  const records = rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (row[index] ?? "").trim();
    });
    return record;
  });
  return { headers, records };
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** Serialize a matrix of cells. First row is treated as the header. */
export function toCsv(rows: Array<Array<unknown>>): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}

/** Serialize records with an explicit column order. */
export function recordsToCsv(
  columns: Array<{ key: string; header: string }>,
  records: Array<Record<string, unknown>>,
): string {
  const matrix: Array<Array<unknown>> = [columns.map((column) => column.header)];
  for (const record of records) {
    matrix.push(columns.map((column) => record[column.key]));
  }
  return toCsv(matrix);
}

/** Trigger a browser download. The BOM keeps Excel happy with UTF-8. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Today as 2026-10-24, for filenames. */
export function todayStamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

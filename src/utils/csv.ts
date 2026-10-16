/**
 * Small, dependency-free CSV reader/writer (RFC 4180 style).
 * Handles quoted fields, escaped quotes (""), commas/newlines inside quotes,
 * Windows/Mac/Unix line endings, a UTF-8 BOM, and ; or tab separated files
 * (Excel in many European locales saves CSV with semicolons).
 */

export type Delimiter = ',' | ';' | '\t';

const BOM = '﻿';

/** Guesses the delimiter from the first line by counting candidates outside quotes. */
export function detectDelimiter(text: string): Delimiter {
  const counts: Record<Delimiter, number> = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (char === '\n' || char === '\r')) break;
    else if (!inQuotes && (char === ',' || char === ';' || char === '\t')) counts[char]++;
  }

  if (counts[';'] > counts[','] && counts[';'] >= counts['\t']) return ';';
  if (counts['\t'] > counts[',']) return '\t';
  return ',';
}

/** Parses CSV text into rows of cells. Completely empty rows are dropped. */
export function parseCsv(input: string, delimiter: Delimiter = detectDelimiter(input)): string[][] {
  const text = input.startsWith(BOM) ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);

    if (inQuotes) {
      if (char === '"') {
        if (text.charAt(i + 1) === '"') {
          field += '"'; // escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field === '') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text.charAt(i + 1) === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** Plain numbers and phone numbers like "+94 77 123 4567" or "-12.5" are safe as-is. */
const NUMBER_LIKE = /^[+-]?[\d\s().-]+$/;

/**
 * Stops "CSV injection": spreadsheet apps run cells starting with = + - @ as formulas,
 * which a malicious guest name could abuse. Such cells get a leading apostrophe.
 */
function neutralizeFormula(value: string): string {
  const first = value.charAt(0);
  if (first === '=' || first === '@' || first === '\t' || first === '\r') return `'${value}`;
  if ((first === '+' || first === '-') && !NUMBER_LIKE.test(value)) return `'${value}`;
  return value;
}

function escapeCell(value: string | number | boolean, delimiter: Delimiter): string {
  const text = neutralizeFormula(String(value));
  const needsQuotes =
    text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r');
  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Turns rows into CSV text. Starts with a BOM so Excel opens accented/Sinhala/Tamil
 * names correctly, and uses \r\n line endings as the CSV standard expects.
 */
export function toCsv(rows: (string | number | boolean)[][], delimiter: Delimiter = ','): string {
  return (
    BOM + rows.map((r) => r.map((cell) => escapeCell(cell, delimiter)).join(delimiter)).join('\r\n')
  );
}

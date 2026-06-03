import Papa from "papaparse";
import { validateHeaders } from "./csvSchemas";
import type { SourceSchema } from "../types/revenue";

export type RawCsvRow = Record<string, string>;

export interface ParsedCsv {
  rows: RawCsvRow[];
  headers: string[];
  missingColumns: string[];
  warnings: string[];
}

export function parseRevenueCsv(file: File, schema: SourceSchema) {
  return new Promise<ParsedCsv>((resolve, reject) => {
    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const headers = (results.meta.fields ?? []).filter(Boolean);
        const missingColumns = validateHeaders(headers, schema);
        const parseWarnings = results.errors.map(
          (error) => `Row ${error.row ?? "unknown"}: ${error.message}`,
        );
        const shapeWarning =
          headers.length &&
          headers.length !== schema.expectedColumns &&
          !schema.allowExtraColumns
            ? [
                `Expected ${schema.expectedColumns} columns for ${schema.sourceTab}; found ${headers.length}. Extra columns are ignored.`,
              ]
            : [];

        resolve({
          rows: results.data.filter((row) =>
            Object.values(row).some((value) => String(value ?? "").trim()),
          ),
          headers,
          missingColumns,
          warnings: [...shapeWarning, ...parseWarnings],
        });
      },
      error: (error) => reject(error),
    });
  });
}

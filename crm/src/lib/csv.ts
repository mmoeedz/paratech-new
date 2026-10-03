import Papa from "papaparse";

/** CSV with spreadsheet-formula neutralisation (cells starting with = + - @ are escaped). */
export function toCsv(fields: string[], data: (string | number | null | undefined)[][]): string {
  return Papa.unparse({ fields, data: data.map((r) => r.map((c) => c ?? "")) }, { escapeFormulae: true });
}

export function csvResponse(name: string, body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}

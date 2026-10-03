/** US (NANP) phone number helpers. Numbers are stored as +1XXXXXXXXXX. */

export type ParsedPhone =
  | { ok: true; e164: string; national: string }
  | { ok: false; reason: string };

export function parsePhone(input: string | null | undefined): ParsedPhone {
  if (!input) return { ok: false, reason: "empty" };
  // Drop an extension ("x123", "ext. 4") before looking at digits.
  const base = String(input).split(/\s*(?:ext\.?|x|#)\s*\d+\s*$/i)[0];
  let digits = base.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) {
    return { ok: false, reason: digits.length < 10 ? "too short" : "too long" };
  }
  const area = digits.slice(0, 3);
  const exchange = digits.slice(3, 6);
  // NANP: area and exchange codes can't start with 0/1; N11 codes are services.
  if (!/^[2-9]/.test(area) || !/^[2-9]/.test(exchange)) {
    return { ok: false, reason: "not a valid US number" };
  }
  if (area.endsWith("11") || exchange.endsWith("11")) {
    return { ok: false, reason: "not a valid US number" };
  }
  if (/^(\d)\1{9}$/.test(digits)) {
    return { ok: false, reason: "placeholder number" };
  }
  return { ok: true, e164: `+1${digits}`, national: digits };
}

/** +15125551234 -> (512) 555-1234 */
export function formatPhone(e164: string | null | undefined): string {
  const m = e164?.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : (e164 ?? "");
}

/** Every phone-like substring in a free-text cell ("512-555-1234 / 737 555 9999"). */
export function splitPhones(cell: string | null | undefined): string[] {
  if (!cell) return [];
  return String(cell)
    .split(/[;,/|\n]+|\s{2,}|\sor\s/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Lower-cased, punctuation-free business name used for duplicate detection. */
export function nameKey(name: string | null | undefined): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(llc|l l c|inc|incorporated|corp|corporation|co|company|ltd|pllc|pc|the)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

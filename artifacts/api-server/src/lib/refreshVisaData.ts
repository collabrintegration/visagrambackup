import { db, countriesTable, visasTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

// Passport Index public dataset (ISO-2 column headers version)
// Falls back to name-based CSV if ISO version is unavailable
const ISO_CSV_URL =
  "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-matrix-iso2.csv";
const NAME_CSV_URL =
  "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-matrix.csv";

// Partial name→ISO map for the countries we support
const NAME_TO_CODE: Record<string, string> = {
  "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Angola": "AO",
  "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT",
  "Azerbaijan": "AZ", "Bahrain": "BH", "Bangladesh": "BD", "Belarus": "BY",
  "Belgium": "BE", "Bolivia": "BO", "Bosnia and Herzegovina": "BA",
  "Botswana": "BW", "Brazil": "BR", "Bulgaria": "BG", "Cambodia": "KH",
  "Cameroon": "CM", "Canada": "CA", "Chile": "CL", "China": "CN",
  "Colombia": "CO", "Croatia": "HR", "Cuba": "CU", "Czech Republic": "CZ",
  "Czechia": "CZ", "Denmark": "DK", "Ecuador": "EC", "Egypt": "EG",
  "Estonia": "EE", "Ethiopia": "ET", "Fiji": "FJ", "Finland": "FI",
  "France": "FR", "Germany": "DE", "Ghana": "GH", "Greece": "GR",
  "Hungary": "HU", "Iceland": "IS", "India": "IN", "Indonesia": "ID",
  "Iran": "IR", "Iraq": "IQ", "Ireland": "IE", "Israel": "IL",
  "Italy": "IT", "Japan": "JP", "Jordan": "JO", "Kazakhstan": "KZ",
  "Kenya": "KE", "Kosovo": "XK", "Kuwait": "KW", "Latvia": "LV",
  "Lebanon": "LB", "Libya": "LY", "Lithuania": "LT", "Luxembourg": "LU",
  "Malaysia": "MY", "Mexico": "MX", "Morocco": "MA", "Mozambique": "MZ",
  "Myanmar": "MM", "Netherlands": "NL", "New Zealand": "NZ",
  "Nigeria": "NG", "Norway": "NO", "Oman": "OM", "Pakistan": "PK",
  "Palestine": "PS", "Peru": "PE", "Philippines": "PH", "Poland": "PL",
  "Portugal": "PT", "Qatar": "QA", "Romania": "RO", "Russia": "RU",
  "Russian Federation": "RU", "Rwanda": "RW", "Saudi Arabia": "SA",
  "Senegal": "SN", "Serbia": "RS", "Singapore": "SG", "Slovakia": "SK",
  "Slovenia": "SI", "Somalia": "SO", "South Africa": "ZA",
  "South Korea": "KR", "Korea, South": "KR", "Korea (Republic of)": "KR",
  "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD", "Sweden": "SE",
  "Switzerland": "CH", "Syria": "SY", "Taiwan": "TW", "Tanzania": "TZ",
  "Thailand": "TH", "Tunisia": "TN", "Turkey": "TR", "Türkiye": "TR",
  "Uganda": "UG", "Ukraine": "UA", "United Arab Emirates": "AE",
  "United Kingdom": "GB", "United States": "US", "Uruguay": "UY",
  "Uzbekistan": "UZ", "Venezuela": "VE", "Vietnam": "VN",
  "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW",
};

type ParsedEntry = { entryType: string; durationDays: number | null };

function parseValue(raw: string): ParsedEntry | null {
  const v = raw.trim().toUpperCase();
  if (!v || v === "NA" || v === "-1") return null;            // not applicable / same country
  if (v === "CB" || v === "NI") return null;                  // closed border / no info — skip
  if (v === "VR" || v === "0") return { entryType: "visa_required", durationDays: null };
  if (v === "VOA") return { entryType: "visa_on_arrival", durationDays: null };
  if (v === "E-VISA" || v === "EVISA" || v === "ETA") return { entryType: "evisa", durationDays: null };
  if (v === "VF") return { entryType: "visa_free", durationDays: null };
  const days = parseInt(v);
  if (!isNaN(days) && days > 0) return { entryType: "visa_free", durationDays: days };
  return null;
}

function resolveCode(raw: string, isISO: boolean): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (isISO) {
    const code = s.toUpperCase();
    return code.length === 2 ? code : null;
  }
  return NAME_TO_CODE[s] ?? null;
}

async function fetchCSV(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function refreshVisaData(): Promise<{ updated: number; source: string }> {
  logger.info("Visa data refresh: starting…");

  // Try ISO version first, fall back to name-based
  let csv = await fetchCSV(ISO_CSV_URL);
  let isISO = true;
  let source = "passport-index-iso2";

  if (!csv) {
    csv = await fetchCSV(NAME_CSV_URL);
    isISO = false;
    source = "passport-index-names";
  }

  if (!csv) {
    logger.warn("Visa data refresh: could not fetch data from Passport Index — skipping");
    return { updated: 0, source: "none" };
  }

  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    logger.warn("Visa data refresh: CSV appears empty");
    return { updated: 0, source };
  }

  // Header row: first cell is label ("Passport"), rest are destination codes/names
  const headers = lines[0].split(",");
  const destCodes = headers.slice(1).map((h) => resolveCode(h, isISO));

  // Load our supported country codes once
  const supportedRows = await db.select({ code: countriesTable.code }).from(countriesTable);
  const supported = new Set(supportedRows.map((r) => r.code));

  // Batch upserts for efficiency — collect all rows then insert in chunks
  type UpsertRow = {
    passportCountryCode: string;
    destinationCountryCode: string;
    visaType: string;
    entryType: string;
    durationDays: number | null;
  };

  const rows: UpsertRow[] = [];

  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    const passportCode = resolveCode(cols[0], isISO);
    if (!passportCode || !supported.has(passportCode)) continue;

    for (let i = 1; i < cols.length; i++) {
      const destCode = destCodes[i - 1];
      if (!destCode || !supported.has(destCode) || destCode === passportCode) continue;

      const parsed = parseValue(cols[i] ?? "");
      if (!parsed) continue;

      rows.push({
        passportCountryCode: passportCode,
        destinationCountryCode: destCode,
        visaType: "tourist",
        entryType: parsed.entryType,
        durationDays: parsed.durationDays,
      });
    }
  }

  if (rows.length === 0) {
    logger.warn("Visa data refresh: no usable rows parsed from CSV");
    return { updated: 0, source };
  }

  // Upsert in chunks of 200 to avoid parameter limits
  const CHUNK = 200;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await db
      .insert(visasTable)
      .values(chunk)
      .onConflictDoUpdate({
        target: [
          visasTable.passportCountryCode,
          visasTable.destinationCountryCode,
          visasTable.visaType,
        ],
        set: {
          entryType: sql`EXCLUDED.entry_type`,
          durationDays: sql`EXCLUDED.duration_days`,
        },
      });
    upserted += chunk.length;
  }

  logger.info({ updated: upserted, source }, "Visa data refresh: complete");
  return { updated: upserted, source };
}

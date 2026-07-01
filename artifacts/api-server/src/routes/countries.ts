import { Router } from "express";
import { db, countriesTable, visasTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";

const router = Router();

router.get("/countries", async (req, res) => {
  const { search, continent } = req.query as Record<string, string | undefined>;

  const conditions = [];
  if (search) conditions.push(ilike(countriesTable.name, `%${search}%`));
  if (continent) conditions.push(eq(countriesTable.continent, continent));

  const countries = await db
    .select({
      code: countriesTable.code,
      name: countriesTable.name,
      continent: countriesTable.continent,
      flagEmoji: countriesTable.flagEmoji,
      capital: countriesTable.capital,
      currency: countriesTable.currency,
      language: countriesTable.language,
    })
    .from(countriesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(countriesTable.name);

  const visaFreeCounts = await db
    .select({
      passportCountryCode: visasTable.passportCountryCode,
      count: sql<number>`count(*)::int`,
    })
    .from(visasTable)
    .where(eq(visasTable.entryType, "visa_free"))
    .groupBy(visasTable.passportCountryCode);

  const freeCountMap = new Map(
    visaFreeCounts.map((r) => [r.passportCountryCode, r.count])
  );

  const result = countries.map((c) => ({
    ...c,
    visaFreeCount: freeCountMap.get(c.code) ?? 0,
  }));

  res.json(result);
});

router.get("/countries/:code", async (req, res) => {
  const { code } = req.params;

  const country = await db
    .select()
    .from(countriesTable)
    .where(eq(countriesTable.code, code.toUpperCase()))
    .limit(1);

  if (!country[0]) {
    res.status(404).json({ error: "Country not found" });
    return;
  }

  const passportCountryCodes = db
    .select({ code: countriesTable.code })
    .from(countriesTable);

  const visas = await db
    .select({
      id: visasTable.id,
      passportCountryCode: visasTable.passportCountryCode,
      destinationCountryCode: visasTable.destinationCountryCode,
      visaType: visasTable.visaType,
      entryType: visasTable.entryType,
      fee: visasTable.fee,
      feeCurrency: visasTable.feeCurrency,
      durationDays: visasTable.durationDays,
      validityDays: visasTable.validityDays,
      processingDays: visasTable.processingDays,
      entries: visasTable.entries,
      officialUrl: visasTable.officialUrl,
      passportCountryName: countriesTable.name,
      passportCountryFlag: countriesTable.flagEmoji,
    })
    .from(visasTable)
    .innerJoin(
      countriesTable,
      eq(visasTable.passportCountryCode, countriesTable.code)
    )
    .where(eq(visasTable.destinationCountryCode, code.toUpperCase()))
    .orderBy(visasTable.entryType, countriesTable.name);

  const c = country[0];
  res.json({
    code: c.code,
    name: c.name,
    continent: c.continent,
    flagEmoji: c.flagEmoji,
    capital: c.capital,
    currency: c.currency,
    language: c.language,
    description: c.description,
    visas: visas.map((v) => ({
      id: v.id,
      passportCountryCode: v.passportCountryCode,
      passportCountryName: v.passportCountryName,
      passportCountryFlag: v.passportCountryFlag,
      destinationCountryCode: v.destinationCountryCode,
      destinationCountryName: c.name,
      destinationCountryFlag: c.flagEmoji,
      visaType: v.visaType,
      entryType: v.entryType,
      fee: v.fee ? parseFloat(v.fee) : null,
      durationDays: v.durationDays,
      validityDays: v.validityDays,
      processingDays: v.processingDays,
      entries: v.entries,
      officialUrl: v.officialUrl,
    })),
  });
});

export default router;

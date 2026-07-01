import { Router } from "express";
import { db, visasTable, countriesTable } from "@workspace/db";
import { eq, and, lte, gte, ilike, sql, asc, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const router = Router();

router.get("/visas", async (req, res) => {
  const {
    passportCountry,
    destinationCountry,
    visaType,
    entryType,
    continent,
    maxFee,
    minDuration,
    sortBy,
    order,
    limit: limitStr,
    offset: offsetStr,
  } = req.query as Record<string, string | undefined>;

  const passportCountries = alias(countriesTable, "passport_countries");
  const destinationCountries = alias(countriesTable, "destination_countries");

  const conditions = [];
  if (passportCountry)
    conditions.push(eq(visasTable.passportCountryCode, passportCountry.toUpperCase()));
  if (destinationCountry)
    conditions.push(eq(visasTable.destinationCountryCode, destinationCountry.toUpperCase()));
  if (visaType) conditions.push(eq(visasTable.visaType, visaType));
  if (entryType) conditions.push(eq(visasTable.entryType, entryType));
  if (continent) conditions.push(eq(destinationCountries.continent, continent));
  if (maxFee) conditions.push(lte(sql`${visasTable.fee}::numeric`, parseFloat(maxFee)));
  if (minDuration) conditions.push(gte(visasTable.durationDays, parseInt(minDuration)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const limit = Math.min(parseInt(limitStr ?? "50"), 200);
  const offset = parseInt(offsetStr ?? "0");

  const sortColumn = (() => {
    const dir = order === "desc" ? desc : asc;
    switch (sortBy) {
      case "fee": return dir(sql`${visasTable.fee}::numeric`);
      case "duration": return dir(visasTable.durationDays);
      case "processingDays": return dir(visasTable.processingDays);
      case "country": return dir(destinationCountries.name);
      default: return asc(destinationCountries.name);
    }
  })();

  const [visas, totalResult] = await Promise.all([
    db
      .select({
        id: visasTable.id,
        passportCountryCode: visasTable.passportCountryCode,
        passportCountryName: passportCountries.name,
        passportCountryFlag: passportCountries.flagEmoji,
        destinationCountryCode: visasTable.destinationCountryCode,
        destinationCountryName: destinationCountries.name,
        destinationCountryFlag: destinationCountries.flagEmoji,
        visaType: visasTable.visaType,
        entryType: visasTable.entryType,
        fee: visasTable.fee,
        durationDays: visasTable.durationDays,
        processingDays: visasTable.processingDays,
      })
      .from(visasTable)
      .innerJoin(passportCountries, eq(visasTable.passportCountryCode, passportCountries.code))
      .innerJoin(destinationCountries, eq(visasTable.destinationCountryCode, destinationCountries.code))
      .where(whereClause)
      .orderBy(sortColumn)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(visasTable)
      .innerJoin(passportCountries, eq(visasTable.passportCountryCode, passportCountries.code))
      .innerJoin(destinationCountries, eq(visasTable.destinationCountryCode, destinationCountries.code))
      .where(whereClause),
  ]);

  res.json({
    total: totalResult[0]?.count ?? 0,
    visas: visas.map((v) => ({
      ...v,
      fee: v.fee ? parseFloat(v.fee) : null,
    })),
  });
});

router.get("/visas/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid visa ID" });
    return;
  }

  const passportCountries = alias(countriesTable, "passport_countries");
  const destinationCountries = alias(countriesTable, "destination_countries");

  const result = await db
    .select({
      id: visasTable.id,
      passportCountryCode: visasTable.passportCountryCode,
      passportCountryName: passportCountries.name,
      passportCountryFlag: passportCountries.flagEmoji,
      destinationCountryCode: visasTable.destinationCountryCode,
      destinationCountryName: destinationCountries.name,
      destinationCountryFlag: destinationCountries.flagEmoji,
      destinationContinent: destinationCountries.continent,
      visaType: visasTable.visaType,
      entryType: visasTable.entryType,
      fee: visasTable.fee,
      feeCurrency: visasTable.feeCurrency,
      durationDays: visasTable.durationDays,
      validityDays: visasTable.validityDays,
      processingDays: visasTable.processingDays,
      entries: visasTable.entries,
      requirements: visasTable.requirements,
      notes: visasTable.notes,
      officialUrl: visasTable.officialUrl,
    })
    .from(visasTable)
    .innerJoin(passportCountries, eq(visasTable.passportCountryCode, passportCountries.code))
    .innerJoin(destinationCountries, eq(visasTable.destinationCountryCode, destinationCountries.code))
    .where(eq(visasTable.id, id))
    .limit(1);

  if (!result[0]) {
    res.status(404).json({ error: "Visa not found" });
    return;
  }

  const v = result[0];
  res.json({
    ...v,
    fee: v.fee ? parseFloat(v.fee) : null,
    requirements: v.requirements ? JSON.parse(v.requirements) : [],
  });
});

router.get("/passport/destinations", async (req, res) => {
  const { passportCode, entryType, continent, sortBy, order } = req.query as Record<
    string,
    string | undefined
  >;

  if (!passportCode) {
    res.status(400).json({ error: "passportCode is required" });
    return;
  }

  const code = passportCode.toUpperCase();

  const passportCountry = await db
    .select()
    .from(countriesTable)
    .where(eq(countriesTable.code, code))
    .limit(1);

  if (!passportCountry[0]) {
    res.status(404).json({ error: "Passport country not found" });
    return;
  }

  const destinationCountries = alias(countriesTable, "destination_countries");

  const conditions = [eq(visasTable.passportCountryCode, code)];
  if (entryType) conditions.push(eq(visasTable.entryType, entryType));
  if (continent) conditions.push(eq(destinationCountries.continent, continent));

  const sortColumn = (() => {
    const dir = order === "desc" ? desc : asc;
    switch (sortBy) {
      case "fee": return dir(sql`${visasTable.fee}::numeric`);
      case "duration": return dir(visasTable.durationDays);
      default: return asc(destinationCountries.name);
    }
  })();

  const destinations = await db
    .select({
      id: visasTable.id,
      passportCountryCode: visasTable.passportCountryCode,
      passportCountryName: sql<string>`${passportCountry[0].name}`,
      passportCountryFlag: sql<string>`${passportCountry[0].flagEmoji}`,
      destinationCountryCode: visasTable.destinationCountryCode,
      destinationCountryName: destinationCountries.name,
      destinationCountryFlag: destinationCountries.flagEmoji,
      visaType: visasTable.visaType,
      entryType: visasTable.entryType,
      fee: visasTable.fee,
      durationDays: visasTable.durationDays,
      processingDays: visasTable.processingDays,
    })
    .from(visasTable)
    .innerJoin(destinationCountries, eq(visasTable.destinationCountryCode, destinationCountries.code))
    .where(and(...conditions))
    .orderBy(sortColumn);

  const counts = { visa_free: 0, visa_on_arrival: 0, evisa: 0, visa_required: 0 };
  for (const d of destinations) {
    const key = d.entryType as keyof typeof counts;
    if (key in counts) counts[key]++;
  }

  const pc = passportCountry[0];
  res.json({
    passportCountryCode: pc.code,
    passportCountryName: pc.name,
    passportCountryFlag: pc.flagEmoji,
    totalDestinations: destinations.length,
    visaFreeCount: counts.visa_free,
    visaOnArrivalCount: counts.visa_on_arrival,
    evisaCount: counts.evisa,
    visaRequiredCount: counts.visa_required,
    destinations: destinations.map((d) => ({
      ...d,
      fee: d.fee ? parseFloat(d.fee) : null,
    })),
  });
});

router.get("/stats/overview", async (req, res) => {
  const [
    totalCountries,
    totalVisas,
    entryTypeCounts,
    topPassports,
    topDestinations,
    continentBreakdown,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(countriesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(visasTable),
    db
      .select({
        entryType: visasTable.entryType,
        count: sql<number>`count(*)::int`,
      })
      .from(visasTable)
      .groupBy(visasTable.entryType),
    db
      .select({
        countryCode: visasTable.passportCountryCode,
        countryName: countriesTable.name,
        flagEmoji: countriesTable.flagEmoji,
        visaFreeCount: sql<number>`count(*)::int`,
      })
      .from(visasTable)
      .innerJoin(countriesTable, eq(visasTable.passportCountryCode, countriesTable.code))
      .where(eq(visasTable.entryType, "visa_free"))
      .groupBy(visasTable.passportCountryCode, countriesTable.name, countriesTable.flagEmoji)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db
      .select({
        countryCode: visasTable.destinationCountryCode,
        countryName: countriesTable.name,
        flagEmoji: countriesTable.flagEmoji,
        visaFreePassportCount: sql<number>`count(*)::int`,
      })
      .from(visasTable)
      .innerJoin(countriesTable, eq(visasTable.destinationCountryCode, countriesTable.code))
      .where(eq(visasTable.entryType, "visa_free"))
      .groupBy(visasTable.destinationCountryCode, countriesTable.name, countriesTable.flagEmoji)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db
      .select({
        continent: countriesTable.continent,
        countryCount: sql<number>`count(*)::int`,
      })
      .from(countriesTable)
      .groupBy(countriesTable.continent)
      .orderBy(countriesTable.continent),
  ]);

  const totalVisaRecords = totalVisas[0]?.count ?? 0;
  const visaFreeCount = entryTypeCounts.find((e) => e.entryType === "visa_free")?.count ?? 0;
  const visaFreePercent =
    totalVisaRecords > 0 ? (visaFreeCount / totalVisaRecords) * 100 : 0;

  res.json({
    totalCountries: totalCountries[0]?.count ?? 0,
    totalVisaRecords,
    visaFreePercent: Math.round(visaFreePercent * 10) / 10,
    mostAccessiblePassports: topPassports,
    popularDestinations: topDestinations,
    continentBreakdown: continentBreakdown.map((c) => ({
      continent: c.continent,
      countryCount: c.countryCount,
      avgVisaFee: null,
    })),
  });
});

export default router;

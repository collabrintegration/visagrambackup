import { Router } from "express";
import { db, visaApplicationsTable, usersTable, countriesTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";

const router = Router();

function computeProcessingDays(applicationDate: string, grantedDate: string | null | undefined, status: string): number | null {
  if (!applicationDate) return null;
  const start = new Date(applicationDate);
  if (isNaN(start.getTime())) return null;
  if (grantedDate) {
    const end = new Date(grantedDate);
    if (!isNaN(end.getTime())) return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
  }
  if (status === "approved" || status === "rejected" || status === "withdrawn") return null;
  return Math.max(0, Math.round((Date.now() - start.getTime()) / 86400000));
}

router.get("/visa-tracker", async (req, res) => {
  const apps = await db
    .select({
      id: visaApplicationsTable.id,
      userId: visaApplicationsTable.userId,
      countryCode: visaApplicationsTable.countryCode,
      countryName: visaApplicationsTable.countryName,
      passportCode: visaApplicationsTable.passportCode,
      visaType: visaApplicationsTable.visaType,
      applicationDate: visaApplicationsTable.applicationDate,
      status: visaApplicationsTable.status,
      grantedDate: visaApplicationsTable.grantedDate,
      comment: visaApplicationsTable.comment,
      createdAt: visaApplicationsTable.createdAt,
      updatedAt: visaApplicationsTable.updatedAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      passportName: countriesTable.name,
      passportFlag: countriesTable.flagEmoji,
    })
    .from(visaApplicationsTable)
    .leftJoin(usersTable, eq(visaApplicationsTable.userId, usersTable.id))
    .leftJoin(countriesTable, eq(sql`upper(${visaApplicationsTable.passportCode})`, countriesTable.code))
    .orderBy(desc(visaApplicationsTable.createdAt));

  res.json(apps.map((a) => ({
    ...a,
    processingDays: computeProcessingDays(a.applicationDate, a.grantedDate, a.status),
  })));
});

router.get("/visa-tracker/analytics", async (req, res) => {
  const apps = await db
    .select({
      passportCode: visaApplicationsTable.passportCode,
      countryCode: visaApplicationsTable.countryCode,
      countryName: visaApplicationsTable.countryName,
      visaType: visaApplicationsTable.visaType,
      status: visaApplicationsTable.status,
      applicationDate: visaApplicationsTable.applicationDate,
      grantedDate: visaApplicationsTable.grantedDate,
      passportName: countriesTable.name,
      passportFlag: countriesTable.flagEmoji,
    })
    .from(visaApplicationsTable)
    .leftJoin(countriesTable, eq(sql`upper(${visaApplicationsTable.passportCode})`, countriesTable.code))
    .orderBy(desc(visaApplicationsTable.createdAt));

  const all = apps.map((a) => ({
    ...a,
    processingDays: computeProcessingDays(a.applicationDate, a.grantedDate, a.status),
  }));

  const total = all.length;
  const approved = all.filter((a) => a.status === "approved").length;
  const pending = all.filter((a) => a.status === "applied" || a.status === "in_review").length;
  const rejected = all.filter((a) => a.status === "rejected").length;

  const decided = all.filter((a) => a.grantedDate);
  const avgDays = decided.length
    ? +(decided.reduce((s, a) => s + (computeProcessingDays(a.applicationDate, a.grantedDate, a.status) ?? 0), 0) / decided.length).toFixed(1)
    : null;

  const passportMap = new Map<string, { code: string; name: string | null; flag: string | null; total: number; approved: number; rejected: number; days: number[] }>();
  for (const a of all) {
    const key = (a.passportCode ?? "unknown").toUpperCase();
    const entry = passportMap.get(key) ?? { code: key, name: a.passportName ?? null, flag: a.passportFlag ?? null, total: 0, approved: 0, rejected: 0, days: [] };
    entry.total++;
    if (a.status === "approved") entry.approved++;
    if (a.status === "rejected") entry.rejected++;
    const d = computeProcessingDays(a.applicationDate, a.grantedDate, a.status);
    if (a.grantedDate && d != null) entry.days.push(d);
    passportMap.set(key, entry);
  }

  const countryMap = new Map<string, { code: string; name: string; total: number; approved: number; days: number[] }>();
  for (const a of all) {
    const key = a.countryCode.toUpperCase();
    const entry = countryMap.get(key) ?? { code: key, name: a.countryName, total: 0, approved: 0, days: [] };
    entry.total++;
    if (a.status === "approved") entry.approved++;
    const d = computeProcessingDays(a.applicationDate, a.grantedDate, a.status);
    if (a.grantedDate && d != null) entry.days.push(d);
    countryMap.set(key, entry);
  }

  const byPassport = [...passportMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)
    .map((p) => ({
      passportCode: p.code,
      passportName: p.name,
      passportFlag: p.flag,
      total: p.total,
      approved: p.approved,
      rejected: p.rejected,
      approvalRate: p.total > 0 ? +((p.approved / p.total) * 100).toFixed(1) : null,
      avgDays: p.days.length ? +(p.days.reduce((s, d) => s + d, 0) / p.days.length).toFixed(1) : null,
    }));

  const byCountry = [...countryMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)
    .map((c) => ({
      countryCode: c.code,
      countryName: c.name,
      total: c.total,
      approved: c.approved,
      approvalRate: c.total > 0 ? +((c.approved / c.total) * 100).toFixed(1) : null,
      avgDays: c.days.length ? +(c.days.reduce((s, d) => s + d, 0) / c.days.length).toFixed(1) : null,
    }));

  const byVisaType = ["travel", "work", "study", "pr", "citizenship"].map((vt) => {
    const rows = all.filter((a) => a.visaType === vt);
    const appr = rows.filter((a) => a.status === "approved");
    const days = rows.filter((a) => a.grantedDate).map((a) => computeProcessingDays(a.applicationDate, a.grantedDate, a.status)).filter((d): d is number => d != null);
    return {
      visaType: vt,
      total: rows.length,
      approved: appr.length,
      approvalRate: rows.length > 0 ? +((appr.length / rows.length) * 100).toFixed(1) : null,
      avgDays: days.length ? +(days.reduce((s, d) => s + d, 0) / days.length).toFixed(1) : null,
    };
  }).filter((r) => r.total > 0);

  res.json({ total, approved, pending, rejected, avgDays, byPassport, byCountry, byVisaType });
});

router.post("/visa-tracker", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { countryCode, countryName, passportCode, visaType, applicationDate, status, comment } = req.body as {
    countryCode: string;
    countryName: string;
    passportCode?: string;
    visaType: string;
    applicationDate: string;
    status?: string;
    comment?: string;
  };

  if (!countryCode || !countryName || !visaType || !applicationDate) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }

  const [app] = await db
    .insert(visaApplicationsTable)
    .values({
      userId: req.user!.id,
      countryCode,
      countryName,
      passportCode: passportCode ? passportCode.toUpperCase() : null,
      visaType,
      applicationDate,
      status: status ?? "applied",
      comment: comment ?? null,
    })
    .returning();

  res.status(201).json({ ...app, processingDays: computeProcessingDays(app.applicationDate, app.grantedDate, app.status) });
});

router.patch("/visa-tracker/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = Number(req.params.id);
  const [existing] = await db
    .select()
    .from(visaApplicationsTable)
    .where(eq(visaApplicationsTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.userId !== req.user!.id) { res.status(403).json({ error: "Forbidden" }); return; }

  const { status, grantedDate, comment } = req.body as {
    status?: string;
    grantedDate?: string | null;
    comment?: string | null;
  };

  const updates: Partial<typeof visaApplicationsTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (status !== undefined) {
    updates.status = status;
    if (status === "approved" && !existing.grantedDate) {
      updates.grantedDate = new Date().toISOString().split("T")[0];
    }
  }
  if (grantedDate !== undefined) updates.grantedDate = grantedDate ?? null;
  if (comment !== undefined) updates.comment = comment ?? null;

  const [updated] = await db
    .update(visaApplicationsTable)
    .set(updates)
    .where(eq(visaApplicationsTable.id, id))
    .returning();

  res.json({ ...updated, processingDays: computeProcessingDays(updated.applicationDate, updated.grantedDate, updated.status) });
});

router.delete("/visa-tracker/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = Number(req.params.id);
  const [existing] = await db
    .select()
    .from(visaApplicationsTable)
    .where(eq(visaApplicationsTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.userId !== req.user!.id) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(visaApplicationsTable).where(eq(visaApplicationsTable.id, id));
  res.status(204).end();
});

export default router;

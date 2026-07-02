import { Router, type IRouter, type Request, type Response } from "express";
import { db, visaGuideEntriesTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

// ── List entries ────────────────────────────────────────────────────────────
router.get("/visa-guide", async (req: Request, res: Response) => {
  const { countryCode, category } = req.query as { countryCode?: string; category?: string };

  let query = db
    .select({
      id: visaGuideEntriesTable.id,
      userId: visaGuideEntriesTable.userId,
      countryCode: visaGuideEntriesTable.countryCode,
      countryName: visaGuideEntriesTable.countryName,
      category: visaGuideEntriesTable.category,
      visaRequired: visaGuideEntriesTable.visaRequired,
      processingTime: visaGuideEntriesTable.processingTime,
      officialFee: visaGuideEntriesTable.officialFee,
      maxStay: visaGuideEntriesTable.maxStay,
      requirements: visaGuideEntriesTable.requirements,
      applicationUrl: visaGuideEntriesTable.applicationUrl,
      notes: visaGuideEntriesTable.notes,
      createdAt: visaGuideEntriesTable.createdAt,
      updatedAt: visaGuideEntriesTable.updatedAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
    })
    .from(visaGuideEntriesTable)
    .leftJoin(usersTable, eq(usersTable.id, visaGuideEntriesTable.userId))
    .$dynamic();

  const conditions = [];
  if (countryCode) conditions.push(eq(visaGuideEntriesTable.countryCode, countryCode));
  if (category) conditions.push(eq(visaGuideEntriesTable.category, category));
  if (conditions.length > 0) query = query.where(and(...conditions));

  const rows = await query.orderBy(desc(visaGuideEntriesTable.createdAt));
  res.json(rows);
});

// ── Create entry ────────────────────────────────────────────────────────────
router.post("/visa-guide", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;

  const { countryCode, countryName, category, visaRequired = true, processingTime, officialFee, maxStay, requirements, applicationUrl, notes } = req.body as {
    countryCode?: string;
    countryName?: string;
    category?: string;
    visaRequired?: boolean;
    processingTime?: string;
    officialFee?: string;
    maxStay?: string;
    requirements?: string;
    applicationUrl?: string;
    notes?: string;
  };

  if (!countryCode || !countryName || !category) {
    res.status(400).json({ error: "countryCode, countryName, and category are required" });
    return;
  }

  const [entry] = await db
    .insert(visaGuideEntriesTable)
    .values({
      userId,
      countryCode,
      countryName,
      category,
      visaRequired,
      processingTime: processingTime || null,
      officialFee: officialFee || null,
      maxStay: maxStay || null,
      requirements: requirements || null,
      applicationUrl: applicationUrl || null,
      notes: notes || null,
    })
    .returning();

  const user = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.status(201).json({ ...entry, firstName: user[0]?.firstName ?? null, lastName: user[0]?.lastName ?? null });
});

// ── Update entry ────────────────────────────────────────────────────────────
router.patch("/visa-guide/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const entryId = Number(req.params.id);

  const existing = await db.select().from(visaGuideEntriesTable).where(eq(visaGuideEntriesTable.id, entryId)).limit(1);
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }
  if (existing[0].userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { visaRequired, processingTime, officialFee, maxStay, requirements, applicationUrl, notes } = req.body as {
    visaRequired?: boolean;
    processingTime?: string;
    officialFee?: string;
    maxStay?: string;
    requirements?: string;
    applicationUrl?: string;
    notes?: string;
  };

  const [updated] = await db
    .update(visaGuideEntriesTable)
    .set({
      ...(visaRequired !== undefined ? { visaRequired } : {}),
      ...(processingTime !== undefined ? { processingTime: processingTime || null } : {}),
      ...(officialFee !== undefined ? { officialFee: officialFee || null } : {}),
      ...(maxStay !== undefined ? { maxStay: maxStay || null } : {}),
      ...(requirements !== undefined ? { requirements: requirements || null } : {}),
      ...(applicationUrl !== undefined ? { applicationUrl: applicationUrl || null } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(visaGuideEntriesTable.id, entryId))
    .returning();

  const user = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ ...updated, firstName: user[0]?.firstName ?? null, lastName: user[0]?.lastName ?? null });
});

// ── Delete entry ────────────────────────────────────────────────────────────
router.delete("/visa-guide/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const entryId = Number(req.params.id);

  const existing = await db.select({ userId: visaGuideEntriesTable.userId }).from(visaGuideEntriesTable).where(eq(visaGuideEntriesTable.id, entryId)).limit(1);
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }
  if (existing[0].userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(visaGuideEntriesTable).where(eq(visaGuideEntriesTable.id, entryId));
  res.status(204).end();
});

export default router;

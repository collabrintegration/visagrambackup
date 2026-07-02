import { Router } from "express";
import { db, visaApplicationsTable, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

router.get("/visa-tracker", async (req, res) => {
  const apps = await db
    .select({
      id: visaApplicationsTable.id,
      userId: visaApplicationsTable.userId,
      countryCode: visaApplicationsTable.countryCode,
      countryName: visaApplicationsTable.countryName,
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
    })
    .from(visaApplicationsTable)
    .leftJoin(usersTable, eq(visaApplicationsTable.userId, usersTable.id))
    .orderBy(desc(visaApplicationsTable.createdAt));

  res.json(apps);
});

router.post("/visa-tracker", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { countryCode, countryName, visaType, applicationDate, status, comment } = req.body as {
    countryCode: string;
    countryName: string;
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
      visaType,
      applicationDate,
      status: status ?? "applied",
      comment: comment ?? null,
    })
    .returning();

  res.status(201).json(app);
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

  res.json(updated);
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

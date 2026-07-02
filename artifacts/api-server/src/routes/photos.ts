import { Router } from "express";
import { db } from "@workspace/db";
import { travelPhotosTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

router.get("/photos", async (req, res) => {
  const { countryCode, userId, limit = "24", offset = "0" } = req.query as Record<string, string>;

  let query = db
    .select()
    .from(travelPhotosTable)
    .where(eq(travelPhotosTable.isPublic, true))
    .orderBy(desc(travelPhotosTable.createdAt))
    .limit(Math.min(Number(limit), 50))
    .offset(Number(offset));

  const conditions = [eq(travelPhotosTable.isPublic, true)];
  if (countryCode) conditions.push(eq(travelPhotosTable.countryCode, countryCode));
  if (userId) conditions.push(eq(travelPhotosTable.userId, userId));

  const photos = await db
    .select()
    .from(travelPhotosTable)
    .where(and(...conditions))
    .orderBy(desc(travelPhotosTable.createdAt))
    .limit(Math.min(Number(limit), 50))
    .offset(Number(offset));

  res.json({ photos, total: photos.length });
});

router.post("/photos", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { countryCode, objectPath, caption, orientation } = req.body as {
    countryCode: string;
    objectPath: string;
    caption?: string;
    orientation?: string;
  };

  if (!countryCode || !objectPath) {
    return res.status(400).json({ error: "countryCode and objectPath are required" });
  }

  const [photo] = await db
    .insert(travelPhotosTable)
    .values({
      userId: req.user.id,
      countryCode: countryCode.toUpperCase(),
      objectPath,
      caption: caption ?? null,
      orientation: orientation ?? "landscape",
      isPublic: true,
    })
    .returning();

  return res.status(201).json(photo);
});

router.delete("/photos/:id", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [photo] = await db
    .select()
    .from(travelPhotosTable)
    .where(and(eq(travelPhotosTable.id, id), eq(travelPhotosTable.userId, req.user.id)));

  if (!photo) return res.status(404).json({ error: "Not found" });

  await db.delete(travelPhotosTable).where(eq(travelPhotosTable.id, id));

  return res.json({ ok: true });
});

export default router;

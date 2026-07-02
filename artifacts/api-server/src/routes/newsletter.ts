import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { newsletterTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/newsletter/subscribe", async (req: Request, res: Response) => {
  const { email, source } = req.body as { email?: string; source?: string };

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }

  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  const [existing] = await db
    .select({ id: newsletterTable.id })
    .from(newsletterTable)
    .where(eq(newsletterTable.email, clean))
    .limit(1);

  if (existing) {
    res.json({ success: true, alreadySubscribed: true });
    return;
  }

  await db.insert(newsletterTable).values({
    email: clean,
    source: source ?? "website",
  });

  res.json({ success: true, alreadySubscribed: false });
});

export default router;

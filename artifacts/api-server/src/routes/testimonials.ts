import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, testimonialsTable, friendshipsTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return String(userId);
}

// GET /api/testimonials/:userId — list testimonials for a user
router.get("/testimonials/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  const rows = await db
    .select({
      id: testimonialsTable.id,
      content: testimonialsTable.content,
      createdAt: testimonialsTable.createdAt,
      authorId: testimonialsTable.authorId,
      authorFirstName: usersTable.firstName,
      authorLastName: usersTable.lastName,
      authorImageUrl: usersTable.profileImageUrl,
      authorCountry: usersTable.homeCountry,
    })
    .from(testimonialsTable)
    .innerJoin(usersTable, eq(testimonialsTable.authorId, usersTable.id))
    .where(eq(testimonialsTable.recipientId, userId))
    .orderBy(testimonialsTable.createdAt);

  res.json(rows);
});

// POST /api/testimonials/:userId — write a testimonial (must be friends)
router.post("/testimonials/:userId", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const { userId } = req.params;
  if (userId === myId) { res.status(400).json({ error: "Cannot write your own testimonial" }); return; }

  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content || content.length < 10) { res.status(400).json({ error: "Testimonial must be at least 10 characters" }); return; }
  if (content.length > 500) { res.status(400).json({ error: "Testimonial must be under 500 characters" }); return; }

  // Must be accepted friends
  const friendship = await db
    .select({ status: friendshipsTable.status })
    .from(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.status, "accepted"),
        or(
          and(eq(friendshipsTable.requesterId, myId), eq(friendshipsTable.addresseeId, userId)),
          and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, myId)),
        ),
      ),
    )
    .limit(1);

  if (!friendship.length) { res.status(403).json({ error: "You must be friends to write a testimonial" }); return; }

  const [row] = await db
    .insert(testimonialsTable)
    .values({ authorId: myId, recipientId: userId, content })
    .onConflictDoUpdate({ target: [testimonialsTable.authorId, testimonialsTable.recipientId], set: { content, updatedAt: new Date() } })
    .returning();

  res.json(row);
});

// DELETE /api/testimonials/:id — delete your own testimonial
router.delete("/testimonials/:id", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const id = Number(req.params.id);
  await db.delete(testimonialsTable).where(and(eq(testimonialsTable.id, id), eq(testimonialsTable.authorId, myId)));
  res.json({ ok: true });
});

export default router;

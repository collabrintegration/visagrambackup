import { Router, type IRouter, type Request, type Response } from "express";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.user.id;
}

router.get("/notifications", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const rows = await db
    .select({
      id: notificationsTable.id,
      type: notificationsTable.type,
      link: notificationsTable.link,
      preview: notificationsTable.preview,
      isRead: notificationsTable.isRead,
      createdAt: notificationsTable.createdAt,
      actorId: usersTable.id,
      actorFirstName: usersTable.firstName,
      actorLastName: usersTable.lastName,
      actorProfileImageUrl: usersTable.profileImageUrl,
    })
    .from(notificationsTable)
    .leftJoin(usersTable, eq(notificationsTable.actorId, usersTable.id))
    .where(eq(notificationsTable.recipientId, myId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);

  res.json({
    notifications: page.map((r) => ({
      id: r.id,
      type: r.type,
      link: r.link,
      preview: r.preview,
      isRead: r.isRead,
      createdAt: r.createdAt,
      actor: {
        userId: r.actorId ?? null,
        firstName: r.actorFirstName ?? null,
        lastName: r.actorLastName ?? null,
        profileImageUrl: r.actorProfileImageUrl ?? null,
      },
    })),
    hasMore,
  });
});

router.get("/notifications/unread-count", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const [{ unread }] = await db
    .select({ unread: count() })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.recipientId, myId), eq(notificationsTable.isRead, false)));

  res.json({ count: Number(unread) });
});

router.patch("/notifications/:id/read", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const id = Number(req.params.id);
  const [updated] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.recipientId, myId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({ ok: true });
});

router.post("/notifications/read-all", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.recipientId, myId), eq(notificationsTable.isRead, false)));

  res.json({ ok: true });
});

export default router;

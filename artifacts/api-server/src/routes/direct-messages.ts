import { Router, Request, Response } from "express";
import { db, dmConversationsTable, dmMessagesTable, usersTable } from "@workspace/db";
import { and, desc, eq, or, ne, count, sql } from "drizzle-orm";

const router = Router();

function convUserIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function getConv(myId: string, otherId: string) {
  const [u1, u2] = convUserIds(myId, otherId);
  const [row] = await db.select().from(dmConversationsTable)
    .where(and(eq(dmConversationsTable.user1Id, u1), eq(dmConversationsTable.user2Id, u2)))
    .limit(1);
  return row ?? null;
}

async function enrichConv(conv: typeof dmConversationsTable.$inferSelect, myId: string) {
  const otherId = conv.user1Id === myId ? conv.user2Id : conv.user1Id;
  const [other] = await db.select({
    id: usersTable.id,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    profileImageUrl: usersTable.profileImageUrl,
  }).from(usersTable).where(eq(usersTable.id, otherId)).limit(1);

  const [lastMsg] = await db.select()
    .from(dmMessagesTable)
    .where(eq(dmMessagesTable.conversationId, conv.id))
    .orderBy(desc(dmMessagesTable.createdAt))
    .limit(1);

  const [{ unread }] = await db.select({ unread: count() })
    .from(dmMessagesTable)
    .where(and(
      eq(dmMessagesTable.conversationId, conv.id),
      eq(dmMessagesTable.fromUserId, otherId),
      eq(dmMessagesTable.isRead, false),
    ));

  return {
    id: conv.id,
    status: conv.status,
    requestedBy: conv.requestedBy,
    blockedBy: conv.blockedBy ?? null,
    otherUserId: otherId,
    otherUserFirstName: other?.firstName ?? null,
    otherUserLastName: other?.lastName ?? null,
    otherUserProfileImageUrl: other?.profileImageUrl ?? null,
    lastMessage: lastMsg?.content || (lastMsg?.gifUrl ? "🖼️ GIF" : null),
    lastMessageAt: lastMsg?.createdAt ?? conv.createdAt,
    unreadCount: unread,
  };
}

function param(v: string | string[]): string {
  return Array.isArray(v) ? v[0] : v;
}

// ── GET /api/dm — my inbox (active conversations) ──
router.get("/dm", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;

  const convs = await db.select().from(dmConversationsTable)
    .where(and(
      or(eq(dmConversationsTable.user1Id, myId), eq(dmConversationsTable.user2Id, myId)),
      eq(dmConversationsTable.status, "active"),
    ))
    .orderBy(desc(dmConversationsTable.lastMessageAt));

  const enriched = await Promise.all(convs.map((c) => enrichConv(c, myId)));
  res.json(enriched);
});

// ── GET /api/dm/requests — requests sent to me ──
router.get("/dm/requests", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;

  const convs = await db.select().from(dmConversationsTable)
    .where(and(
      or(eq(dmConversationsTable.user1Id, myId), eq(dmConversationsTable.user2Id, myId)),
      eq(dmConversationsTable.status, "request"),
      ne(dmConversationsTable.requestedBy, myId),
    ))
    .orderBy(desc(dmConversationsTable.lastMessageAt));

  const enriched = await Promise.all(convs.map((c) => enrichConv(c, myId)));
  res.json(enriched);
});

// ── GET /api/dm/unread-count — total unread count for nav badge ──
router.get("/dm/unread-count", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;

  const activeConvIds = await db.select({ id: dmConversationsTable.id })
    .from(dmConversationsTable)
    .where(and(
      or(eq(dmConversationsTable.user1Id, myId), eq(dmConversationsTable.user2Id, myId)),
      eq(dmConversationsTable.status, "active"),
    ));

  const [requestCount] = await db.select({ cnt: count() })
    .from(dmConversationsTable)
    .where(and(
      or(eq(dmConversationsTable.user1Id, myId), eq(dmConversationsTable.user2Id, myId)),
      eq(dmConversationsTable.status, "request"),
      ne(dmConversationsTable.requestedBy, myId),
    ));

  let unreadMessages = 0;
  if (activeConvIds.length > 0) {
    for (const { id } of activeConvIds) {
      const [{ unread }] = await db.select({ unread: count() })
        .from(dmMessagesTable)
        .where(and(
          eq(dmMessagesTable.conversationId, id),
          ne(dmMessagesTable.fromUserId, myId),
          eq(dmMessagesTable.isRead, false),
        ));
      unreadMessages += unread;
    }
  }

  res.json({ unreadMessages, pendingRequests: requestCount?.cnt ?? 0 });
});

// ── GET /api/dm/:userId — thread with user ──
router.get("/dm/:userId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;
  const otherId = param(req.params.userId);
  if (myId === otherId) { res.status(400).json({ error: "Cannot message yourself" }); return; }

  const conv = await getConv(myId, otherId);
  if (!conv) { res.json([]); return; }
  if (conv.status === "blocked" && conv.blockedBy !== myId) {
    res.status(403).json({ error: "Blocked" }); return;
  }

  const msgs = await db.select().from(dmMessagesTable)
    .where(eq(dmMessagesTable.conversationId, conv.id))
    .orderBy(dmMessagesTable.createdAt);

  res.json(msgs);
});

// ── POST /api/dm/:userId — send message ──
router.post("/dm/:userId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;
  const otherId = param(req.params.userId);
  if (myId === otherId) { res.status(400).json({ error: "Cannot message yourself" }); return; }

  const { content, gifUrl } = req.body as { content?: string; gifUrl?: string };
  if (!content?.trim() && !gifUrl) { res.status(400).json({ error: "content or gifUrl required" }); return; }

  let conv = await getConv(myId, otherId);
  if (!conv) {
    const [u1, u2] = convUserIds(myId, otherId);
    const [created] = await db.insert(dmConversationsTable)
      .values({ user1Id: u1, user2Id: u2, requestedBy: myId, status: "request", lastMessageAt: new Date() })
      .returning();
    conv = created;
  } else {
    if (conv.status === "blocked") { res.status(403).json({ error: "Blocked" }); return; }
    if (conv.status === "spam") { res.status(403).json({ error: "Blocked" }); return; }
  }

  const [msg] = await db.insert(dmMessagesTable)
    .values({ conversationId: conv.id, fromUserId: myId, content: content?.trim() ?? "", gifUrl: gifUrl ?? null })
    .returning();

  await db.update(dmConversationsTable)
    .set({ lastMessageAt: new Date() })
    .where(eq(dmConversationsTable.id, conv.id));

  res.status(201).json(msg);
});

// ── POST /api/dm/:userId/accept ──
router.post("/dm/:userId/accept", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;
  const conv = await getConv(myId, param(req.params.userId));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  if (conv.requestedBy === myId) { res.status(400).json({ error: "You initiated this conversation" }); return; }

  const [updated] = await db.update(dmConversationsTable)
    .set({ status: "active" })
    .where(eq(dmConversationsTable.id, conv.id))
    .returning();

  res.json(updated);
});

// ── POST /api/dm/:userId/block ──
router.post("/dm/:userId/block", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;
  const otherId = param(req.params.userId);

  let conv = await getConv(myId, otherId);
  if (!conv) {
    const [u1, u2] = convUserIds(myId, otherId);
    const [created] = await db.insert(dmConversationsTable)
      .values({ user1Id: u1, user2Id: u2, requestedBy: otherId, status: "blocked", blockedBy: myId })
      .returning();
    conv = created;
  } else {
    await db.update(dmConversationsTable)
      .set({ status: "blocked", blockedBy: myId })
      .where(eq(dmConversationsTable.id, conv.id));
  }

  res.json({ ok: true });
});

// ── DELETE /api/dm/:userId/block — unblock ──
router.delete("/dm/:userId/block", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;
  const conv = await getConv(myId, param(req.params.userId));
  if (!conv || conv.blockedBy !== myId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.update(dmConversationsTable)
    .set({ status: "active", blockedBy: null })
    .where(eq(dmConversationsTable.id, conv.id));

  res.json({ ok: true });
});

// ── POST /api/dm/:userId/spam ──
router.post("/dm/:userId/spam", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;
  const otherId = param(req.params.userId);

  let conv = await getConv(myId, otherId);
  if (!conv) {
    const [u1, u2] = convUserIds(myId, otherId);
    const [created] = await db.insert(dmConversationsTable)
      .values({ user1Id: u1, user2Id: u2, requestedBy: otherId, status: "spam", blockedBy: myId })
      .returning();
    conv = created;
  } else {
    await db.update(dmConversationsTable)
      .set({ status: "spam", blockedBy: myId })
      .where(eq(dmConversationsTable.id, conv.id));
  }

  res.json({ ok: true });
});

// ── PATCH /api/dm/:userId/read — mark messages as read ──
router.patch("/dm/:userId/read", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const myId = req.user!.id;
  const conv = await getConv(myId, param(req.params.userId));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(dmMessagesTable)
    .set({ isRead: true })
    .where(and(
      eq(dmMessagesTable.conversationId, conv.id),
      ne(dmMessagesTable.fromUserId, myId),
      eq(dmMessagesTable.isRead, false),
    ));

  res.json({ ok: true });
});

export default router;

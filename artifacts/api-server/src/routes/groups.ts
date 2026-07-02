import { Router, type IRouter, type Request, type Response } from "express";
import { db, groupsTable, groupMembersTable, groupMessagesTable, groupJoinRequestsTable, usersTable } from "@workspace/db";
import { eq, and, desc, lt, count } from "drizzle-orm";

const router: IRouter = Router();

function getAuthUserId(req: Request): string | null {
  if (!req.isAuthenticated() || !req.user?.id) return null;
  return req.user.id;
}

async function isMemberOf(groupId: number, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: groupMembersTable.id })
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

async function isAdminOf(groupId: number, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: groupMembersTable.id })
    .from(groupMembersTable)
    .where(and(
      eq(groupMembersTable.groupId, groupId),
      eq(groupMembersTable.userId, userId),
      eq(groupMembersTable.role, "admin"),
    ))
    .limit(1);
  return rows.length > 0;
}

async function hasPendingRequest(groupId: number, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: groupJoinRequestsTable.id })
    .from(groupJoinRequestsTable)
    .where(and(
      eq(groupJoinRequestsTable.groupId, groupId),
      eq(groupJoinRequestsTable.userId, userId),
      eq(groupJoinRequestsTable.status, "pending"),
    ))
    .limit(1);
  return rows.length > 0;
}

async function buildGroupResponse(
  group: typeof groupsTable.$inferSelect & { memberCount: number },
  userId: string | null,
) {
  const isMember = userId ? await isMemberOf(group.id, userId) : false;
  const isAdmin = userId ? await isAdminOf(group.id, userId) : false;
  const isPrimaryAdmin = userId ? group.adminId === userId : false;
  const hasPending = userId && !isMember ? await hasPendingRequest(group.id, userId) : false;

  const lastMsgRows = await db
    .select({
      id: groupMessagesTable.id,
      groupId: groupMessagesTable.groupId,
      userId: groupMessagesTable.userId,
      content: groupMessagesTable.content,
      createdAt: groupMessagesTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(groupMessagesTable)
    .leftJoin(usersTable, eq(groupMessagesTable.userId, usersTable.id))
    .where(eq(groupMessagesTable.groupId, group.id))
    .orderBy(desc(groupMessagesTable.createdAt))
    .limit(1);

  return {
    id: group.id,
    name: group.name,
    description: group.description ?? null,
    emoji: group.emoji,
    adminId: group.adminId,
    isPrivate: group.isPrivate,
    memberCount: group.memberCount,
    isMember,
    isAdmin,
    isPrimaryAdmin,
    hasPendingRequest: hasPending,
    lastMessage: lastMsgRows[0] ?? null,
    createdAt: group.createdAt,
  };
}

// ── List groups ────────────────────────────────────────────────────────────
router.get("/groups", async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);

  const rows = await db
    .select({
      id: groupsTable.id,
      name: groupsTable.name,
      description: groupsTable.description,
      emoji: groupsTable.emoji,
      adminId: groupsTable.adminId,
      isPrivate: groupsTable.isPrivate,
      createdAt: groupsTable.createdAt,
      memberCount: count(groupMembersTable.id),
    })
    .from(groupsTable)
    .leftJoin(groupMembersTable, eq(groupMembersTable.groupId, groupsTable.id))
    .groupBy(groupsTable.id)
    .orderBy(desc(groupsTable.createdAt));

  const enriched = await Promise.all(rows.map((g) => buildGroupResponse(g, userId)));
  res.json(enriched);
});

// ── Create group ───────────────────────────────────────────────────────────
router.post("/groups", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;

  const { name, description, emoji = "🌍", isPrivate = false } = req.body as {
    name?: string;
    description?: string;
    emoji?: string;
    isPrivate?: boolean;
  };

  if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }

  const [{ adminCount }] = await db
    .select({ adminCount: count() })
    .from(groupsTable)
    .where(eq(groupsTable.adminId, userId));

  if (adminCount >= 5) {
    res.status(403).json({ error: "You can only be admin of up to 5 groups." });
    return;
  }

  const [group] = await db
    .insert(groupsTable)
    .values({ name: name.trim(), description: description?.trim() ?? null, emoji, isPrivate, adminId: userId })
    .returning();

  await db.insert(groupMembersTable).values({ groupId: group.id, userId, role: "admin" });

  res.status(201).json(await buildGroupResponse({ ...group, memberCount: 1 }, userId));
});

// ── Get group ──────────────────────────────────────────────────────────────
router.get("/groups/:id", async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const groupId = Number(req.params.id);

  const rows = await db
    .select({
      id: groupsTable.id,
      name: groupsTable.name,
      description: groupsTable.description,
      emoji: groupsTable.emoji,
      adminId: groupsTable.adminId,
      isPrivate: groupsTable.isPrivate,
      createdAt: groupsTable.createdAt,
      memberCount: count(groupMembersTable.id),
    })
    .from(groupsTable)
    .leftJoin(groupMembersTable, eq(groupMembersTable.groupId, groupsTable.id))
    .where(eq(groupsTable.id, groupId))
    .groupBy(groupsTable.id)
    .limit(1);

  if (!rows[0]) { res.status(404).json({ error: "Group not found" }); return; }

  res.json(await buildGroupResponse(rows[0], userId));
});

// ── Update group ───────────────────────────────────────────────────────────
router.patch("/groups/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const groupId = Number(req.params.id);

  if (!(await isAdminOf(groupId, userId))) { res.status(403).json({ error: "Forbidden" }); return; }

  const { name, description, emoji, isPrivate } = req.body as {
    name?: string;
    description?: string;
    emoji?: string;
    isPrivate?: boolean;
  };

  const updates: Partial<typeof groupsTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description.trim() || null;
  if (emoji !== undefined) updates.emoji = emoji;
  if (isPrivate !== undefined) updates.isPrivate = isPrivate;

  const [updated] = await db
    .update(groupsTable)
    .set(updates)
    .where(eq(groupsTable.id, groupId))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, groupId));

  res.json(await buildGroupResponse({ ...updated, memberCount: Number(cnt) }, userId));
});

// ── Delete group ───────────────────────────────────────────────────────────
router.delete("/groups/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const groupId = Number(req.params.id);

  if (!(await isAdminOf(groupId, userId))) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(groupsTable).where(eq(groupsTable.id, groupId));
  res.status(204).end();
});

// ── Join group (creates request for private groups) ────────────────────────
router.post("/groups/:id/join", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const groupId = Number(req.params.id);

  const group = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId)).limit(1);
  if (!group[0]) { res.status(404).json({ error: "Group not found" }); return; }

  if (await isMemberOf(groupId, userId)) {
    res.json({ ok: true, status: "already_member" });
    return;
  }

  if (group[0].isPrivate) {
    const alreadyRequested = await hasPendingRequest(groupId, userId);
    if (!alreadyRequested) {
      await db.insert(groupJoinRequestsTable)
        .values({ groupId, userId, status: "pending" })
        .onConflictDoNothing();
    }
    res.json({ ok: true, status: "requested" });
    return;
  }

  await db.insert(groupMembersTable).values({ groupId, userId, role: "member" });
  res.json({ ok: true, status: "joined" });
});

// ── Leave group ────────────────────────────────────────────────────────────
router.post("/groups/:id/leave", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const groupId = Number(req.params.id);

  const group = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId)).limit(1);
  if (!group[0]) { res.status(404).json({ error: "Group not found" }); return; }

  if (group[0].adminId === userId) {
    res.status(400).json({ error: "Primary admin cannot leave — delete the group or transfer ownership first." });
    return;
  }

  await db.delete(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, userId)));

  res.json({ ok: true });
});

// ── List members ───────────────────────────────────────────────────────────
router.get("/groups/:id/members", async (req: Request, res: Response) => {
  const groupId = Number(req.params.id);

  const group = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId)).limit(1);
  if (!group[0]) { res.status(404).json({ error: "Group not found" }); return; }

  const members = await db
    .select({
      userId: groupMembersTable.userId,
      role: groupMembersTable.role,
      joinedAt: groupMembersTable.joinedAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(groupMembersTable)
    .leftJoin(usersTable, eq(groupMembersTable.userId, usersTable.id))
    .where(eq(groupMembersTable.groupId, groupId))
    .orderBy(groupMembersTable.joinedAt);

  const primaryAdminId = group[0].adminId;
  res.json(members.map((m) => ({ ...m, isPrimary: m.userId === primaryAdminId })));
});

// ── Remove member ──────────────────────────────────────────────────────────
router.delete("/groups/:id/members/:userId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const adminId = req.user.id;
  const groupId = Number(req.params.id);
  const targetId = String(req.params.userId);

  if (!(await isAdminOf(groupId, adminId))) { res.status(403).json({ error: "Forbidden" }); return; }
  if (targetId === adminId) { res.status(400).json({ error: "Admin cannot remove themselves" }); return; }

  await db.delete(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, targetId)));

  res.status(204).end();
});

// ── List join requests (admin only) ────────────────────────────────────────
router.get("/groups/:id/join-requests", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const groupId = Number(req.params.id);

  if (!(await isAdminOf(groupId, userId))) { res.status(403).json({ error: "Forbidden" }); return; }

  const requests = await db
    .select({
      id: groupJoinRequestsTable.id,
      groupId: groupJoinRequestsTable.groupId,
      userId: groupJoinRequestsTable.userId,
      status: groupJoinRequestsTable.status,
      createdAt: groupJoinRequestsTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(groupJoinRequestsTable)
    .leftJoin(usersTable, eq(groupJoinRequestsTable.userId, usersTable.id))
    .where(and(
      eq(groupJoinRequestsTable.groupId, groupId),
      eq(groupJoinRequestsTable.status, "pending"),
    ))
    .orderBy(groupJoinRequestsTable.createdAt);

  res.json(requests);
});

// ── Approve join request ───────────────────────────────────────────────────
router.post("/groups/:id/join-requests/:userId/approve", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const adminUserId = req.user.id;
  const groupId = Number(req.params.id);
  const targetUserId = String(req.params.userId);

  if (!(await isAdminOf(groupId, adminUserId))) { res.status(403).json({ error: "Forbidden" }); return; }

  const request = await db
    .select()
    .from(groupJoinRequestsTable)
    .where(and(
      eq(groupJoinRequestsTable.groupId, groupId),
      eq(groupJoinRequestsTable.userId, targetUserId),
      eq(groupJoinRequestsTable.status, "pending"),
    ))
    .limit(1);

  if (!request[0]) { res.status(404).json({ error: "Join request not found" }); return; }

  await db.update(groupJoinRequestsTable)
    .set({ status: "approved" })
    .where(eq(groupJoinRequestsTable.id, request[0].id));

  await db.insert(groupMembersTable)
    .values({ groupId, userId: targetUserId, role: "member" })
    .onConflictDoNothing();

  res.json({ ok: true });
});

// ── Reject join request ────────────────────────────────────────────────────
router.post("/groups/:id/join-requests/:userId/reject", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const adminUserId = req.user.id;
  const groupId = Number(req.params.id);
  const targetUserId = String(req.params.userId);

  if (!(await isAdminOf(groupId, adminUserId))) { res.status(403).json({ error: "Forbidden" }); return; }

  const request = await db
    .select()
    .from(groupJoinRequestsTable)
    .where(and(
      eq(groupJoinRequestsTable.groupId, groupId),
      eq(groupJoinRequestsTable.userId, targetUserId),
      eq(groupJoinRequestsTable.status, "pending"),
    ))
    .limit(1);

  if (!request[0]) { res.status(404).json({ error: "Join request not found" }); return; }

  await db.update(groupJoinRequestsTable)
    .set({ status: "rejected" })
    .where(eq(groupJoinRequestsTable.id, request[0].id));

  res.json({ ok: true });
});

// ── Promote / demote member role (primary admin only) ──────────────────────
router.patch("/groups/:id/members/:userId/role", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const actorId = req.user.id;
  const groupId = Number(req.params.id);
  const targetId = String(req.params.userId);
  const { role } = req.body as { role?: string };

  if (role !== "admin" && role !== "member") {
    res.status(400).json({ error: "role must be 'admin' or 'member'" }); return;
  }

  const group = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId)).limit(1);
  if (!group[0]) { res.status(404).json({ error: "Group not found" }); return; }

  if (group[0].adminId !== actorId) {
    res.status(403).json({ error: "Only the primary admin can promote or demote members." }); return;
  }
  if (targetId === actorId) {
    res.status(400).json({ error: "You cannot change your own role." }); return;
  }

  const target = await db.select({ id: groupMembersTable.id })
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, targetId)))
    .limit(1);
  if (!target[0]) { res.status(404).json({ error: "Member not found" }); return; }

  await db.update(groupMembersTable)
    .set({ role })
    .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, targetId)));

  res.json({ ok: true, role });
});

// ── List messages ──────────────────────────────────────────────────────────
router.get("/groups/:id/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const groupId = Number(req.params.id);

  const group = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId)).limit(1);
  if (!group[0]) { res.status(404).json({ error: "Group not found" }); return; }

  if (!(await isMemberOf(groupId, userId))) { res.status(403).json({ error: "Not a member" }); return; }

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const before = req.query.before ? Number(req.query.before) : undefined;

  const where = before !== undefined
    ? and(eq(groupMessagesTable.groupId, groupId), lt(groupMessagesTable.id, before))
    : eq(groupMessagesTable.groupId, groupId);

  const messages = await db
    .select({
      id: groupMessagesTable.id,
      groupId: groupMessagesTable.groupId,
      userId: groupMessagesTable.userId,
      content: groupMessagesTable.content,
      gifUrl: groupMessagesTable.gifUrl,
      createdAt: groupMessagesTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(groupMessagesTable)
    .leftJoin(usersTable, eq(groupMessagesTable.userId, usersTable.id))
    .where(where)
    .orderBy(desc(groupMessagesTable.id))
    .limit(limit);

  res.json(messages.reverse());
});

// ── Post message ───────────────────────────────────────────────────────────
router.post("/groups/:id/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const groupId = Number(req.params.id);

  const group = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId)).limit(1);
  if (!group[0]) { res.status(404).json({ error: "Group not found" }); return; }

  if (!(await isMemberOf(groupId, userId))) { res.status(403).json({ error: "Not a member" }); return; }

  const { content, gifUrl } = req.body as { content?: string; gifUrl?: string };
  if (!content?.trim() && !gifUrl) { res.status(400).json({ error: "content or gifUrl is required" }); return; }

  const [message] = await db
    .insert(groupMessagesTable)
    .values({ groupId, userId, content: content?.trim() ?? "", gifUrl: gifUrl ?? null })
    .returning();

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.status(201).json({
    ...message,
    firstName: user[0]?.firstName ?? null,
    lastName: user[0]?.lastName ?? null,
    profileImageUrl: user[0]?.profileImageUrl ?? null,
  });
});

// ── Delete message ─────────────────────────────────────────────────────────
router.delete("/groups/:id/messages/:messageId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const groupId = Number(req.params.id);
  const messageId = Number(req.params.messageId);

  const msg = await db
    .select()
    .from(groupMessagesTable)
    .where(and(eq(groupMessagesTable.id, messageId), eq(groupMessagesTable.groupId, groupId)))
    .limit(1);

  if (!msg[0]) { res.status(404).json({ error: "Message not found" }); return; }

  if (msg[0].userId !== userId && !(await isAdminOf(groupId, userId))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(groupMessagesTable).where(eq(groupMessagesTable.id, messageId));
  res.status(204).end();
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, friendshipsTable } from "@workspace/db";
import { eq, and, or, ilike, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return String(userId);
}

// ── Search users ──────────────────────────────────────────────────────────────
router.get("/users/search", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const sexFilter = typeof req.query.sex === "string" ? req.query.sex.trim() : "";
  const locationFilter = typeof req.query.location === "string" ? req.query.location.trim() : "";
  const minAge = req.query.minAge != null ? Number(req.query.minAge) : null;
  const maxAge = req.query.maxAge != null ? Number(req.query.maxAge) : null;

  // Require at least a search term or a filter
  const hasQuery = q.length > 0;
  const hasFilter = sexFilter || locationFilter || minAge != null || maxAge != null;
  if (!hasQuery && !hasFilter) {
    res.json([]);
    return;
  }

  // Get my existing friendships to annotate results
  const myFriendships = await db
    .select({
      requesterId: friendshipsTable.requesterId,
      addresseeId: friendshipsTable.addresseeId,
      status: friendshipsTable.status,
    })
    .from(friendshipsTable)
    .where(or(eq(friendshipsTable.requesterId, myId), eq(friendshipsTable.addresseeId, myId)));

  const friendshipMap = new Map<string, { status: string; iRequested: boolean }>();
  for (const f of myFriendships) {
    const otherId = f.requesterId === myId ? f.addresseeId : f.requesterId;
    friendshipMap.set(otherId, { status: f.status, iRequested: f.requesterId === myId });
  }

  const conditions = [ne(usersTable.id, myId)];

  if (hasQuery) {
    conditions.push(
      or(
        ilike(usersTable.username, `%${q}%`),
        ilike(usersTable.firstName, `%${q}%`),
        ilike(usersTable.lastName, `%${q}%`),
        ilike(usersTable.email, `%${q}%`),
        ilike(sql`concat(${usersTable.firstName}, ' ', ${usersTable.lastName})`, `%${q}%`),
        ilike(usersTable.location, `%${q}%`),
      )!,
    );
  }
  if (sexFilter) conditions.push(ilike(usersTable.sex, sexFilter));
  if (locationFilter) conditions.push(ilike(usersTable.location, `%${locationFilter}%`));
  if (minAge != null) conditions.push(sql`${usersTable.age} >= ${minAge}`);
  if (maxAge != null) conditions.push(sql`${usersTable.age} <= ${maxAge}`);

  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      homeCountry: usersTable.homeCountry,
      age: usersTable.age,
      sex: usersTable.sex,
      location: usersTable.location,
    })
    .from(usersTable)
    .where(and(...conditions))
    .limit(limit);

  const results = users.map((u) => {
    const rel = friendshipMap.get(u.id);
    return {
      ...u,
      friendshipStatus: rel?.status ?? null,
      iRequested: rel?.iRequested ?? null,
    };
  });

  res.json(results);
});

// ── List my friends ───────────────────────────────────────────────────────────
router.get("/friends", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const requesterAlias = alias(usersTable, "requester");
  const addresseeAlias = alias(usersTable, "addressee");

  const rows = await db
    .select({
      friendshipSince: friendshipsTable.createdAt,
      requesterId: friendshipsTable.requesterId,
      addresseeId: friendshipsTable.addresseeId,
      requesterFirstName: requesterAlias.firstName,
      requesterLastName: requesterAlias.lastName,
      requesterImageUrl: requesterAlias.profileImageUrl,
      requesterCountry: requesterAlias.homeCountry,
      addresseeFirstName: addresseeAlias.firstName,
      addresseeLastName: addresseeAlias.lastName,
      addresseeImageUrl: addresseeAlias.profileImageUrl,
      addresseeCountry: addresseeAlias.homeCountry,
    })
    .from(friendshipsTable)
    .innerJoin(requesterAlias, eq(friendshipsTable.requesterId, requesterAlias.id))
    .innerJoin(addresseeAlias, eq(friendshipsTable.addresseeId, addresseeAlias.id))
    .where(
      and(
        eq(friendshipsTable.status, "accepted"),
        or(eq(friendshipsTable.requesterId, myId), eq(friendshipsTable.addresseeId, myId)),
      ),
    );

  const friends = rows.map((r) => {
    const iAmRequester = r.requesterId === myId;
    return {
      id: iAmRequester ? r.addresseeId : r.requesterId,
      firstName: iAmRequester ? r.addresseeFirstName : r.requesterFirstName,
      lastName: iAmRequester ? r.addresseeLastName : r.requesterLastName,
      profileImageUrl: iAmRequester ? r.addresseeImageUrl : r.requesterImageUrl,
      homeCountry: iAmRequester ? r.addresseeCountry : r.requesterCountry,
      friendshipSince: r.friendshipSince,
    };
  });

  res.json(friends);
});

// ── List incoming friend requests ─────────────────────────────────────────────
router.get("/friends/requests", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const rows = await db
    .select({
      requesterId: friendshipsTable.requesterId,
      createdAt: friendshipsTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      homeCountry: usersTable.homeCountry,
    })
    .from(friendshipsTable)
    .innerJoin(usersTable, eq(friendshipsTable.requesterId, usersTable.id))
    .where(
      and(eq(friendshipsTable.addresseeId, myId), eq(friendshipsTable.status, "pending")),
    );

  res.json(rows.map((r) => ({ ...r, id: r.requesterId })));
});

// ── Send friend request ───────────────────────────────────────────────────────
router.post("/friends/request/:userId", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const { userId } = req.params;
  if (userId === myId) {
    res.status(400).json({ error: "Cannot friend yourself" });
    return;
  }

  // Check if reverse request already exists — auto-accept
  const existing = await db
    .select()
    .from(friendshipsTable)
    .where(
      or(
        and(eq(friendshipsTable.requesterId, myId), eq(friendshipsTable.addresseeId, userId)),
        and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, myId)),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    // They already requested me → accept automatically
    if (row.requesterId === userId && row.status === "pending") {
      await db
        .update(friendshipsTable)
        .set({ status: "accepted" })
        .where(and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, myId)));
      res.json({ status: "accepted" });
      return;
    }
    res.json({ status: row.status });
    return;
  }

  await db.insert(friendshipsTable).values({ requesterId: myId, addresseeId: userId });
  res.json({ status: "pending" });
});

// ── Accept a friend request ───────────────────────────────────────────────────
router.post("/friends/accept/:requesterId", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const { requesterId } = req.params;
  await db
    .update(friendshipsTable)
    .set({ status: "accepted" })
    .where(
      and(eq(friendshipsTable.requesterId, requesterId), eq(friendshipsTable.addresseeId, myId), eq(friendshipsTable.status, "pending")),
    );

  res.json({ ok: true });
});

// ── Decline a friend request ──────────────────────────────────────────────────
router.post("/friends/decline/:requesterId", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const { requesterId } = req.params;
  await db
    .update(friendshipsTable)
    .set({ status: "declined" })
    .where(
      and(eq(friendshipsTable.requesterId, requesterId), eq(friendshipsTable.addresseeId, myId), eq(friendshipsTable.status, "pending")),
    );

  res.json({ ok: true });
});

// ── Unfriend ──────────────────────────────────────────────────────────────────
router.delete("/friends/:userId", async (req: Request, res: Response) => {
  const myId = requireAuth(req, res);
  if (!myId) return;

  const { userId } = req.params;
  await db
    .delete(friendshipsTable)
    .where(
      or(
        and(eq(friendshipsTable.requesterId, myId), eq(friendshipsTable.addresseeId, userId)),
        and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, myId)),
      ),
    );

  res.json({ ok: true });
});

export default router;

import { Router, type IRouter, type Request } from "express";
import { db, usersTable, groupsTable, groupMembersTable, visaApplicationsTable, travelEntriesTable, reviewsTable, questionsTable, answersTable, pageViewsTable, friendshipsTable } from "@workspace/db";
import { count, eq, sql, gte, or, ilike, desc, and } from "drizzle-orm";

const router: IRouter = Router();

async function isSuperAdmin(req: Request): Promise<boolean> {
  if (!req.user?.id) return false;
  const row = await db
    .select({ isSuperAdmin: usersTable.isSuperAdmin })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);
  return row[0]?.isSuperAdmin === true;
}

router.get("/api/admin/users/search", async (req, res) => {
  if (!(await isSuperAdmin(req))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const where = q.length > 0
    ? or(
        ilike(usersTable.username, `%${q}%`),
        ilike(usersTable.firstName, `%${q}%`),
        ilike(usersTable.lastName, `%${q}%`),
        ilike(usersTable.email, `%${q}%`),
        ilike(sql`concat(${usersTable.firstName}, ' ', ${usersTable.lastName})`, `%${q}%`),
        ilike(usersTable.location, `%${q}%`),
      )
    : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        username: usersTable.username,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        homeCountry: usersTable.homeCountry,
        age: usersTable.age,
        sex: usersTable.sex,
        location: usersTable.location,
        isSuperAdmin: usersTable.isSuperAdmin,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(where)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(usersTable).where(where),
  ]);

  res.json({ users: rows, total: totalRow?.total ?? 0 });
});

router.get("/api/admin/users/:userId", async (req, res) => {
  if (!(await isSuperAdmin(req))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { userId } = req.params;

  const [userRow] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!userRow) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [[reviewCount], [questionCount], [answerCount], [travelCount], [visaCount], [groupCount], [friendCount]] = await Promise.all([
    db.select({ total: count() }).from(reviewsTable).where(eq(reviewsTable.userId, userId)),
    db.select({ total: count() }).from(questionsTable).where(eq(questionsTable.userId, userId)),
    db.select({ total: count() }).from(answersTable).where(eq(answersTable.userId, userId)),
    db.select({ total: count() }).from(travelEntriesTable).where(eq(travelEntriesTable.userId, userId)),
    db.select({ total: count() }).from(visaApplicationsTable).where(eq(visaApplicationsTable.userId, userId)),
    db.select({ total: count() }).from(groupMembersTable).where(eq(groupMembersTable.userId, userId)),
    db.select({ total: count() }).from(friendshipsTable).where(
      and(
        eq(friendshipsTable.status, "accepted"),
        or(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, userId)),
      ),
    ),
  ]);

  res.json({
    id: userRow.id,
    email: userRow.email,
    username: userRow.username,
    firstName: userRow.firstName,
    lastName: userRow.lastName,
    profileImageUrl: userRow.profileImageUrl,
    homeCountry: userRow.homeCountry,
    bio: userRow.bio,
    isPrivate: userRow.isPrivate,
    isEmailPublic: userRow.isEmailPublic,
    isSuperAdmin: userRow.isSuperAdmin,
    createdAt: userRow.createdAt,
    updatedAt: userRow.updatedAt,
    stats: {
      reviews: reviewCount?.total ?? 0,
      questions: questionCount?.total ?? 0,
      answers: answerCount?.total ?? 0,
      travelEntries: travelCount?.total ?? 0,
      visaApplications: visaCount?.total ?? 0,
      groupMemberships: groupCount?.total ?? 0,
      friends: friendCount?.total ?? 0,
    },
  });
});

router.post("/track", async (req, res) => {
  const path = typeof req.body?.path === "string" ? req.body.path.slice(0, 500) : "/";
  await db.insert(pageViewsTable).values({ path });
  res.status(204).end();
});

router.get("/api/admin/site-stats", async (req, res) => {
  if (!(await isSuperAdmin(req))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [[users], [groupStats], [visaEntries], [travelEntries], [reviews], [questions], [totalViews], [todayViews]] = await Promise.all([
    db.select({ total: count() }).from(usersTable),
    db.select({
      total: count(),
      publicCount: sql<number>`sum(case when ${groupsTable.isPrivate} = false then 1 else 0 end)::int`,
      privateCount: sql<number>`sum(case when ${groupsTable.isPrivate} = true then 1 else 0 end)::int`,
    }).from(groupsTable),
    db.select({ total: count() }).from(visaApplicationsTable),
    db.select({ total: count() }).from(travelEntriesTable),
    db.select({ total: count() }).from(reviewsTable),
    db.select({ total: count() }).from(questionsTable),
    db.select({ total: count() }).from(pageViewsTable),
    db.select({ total: count() }).from(pageViewsTable).where(gte(pageViewsTable.visitedAt, todayStart)),
  ]);

  res.json({
    totalUsers: users?.total ?? 0,
    totalGroups: groupStats?.total ?? 0,
    publicGroups: groupStats?.publicCount ?? 0,
    privateGroups: groupStats?.privateCount ?? 0,
    totalVisaEntries: visaEntries?.total ?? 0,
    totalTravelEntries: travelEntries?.total ?? 0,
    totalReviews: reviews?.total ?? 0,
    totalQuestions: questions?.total ?? 0,
    totalPageViews: totalViews?.total ?? 0,
    todayPageViews: todayViews?.total ?? 0,
  });
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { db, reviewsTable, questionsTable, answersTable, travelEntriesTable, usersTable, countriesTable, visaReportsTable, questionFollowsTable, answerRepliesTable } from "@workspace/db";
import { eq, and, desc, sql, count } from "drizzle-orm";

const router: IRouter = Router();

function userSnippet(u: { userId?: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; homeCountry?: string | null } | undefined) {
  if (!u) return { userId: null, firstName: null, lastName: null, profileImageUrl: null, homeCountry: null };
  return { userId: u.userId ?? null, firstName: u.firstName, lastName: u.lastName, profileImageUrl: u.profileImageUrl, homeCountry: u.homeCountry ?? null };
}

async function questionFollowStats(questionId: number, userId?: string): Promise<{ followersCount: number; isFollowing: boolean }> {
  const [{ followersCount }] = await db
    .select({ followersCount: count() })
    .from(questionFollowsTable)
    .where(eq(questionFollowsTable.questionId, questionId));

  if (!userId) return { followersCount: Number(followersCount), isFollowing: false };

  const existing = await db
    .select()
    .from(questionFollowsTable)
    .where(and(eq(questionFollowsTable.userId, userId), eq(questionFollowsTable.questionId, questionId)))
    .limit(1);

  return { followersCount: Number(followersCount), isFollowing: existing.length > 0 };
}

// ── Community Feed ─────────────────────────────────────────────────────────
router.get("/community/feed", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const [reviews, questions] = await Promise.all([
    db.select({
      id: reviewsTable.id,
      userId: reviewsTable.userId,
      countryCode: reviewsTable.countryCode,
      title: reviewsTable.title,
      overallRating: reviewsTable.overallRating,
      easeRating: reviewsTable.easeRating,
      welcomeRating: reviewsTable.welcomeRating,
      body: reviewsTable.body,
      createdAt: reviewsTable.createdAt,
      countryName: countriesTable.name,
      countryFlag: countriesTable.flagEmoji,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .leftJoin(countriesTable, eq(reviewsTable.countryCode, countriesTable.code))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(limit),

    db.select({
      id: questionsTable.id,
      userId: questionsTable.userId,
      countryCode: questionsTable.countryCode,
      passportCode: questionsTable.passportCode,
      title: questionsTable.title,
      body: questionsTable.body,
      resolved: questionsTable.resolved,
      createdAt: questionsTable.createdAt,
      countryName: countriesTable.name,
      countryFlag: countriesTable.flagEmoji,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      answersCount: sql<number>`(SELECT COUNT(*) FROM answers WHERE question_id = ${questionsTable.id})`.as("answers_count"),
    })
      .from(questionsTable)
      .leftJoin(usersTable, eq(questionsTable.userId, usersTable.id))
      .leftJoin(countriesTable, eq(questionsTable.countryCode, countriesTable.code))
      .orderBy(desc(questionsTable.createdAt))
      .limit(limit),
  ]);

  const feedReviews = reviews.map((r) => ({
    type: "review" as const,
    id: r.id,
    createdAt: r.createdAt,
    countryCode: r.countryCode,
    countryName: r.countryName,
    countryFlag: r.countryFlag,
    user: userSnippet({ userId: r.userId, firstName: r.firstName, lastName: r.lastName, profileImageUrl: r.profileImageUrl }),
    data: {
      title: r.title,
      overallRating: r.overallRating,
      easeRating: r.easeRating,
      welcomeRating: r.welcomeRating,
      body: r.body,
    },
  }));

  const feedQuestions = questions.map((q) => ({
    type: "question" as const,
    id: q.id,
    createdAt: q.createdAt,
    countryCode: q.countryCode,
    countryName: q.countryName,
    countryFlag: q.countryFlag,
    user: userSnippet({ userId: q.userId, firstName: q.firstName, lastName: q.lastName, profileImageUrl: q.profileImageUrl }),
    data: {
      title: q.title,
      body: q.body,
      passportCode: q.passportCode,
      resolved: q.resolved,
      answersCount: Number(q.answersCount),
    },
  }));

  const feed = [...feedReviews, ...feedQuestions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  res.json(feed);
});

// ── Reviews ────────────────────────────────────────────────────────────────
router.get("/countries/:code/reviews", async (req: Request, res: Response) => {
  const code = String(req.params.code);

  const rows = await db.select({
    id: reviewsTable.id,
    userId: reviewsTable.userId,
    countryCode: reviewsTable.countryCode,
    title: reviewsTable.title,
    overallRating: reviewsTable.overallRating,
    easeRating: reviewsTable.easeRating,
    welcomeRating: reviewsTable.welcomeRating,
    body: reviewsTable.body,
    createdAt: reviewsTable.createdAt,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    profileImageUrl: usersTable.profileImageUrl,
  })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.countryCode, code.toUpperCase()))
    .orderBy(desc(reviewsTable.createdAt));

  const avgRatings = rows.length
    ? {
        overall: +(rows.reduce((s, r) => s + r.overallRating, 0) / rows.length).toFixed(1),
        ease: +(rows.reduce((s, r) => s + r.easeRating, 0) / rows.length).toFixed(1),
        welcome: +(rows.reduce((s, r) => s + r.welcomeRating, 0) / rows.length).toFixed(1),
      }
    : null;

  res.json({
    avgRatings,
    count: rows.length,
    reviews: rows.map((r) => ({
      id: r.id,
      title: r.title,
      overallRating: r.overallRating,
      easeRating: r.easeRating,
      welcomeRating: r.welcomeRating,
      body: r.body,
      createdAt: r.createdAt,
      user: userSnippet(r),
    })),
  });
});

router.post("/countries/:code/reviews", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const code = String(req.params.code);
  const { title, overallRating, easeRating, welcomeRating, body } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (!overallRating || !easeRating || !welcomeRating) {
    res.status(400).json({ error: "overallRating, easeRating, welcomeRating are required" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      userId: req.user.id,
      countryCode: code.toUpperCase(),
      title: title.trim(),
      overallRating: Number(overallRating),
      easeRating: Number(easeRating),
      welcomeRating: Number(welcomeRating),
      body: body || null,
    })
    .onConflictDoUpdate({
      target: [reviewsTable.userId, reviewsTable.countryCode],
      set: {
        title: title.trim(),
        overallRating: Number(overallRating),
        easeRating: Number(easeRating),
        welcomeRating: Number(welcomeRating),
        body: body || null,
      },
    })
    .returning();

  res.status(201).json(review);
});

// ── Questions ──────────────────────────────────────────────────────────────
router.get("/countries/:code/questions", async (req: Request, res: Response) => {
  const code = String(req.params.code);
  const currentUserId = req.isAuthenticated() ? req.user.id : undefined;

  const rows = await db.select({
    id: questionsTable.id,
    userId: questionsTable.userId,
    countryCode: questionsTable.countryCode,
    passportCode: questionsTable.passportCode,
    title: questionsTable.title,
    body: questionsTable.body,
    resolved: questionsTable.resolved,
    createdAt: questionsTable.createdAt,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    profileImageUrl: usersTable.profileImageUrl,
    homeCountry: usersTable.homeCountry,
    answersCount: sql<number>`(SELECT COUNT(*) FROM answers WHERE question_id = ${questionsTable.id})`.as("answers_count"),
    followersCount: sql<number>`(SELECT COUNT(*) FROM question_follows WHERE question_id = ${questionsTable.id})`.as("followers_count"),
  })
    .from(questionsTable)
    .leftJoin(usersTable, eq(questionsTable.userId, usersTable.id))
    .where(eq(questionsTable.countryCode, code.toUpperCase()))
    .orderBy(desc(questionsTable.createdAt));

  const result = await Promise.all(rows.map(async (q) => {
    const isFollowing = currentUserId
      ? (await db.select().from(questionFollowsTable).where(and(eq(questionFollowsTable.userId, currentUserId), eq(questionFollowsTable.questionId, q.id))).limit(1)).length > 0
      : false;
    return {
      id: q.id,
      countryCode: q.countryCode,
      passportCode: q.passportCode,
      title: q.title,
      body: q.body,
      resolved: q.resolved,
      createdAt: q.createdAt,
      answersCount: Number(q.answersCount),
      followersCount: Number(q.followersCount),
      isFollowing,
      user: userSnippet(q),
    };
  }));

  res.json(result);
});

router.post("/countries/:code/questions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const code = String(req.params.code);
  const { title, body, passportCode } = req.body;

  if (!title || !body) {
    res.status(400).json({ error: "title and body are required" });
    return;
  }

  const [question] = await db
    .insert(questionsTable)
    .values({
      userId: req.user.id,
      countryCode: code.toUpperCase(),
      title,
      body,
      passportCode: passportCode?.toUpperCase() || null,
    })
    .returning();

  res.status(201).json(question);
});

// ── Answers ────────────────────────────────────────────────────────────────
router.get("/questions/:id/answers", async (req: Request, res: Response) => {
  const questionId = Number(req.params.id);

  const [questionRows, answers] = await Promise.all([
    db.select({
      id: questionsTable.id,
      userId: questionsTable.userId,
      countryCode: questionsTable.countryCode,
      passportCode: questionsTable.passportCode,
      title: questionsTable.title,
      body: questionsTable.body,
      resolved: questionsTable.resolved,
      createdAt: questionsTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      homeCountry: usersTable.homeCountry,
    })
      .from(questionsTable)
      .leftJoin(usersTable, eq(questionsTable.userId, usersTable.id))
      .where(eq(questionsTable.id, questionId))
      .limit(1),
    db.select({
      id: answersTable.id,
      userId: answersTable.userId,
      body: answersTable.body,
      gifUrl: answersTable.gifUrl,
      isAccepted: answersTable.isAccepted,
      createdAt: answersTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      homeCountry: usersTable.homeCountry,
      repliesCount: sql<number>`(SELECT COUNT(*) FROM answer_replies WHERE answer_id = ${answersTable.id})`.as("replies_count"),
    })
      .from(answersTable)
      .leftJoin(usersTable, eq(answersTable.userId, usersTable.id))
      .where(eq(answersTable.questionId, questionId))
      .orderBy(desc(answersTable.isAccepted), desc(answersTable.createdAt)),
  ]);

  if (!questionRows[0]) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const q = questionRows[0];
  res.json({
    question: { ...q, user: userSnippet(q) },
    answers: answers.map((a) => ({
      id: a.id,
      body: a.body,
      gifUrl: a.gifUrl,
      isAccepted: a.isAccepted,
      repliesCount: Number(a.repliesCount),
      createdAt: a.createdAt,
      user: userSnippet(a),
    })),
  });
});

router.post("/questions/:id/answers", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const questionId = Number(req.params.id);
  const { body, gifUrl } = req.body;

  if (!body) {
    res.status(400).json({ error: "body is required" });
    return;
  }

  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, questionId)).limit(1);
  if (!q) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const [answer] = await db
    .insert(answersTable)
    .values({ userId: req.user.id, questionId, body, gifUrl: gifUrl || null })
    .returning();

  res.status(201).json(answer);
});

// ── Get single question detail ───────────────────────────────────────────────
router.get("/questions/:id", async (req: Request, res: Response) => {
  const questionId = Number(req.params.id);
  const currentUserId = req.isAuthenticated() ? req.user.id : undefined;

  const [questionRows, answers, countryRows] = await Promise.all([
    db.select({
      id: questionsTable.id,
      userId: questionsTable.userId,
      countryCode: questionsTable.countryCode,
      passportCode: questionsTable.passportCode,
      title: questionsTable.title,
      body: questionsTable.body,
      resolved: questionsTable.resolved,
      createdAt: questionsTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      homeCountry: usersTable.homeCountry,
    })
      .from(questionsTable)
      .leftJoin(usersTable, eq(questionsTable.userId, usersTable.id))
      .where(eq(questionsTable.id, questionId))
      .limit(1),
    db.select({
      id: answersTable.id,
      userId: answersTable.userId,
      body: answersTable.body,
      gifUrl: answersTable.gifUrl,
      isAccepted: answersTable.isAccepted,
      createdAt: answersTable.createdAt,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
      homeCountry: usersTable.homeCountry,
      repliesCount: sql<number>`(SELECT COUNT(*) FROM answer_replies WHERE answer_id = ${answersTable.id})`.as("replies_count"),
    })
      .from(answersTable)
      .leftJoin(usersTable, eq(answersTable.userId, usersTable.id))
      .where(eq(answersTable.questionId, questionId))
      .orderBy(desc(answersTable.isAccepted), desc(answersTable.createdAt)),
    db.select({ name: countriesTable.name, flagEmoji: countriesTable.flagEmoji })
      .from(countriesTable)
      .where(sql`countries.code = (SELECT country_code FROM questions WHERE id = ${questionId} LIMIT 1)`)
      .limit(1),
  ]);

  if (!questionRows[0]) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const q = questionRows[0];
  const { followersCount, isFollowing } = await questionFollowStats(questionId, currentUserId);

  res.json({
    id: q.id,
    countryCode: q.countryCode,
    countryName: countryRows[0]?.name ?? null,
    countryFlag: countryRows[0]?.flagEmoji ?? null,
    passportCode: q.passportCode,
    title: q.title,
    body: q.body,
    resolved: q.resolved,
    createdAt: q.createdAt,
    answersCount: answers.length,
    followersCount,
    isFollowing,
    user: userSnippet(q),
    answers: answers.map((a) => ({
      id: a.id,
      body: a.body,
      gifUrl: a.gifUrl,
      isAccepted: a.isAccepted,
      repliesCount: Number(a.repliesCount),
      createdAt: a.createdAt,
      user: userSnippet(a),
    })),
  });
});

// ── Create question (global, countryCode in body) ───────────────────────────
router.post("/questions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const { title, body, countryCode, passportCode } = req.body;
  if (!title || !body || !countryCode) {
    res.status(400).json({ error: "title, body, and countryCode are required" });
    return;
  }

  const [question] = await db
    .insert(questionsTable)
    .values({
      userId: req.user.id,
      countryCode: String(countryCode).toUpperCase(),
      title,
      body,
      passportCode: passportCode?.toUpperCase() || null,
    })
    .returning();

  const country = await db.select({ name: countriesTable.name, flagEmoji: countriesTable.flagEmoji })
    .from(countriesTable)
    .where(eq(countriesTable.code, question.countryCode))
    .limit(1);

  res.status(201).json({
    id: question.id,
    countryCode: question.countryCode,
    countryName: country[0]?.name ?? null,
    countryFlag: country[0]?.flagEmoji ?? null,
    passportCode: question.passportCode,
    title: question.title,
    body: question.body,
    resolved: question.resolved,
    createdAt: question.createdAt,
    answersCount: 0,
    followersCount: 0,
    isFollowing: false,
    user: userSnippet({ firstName: req.user.firstName ?? null, lastName: req.user.lastName ?? null, profileImageUrl: req.user.profileImageUrl ?? null }),
  });
});

// ── Follow/Unfollow question ─────────────────────────────────────────────────
router.post("/questions/:id/follow", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const questionId = Number(req.params.id);
  const userId = req.user.id;

  const existing = await db
    .select()
    .from(questionFollowsTable)
    .where(and(eq(questionFollowsTable.userId, userId), eq(questionFollowsTable.questionId, questionId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(questionFollowsTable).where(and(eq(questionFollowsTable.userId, userId), eq(questionFollowsTable.questionId, questionId)));
  } else {
    await db.insert(questionFollowsTable).values({ userId, questionId });
  }

  const { followersCount, isFollowing } = await questionFollowStats(questionId, userId);
  res.json({ following: isFollowing, followersCount });
});

// ── Followed questions ───────────────────────────────────────────────────────
router.get("/users/me/followed-questions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const userId = req.user.id;

  const rows = await db.select({
    id: questionsTable.id,
    countryCode: questionsTable.countryCode,
    passportCode: questionsTable.passportCode,
    title: questionsTable.title,
    body: questionsTable.body,
    resolved: questionsTable.resolved,
    createdAt: questionsTable.createdAt,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    profileImageUrl: usersTable.profileImageUrl,
    homeCountry: usersTable.homeCountry,
    countryName: countriesTable.name,
    countryFlag: countriesTable.flagEmoji,
    answersCount: sql<number>`(SELECT COUNT(*) FROM answers WHERE question_id = ${questionsTable.id})`.as("answers_count"),
    followersCount: sql<number>`(SELECT COUNT(*) FROM question_follows WHERE question_id = ${questionsTable.id})`.as("followers_count"),
  })
    .from(questionFollowsTable)
    .innerJoin(questionsTable, eq(questionFollowsTable.questionId, questionsTable.id))
    .leftJoin(usersTable, eq(questionsTable.userId, usersTable.id))
    .leftJoin(countriesTable, eq(questionsTable.countryCode, countriesTable.code))
    .where(eq(questionFollowsTable.userId, userId))
    .orderBy(desc(questionFollowsTable.createdAt));

  res.json(rows.map((q) => ({
    id: q.id,
    countryCode: q.countryCode,
    countryName: q.countryName ?? null,
    countryFlag: q.countryFlag ?? null,
    passportCode: q.passportCode,
    title: q.title,
    body: q.body,
    resolved: q.resolved,
    createdAt: q.createdAt,
    answersCount: Number(q.answersCount),
    followersCount: Number(q.followersCount),
    isFollowing: true,
    user: userSnippet(q),
  })));
});

// ── Answer replies ───────────────────────────────────────────────────────────
router.get("/answers/:id/replies", async (req: Request, res: Response) => {
  const answerId = Number(req.params.id);

  const replies = await db.select({
    id: answerRepliesTable.id,
    body: answerRepliesTable.body,
    gifUrl: answerRepliesTable.gifUrl,
    createdAt: answerRepliesTable.createdAt,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    profileImageUrl: usersTable.profileImageUrl,
    homeCountry: usersTable.homeCountry,
  })
    .from(answerRepliesTable)
    .leftJoin(usersTable, eq(answerRepliesTable.userId, usersTable.id))
    .where(eq(answerRepliesTable.answerId, answerId))
    .orderBy(answerRepliesTable.createdAt);

  res.json(replies.map((r) => ({
    id: r.id,
    body: r.body,
    gifUrl: r.gifUrl,
    createdAt: r.createdAt,
    user: userSnippet(r),
  })));
});

router.post("/answers/:id/replies", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const answerId = Number(req.params.id);
  const { body, gifUrl } = req.body;

  if (!body) {
    res.status(400).json({ error: "body is required" });
    return;
  }

  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, answerId)).limit(1);
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }

  const [reply] = await db
    .insert(answerRepliesTable)
    .values({ userId: req.user.id, answerId, body, gifUrl: gifUrl || null })
    .returning();

  res.status(201).json({
    id: reply.id,
    body: reply.body,
    gifUrl: reply.gifUrl,
    createdAt: reply.createdAt,
    user: userSnippet({ firstName: req.user.firstName ?? null, lastName: req.user.lastName ?? null, profileImageUrl: req.user.profileImageUrl ?? null }),
  });
});

router.post("/questions/:id/resolve", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const questionId = Number(req.params.id);

  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, questionId)).limit(1);
  if (!q) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  if (q.userId !== req.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [answerId] = req.body.answerId ? [Number(req.body.answerId)] : [null];
  if (answerId) {
    await db.update(answersTable).set({ isAccepted: false }).where(eq(answersTable.questionId, questionId));
    await db.update(answersTable).set({ isAccepted: true }).where(and(eq(answersTable.id, answerId), eq(answersTable.questionId, questionId)));
  }

  const [updated] = await db.update(questionsTable).set({ resolved: true }).where(eq(questionsTable.id, questionId)).returning();
  res.json(updated);
});

// ── Travel Map ─────────────────────────────────────────────────────────────
router.get("/travel-map", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const entries = await db
    .select({
      id: travelEntriesTable.id,
      countryCode: travelEntriesTable.countryCode,
      status: travelEntriesTable.status,
      notes: travelEntriesTable.notes,
      createdAt: travelEntriesTable.createdAt,
      countryName: countriesTable.name,
      countryFlag: countriesTable.flagEmoji,
      continent: countriesTable.continent,
    })
    .from(travelEntriesTable)
    .leftJoin(countriesTable, eq(travelEntriesTable.countryCode, countriesTable.code))
    .where(eq(travelEntriesTable.userId, req.user.id))
    .orderBy(desc(travelEntriesTable.createdAt));

  res.json(entries);
});

router.put("/travel-map/:code", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const code = String(req.params.code).toUpperCase();
  const { status, notes } = req.body;

  if (!["visited", "want_to_visit"].includes(status)) {
    res.status(400).json({ error: "status must be 'visited' or 'want_to_visit'" });
    return;
  }

  const [entry] = await db
    .insert(travelEntriesTable)
    .values({ userId: req.user.id, countryCode: code, status, notes: notes || null })
    .onConflictDoUpdate({
      target: [travelEntriesTable.userId, travelEntriesTable.countryCode],
      set: { status, notes: notes || null },
    })
    .returning();

  res.json(entry);
});

router.delete("/travel-map/:code", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const code = String(req.params.code).toUpperCase();

  await db.delete(travelEntriesTable).where(
    and(eq(travelEntriesTable.userId, req.user.id), eq(travelEntriesTable.countryCode, code))
  );

  res.json({ ok: true });
});

// ── Visa Reports ────────────────────────────────────────────────────────────
router.get("/countries/:code/visa-reports", async (req: Request, res: Response) => {
  const code = String(req.params.code).toUpperCase();
  const passportFilter = req.query.passportCode ? String(req.query.passportCode).toUpperCase() : null;

  const rows = await db.select({
    id: visaReportsTable.id,
    userId: visaReportsTable.userId,
    passportCode: visaReportsTable.passportCode,
    visaType: visaReportsTable.visaType,
    appliedAt: visaReportsTable.appliedAt,
    decidedAt: visaReportsTable.decidedAt,
    processingDays: visaReportsTable.processingDays,
    result: visaReportsTable.result,
    notes: visaReportsTable.notes,
    createdAt: visaReportsTable.createdAt,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    profileImageUrl: usersTable.profileImageUrl,
    passportName: countriesTable.name,
    passportFlag: countriesTable.flagEmoji,
  })
    .from(visaReportsTable)
    .leftJoin(usersTable, eq(visaReportsTable.userId, usersTable.id))
    .leftJoin(countriesTable, eq(visaReportsTable.passportCode, countriesTable.code))
    .where(
      passportFilter
        ? and(eq(visaReportsTable.countryCode, code), eq(visaReportsTable.passportCode, passportFilter))
        : eq(visaReportsTable.countryCode, code)
    )
    .orderBy(desc(visaReportsTable.createdAt));

  const approved = rows.filter((r) => r.result === "approved");
  const denied = rows.filter((r) => r.result === "denied");
  const pending = rows.filter((r) => r.result === "pending");
  const withDays = rows.filter((r) => r.processingDays != null);
  const avgDays = withDays.length
    ? +(withDays.reduce((s, r) => s + (r.processingDays ?? 0), 0) / withDays.length).toFixed(1)
    : null;

  const passportMap = new Map<string, { count: number; days: number[]; approved: number; denied: number; name: string | null; flag: string | null }>();
  for (const r of rows) {
    const entry = passportMap.get(r.passportCode) ?? { count: 0, days: [], approved: 0, denied: 0, name: r.passportName ?? null, flag: r.passportFlag ?? null };
    entry.count++;
    if (r.processingDays != null) entry.days.push(r.processingDays);
    if (r.result === "approved") entry.approved++;
    if (r.result === "denied") entry.denied++;
    passportMap.set(r.passportCode, entry);
  }

  const byPassport = [...passportMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([passportCode, v]) => ({
      passportCode,
      passportName: v.name,
      passportFlag: v.flag,
      count: v.count,
      avgDays: v.days.length ? +(v.days.reduce((s, d) => s + d, 0) / v.days.length).toFixed(1) : null,
      approvedCount: v.approved,
      deniedCount: v.denied,
    }));

  res.json({
    count: rows.length,
    avgDays,
    approvedCount: approved.length,
    deniedCount: denied.length,
    pendingCount: pending.length,
    byPassport,
    reports: rows.map((r) => ({
      id: r.id,
      passportCode: r.passportCode,
      visaType: r.visaType,
      appliedAt: r.appliedAt,
      decidedAt: r.decidedAt,
      processingDays: r.processingDays,
      result: r.result,
      notes: r.notes,
      createdAt: r.createdAt,
      user: userSnippet(r),
    })),
  });
});

router.post("/countries/:code/visa-reports", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const code = String(req.params.code).toUpperCase();
  const { passportCode, visaType, appliedAt, decidedAt, result, notes } = req.body;

  if (!passportCode || !visaType || !appliedAt || !result) {
    res.status(400).json({ error: "passportCode, visaType, appliedAt, result are required" });
    return;
  }

  const appliedDate = new Date(appliedAt);
  const decidedDate = decidedAt ? new Date(decidedAt) : null;
  const processingDays = decidedDate
    ? Math.round((decidedDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const [report] = await db
    .insert(visaReportsTable)
    .values({
      userId: req.user.id,
      countryCode: code,
      passportCode: passportCode.toUpperCase(),
      visaType,
      appliedAt: appliedDate,
      decidedAt: decidedDate ?? undefined,
      processingDays: processingDays ?? undefined,
      result,
      notes: notes || null,
    })
    .returning();

  res.status(201).json(report);
});

export default router;

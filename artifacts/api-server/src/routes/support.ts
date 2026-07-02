import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { supportCasesTable, supportCaseCommentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { sendNewCaseAlert, sendCaseUpdate } from "../lib/email";

const router: IRouter = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "collabrintegration@gmail.com";

function isAdmin(req: Request) {
  return req.isAuthenticated() && req.user?.email === ADMIN_EMAIL;
}

// ── List current user's cases ────────────────────────────────────────────────
router.get("/support/cases", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const rows = isAdmin(req)
    ? await db.select().from(supportCasesTable).orderBy(desc(supportCasesTable.updatedAt))
    : await db
        .select()
        .from(supportCasesTable)
        .where(eq(supportCasesTable.userId, req.user.id))
        .orderBy(desc(supportCasesTable.updatedAt));

  res.json(rows);
});

// ── Create a new case ────────────────────────────────────────────────────────
router.post("/support/cases", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const { subject, body } = req.body;
  if (!subject || !body) {
    res.status(400).json({ error: "subject and body are required" });
    return;
  }

  const [row] = await db
    .insert(supportCasesTable)
    .values({ userId: req.user.id, subject, body, status: "open" })
    .returning();

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.user.id) });
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const userEmail = user?.email ?? req.user.email ?? "unknown";

  void sendNewCaseAlert({
    caseId: row.id,
    subject: row.subject,
    body: row.body,
    userEmail,
    userName,
  });

  res.status(201).json({ ...row, comments: [] });
});

// ── Get a single case with comments ─────────────────────────────────────────
router.get("/support/cases/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(supportCasesTable).where(eq(supportCasesTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  if (row.userId !== req.user!.id && !isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const comments = await db
    .select()
    .from(supportCaseCommentsTable)
    .where(eq(supportCaseCommentsTable.caseId, id))
    .orderBy(supportCaseCommentsTable.createdAt);

  res.json({ ...row, comments });
});

// ── Add comment (admin can also update status) ───────────────────────────────
router.post("/support/cases/:id/comments", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [caseRow] = await db.select().from(supportCasesTable).where(eq(supportCasesTable.id, id));
  if (!caseRow) { res.status(404).json({ error: "Not found" }); return; }

  if (caseRow.userId !== req.user!.id && !isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { body, status } = req.body;
  if (!body) { res.status(400).json({ error: "body is required" }); return; }

  const admin = isAdmin(req);

  const [comment] = await db
    .insert(supportCaseCommentsTable)
    .values({ caseId: id, userId: req.user!.id, body, isAdmin: admin })
    .returning();

  let newStatus = caseRow.status;
  if (admin && status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
    newStatus = status;
    await db
      .update(supportCasesTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportCasesTable.id, id));
  } else {
    await db
      .update(supportCasesTable)
      .set({ updatedAt: new Date() })
      .where(eq(supportCasesTable.id, id));
  }

  if (admin) {
    const caseOwner = await db.query.usersTable.findFirst({ where: eq(usersTable.id, caseRow.userId) });
    if (caseOwner?.email) {
      void sendCaseUpdate({
        caseId: id,
        subject: caseRow.subject,
        comment: body,
        toEmail: caseOwner.email,
        toName: [caseOwner.firstName, caseOwner.lastName].filter(Boolean).join(" ") || "User",
        newStatus: newStatus !== caseRow.status ? newStatus : undefined,
      });
    }
  }

  res.status(201).json(comment);
});

export default router;

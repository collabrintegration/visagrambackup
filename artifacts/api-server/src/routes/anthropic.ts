import { Router, type IRouter, type Request, type Response } from "express";
import { db, conversations, messages } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

const TRAVEL_ADVISOR_SYSTEM_PROMPT = `You are Visagram AI, an expert travel advisor specializing in visa requirements, travel planning, and destination recommendations.

Your expertise includes:
- Visa requirements for all nationalities worldwide
- Visa-on-arrival and visa-free travel
- E-visa and embassy appointment processes
- Travel costs and budget planning by destination
- Best times to visit countries
- Travel safety and health requirements
- Hidden gem destinations and popular travel routes

When recommending countries, always mention:
- Visa status for common passport holders (e.g., US, EU, UK, Indian passports)
- Approximate travel costs (budget/mid-range/luxury)
- Key highlights and attractions
- Best travel season

Keep responses concise, friendly, and practical. When listing countries as recommendations, format each one clearly so they can be displayed as visual cards. Use markdown for structure.`;

// List all conversations
router.get("/anthropic/conversations", async (req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(conversations)
    .orderBy(asc(conversations.createdAt));
  res.json(rows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

// Create a new conversation
router.post("/anthropic/conversations", async (req: Request, res: Response) => {
  const { title } = req.body as { title?: string };
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [row] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

// Get a single conversation with its messages
router.get("/anthropic/conversations/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  res.json({
    ...conv,
    createdAt: conv.createdAt.toISOString(),
    messages: msgs.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
});

// Delete a conversation (cascades to messages)
router.delete("/anthropic/conversations/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).send();
});

// List messages in a conversation
router.get("/anthropic/conversations/:id/messages", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  res.json(msgs.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

// Send a message — persists user msg, streams assistant reply via SSE
router.post("/anthropic/conversations/:id/messages", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }

  const { content } = req.body as { content?: string };
  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  // Persist the user message
  await db.insert(messages).values({ conversationId: id, role: "user", content });

  // Fetch full conversation history to pass to Claude
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let fullContent = "";

  try {
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: TRAVEL_ADVISOR_SYSTEM_PROMPT,
      messages: history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        fullContent += chunk.delta.text;
        sendEvent({ content: chunk.delta.text });
      }
    }

    // Persist the full assistant message
    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullContent,
    });

    sendEvent({ done: true });
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI request failed";
    sendEvent({ error: msg });
    res.end();
  }
});

export default router;

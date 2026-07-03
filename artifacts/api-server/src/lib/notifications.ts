import { db, notificationsTable, usersTable, type Notification } from "@workspace/db";
import { inArray, sql } from "drizzle-orm";

const MENTION_REGEX = /(^|\s)@([a-zA-Z0-9_]{2,30})\b/g;

export function extractMentionedUsernames(text: string): string[] {
  const usernames = new Set<string>();
  let match: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text))) {
    usernames.add(match[2].toLowerCase());
  }
  return [...usernames];
}

async function resolveMentionedUserIds(text: string, excludeUserId: string): Promise<string[]> {
  const usernames = extractMentionedUsernames(text);
  if (usernames.length === 0) return [];

  const rows = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(inArray(sql`lower(${usersTable.username})`, usernames));

  return [...new Set(rows.map((r) => r.id).filter((id) => id !== excludeUserId))];
}

export type NotificationType = Notification["type"];

export async function createNotification(params: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  link: string;
  preview?: string | null;
}): Promise<void> {
  if (params.recipientId === params.actorId) return;
  await db.insert(notificationsTable).values({
    recipientId: params.recipientId,
    actorId: params.actorId,
    type: params.type,
    link: params.link,
    preview: params.preview ?? null,
  });
}

function truncate(text: string, max = 140): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export async function createMentionNotifications(params: {
  text: string;
  actorId: string;
  link: string;
  type: Extract<NotificationType, "mention_qa" | "mention_chat">;
  allowedRecipientIds?: string[];
}): Promise<void> {
  let recipientIds = await resolveMentionedUserIds(params.text, params.actorId);
  if (params.allowedRecipientIds) {
    const allowed = new Set(params.allowedRecipientIds);
    recipientIds = recipientIds.filter((id) => allowed.has(id));
  }
  if (recipientIds.length === 0) return;

  const preview = truncate(params.text);
  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({
        recipientId,
        actorId: params.actorId,
        type: params.type,
        link: params.link,
        preview,
      }),
    ),
  );
}

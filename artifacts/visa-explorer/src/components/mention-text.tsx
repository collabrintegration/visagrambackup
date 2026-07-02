import { useMemo } from "react";
import { Link } from "wouter";
import { useSearchUsers, getSearchUsersQueryKey } from "@workspace/api-client-react";

type Segment = { type: "text"; value: string } | { type: "mention"; username: string };

const MENTION_REGEX = /(^|\s)@([a-zA-Z0-9_]{2,30})\b/g;

function splitMentions(text: string): Segment[] {
  const parts: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text))) {
    const leading = match[1];
    const atStart = match.index + leading.length;
    if (atStart > lastIndex) parts.push({ type: "text", value: text.slice(lastIndex, atStart) });
    parts.push({ type: "mention", username: match[2] });
    lastIndex = atStart + 1 + match[2].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });
  return parts;
}

function MentionLink({ username }: { username: string }) {
  const { data: results = [] } = useSearchUsers(
    { q: username, limit: 5 },
    { query: { queryKey: getSearchUsersQueryKey({ q: username }), enabled: !!username, staleTime: Infinity } },
  );
  const match = results.find((u) => u.username?.toLowerCase() === username.toLowerCase());

  if (!match) return <span>@{username}</span>;

  return (
    <Link
      href={`/user/${match.id}`}
      onClick={(e) => e.stopPropagation()}
      className="text-primary font-medium hover:underline"
    >
      @{username}
    </Link>
  );
}

export default function MentionText({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => splitMentions(text), [text]);

  if (parts.length === 1 && parts[0].type === "text") {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === "mention" ? (
          <MentionLink key={i} username={part.username} />
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </span>
  );
}

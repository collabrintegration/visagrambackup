import { useRef, useState, type RefObject } from "react";
import { useSearchUsers, getSearchUsersQueryKey } from "@workspace/api-client-react";
import type { UserSearchResult } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";

export type MentionCandidate = UserSearchResult & { username: string };

interface Trigger {
  start: number;
  query: string;
}

export function useMentionAutocomplete(
  text: string,
  setText: (value: string) => void,
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
) {
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [highlighted, setHighlighted] = useState(0);
  const debouncedQuery = useDebounce(trigger?.query ?? "", 150);
  const lastSelectionRef = useRef(0);

  const { data: results = [] } = useSearchUsers(
    { q: debouncedQuery, limit: 6 },
    { query: { queryKey: getSearchUsersQueryKey({ q: debouncedQuery }), enabled: !!trigger } },
  );

  const suggestions: MentionCandidate[] = results.filter(
    (u): u is MentionCandidate => !!u.username,
  );

  function onChangeText(value: string, cursorPos: number) {
    setText(value);
    lastSelectionRef.current = cursorPos;
    const uptoCursor = value.slice(0, cursorPos);
    const match = /(?:^|\s)@([a-zA-Z0-9_]{0,30})$/.exec(uptoCursor);
    if (match) {
      setTrigger({ start: cursorPos - match[1].length - 1, query: match[1] });
      setHighlighted(0);
    } else if (trigger) {
      setTrigger(null);
    }
  }

  function select(user: MentionCandidate) {
    if (!trigger) return;
    const cursor = lastSelectionRef.current;
    const before = text.slice(0, trigger.start);
    const after = text.slice(cursor);
    const insertion = `@${user.username} `;
    const newText = before + insertion + after;
    setText(newText);
    setTrigger(null);
    requestAnimationFrame(() => {
      const pos = (before + insertion).length;
      inputRef.current?.setSelectionRange(pos, pos);
      inputRef.current?.focus();
    });
  }

  function onKeyDown(e: { key: string; preventDefault: () => void }): boolean {
    if (!trigger || suggestions.length === 0) return false;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      select(suggestions[highlighted]);
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setTrigger(null);
      return true;
    }
    return false;
  }

  return {
    active: !!trigger && suggestions.length > 0,
    suggestions,
    highlighted,
    setHighlighted,
    select,
    onChangeText,
    onKeyDown,
    close: () => setTrigger(null),
  };
}

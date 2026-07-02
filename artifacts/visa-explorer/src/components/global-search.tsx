import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, Users, Globe, MessageSquare, UserPlus, Loader2, X } from "lucide-react";
import {
  useSearchUsers, useListGroups, useGetCommunityFeed,
  getSearchUsersQueryKey, getListGroupsQueryKey, getGetCommunityFeedQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useDebounce } from "@/hooks/use-debounce";

function Avatar({ url, name, size = 28 }: { url?: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  if (url) return <img src={url} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />;
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

export default function GlobalSearch() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const canSearch = debouncedQuery.trim().length >= 2;

  const { data: users = [], isLoading: loadingUsers } = useSearchUsers(
    { q: debouncedQuery },
    { query: { queryKey: getSearchUsersQueryKey({ q: debouncedQuery }), enabled: isAuthenticated && canSearch } },
  );

  const { data: groups = [], isLoading: loadingGroups } = useListGroups(
    { query: { queryKey: getListGroupsQueryKey(), enabled: canSearch } },
  );

  const { data: feed = [], isLoading: loadingFeed } = useGetCommunityFeed(
    { limit: 100 },
    { query: { queryKey: getGetCommunityFeedQueryKey({ limit: 100 }), enabled: canSearch } },
  );

  // Filter groups and feed locally
  const q = debouncedQuery.toLowerCase();
  const matchedGroups = canSearch
    ? groups.filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const matchedFeed = canSearch
    ? (feed as Array<{ id: number; type: string; data: Record<string, unknown>; userName?: string; countryName?: string; createdAt: string }>)
        .filter(item => {
          const content = typeof item.data["content"] === "string" ? item.data["content"] : "";
          const title = typeof item.data["title"] === "string" ? item.data["title"] : "";
          const body = typeof item.data["body"] === "string" ? item.data["body"] : "";
          return (content + title + body + (item.userName ?? "") + (item.countryName ?? "")).toLowerCase().includes(q);
        })
        .slice(0, 3)
    : [];

  const hasResults = users.length > 0 || matchedGroups.length > 0 || matchedFeed.length > 0;
  const isLoading = loadingUsers || loadingGroups || loadingFeed;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    navigate(href);
  };

  return (
    <div ref={containerRef} className="relative hidden md:block w-96">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search…"
          className="w-full pl-9 pr-8 py-1.5 text-sm bg-muted/60 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-colors placeholder:text-muted-foreground"
        />
        {query ? (
          <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => { setQuery(""); setOpen(false); }}>
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 border border-border rounded px-1">⌘K</kbd>
        )}
      </div>

      {/* Dropdown */}
      {open && query.trim().length > 0 && (
        <div className="absolute top-full mt-2 left-0 w-[380px] rounded-xl border border-border bg-background shadow-2xl shadow-black/20 z-[100] overflow-hidden">
          {!canSearch ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Type at least 2 characters…</div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No results for "{debouncedQuery}"</div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {/* People */}
              {users.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                    <UserPlus className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">People</span>
                  </div>
                  {users.slice(0, 4).map(u => {
                    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "Traveler";
                    return (
                      <button
                        key={u.id}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                        onClick={() => handleSelect("/friends?search=" + encodeURIComponent(name))}
                      >
                        <Avatar url={u.profileImageUrl} name={name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name}</p>
                          {u.homeCountry && <p className="text-xs text-muted-foreground">{u.homeCountry}</p>}
                        </div>
                        {u.friendshipStatus === "accepted" && (
                          <span className="text-xs text-emerald-500 font-medium shrink-0">Friend</span>
                        )}
                      </button>
                    );
                  })}
                </section>
              )}

              {/* Groups */}
              {matchedGroups.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Groups</span>
                  </div>
                  {matchedGroups.map(g => (
                    <button
                      key={g.id}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                      onClick={() => handleSelect(`/groups/${g.id}`)}
                    >
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                        {g.isPrivate ? "🔒" : "🌐"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.memberCount ?? 0} members</p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Community */}
              {matchedFeed.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                    <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Community</span>
                  </div>
                  {matchedFeed.map(item => {
                    const text = (typeof item.data["content"] === "string" ? item.data["content"] : "") ||
                      (typeof item.data["title"] === "string" ? item.data["title"] : "") || "Post";
                    return (
                      <button
                        key={item.id}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                        onClick={() => handleSelect("/community")}
                      >
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{text.slice(0, 60)}{text.length > 60 ? "…" : ""}</p>
                          <p className="text-xs text-muted-foreground">{item.userName ?? "Traveler"} · {item.countryName ?? ""}</p>
                        </div>
                      </button>
                    );
                  })}
                </section>
              )}

              {/* View all results footer */}
              <div className="border-t border-border mt-1">
                <button
                  className="w-full px-3 py-2.5 text-xs text-center text-primary hover:bg-muted/40 transition-colors"
                  onClick={() => handleSelect(`/friends?tab=search&q=${encodeURIComponent(debouncedQuery)}`)}
                >
                  See all results for "{debouncedQuery}"
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

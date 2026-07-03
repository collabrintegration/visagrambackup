import { Helmet } from "react-helmet-async";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useGetCommunityFeed,
  getGetCommunityFeedQueryKey,
  useListCountries,
  useCreateQuestion,
  useListGroups,
  useCreateGroup,
  useJoinGroup,
  getListGroupsQueryKey,
  useDeleteQuestion,
  useDeleteCountryReview,
} from "@workspace/api-client-react";
import type { FeedItem, Country, Group } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare, Star, Globe, Users, Loader2, MapPin, LogIn,
  TrendingUp, Search, X, ChevronDown, Filter, PenLine, Save,
  Plus, Lock, UserPlus, AlertTriangle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdUnit from "@/components/ad-unit";
import CountryCombobox from "@/components/country-combobox";
import UserMiniCard from "@/components/user-mini-card";
import { useIsMobile } from "@/hooks/use-mobile";

const GROUP_EMOJI_OPTIONS = ["🌍","✈️","🗺️","🏖️","🏔️","🌏","🌐","🚀","🎒","🧳","🌴","🏕️","🚂","⛵","🛸","🏛️","🌺","🍜","🎉","🤝"];

function stringSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().trim();
  const aa = norm(a); const bb = norm(b);
  if (aa === bb) return 1;
  if (aa.length < 2 || bb.length < 2) return 0;
  function bigrams(s: string): Map<string, number> {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bi = s.slice(i, i + 2);
      map.set(bi, (map.get(bi) ?? 0) + 1);
    }
    return map;
  }
  const biA = bigrams(aa); const biB = bigrams(bb);
  let intersection = 0;
  for (const [bi, cntA] of biA) intersection += Math.min(cntA, biB.get(bi) ?? 0);
  const denom = aa.length + bb.length - 2;
  return denom > 0 ? (2 * intersection) / denom : 0;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function FeedCard({ item, myId, onDelete }: { item: FeedItem; myId?: string; onDelete?: () => void }) {
  const isReview = item.type === "review";
  const href = isReview
    ? `/country/${item.countryCode}`
    : `/questions/${item.id}`;
  const authorId = item.user?.userId;
  const canMessage = authorId && authorId !== myId;
  const isOwn = !!myId && authorId === myId;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link href={href} className="shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {(item.user?.firstName || "A")[0].toUpperCase()}
            </div>
          </Link>
          <div className="min-w-0">
            <UserMiniCard
              userId={item.user?.userId ?? ""}
              firstName={item.user?.firstName}
              lastName={item.user?.lastName}
              profileImageUrl={item.user?.profileImageUrl}
              className="font-semibold text-sm"
            />
            <span className="text-xs text-muted-foreground block">
              {timeAgo(item.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canMessage && (
            <Link
              href={`/messages/${authorId}`}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Send message"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </Link>
          )}
          {isOwn && onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); if (confirm(`Delete this ${isReview ? "review" : "question"}?`)) onDelete(); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title={`Delete ${isReview ? "review" : "question"}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Badge
            variant="secondary"
            className={`text-xs border-none ${isReview ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-400"}`}
          >
            {isReview ? (
              <><Star className="w-3 h-3 mr-1" /> Review</>
            ) : (
              <><MessageSquare className="w-3 h-3 mr-1" /> Q&A</>
            )}
          </Badge>
        </div>
      </div>

      <Link href={href} className="block mt-1">
        {/* Country badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {item.countryName ?? item.countryCode}
          </span>
          <MapPin className="w-3 h-3 text-muted-foreground/50 ml-1" />
        </div>

        {/* Content */}
        {isReview ? (
          <>
            {"overallRating" in item.data && typeof item.data.overallRating === "number" && (
              <div className="flex items-center gap-2 mb-2">
                <StarRow rating={item.data.overallRating} />
                <span className="text-xs text-muted-foreground font-medium">
                  {item.data.overallRating.toFixed(1)} / 5
                </span>
              </div>
            )}
            {"body" in item.data && typeof item.data.body === "string" && item.data.body && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {item.data.body}
              </p>
            )}
          </>
        ) : (
          <>
            {"title" in item.data && typeof item.data.title === "string" && (
              <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                {item.data.title}
              </p>
            )}
            {"body" in item.data && typeof item.data.body === "string" && item.data.body && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.data.body}
              </p>
            )}
            {"answersCount" in item.data && typeof item.data.answersCount === "number" && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                {item.data.answersCount} {item.data.answersCount === 1 ? "answer" : "answers"}
              </div>
            )}
          </>
        )}
      </Link>
    </div>
  );
}

type FeedType = "all" | "question" | "review";

export default function Community() {
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const myId = (user as { id?: string })?.id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FeedType>("all");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [countryOpen, setCountryOpen] = useState(false);

  // Ask Question modal state
  const [showAskModal, setShowAskModal] = useState(false);
  const [askCountry, setAskCountry] = useState<string | null>(null);
  const [askTitle, setAskTitle] = useState("");
  const [askBody, setAskBody] = useState("");

  // Create Group modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupEmoji, setGroupEmoji] = useState("🌍");
  const [groupPrivate, setGroupPrivate] = useState(false);
  const [groupSort, setGroupSort] = useState<"members" | "newest" | "alpha">("members");
  const [groupType, setGroupType] = useState<"all" | "public" | "private">("all");
  const [groupPage, setGroupPage] = useState(0);
  const [qaPage, setQaPage] = useState(0);
  const [qaSort, setQaSort] = useState<"newest" | "answers">("newest");

  const isMobile = useIsMobile();
  const GROUPS_PER_PAGE = isMobile ? 6 : 12;
  const QA_PER_PAGE = isMobile ? 6 : 10;

  const { data: feed = [], isLoading: feedLoading } = useGetCommunityFeed(
    { limit: 100 },
    {
      query: {
        queryKey: getGetCommunityFeedQueryKey({ limit: 100 }),
      },
    },
  );

  const { data: allCountries = [] } = useListCountries();

  const { mutate: createQuestion, isPending: isCreatingQuestion } = useCreateQuestion({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetCommunityFeedQueryKey({ limit: 100 }) });
        setShowAskModal(false);
        setAskCountry(null);
        setAskTitle("");
        setAskBody("");
      },
    },
  });

  const { mutate: deleteQuestion } = useDeleteQuestion({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: getGetCommunityFeedQueryKey({ limit: 100 }) }),
    },
  });

  const { mutate: deleteReview } = useDeleteCountryReview({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: getGetCommunityFeedQueryKey({ limit: 100 }) }),
    },
  });

  const { data: allGroups = [] } = useListGroups({
    query: { queryKey: getListGroupsQueryKey() },
  });

  const { mutate: createGroup, isPending: isCreatingGroup } = useCreateGroup({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        setShowGroupModal(false);
        setGroupName("");
        setGroupDesc("");
        setGroupEmoji("🌍");
        setGroupPrivate(false);
      },
    },
  });

  const { mutate: joinGroup } = useJoinGroup({
    mutation: { onSuccess: () => void queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() }) },
  });

  const similarGroups = (() => {
    if (!groupName.trim() || groupName.trim().length < 3) return [];
    return allGroups
      .map((g) => ({ group: g, score: stringSimilarity(groupName, g.name) }))
      .filter(({ score }) => score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ group }) => group);
  })();

  const exactDuplicate = similarGroups.some(
    (g) => g.name.toLowerCase().trim() === groupName.toLowerCase().trim(),
  );

  const filteredSidebarGroups = useMemo(() => {
    const q = groupSearch.toLowerCase().trim();
    let result = [...allGroups];
    if (groupType === "public") result = result.filter((g) => !g.isPrivate);
    if (groupType === "private") result = result.filter((g) => g.isPrivate);
    if (q) result = result.filter((g) => g.name.toLowerCase().includes(q) || (g.description ?? "").toLowerCase().includes(q));
    if (groupSort === "members") result.sort((a, b) => b.memberCount - a.memberCount);
    else if (groupSort === "newest") result.sort((a, b) => b.id - a.id);
    else result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [allGroups, groupSearch, groupSort, groupType]);

  const isLoading = authLoading || feedLoading;

  // All countries for the filter dropdown
  const countries = useMemo(() => {
    return (allCountries as Country[])
      .map((c): [string, string] => [c.code, `${c.flagEmoji ?? ""} ${c.name}`.trim()])
      .sort((a: [string, string], b: [string, string]) => a[1].localeCompare(b[1]));
  }, [allCountries]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = feed;

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    // Country filter
    if (countryFilter) {
      result = result.filter((item) => item.countryCode === countryFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const title = typeof item.data.title === "string" ? item.data.title.toLowerCase() : "";
        const body = typeof item.data.body === "string" ? item.data.body.toLowerCase() : "";
        const country = (item.countryName ?? item.countryCode ?? "").toLowerCase();
        return title.includes(q) || body.includes(q) || country.includes(q);
      });
    }

    return result;
  }, [feed, typeFilter, countryFilter, search]);

  const activeFiltersCount = (typeFilter !== "all" ? 1 : 0) + (countryFilter ? 1 : 0);
  const selectedCountryLabel = countryFilter
    ? countries.find(([code]) => code === countryFilter)?.[1] ?? countryFilter
    : null;

  return (
    <>
    <Helmet>
      <title>Community — Traveler Reviews & Visa Q&A | Visagram</title>
      <meta name="description" content="Read real traveler reviews, ask visa questions, and get answers from a global community of travelers. Share your own experiences and help others plan their trips." />
      <meta property="og:title" content="Community — Traveler Reviews & Visa Q&A | Visagram" />
      <meta property="og:description" content="Read real traveler reviews, ask visa questions, and connect with a global community of travelers on Visagram." />
      <meta property="og:url" content="https://visagram.io/community" />
      <meta property="og:image" content="https://visagram.io/og-image.png" />
      <meta name="twitter:image" content="https://visagram.io/og-image.png" />
    </Helmet>
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border/60 bg-card/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-widest mb-3">
                <Users className="w-4 h-4" /> Community
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Travel Stories & Insights
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Real reviews, questions, and experiences from travelers around the world.
              </p>
            </div>
            {!authLoading && (
              isAuthenticated ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" onClick={() => setShowGroupModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create Group
                  </Button>
                  <Button onClick={() => setShowAskModal(true)}>
                    <PenLine className="w-4 h-4 mr-2" /> Ask a Question
                  </Button>
                </div>
              ) : (
                <Button onClick={login} variant="outline" className="shrink-0">
                  <LogIn className="w-4 h-4 mr-2" /> Sign in to contribute
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Groups + Questions two-column layout */}
      <div className="container mx-auto px-4 py-8 max-w-7xl" onClick={() => setCountryOpen(false)}>
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* ── LEFT: Groups column (major portion) ─────────────── */}
          <div className="min-w-0 flex-[3]">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-primary" /> Travel Groups
                {filteredSidebarGroups.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">({filteredSidebarGroups.length})</span>
                )}
              </h3>
              {isAuthenticated && (
                <Button size="sm" variant="outline" onClick={() => setShowGroupModal(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> New Group
                </Button>
              )}
            </div>

            {/* Group search + filters row */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={groupSearch}
                  onChange={(e) => { setGroupSearch(e.target.value); setGroupPage(0); }}
                  placeholder="Search groups…"
                  className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
                {groupSearch && (
                  <button onClick={() => { setGroupSearch(""); setGroupPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {/* Type filter */}
              <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-1.5 py-1">
                {(["all", "public", "private"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setGroupType(t); setGroupPage(0); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${groupType === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t === "all" ? "All" : t === "public" ? "🌐 Public" : "🔒 Private"}
                  </button>
                ))}
              </div>
              {/* Sort */}
              <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-1.5 py-1">
                {([["members", "👥 Members"], ["newest", "🆕 Newest"], ["alpha", "🔤 A–Z"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setGroupSort(val); setGroupPage(0); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${groupSort === val ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Groups grid */}
            {filteredSidebarGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {groupSearch || groupType !== "all" ? "No groups match your filters" : "No groups yet"}
                </p>
                {isAuthenticated && (
                  <Button size="sm" className="mt-3" onClick={() => setShowGroupModal(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Create the first group
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredSidebarGroups.slice(groupPage * GROUPS_PER_PAGE, (groupPage + 1) * GROUPS_PER_PAGE).map((g) => (
                    <div
                      key={g.id}
                      className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors flex flex-col gap-3"
                    >
                      {/* Emoji + privacy badge */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-5xl leading-none">{g.emoji}</span>
                        {g.isPrivate && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0 mt-1">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </span>
                        )}
                      </div>

                      {/* Name + description */}
                      <div className="flex-1 min-h-0">
                        <p className="font-semibold text-sm leading-tight line-clamp-2">{g.name}</p>
                        {g.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {g.description}
                          </p>
                        )}
                      </div>

                      {/* Member count */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{g.memberCount} member{g.memberCount !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Action button */}
                      <div>
                        {g.isMember ? (
                          <Link href={`/groups/${g.id}`}>
                            <Button size="sm" className="w-full">
                              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Open Chat
                            </Button>
                          </Link>
                        ) : isAuthenticated ? (
                          <Button size="sm" variant="outline" className="w-full" onClick={() => joinGroup({ id: g.id })}>
                            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                            {g.isPrivate ? "Request to Join" : "Join Group"}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full" onClick={login}>
                            <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign in to Join
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Groups pagination */}
                {filteredSidebarGroups.length > GROUPS_PER_PAGE && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {groupPage * GROUPS_PER_PAGE + 1}–{Math.min((groupPage + 1) * GROUPS_PER_PAGE, filteredSidebarGroups.length)} of {filteredSidebarGroups.length}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setGroupPage((p) => Math.max(0, p - 1))} disabled={groupPage === 0} className="h-7 px-3 text-xs">
                        ← Prev
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setGroupPage((p) => p + 1)} disabled={(groupPage + 1) * GROUPS_PER_PAGE >= filteredSidebarGroups.length} className="h-7 px-3 text-xs">
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT: Questions column ─────────────────────────── */}
          <div className="min-w-0 flex-[2]">
            {/* Q&A column header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-base">
                <MessageSquare className="w-4 h-4 text-primary" /> Q&amp;A
              </h3>
              {isAuthenticated && (
                <Button size="sm" onClick={() => setShowAskModal(true)}>
                  <PenLine className="w-3.5 h-3.5 mr-1.5" /> Ask
                </Button>
              )}
            </div>

            {/* Q&A search + country filter + sort */}
            <div className="flex flex-col gap-2 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setQaPage(0); }}
                  placeholder="Search questions…"
                  className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
                {search && (
                  <button onClick={() => { setSearch(""); setQaPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Country filter + sort row */}
              <div className="flex gap-2">
                {/* Country */}
                <div className="relative flex-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setCountryOpen((v) => !v); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                      countryFilter
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate text-xs flex-1 text-left">{selectedCountryLabel ?? "All countries"}</span>
                    {countryFilter ? (
                      <span onClick={(e) => { e.stopPropagation(); setCountryFilter(""); setCountryOpen(false); setQaPage(0); }}>
                        <X className="w-3 h-3" />
                      </span>
                    ) : (
                      <ChevronDown className="w-3 h-3 shrink-0" />
                    )}
                  </button>
                  {countryOpen && (
                    <div className="absolute left-0 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="max-h-56 overflow-y-auto py-1">
                        <button onClick={() => { setCountryFilter(""); setCountryOpen(false); setQaPage(0); }}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-muted/50 ${!countryFilter ? "text-primary font-medium" : "text-foreground"}`}>
                          All Countries
                        </button>
                        {countries.map(([code, label]) => (
                          <button key={code} onClick={() => { setCountryFilter(code); setCountryOpen(false); setQaPage(0); }}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-muted/50 ${countryFilter === code ? "text-primary font-medium bg-primary/5" : "text-foreground"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Sort */}
                <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-1.5 py-1 shrink-0">
                  <button onClick={() => { setQaSort("newest"); setQaPage(0); }} className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${qaSort === "newest" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    🕐 New
                  </button>
                  <button onClick={() => { setQaSort("answers"); setQaPage(0); }} className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${qaSort === "answers" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    💬 Top
                  </button>
                </div>
              </div>
            </div>

            {/* Questions list */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (() => {
              let questions = filtered.filter((item) => item.type === "question");
              if (qaSort === "answers") {
                questions = [...questions].sort((a, b) => {
                  const aA = typeof a.data.answersCount === "number" ? a.data.answersCount : 0;
                  const bA = typeof b.data.answersCount === "number" ? b.data.answersCount : 0;
                  return bA - aA;
                });
              }
              const totalQa = questions.length;
              const pageQa = questions.slice(qaPage * QA_PER_PAGE, (qaPage + 1) * QA_PER_PAGE);
              if (totalQa === 0) {
                return (
                  <div className="text-center py-16">
                    <MessageSquare className="w-10 h-10 mx-auto text-muted mb-3 opacity-40" />
                    <p className="text-sm font-semibold mb-1">
                      {search || countryFilter ? "No questions found" : "No questions yet"}
                    </p>
                    <p className="text-muted-foreground text-xs mb-4">
                      {search || countryFilter ? "Try different filters." : "Be the first to ask."}
                    </p>
                    {!isAuthenticated ? (
                      <Button size="sm" onClick={login}><LogIn className="w-3.5 h-3.5 mr-1.5" />Sign in to ask</Button>
                    ) : (
                      <Button size="sm" onClick={() => setShowAskModal(true)}><PenLine className="w-3.5 h-3.5 mr-1.5" />Ask a Question</Button>
                    )}
                  </div>
                );
              }
              return (
                <>
                  <div className="space-y-2">
                    {pageQa.map((item) => {
                      const title = typeof item.data.title === "string" ? item.data.title : "";
                      const body = typeof item.data.body === "string" ? item.data.body : "";
                      const answers = typeof item.data.answersCount === "number" ? item.data.answersCount : 0;
                      const authorId = item.user?.userId;
                      const isOwn = !!myId && authorId === myId;
                      return (
                        <Link key={item.id} href={`/questions/${item.id}`}>
                          <div className="group bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition-colors cursor-pointer">
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                                {(item.user?.firstName || "A")[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">{title}</p>
                                {body && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{body}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{item.countryName ?? item.countryCode}</span>
                                  <span className="flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" />{answers} {answers === 1 ? "answer" : "answers"}</span>
                                  <span>{timeAgo(item.createdAt)}</span>
                                </div>
                              </div>
                              {isOwn && (
                                <button
                                  onClick={(e) => { e.preventDefault(); if (confirm("Delete this question?")) deleteQuestion({ id: item.id }); }}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  {/* Q&A pagination */}
                  {totalQa > QA_PER_PAGE && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {qaPage * QA_PER_PAGE + 1}–{Math.min((qaPage + 1) * QA_PER_PAGE, totalQa)} of {totalQa}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setQaPage((p) => Math.max(0, p - 1))} disabled={qaPage === 0} className="h-7 px-3 text-xs">
                          ← Prev
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setQaPage((p) => p + 1)} disabled={(qaPage + 1) * QA_PER_PAGE >= totalQa} className="h-7 px-3 text-xs">
                          Next →
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>

    {/* ── Create Group Modal ───────────────────────────────────────── */}
    {showGroupModal && (
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) setShowGroupModal(false); }}
      >
        <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-lg">Create a Group</h2>
            <button onClick={() => setShowGroupModal(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block font-medium">Pick an emoji</label>
              <div className="flex flex-wrap gap-2">
                {GROUP_EMOJI_OPTIONS.map((e) => (
                  <button key={e} onClick={() => setGroupEmoji(e)}
                    className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all ${groupEmoji === e ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Group name *</label>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Southeast Asia Backpackers"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                maxLength={80}
              />
              {similarGroups.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Similar groups already exist — consider joining one instead:
                  </div>
                  {similarGroups.map((g) => (
                    <div key={g.id} className="flex items-center justify-between gap-2 bg-card rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{g.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{g.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {g.memberCount} member{g.memberCount !== 1 ? "s" : ""} · {g.isPrivate ? "Private" : "Public"}
                          </p>
                        </div>
                      </div>
                      {g.isMember ? (
                        <Link href={`/groups/${g.id}`}>
                          <Button size="sm" className="h-7 text-xs shrink-0" onClick={() => setShowGroupModal(false)}>
                            <MessageSquare className="w-3 h-3 mr-1" /> Open
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0"
                          onClick={() => { joinGroup({ id: g.id }); setShowGroupModal(false); }}>
                          <UserPlus className="w-3 h-3 mr-1" /> {g.isPrivate ? "Request" : "Join"}
                        </Button>
                      )}
                    </div>
                  ))}
                  {exactDuplicate && (
                    <p className="text-xs text-destructive font-medium pt-1">
                      A group with this exact name already exists. Please choose a different name.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Description</label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="What is this group about?"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                maxLength={300}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => setGroupPrivate(!groupPrivate)}
                className={`w-10 h-5 rounded-full transition-colors ${groupPrivate ? "bg-primary" : "bg-muted"} relative`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${groupPrivate ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-sm font-medium">Private group</span>
              <span className="text-xs text-muted-foreground">(members must request to join)</span>
            </label>
            <div className="flex gap-3 pt-1">
              <Button className="flex-1" disabled={isCreatingGroup || !groupName.trim() || exactDuplicate}
                onClick={() => createGroup({ data: { name: groupName, description: groupDesc || undefined, emoji: groupEmoji, isPrivate: groupPrivate } })}>
                {isCreatingGroup ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                Create Group
              </Button>
              <Button variant="ghost" onClick={() => setShowGroupModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Ask a Question Modal ─────────────────────────────────────── */}
    {showAskModal && (
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) setShowAskModal(false); }}
      >
        <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-lg">Ask a Question</h2>
            <button onClick={() => setShowAskModal(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Country</label>
              <CountryCombobox
                value={askCountry}
                onChange={setAskCountry}
                placeholder="Which country is your question about?"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Question title</label>
              <input
                value={askTitle}
                onChange={(e) => setAskTitle(e.target.value)}
                placeholder="e.g. Do I need a visa if I have a US passport?"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{askTitle.length}/160</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Details</label>
              <textarea
                value={askBody}
                onChange={(e) => setAskBody(e.target.value)}
                placeholder="Add any relevant context — your passport, visa type, trip dates, what you've already tried…"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none h-28 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                className="flex-1"
                disabled={isCreatingQuestion || !askCountry || !askTitle.trim() || !askBody.trim()}
                onClick={() => createQuestion({ data: { countryCode: askCountry!, title: askTitle.trim(), body: askBody.trim() } })}
              >
                {isCreatingQuestion ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                Post Question
              </Button>
              <Button variant="ghost" onClick={() => setShowAskModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

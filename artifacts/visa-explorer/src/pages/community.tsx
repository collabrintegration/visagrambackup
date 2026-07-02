import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useGetCommunityFeed,
  getGetCommunityFeedQueryKey,
  useListCountries,
  useCreateQuestion,
} from "@workspace/api-client-react";
import type { FeedItem, Country } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare, Star, Globe, Users, Loader2, MapPin, LogIn,
  TrendingUp, Search, X, ChevronDown, Filter, PenLine, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdUnit from "@/components/ad-unit";
import CountryCombobox from "@/components/country-combobox";

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

function FeedCard({ item }: { item: FeedItem }) {
  const isReview = item.type === "review";
  const href = isReview
    ? `/country/${item.countryCode}`
    : `/questions/${item.id}`;

  return (
    <Link href={href}>
      <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
              {(item.user?.firstName || "A")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm truncate block">
                {item.user?.firstName || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(item.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
      </div>
    </Link>
  );
}

type FeedType = "all" | "question" | "review";

export default function Community() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
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
                <Button onClick={() => setShowAskModal(true)} className="shrink-0">
                  <PenLine className="w-4 h-4 mr-2" /> Ask a Question
                </Button>
              ) : (
                <Button onClick={login} variant="outline" className="shrink-0">
                  <LogIn className="w-4 h-4 mr-2" /> Sign in to contribute
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Search + Filters bar */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="container mx-auto px-4 py-3 max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions, reviews, countries…"
                className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Country dropdown */}
            <div className="relative">
              <button
                onClick={() => setCountryOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all whitespace-nowrap ${
                  countryFilter
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span className="max-w-[120px] truncate">
                  {selectedCountryLabel ?? "All Countries"}
                </span>
                {countryFilter ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCountryFilter(""); setCountryOpen(false); }}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                )}
              </button>

              {countryOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="max-h-64 overflow-y-auto py-1">
                    <button
                      onClick={() => { setCountryFilter(""); setCountryOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 ${!countryFilter ? "text-primary font-medium" : "text-foreground"}`}
                    >
                      All Countries
                    </button>
                    {countries.map(([code, label]) => (
                      <button
                        key={code}
                        onClick={() => { setCountryFilter(code); setCountryOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 ${countryFilter === code ? "text-primary font-medium bg-primary/5" : "text-foreground"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Type filter pills */}
          <div className="flex gap-2 mt-3">
            {([
              { id: "all" as FeedType, label: "All" },
              { id: "question" as FeedType, label: "Questions only", icon: MessageSquare },
              { id: "review" as FeedType, label: "Reviews only", icon: Star },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTypeFilter(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  typeFilter === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {label}
              </button>
            ))}

            {/* Active filters count + clear */}
            {(activeFiltersCount > 0 || search) && (
              <button
                onClick={() => { setTypeFilter("all"); setCountryFilter(""); setSearch(""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/40 transition-all ml-auto"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="container mx-auto px-4 py-8 max-w-3xl" onClick={() => setCountryOpen(false)}>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            {feed.length === 0 ? (
              <>
                <TrendingUp className="w-12 h-12 mx-auto text-muted mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share a review or ask a question about a country.
                </p>
                {!isAuthenticated && (
                  <Button onClick={login}>
                    <LogIn className="w-4 h-4 mr-2" /> Sign in to get started
                  </Button>
                )}
              </>
            ) : (
              <>
                <Filter className="w-12 h-12 mx-auto text-muted mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button variant="outline" onClick={() => { setSearch(""); setTypeFilter("all"); setCountryFilter(""); }}>
                  <X className="w-4 h-4 mr-2" /> Clear filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            {(search || typeFilter !== "all" || countryFilter) && (
              <p className="text-sm text-muted-foreground mb-4">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                {countryFilter && selectedCountryLabel ? ` in ${selectedCountryLabel}` : ""}
                {search ? ` for "${search}"` : ""}
              </p>
            )}
            <div className="space-y-4">
              {filtered.map((item, idx) => (
                <div key={`${item.type}-${item.id}`}>
                  <FeedCard item={item} />
                  {(idx + 1) % 6 === 0 && idx < filtered.length - 1 && (
                    <div className="py-2">
                      <AdUnit slot="3456789012" format="fluid" className="pt-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>

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

import { useState } from "react";
import { Link } from "wouter";
import {
  useGetTravelMap,
  useUpsertTravelEntry,
  useDeleteTravelEntry,
  useGetMyActivity,
  useUpdateMyProfile,
  getGetTravelMapQueryKey,
  getGetMyActivityQueryKey,
  getGetCurrentAuthUserQueryKey,
} from "@workspace/api-client-react";
import type { ActivityQuestion } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  Map, CheckCircle2, Heart, LogIn, Loader2, Trash2, Globe,
  User, MessageSquare, BookOpen, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountryCombobox from "@/components/country-combobox";

const STATUS_CONFIG = {
  visited: {
    label: "Visited",
    icon: CheckCircle2,
    pill: "bg-emerald-500/10 text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  want_to_visit: {
    label: "Want to Visit",
    icon: Heart,
    pill: "bg-primary/10 text-primary",
    ring: "ring-primary/30",
  },
} as const;

type TravelStatus = keyof typeof STATUS_CONFIG;
type ProfileTab = "travel" | "activity";
type ActivitySubTab = "asked" | "answered";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function QuestionCard({ q }: { q: ActivityQuestion }) {
  return (
    <Link href={`/country/${q.countryCode}`}>
      <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {q.countryFlag && <span>{q.countryFlag}</span>}
            <span>{q.countryName ?? q.countryCode}</span>
            <span>·</span>
            <span>{timeAgo(q.createdAt)}</span>
          </div>
          {q.resolved && (
            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-none shrink-0">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
            </Badge>
          )}
        </div>
        <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {q.title}
        </p>
        {q.myAnswer && (
          <div className="border-l-2 border-primary/40 pl-3 mt-2">
            <p className="text-xs text-muted-foreground line-clamp-2">{q.myAnswer}</p>
          </div>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {q.answersCount} {q.answersCount === 1 ? "answer" : "answers"}
          </span>
          {q.passportCode && <span>· 🛂 {q.passportCode}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("travel");
  const [travelFilter, setTravelFilter] = useState<TravelStatus>("visited");
  const [activitySub, setActivitySub] = useState<ActivitySubTab>("asked");
  const [editingCountry, setEditingCountry] = useState(false);
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading: mapLoading } = useGetTravelMap({
    query: { queryKey: getGetTravelMapQueryKey(), enabled: isAuthenticated },
  });

  const { data: activity, isLoading: activityLoading } = useGetMyActivity({
    query: { queryKey: getGetMyActivityQueryKey(), enabled: isAuthenticated && activeTab === "activity" },
  });

  const { mutate: deleteEntry, isPending: isDeleting } = useDeleteTravelEntry({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: getGetTravelMapQueryKey() }),
    },
  });

  const { mutate: updateProfile, isPending: isSavingCountry } = useUpdateMyProfile({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetCurrentAuthUserQueryKey() });
        setEditingCountry(false);
      },
    },
  });

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Profile</h2>
          <p className="text-muted-foreground max-w-sm">
            Sign in to set up your profile, track travels, and see your Q&A activity.
          </p>
        </div>
        <Button onClick={login} size="lg">
          <LogIn className="w-4 h-4 mr-2" /> Sign in to continue
        </Button>
      </div>
    );
  }

  const visited = entries.filter((e) => e.status === "visited");
  const wantToVisit = entries.filter((e) => e.status === "want_to_visit");
  const activeEntries = travelFilter === "visited" ? visited : wantToVisit;
  const cfg = STATUS_CONFIG[travelFilter];
  const totalActivity = (activity?.questionsAsked?.length ?? 0) + (activity?.questionsAnswered?.length ?? 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Profile header */}
      <div className="border-b border-border/60 bg-card/30">
        <div className="container mx-auto px-4 py-10 md:py-12">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName ?? "Profile"}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">
                {user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : "Traveler"}
              </h1>
              {user?.email && (
                <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>
              )}

              {/* Home country */}
              <div className="mt-3">
                {editingCountry ? (
                  <div className="flex items-center gap-2 max-w-xs">
                    <CountryCombobox
                      value={(user as { homeCountry?: string | null })?.homeCountry ?? null}
                      onChange={(code) => updateProfile({ data: { homeCountry: code } })}
                      placeholder="Select your passport country"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCountry(false)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      Cancel
                    </Button>
                    {isSavingCountry && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingCountry(true)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Globe className="w-4 h-4" />
                    {(user as { homeCountry?: string | null })?.homeCountry
                      ? <span>Passport: <span className="text-foreground font-medium">{(user as { homeCountry?: string | null }).homeCountry}</span></span>
                      : <span className="group-hover:text-primary">+ Set your passport country</span>
                    }
                    <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-8">
            <div className="text-left">
              <div className="text-3xl font-bold text-primary">{visited.length}</div>
              <div className="text-sm font-medium flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Visited
              </div>
            </div>
            <div className="w-px bg-border" />
            <div className="text-left">
              <div className="text-3xl font-bold">{wantToVisit.length}</div>
              <div className="text-sm font-medium flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                <Heart className="w-4 h-4 text-primary" /> Want to Visit
              </div>
            </div>
            <div className="w-px bg-border" />
            <div className="text-left">
              <div className="text-3xl font-bold">{totalActivity}</div>
              <div className="text-sm font-medium flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                <MessageSquare className="w-4 h-4" /> Q&A Posts
              </div>
            </div>
          </div>

          {/* Main tabs */}
          <div className="flex gap-1 mt-8 border-b border-border -mb-px">
            {[
              { id: "travel" as const, label: "Travel Map", icon: Map },
              { id: "activity" as const, label: "My Q&A", icon: BookOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* ── Travel Map Tab ──────────────────────────────────────────── */}
        {activeTab === "travel" && (
          <>
            {/* Sub-filter */}
            <div className="flex gap-2 mb-6">
              {(["visited", "want_to_visit"] as TravelStatus[]).map((s) => {
                const c = STATUS_CONFIG[s];
                const count = s === "visited" ? visited.length : wantToVisit.length;
                return (
                  <button
                    key={s}
                    onClick={() => setTravelFilter(s)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      travelFilter === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <c.icon className="w-3.5 h-3.5" />
                    {c.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${travelFilter === s ? "bg-white/20" : "bg-muted"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {(authLoading || mapLoading) ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : activeEntries.length === 0 ? (
              <div className="text-center py-20">
                <cfg.icon className="w-12 h-12 mx-auto text-muted mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {travelFilter === "visited" ? "No visited countries yet" : "No countries saved yet"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {travelFilter === "visited"
                    ? "Go to any country page and mark it as visited."
                    : "Save countries you'd like to explore someday."}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/explore"><Globe className="w-4 h-4 mr-2" /> Browse Countries</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeEntries.map((entry) => (
                  <div
                    key={entry.countryCode}
                    className={`bg-card border border-border rounded-2xl p-4 ring-1 ${cfg.ring} hover:border-primary/30 transition-all group relative`}
                  >
                    <Link href={`/country/${entry.countryCode}`}>
                      <div className="cursor-pointer">
                        <div className="text-5xl mb-3">{entry.countryFlag ?? "🌍"}</div>
                        <div className="font-semibold group-hover:text-primary transition-colors truncate">
                          {entry.countryName ?? entry.countryCode}
                        </div>
                        <Badge variant="secondary" className={`mt-2 text-xs border-none ${cfg.pill}`}>
                          <cfg.icon className="w-3 h-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </div>
                    </Link>
                    <button
                      onClick={() => deleteEntry({ code: entry.countryCode })}
                      disabled={isDeleting}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Q&A Tab ─────────────────────────────────────────────── */}
        {activeTab === "activity" && (
          <>
            <div className="flex gap-2 mb-6">
              {([
                { id: "asked" as const, label: "Questions I Asked", count: activity?.questionsAsked?.length ?? 0 },
                { id: "answered" as const, label: "Questions I Answered", count: activity?.questionsAnswered?.length ?? 0 },
              ]).map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setActivitySub(id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activitySub === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activitySub === id ? "bg-white/20" : "bg-muted"}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {activityLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (() => {
              const items = activitySub === "asked"
                ? (activity?.questionsAsked ?? [])
                : (activity?.questionsAnswered ?? []);
              if (items.length === 0) {
                return (
                  <div className="text-center py-20">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {activitySub === "asked" ? "No questions asked yet" : "No questions answered yet"}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      {activitySub === "asked"
                        ? "Visit a country page to ask a question about visas, safety, or travel tips."
                        : "Help other travelers by answering their questions on country pages."}
                    </p>
                    <Button variant="outline" asChild>
                      <Link href="/explore"><Globe className="w-4 h-4 mr-2" /> Browse Countries</Link>
                    </Button>
                  </div>
                );
              }
              return (
                <div className="space-y-3 max-w-2xl">
                  {items.map((q) => <QuestionCard key={q.id} q={q} />)}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

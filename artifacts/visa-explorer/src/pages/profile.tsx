import { useState } from "react";
import { Link } from "wouter";
import {
  useGetTravelMap,
  useUpsertTravelEntry,
  useDeleteTravelEntry,
  useGetMyActivity,
  useUpdateMyProfile,
  useGetMyCases,
  useCreateSupportCase,
  useCreateQuestion,
  useGetFollowedQuestions,
  getGetTravelMapQueryKey,
  getGetMyActivityQueryKey,
  getGetCurrentAuthUserQueryKey,
  getGetMyCasesQueryKey,
  getGetFollowedQuestionsQueryKey,
} from "@workspace/api-client-react";
import type { ActivityQuestion } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  Map, CheckCircle2, Heart, LogIn, Loader2, Trash2, Globe,
  User, MessageSquare, BookOpen, ChevronDown, ShieldAlert,
  PlusCircle, X, Clock, RefreshCw, XCircle, Bell, PenLine, Save,
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
type ProfileTab = "travel" | "activity" | "cases";
type ActivitySubTab = "asked" | "answered" | "following";

const CASE_STATUS: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  open:        { label: "Open",        cls: "bg-blue-500/10 text-blue-400",       icon: ShieldAlert },
  in_progress: { label: "In Progress", cls: "bg-amber-500/10 text-amber-400",    icon: RefreshCw },
  resolved:    { label: "Resolved",    cls: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  closed:      { label: "Closed",      cls: "bg-zinc-500/10 text-zinc-400",       icon: XCircle },
};

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
    <Link href={`/questions/${q.id}`}>
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

function FollowedQuestionCard({ q }: { q: { id: number; title: string; countryCode: string | null; countryName?: string | null; countryFlag?: string | null; answersCount: number; resolved: boolean; createdAt: string; passportCode?: string | null; followersCount: number } }) {
  return (
    <Link href={`/questions/${q.id}`}>
      <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {q.countryFlag && <span>{q.countryFlag}</span>}
            <span>{q.countryName ?? q.countryCode}</span>
            <span>·</span>
            <span>{timeAgo(q.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            {q.resolved && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-none shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
              </Badge>
            )}
          </div>
        </div>
        <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {q.title}
        </p>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {q.answersCount} {q.answersCount === 1 ? "answer" : "answers"}
          </span>
          <span className="flex items-center gap-1">
            <Bell className="w-3 h-3" /> {q.followersCount} following
          </span>
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
  const [localHomeCountry, setLocalHomeCountry] = useState<string | null>(null);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [askCountry, setAskCountry] = useState<string | null>(null);
  const [askTitle, setAskTitle] = useState("");
  const [askBody, setAskBody] = useState("");
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading: mapLoading } = useGetTravelMap({
    query: { queryKey: getGetTravelMapQueryKey(), enabled: isAuthenticated },
  });

  const { data: activity, isLoading: activityLoading } = useGetMyActivity({
    query: { queryKey: getGetMyActivityQueryKey(), enabled: isAuthenticated && activeTab === "activity" },
  });

  const { data: followedQuestions = [], isLoading: followedLoading } = useGetFollowedQuestions({
    query: { queryKey: getGetFollowedQuestionsQueryKey(), enabled: isAuthenticated && activeTab === "activity" && activitySub === "following" },
  });

  const { data: cases = [], isLoading: casesLoading } = useGetMyCases({
    query: { queryKey: getGetMyCasesQueryKey(), enabled: isAuthenticated && activeTab === "cases" },
  });

  const [showNewCase, setShowNewCase] = useState(false);
  const [caseSubject, setCaseSubject] = useState("");
  const [caseBody, setCaseBody] = useState("");

  const { mutate: createCase, isPending: creatingCase } = useCreateSupportCase({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetMyCasesQueryKey() });
        setShowNewCase(false);
        setCaseSubject("");
        setCaseBody("");
      },
    },
  });

  const { mutate: deleteEntry, isPending: isDeleting } = useDeleteTravelEntry({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: getGetTravelMapQueryKey() }),
    },
  });

  const { mutate: updateProfile, isPending: isSavingCountry } = useUpdateMyProfile({
    mutation: {
      onSuccess: (data) => {
        void queryClient.invalidateQueries({ queryKey: getGetCurrentAuthUserQueryKey() });
        const updated = data as { homeCountry?: string | null };
        setLocalHomeCountry(updated.homeCountry ?? null);
        setEditingCountry(false);
        setSavingError(null);
      },
      onError: () => {
        setSavingError("Failed to save. Please try again.");
      },
    },
  });

  const { mutate: createQuestion, isPending: isCreatingQuestion } = useCreateQuestion({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetMyActivityQueryKey() });
        setShowAskModal(false);
        setAskCountry(null);
        setAskTitle("");
        setAskBody("");
        setActiveTab("activity");
        setActivitySub("asked");
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
  const displayHomeCountry = localHomeCountry !== null
    ? localHomeCountry
    : (user as { homeCountry?: string | null })?.homeCountry ?? null;

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
                  <div className="flex flex-col gap-2 max-w-xs">
                    <div className="flex items-center gap-2">
                      <CountryCombobox
                        value={displayHomeCountry}
                        onChange={(code) => {
                          setSavingError(null);
                          updateProfile({ data: { homeCountry: code } });
                        }}
                        placeholder="Select your passport country"
                      />
                      {isSavingCountry && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
                      {!isSavingCountry && (
                        <button
                          onClick={() => { setEditingCountry(false); setSavingError(null); }}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {savingError && <p className="text-xs text-rose-400">{savingError}</p>}
                    <p className="text-xs text-muted-foreground">Select from the dropdown — saves automatically.</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingCountry(true)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Globe className="w-4 h-4" />
                    {displayHomeCountry
                      ? <span>Passport: <span className="text-foreground font-medium">{displayHomeCountry}</span></span>
                      : <span className="group-hover:text-primary">+ Set your passport country</span>
                    }
                    <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
            </div>

            {/* Ask a Question CTA */}
            <div className="shrink-0">
              <Button size="sm" onClick={() => setShowAskModal(true)}>
                <PenLine className="w-4 h-4 mr-1.5" /> Ask a Question
              </Button>
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
              { id: "cases" as const, label: "Support Cases", icon: ShieldAlert },
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
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex gap-2 flex-wrap">
                {([
                  { id: "asked" as const, label: "Questions I Asked", count: activity?.questionsAsked?.length ?? 0 },
                  { id: "answered" as const, label: "Questions I Answered", count: activity?.questionsAnswered?.length ?? 0 },
                  { id: "following" as const, label: "Following", count: followedQuestions.length, icon: Bell },
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
              <Button size="sm" variant="outline" onClick={() => setShowAskModal(true)}>
                <PenLine className="w-3.5 h-3.5 mr-1.5" /> Ask a Question
              </Button>
            </div>

            {/* Asked / Answered tabs */}
            {(activitySub === "asked" || activitySub === "answered") && (
              activityLoading ? (
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
                          ? "Ask a question about visas, safety, or travel tips for any country."
                          : "Help other travelers by answering their questions on country pages."}
                      </p>
                      <div className="flex gap-3 justify-center flex-wrap">
                        <Button onClick={() => setShowAskModal(true)}>
                          <PenLine className="w-4 h-4 mr-2" /> Ask a Question
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/explore"><Globe className="w-4 h-4 mr-2" /> Browse Countries</Link>
                        </Button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3 max-w-2xl">
                    {items.map((q) => <QuestionCard key={q.id} q={q} />)}
                  </div>
                );
              })()
            )}

            {/* Following tab */}
            {activitySub === "following" && (
              followedLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : followedQuestions.length === 0 ? (
                <div className="text-center py-20">
                  <Bell className="w-12 h-12 mx-auto text-muted mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Not following any questions yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Open a question and click "Follow" to get notified of new answers.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/community"><Globe className="w-4 h-4 mr-2" /> Browse Community</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl">
                  {followedQuestions.map((q) => (
                    <FollowedQuestionCard key={q.id} q={q as { id: number; title: string; countryCode: string | null; countryName?: string | null; countryFlag?: string | null; answersCount: number; resolved: boolean; createdAt: string; passportCode?: string | null; followersCount: number }} />
                  ))}
                </div>
              )
            )}
          </>
        )}

        {/* ── Support Cases Tab ────────────────────────────────────────── */}
        {activeTab === "cases" && (
          <div className="max-w-2xl">
            {showNewCase ? (
              <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Raise a Support Case</h3>
                  <button onClick={() => setShowNewCase(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                  <input
                    value={caseSubject}
                    onChange={(e) => setCaseSubject(e.target.value)}
                    placeholder="Brief summary of your issue"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Details</label>
                  <textarea
                    value={caseBody}
                    onChange={(e) => setCaseBody(e.target.value)}
                    placeholder="Describe your issue in detail — what happened, what you expected, your passport/destination if relevant..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-32 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={creatingCase || !caseSubject.trim() || !caseBody.trim()}
                    onClick={() => createCase({ data: { subject: caseSubject.trim(), body: caseBody.trim() } })}
                  >
                    {creatingCase ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ShieldAlert className="w-4 h-4 mr-1.5" />}
                    Submit Case
                  </Button>
                  <Button variant="ghost" onClick={() => setShowNewCase(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold">Your Support Cases</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Track your queries with the Visagram team</p>
                </div>
                <Button size="sm" onClick={() => setShowNewCase(true)}>
                  <PlusCircle className="w-4 h-4 mr-1.5" /> New Case
                </Button>
              </div>
            )}

            {casesLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : cases.length === 0 && !showNewCase ? (
              <div className="text-center py-20">
                <ShieldAlert className="w-12 h-12 mx-auto text-muted mb-4" />
                <h3 className="text-lg font-semibold mb-2">No support cases yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Have a visa question, report a data issue, or need help? Raise a case and we'll get back to you.
                </p>
                <Button onClick={() => setShowNewCase(true)}>
                  <PlusCircle className="w-4 h-4 mr-1.5" /> Raise a Case
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cases.map((c) => {
                  const sm = CASE_STATUS[c.status] ?? CASE_STATUS.open;
                  const StatusIcon = sm.icon;
                  return (
                    <Link key={c.id} href={`/support/cases/${c.id}`}>
                      <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{c.subject}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.body}</p>
                          </div>
                          <Badge variant="secondary" className={`flex items-center gap-1 border-none text-xs shrink-0 ${sm.cls}`}>
                            <StatusIcon className="w-3 h-3" />
                            {sm.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          Case #{c.id} · {timeAgo(c.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Ask a Question Modal ────────────────────────────────────── */}
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
    </div>
  );
}

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
  useListGroups,
  useListGroupJoinRequests,
  useApproveGroupJoinRequest,
  useRejectGroupJoinRequest,
  useGetAdminSiteStats,
  useAdminSearchUsers,
  useGetDmUnreadCount,
  getGetTravelMapQueryKey,
  getGetMyActivityQueryKey,
  getGetCurrentAuthUserQueryKey,
  getGetMyCasesQueryKey,
  getGetFollowedQuestionsQueryKey,
  getListGroupsQueryKey,
  getListGroupJoinRequestsQueryKey,
  getGetAdminSiteStatsQueryKey,
  getAdminSearchUsersQueryKey,
  getGetDmUnreadCountQueryKey,
} from "@workspace/api-client-react";
import DmProfileTab from "@/components/dm-profile-tab";
import type { ActivityQuestion, Group, GroupJoinRequest, AdminUserResult } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  Map, CheckCircle2, Heart, LogIn, Loader2, Trash2, Globe,
  User, MessageSquare, BookOpen, ChevronDown, ShieldAlert,
  PlusCircle, X, Clock, RefreshCw, XCircle, Bell, PenLine, Save,
  Users, Crown, Lock, UserCheck, UserX, ChevronRight, BarChart2, Inbox,
  TrendingUp, Activity, Search, Shield, Mail, Calendar,
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
type ProfileTab = "travel" | "activity" | "cases" | "groups" | "messages" | "admin";
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

function AdminGroupPanel({ group }: { group: Group }) {
  const qc = useQueryClient();
  const { data: requests = [], isLoading } = useListGroupJoinRequests(group.id, {
    query: { queryKey: getListGroupJoinRequestsQueryKey(group.id) },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: getListGroupJoinRequestsQueryKey(group.id) });
    void qc.invalidateQueries({ queryKey: getListGroupsQueryKey() });
  };

  const { mutate: approve, isPending: approving } = useApproveGroupJoinRequest({ mutation: { onSuccess: invalidate } });
  const { mutate: reject, isPending: rejecting } = useRejectGroupJoinRequest({ mutation: { onSuccess: invalidate } });

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{group.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">{group.name}</h4>
            <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-400 border-amber-500/20">
              <Crown className="w-2.5 h-2.5 mr-1" />Admin
            </Badge>
            {group.isPrivate && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Lock className="w-2.5 h-2.5 mr-1" />Private
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {group.isPrivate && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Join Requests
              {!isLoading && requests.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                  {requests.length}
                </span>
              )}
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
          )}
          <Link href={`/groups/${group.id}`}>
            <Button size="sm" className="h-7 text-xs">
              <MessageSquare className="w-3 h-3 mr-1" /> Open Chat
            </Button>
          </Link>
        </div>
      </div>

      {expanded && group.isPrivate && (
        <div className="mt-4 border-t border-border pt-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No pending join requests</p>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                  {r.firstName?.[0]?.toUpperCase() ?? "T"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {[r.firstName, r.lastName].filter(Boolean).join(" ") || "Traveler"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(r.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    className="h-6 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700"
                    disabled={approving || rejecting}
                    onClick={() => approve({ id: group.id, userId: r.userId })}
                  >
                    <UserCheck className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px] px-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                    disabled={approving || rejecting}
                    onClick={() => reject({ id: group.id, userId: r.userId })}
                  >
                    <UserX className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ProfileGroupsTab({ userId }: { userId: string }) {
  const { data: groups = [], isLoading } = useListGroups({
    query: { queryKey: getListGroupsQueryKey(), enabled: !!userId },
  });

  const myGroups = groups.filter((g) => g.isMember && !g.isAdmin);
  const adminGroups = groups.filter((g) => g.isAdmin);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (myGroups.length === 0 && adminGroups.length === 0) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <Users className="w-12 h-12 mx-auto text-muted mb-4" />
        <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
        <p className="text-muted-foreground mb-6">
          Join or create travel groups to connect with fellow travelers.
        </p>
        <Link href="/groups">
          <Button><Users className="w-4 h-4 mr-2" /> Browse Groups</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {adminGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold">Groups I Admin</h3>
            <span className="text-xs text-muted-foreground">({adminGroups.length})</span>
          </div>
          <div className="space-y-3">
            {adminGroups.map((g) => <AdminGroupPanel key={g.id} group={g} />)}
          </div>
        </div>
      )}

      {myGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Groups I'm In</h3>
            <span className="text-xs text-muted-foreground">({myGroups.length})</span>
          </div>
          <div className="space-y-3">
            {myGroups.map((g) => (
              <div key={g.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{g.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">{g.name}</h4>
                    {g.isPrivate && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Lock className="w-2.5 h-2.5 mr-1" />Private
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {g.memberCount} member{g.memberCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link href={`/groups/${g.id}`}>
                  <Button size="sm" className="h-7 text-xs shrink-0">
                    <MessageSquare className="w-3 h-3 mr-1" /> Open Chat
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2">
        <Link href="/groups">
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" /> Browse All Groups
          </Button>
        </Link>
      </div>
    </div>
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
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [addCountryCode, setAddCountryCode] = useState<string | null>(null);
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

  const isSuperAdmin = (user as { isSuperAdmin?: boolean })?.isSuperAdmin === true;
  const { data: siteStats, isLoading: statsLoading } = useGetAdminSiteStats({
    query: { queryKey: getGetAdminSiteStatsQueryKey(), enabled: isAuthenticated && isSuperAdmin && activeTab === "admin" },
  });

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const userSearchParams = { q: userSearchQuery, limit: 30 };
  const { data: userSearchResults, isLoading: userSearchLoading } = useAdminSearchUsers(
    userSearchParams,
    { query: { queryKey: getAdminSearchUsersQueryKey(userSearchParams), enabled: isAuthenticated && isSuperAdmin && activeTab === "admin" } },
  );

  const { data: dmUnread } = useGetDmUnreadCount({
    query: { queryKey: getGetDmUnreadCountQueryKey(), enabled: isAuthenticated, refetchInterval: 15000 },
  });
  const dmBadge = (dmUnread?.unreadMessages ?? 0) + (dmUnread?.pendingRequests ?? 0);

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

  const { mutate: upsertEntry, isPending: isUpserting } = useUpsertTravelEntry({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetTravelMapQueryKey() });
        setShowAddCountry(false);
        setAddCountryCode(null);
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
          <div className="flex gap-1 mt-8 border-b border-border -mb-px flex-wrap">
            {[
              { id: "messages" as const, label: "Messages", icon: MessageSquare, badge: dmBadge },
              { id: "groups" as const, label: "My Groups", icon: Users },
              { id: "activity" as const, label: "My Q&A", icon: BookOpen },
              { id: "travel" as const, label: "Travel Map", icon: Map },
              { id: "cases" as const, label: "Support Cases", icon: ShieldAlert },
              ...(isSuperAdmin ? [{ id: "admin" as const, label: "Site Stats", icon: BarChart2 }] : []),
            ].map(({ id, label, icon: Icon, ...rest }) => {
              const badge = (rest as { badge?: number }).badge;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {!!badge && badge > 0 && (
                    <span className="min-w-[17px] h-[17px] bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                  {id === "admin" && (
                    <span className="ml-1 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-amber-500/30 via-primary/30 to-violet-500/30 border border-amber-400/30 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.25)]">
                      <Crown className="w-2.5 h-2.5 shrink-0" />
                      Super
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* ── Travel Map Tab ──────────────────────────────────────────── */}
        {activeTab === "travel" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-2">
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setShowAddCountry((v) => !v); setAddCountryCode(null); }}
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Add Country
              </Button>
            </div>

            {showAddCountry && (
              <div className="mb-6 bg-card border border-border rounded-2xl p-4">
                <p className="text-sm font-medium mb-3">Which country do you want to add?</p>
                <CountryCombobox
                  value={addCountryCode}
                  onChange={setAddCountryCode}
                  placeholder="Search a country…"
                />
                {addCountryCode && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-none"
                      disabled={isUpserting}
                      onClick={() => upsertEntry({ code: addCountryCode, data: { status: "visited" } })}
                    >
                      {isUpserting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                      Mark as Visited
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={isUpserting}
                      onClick={() => upsertEntry({ code: addCountryCode, data: { status: "want_to_visit" } })}
                    >
                      {isUpserting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Heart className="w-3.5 h-3.5 mr-1.5 text-primary" />}
                      Want to Visit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowAddCountry(false); setAddCountryCode(null); }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

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
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  {travelFilter === "visited"
                    ? "Mark countries you've already been to."
                    : "Save countries you'd like to explore someday."}
                </p>
                <Button
                  size="sm"
                  onClick={() => { setShowAddCountry(true); setAddCountryCode(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Add a Country
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

        {/* ── Groups Tab ──────────────────────────────────────────────── */}
        {activeTab === "groups" && (
          <ProfileGroupsTab userId={user?.id ?? ""} />
        )}

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

        {/* ── Messages Tab ────────────────────────────────────────────── */}
        {activeTab === "messages" && (
          <DmProfileTab myId={(user as { id?: string })?.id ?? ""} />
        )}

        {/* ── Admin / Site Stats Tab ──────────────────────────────────── */}
        {activeTab === "admin" && isSuperAdmin && (
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Site Statistics</h2>
                <p className="text-xs text-muted-foreground">Live counts across the entire platform — visible only to super admins.</p>
              </div>
            </div>

            {statsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !siteStats ? (
              <div className="text-center py-20 text-muted-foreground">
                <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Could not load stats.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Traffic */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Traffic</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Total Page Views (all time)", value: siteStats.totalPageViews, icon: TrendingUp, color: "text-pink-400", bg: "bg-pink-500/10" },
                      { label: "Page Views Today", value: siteStats.todayPageViews, icon: Activity, color: "text-green-400", bg: "bg-green-500/10" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <div key={label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Users</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Total Registered Users", value: siteStats.totalUsers, icon: User, color: "text-blue-400", bg: "bg-blue-500/10" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <div key={label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Groups */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Groups</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Total Groups", value: siteStats.totalGroups, icon: Users, color: "text-violet-400", bg: "bg-violet-500/10" },
                      { label: "Public Groups", value: siteStats.publicGroups, icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                      { label: "Private Groups", value: siteStats.privateGroups, icon: Lock, color: "text-amber-400", bg: "bg-amber-500/10" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <div key={label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Content</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Visa Applications Tracked", value: siteStats.totalVisaEntries, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
                      { label: "Travel Map Entries", value: siteStats.totalTravelEntries, icon: Map, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                      { label: "Community Reviews", value: siteStats.totalReviews, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                      { label: "Community Questions", value: siteStats.totalQuestions, icon: MessageSquare, color: "text-orange-400", bg: "bg-orange-500/10" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <div key={label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── User Search ────────────────────────────────────── */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">User Search</h2>
                  <p className="text-xs text-muted-foreground">Find any user by name or email address.</p>
                </div>
              </div>

              <form
                className="flex gap-2 mb-4"
                onSubmit={(e) => { e.preventDefault(); setUserSearchQuery(userSearchInput.trim()); }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={userSearchInput}
                    onChange={(e) => setUserSearchInput(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" className="px-5">Search</Button>
                {userSearchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setUserSearchQuery(""); setUserSearchInput(""); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </form>

              {userSearchLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : userSearchResults && userSearchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    {userSearchResults.length} result{userSearchResults.length !== 1 ? "s" : ""}
                    {userSearchQuery ? ` for "${userSearchQuery}"` : " (showing all recent)"}
                  </p>
                  {userSearchResults.map((u: AdminUserResult) => {
                    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
                    const initials = ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() || "?";
                    return (
                      <div key={u.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                        {u.profileImageUrl ? (
                          <img src={u.profileImageUrl} alt={fullName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{fullName}</span>
                            {u.isSuperAdmin && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Shield className="w-3 h-3" />Super Admin
                              </span>
                            )}
                            {u.homeCountry && (
                              <span className="text-xs text-muted-foreground">{u.homeCountry}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {u.email && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" />{u.email}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />Joined {new Date(u.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg font-mono shrink-0 hidden sm:block">
                          {u.id.slice(0, 8)}…
                        </code>
                      </div>
                    );
                  })}
                </div>
              ) : userSearchQuery ? (
                <div className="text-center py-10 text-muted-foreground">
                  <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No users found for "{userSearchQuery}"</p>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Type a name or email and hit Search</p>
                </div>
              )}
            </div>
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

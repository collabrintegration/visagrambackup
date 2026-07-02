import { useState, useRef, useCallback } from "react";
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
  useGetAdminSiteStats,
  useAdminSearchUsers,
  useGetAdminUserDetail,
  useListPhotos,
  useCreatePhoto,
  useDeletePhoto,
  getGetTravelMapQueryKey,
  getGetMyActivityQueryKey,
  getGetCurrentAuthUserQueryKey,
  getGetMyCasesQueryKey,
  getGetFollowedQuestionsQueryKey,
  getGetAdminSiteStatsQueryKey,
  getAdminSearchUsersQueryKey,
  getGetAdminUserDetailQueryKey,
  getListPhotosQueryKey,
} from "@workspace/api-client-react";
import type { ActivityQuestion, AdminUserResult, AdminUserDetail, TravelPhoto } from "@workspace/api-client-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  Map, CheckCircle2, Heart, LogIn, Loader2, Trash2, Globe,
  User, MessageSquare, BookOpen, ChevronDown, ShieldAlert,
  PlusCircle, X, Clock, RefreshCw, XCircle, Bell, PenLine, Save,
  Users, Crown, Lock, UserCheck, UserX, ChevronLeft, ChevronRight, BarChart2, Inbox,
  TrendingUp, Activity, Search, Shield, Mail, Calendar,
  Camera, Eye, EyeOff, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountryCombobox from "@/components/country-combobox";
import LocationAutocomplete from "@/components/location-autocomplete";

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
type ProfileTab = "travel" | "activity" | "cases" | "admin";
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
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState<string>("");
  const [isPrivateLocal, setIsPrivateLocal] = useState<boolean | null>(null);
  const [editingDob, setEditingDob] = useState(false);
  const [dobText, setDobText] = useState("");
  const [editingSex, setEditingSex] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationText, setLocationText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [addCountryCode, setAddCountryCode] = useState<string | null>(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [askCountry, setAskCountry] = useState<string | null>(null);
  const [askTitle, setAskTitle] = useState("");
  const [askBody, setAskBody] = useState("");
  const queryClient = useQueryClient();

  // Photos tab state
  const [photoLightbox, setPhotoLightbox] = useState<TravelPhoto | null>(null);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [photoUploadCountry, setPhotoUploadCountry] = useState<string | null>(null);
  const [pendingPhotoPath, setPendingPhotoPath] = useState<string | null>(null);
  const [pendingPhotoCaption, setPendingPhotoCaption] = useState("");
  const [showPhotoCaptionStep, setShowPhotoCaptionStep] = useState(false);

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

  const myUserId = (user as { id?: string })?.id ?? "";
  const photoQueryParams = { userId: myUserId, limit: 50 };
  const { data: myPhotosData, isLoading: photosLoading } = useListPhotos(photoQueryParams, {
    query: { queryKey: getListPhotosQueryKey(photoQueryParams), enabled: !!myUserId },
  });
  const myPhotos = myPhotosData?.photos ?? [];

  const createPhoto = useCreatePhoto({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey(photoQueryParams) });
        setShowPhotoCaptionStep(false);
        setShowPhotoUploadModal(false);
        setPendingPhotoPath(null);
        setPendingPhotoCaption("");
        setPhotoUploadCountry(null);
      },
    },
  });

  const deletePhoto = useDeletePhoto({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey(photoQueryParams) });
        setPhotoLightbox(null);
      },
    },
  });

  const isSuperAdmin = (user as { isSuperAdmin?: boolean })?.isSuperAdmin === true;
  const { data: siteStats, isLoading: statsLoading } = useGetAdminSiteStats({
    query: { queryKey: getGetAdminSiteStatsQueryKey(), enabled: isAuthenticated && isSuperAdmin && activeTab === "admin" },
  });

  const ADMIN_PAGE_SIZE = 15;
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [adminPage, setAdminPage] = useState(0);
  const userSearchParams = { q: userSearchQuery, limit: ADMIN_PAGE_SIZE, offset: adminPage * ADMIN_PAGE_SIZE };
  const { data: adminUsersData, isLoading: userSearchLoading } = useAdminSearchUsers(
    userSearchParams,
    { query: { queryKey: getAdminSearchUsersQueryKey(userSearchParams), enabled: isAuthenticated && isSuperAdmin && activeTab === "admin" } },
  );
  const userSearchResults = adminUsersData?.users ?? [];
  const adminTotalUsers = adminUsersData?.total ?? 0;
  const adminTotalPages = Math.ceil(adminTotalUsers / ADMIN_PAGE_SIZE);

  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(null);
  const { data: adminUserDetail, isLoading: adminUserDetailLoading } = useGetAdminUserDetail(
    selectedAdminUserId ?? "",
    { query: { queryKey: getGetAdminUserDetailQueryKey(selectedAdminUserId ?? ""), enabled: !!selectedAdminUserId && isSuperAdmin } },
  );

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
        const updated = data as { homeCountry?: string | null; isPrivate?: boolean };
        setLocalHomeCountry(updated.homeCountry ?? null);
        if (updated.isPrivate !== undefined) setIsPrivateLocal(updated.isPrivate);
        setEditingCountry(false);
        setEditingBio(false);
        setIsUploadingPic(false);
        setSavingError(null);
      },
      onError: () => {
        setSavingError("Failed to save. Please try again.");
        setIsUploadingPic(false);
      },
    },
  });

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPic(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 400;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resized = canvas.toDataURL("image/jpeg", 0.85);
        updateProfile({ data: { profileImageUrl: resized } });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [updateProfile]);

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
            {/* Editable avatar */}
            <div className="relative group w-16 h-16 shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={user.firstName ?? "Profile"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              {!isUploadingPic && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  title="Change profile picture"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}
              {isUploadingPic && (
                <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
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

              {/* Bio */}
              <div className="mt-3">
                {editingBio ? (
                  <div className="flex flex-col gap-2 max-w-sm">
                    <textarea
                      value={bioText}
                      onChange={e => setBioText(e.target.value.slice(0, 300))}
                      rows={3}
                      maxLength={300}
                      placeholder="Tell fellow travelers about yourself…"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" disabled={isSavingCountry} onClick={() => updateProfile({ data: { bio: bioText || null } })}>
                        {isSavingCountry ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                        Save Bio
                      </Button>
                      <button onClick={() => setEditingBio(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                      <span className="ml-auto text-xs text-muted-foreground">{bioText.length}/300</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setBioText((user as { bio?: string | null })?.bio ?? ""); setEditingBio(true); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <PenLine className="w-4 h-4" />
                    {(user as { bio?: string | null })?.bio
                      ? <span className="truncate max-w-xs">{(user as { bio?: string | null }).bio}</span>
                      : <span className="group-hover:text-primary">+ Add a bio</span>
                    }
                  </button>
                )}
              </div>

              {/* Date of birth */}
              <div className="mt-3">
                {editingDob ? (
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="date"
                      value={dobText}
                      onChange={e => setDobText(e.target.value)}
                      max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 13); return d.toISOString().split("T")[0]; })()}
                      min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d.toISOString().split("T")[0]; })()}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 [color-scheme:dark]"
                      autoFocus
                    />
                    <Button size="sm" disabled={isSavingCountry} onClick={() => {
                      if (!dobText) return;
                      updateProfile({ data: { dateOfBirth: dobText } });
                      setEditingDob(false);
                    }}>
                      {isSavingCountry ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </Button>
                    <button onClick={() => setEditingDob(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setDobText((user as { dateOfBirth?: string | null })?.dateOfBirth ?? ""); setEditingDob(true); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                    <span className="text-base">🎂</span>
                    {(user as { age?: number | null; dateOfBirth?: string | null })?.age
                      ? <span>Age: <span className="text-foreground font-medium">{(user as { age?: number | null }).age}</span>{(user as { dateOfBirth?: string | null })?.dateOfBirth && <span className="text-muted-foreground text-xs ml-1">(born {new Date((user as { dateOfBirth: string }).dateOfBirth).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })})</span>}</span>
                      : <span className="group-hover:text-primary">+ Add date of birth</span>}
                    <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>

              {/* Sex / Gender */}
              <div className="mt-3">
                {editingSex ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {["Male", "Female", "Non-binary", "Prefer not to say"].map(opt => (
                      <button key={opt} type="button"
                        onClick={() => { updateProfile({ data: { sex: opt } }); setEditingSex(false); }}
                        className="px-3 py-1.5 rounded-full text-sm border border-border hover:border-primary hover:text-primary transition-colors"
                      >{opt}</button>
                    ))}
                    <button onClick={() => setEditingSex(false)} className="text-muted-foreground hover:text-foreground ml-1"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => setEditingSex(true)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                    <span className="text-base">⚧</span>
                    {(user as { sex?: string | null })?.sex
                      ? <span>Gender: <span className="text-foreground font-medium">{(user as { sex?: string | null }).sex}</span></span>
                      : <span className="group-hover:text-primary">+ Add your gender</span>}
                    <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>

              {/* Location */}
              <div className="mt-3">
                {editingLocation ? (
                  <div className="flex items-center gap-2 max-w-sm">
                    <div className="flex-1">
                      <LocationAutocomplete
                        value={locationText}
                        onChange={setLocationText}
                        placeholder="Type a city name…"
                      />
                    </div>
                    <Button size="sm" disabled={isSavingCountry} onClick={() => {
                      updateProfile({ data: { location: locationText.trim() || null } });
                      setEditingLocation(false);
                    }}>
                      {isSavingCountry ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </Button>
                    <button onClick={() => setEditingLocation(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => { setLocationText((user as { location?: string | null })?.location ?? ""); setEditingLocation(true); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                    <MapPin className="w-4 h-4" />
                    {(user as { location?: string | null })?.location
                      ? <span>Based in: <span className="text-foreground font-medium">{(user as { location?: string | null }).location}</span></span>
                      : <span className="group-hover:text-primary">+ Add your location</span>}
                    <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>

              {/* Privacy toggle */}
              <div className="mt-3">
                {(() => {
                  const currentPrivate = isPrivateLocal !== null ? isPrivateLocal : ((user as { isPrivate?: boolean })?.isPrivate ?? false);
                  return (
                    <button
                      onClick={() => updateProfile({ data: { isPrivate: !currentPrivate } })}
                      disabled={isSavingCountry}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                      title={currentPrivate ? "Your profile is private — friends & groups hidden from others" : "Your profile is public"}
                    >
                      {currentPrivate
                        ? <EyeOff className="w-4 h-4 text-amber-400" />
                        : <Eye className="w-4 h-4" />
                      }
                      <span>
                        Profile is{" "}
                        <span className={currentPrivate ? "text-amber-400 font-medium" : "text-foreground font-medium"}>
                          {currentPrivate ? "private" : "public"}
                        </span>
                        {currentPrivate && <span className="text-xs ml-1 text-muted-foreground">(friends & groups hidden)</span>}
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })()}
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

          {/* ── Photos section (always visible) ──────────────────── */}
          <div className="mt-8 pt-8 border-t border-border/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" /> Travel Photos
                {myPhotos.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">({myPhotos.length})</span>
                )}
              </h2>
              <Button size="sm" variant="outline" onClick={() => { setShowPhotoUploadModal(true); setShowPhotoCaptionStep(false); setPendingPhotoPath(null); setPendingPhotoCaption(""); }}>
                <Camera className="w-3.5 h-3.5 mr-1.5" /> Upload Photo
              </Button>
            </div>

            {photosLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : myPhotos.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setShowPhotoUploadModal(true)}
              >
                <Camera className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No photos yet — click to upload your first travel photo</p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2 space-y-2">
                {myPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group break-inside-avoid rounded-xl overflow-hidden cursor-pointer border border-border hover:border-primary/40 transition-all"
                    onClick={() => setPhotoLightbox(photo)}
                  >
                    <img
                      src={`/api/storage${photo.objectPath}`}
                      alt={photo.caption ?? "Travel photo"}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                      {photo.caption && <p className="text-xs text-white/90 line-clamp-1">{photo.caption}</p>}
                      <p className="text-[10px] text-white/60 mt-0.5">{photo.countryCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main tabs */}
          <div className="flex gap-1 mt-8 border-b border-border -mb-px flex-wrap">
            {[
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

        {/* ── Support Cases Tab ───────────────────────────────────────── */}
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
                onSubmit={(e) => { e.preventDefault(); setAdminPage(0); setUserSearchQuery(userSearchInput.trim()); }}
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
                    onClick={() => { setAdminPage(0); setUserSearchQuery(""); setUserSearchInput(""); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </form>

              {userSearchLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : userSearchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    {adminTotalUsers.toLocaleString()} user{adminTotalUsers !== 1 ? "s" : ""}
                    {userSearchQuery ? ` matching "${userSearchQuery}"` : " total (newest first)"}
                    {adminTotalPages > 1 && ` — page ${adminPage + 1} of ${adminTotalPages}`}
                  </p>
                  {userSearchResults.map((u: AdminUserResult) => {
                    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
                    const initials = ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() || "?";
                    return (
                      <div key={u.id} onClick={() => setSelectedAdminUserId(u.id)} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
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
                            {(u as { username?: string | null }).username && (
                              <span className="text-xs text-muted-foreground">@{(u as { username?: string | null }).username}</span>
                            )}
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
                  {adminTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 px-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdminPage(p => Math.max(0, p - 1))}
                        disabled={adminPage === 0}
                        className="h-8 px-3 text-xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 mr-1" />Prev
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {adminPage + 1} / {adminTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdminPage(p => Math.min(adminTotalPages - 1, p + 1))}
                        disabled={adminPage >= adminTotalPages - 1}
                        className="h-8 px-3 text-xs"
                      >
                        Next<ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
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

      {/* ── Admin User Detail Modal ─────────────────────────────────── */}
      {selectedAdminUserId && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAdminUserId(null); }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-semibold text-lg">User Details</h2>
              <button onClick={() => setSelectedAdminUserId(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminUserDetailLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            ) : adminUserDetail ? (() => {
              const d = adminUserDetail as AdminUserDetail;
              const fullName = [d.firstName, d.lastName].filter(Boolean).join(" ") || "—";
              const initials = ((d.firstName?.[0] ?? "") + (d.lastName?.[0] ?? "")).toUpperCase() || "?";
              const statItems = [
                { label: "Reviews", value: d.stats.reviews, icon: CheckCircle2, color: "text-emerald-400" },
                { label: "Questions", value: d.stats.questions, icon: MessageSquare, color: "text-orange-400" },
                { label: "Answers", value: d.stats.answers, icon: BookOpen, color: "text-blue-400" },
                { label: "Travel Entries", value: d.stats.travelEntries, icon: Map, color: "text-cyan-400" },
                { label: "Visa Apps", value: d.stats.visaApplications, icon: Globe, color: "text-primary" },
                { label: "Groups", value: d.stats.groupMemberships, icon: Users, color: "text-violet-400" },
                { label: "Friends", value: d.stats.friends, icon: Heart, color: "text-pink-400" },
              ];
              return (
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    {d.profileImageUrl ? (
                      <img src={d.profileImageUrl} alt={fullName} className="w-16 h-16 rounded-full object-cover shrink-0 ring-2 ring-border" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xl font-bold text-primary">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">{fullName}</h3>
                        {d.isSuperAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            <Shield className="w-3 h-3" />Super Admin
                          </span>
                        )}
                      </div>
                      {d.username && <p className="text-sm text-muted-foreground">@{d.username}</p>}
                      {d.homeCountry && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Globe className="w-3 h-3" />{d.homeCountry}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{d.email ?? "—"}</span>
                      {!d.isEmailPublic && <span className="text-xs text-amber-400">(private)</span>}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Joined {new Date(d.createdAt as string).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">{d.id}</code>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {d.isPrivate && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" />Private profile
                        </span>
                      )}
                    </div>
                    {d.bio && (
                      <p className="text-sm text-foreground bg-muted/30 rounded-xl px-3 py-2 italic">"{d.bio}"</p>
                    )}
                  </div>

                  {/* Activity Stats */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {statItems.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-muted/30 border border-border rounded-xl p-3 flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                          <div>
                            <div className="font-bold text-sm">{value.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="text-center py-16 text-muted-foreground">
                <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Could not load user details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Photo Lightbox ──────────────────────────────────────────── */}
      {photoLightbox && (
        <div
          className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPhotoLightbox(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPhotoLightbox(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <img
              src={`/api/storage${photoLightbox.objectPath}`}
              alt={photoLightbox.caption ?? "Travel photo"}
              className="w-full rounded-xl object-contain max-h-[75vh]"
            />
            <div className="flex items-center justify-between mt-3 px-1">
              <div>
                {photoLightbox.caption && <p className="text-white/90 text-sm">{photoLightbox.caption}</p>}
                <p className="text-white/50 text-xs mt-0.5">{photoLightbox.countryCode}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deletePhoto.mutate({ id: photoLightbox.id })}
                disabled={deletePhoto.isPending}
              >
                {deletePhoto.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span className="ml-1.5">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Upload Modal ───────────────────────────────────────── */}
      {showPhotoUploadModal && (
        <div
          className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowPhotoUploadModal(false); setShowPhotoCaptionStep(false); setPendingPhotoPath(null); } }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-lg">Upload a Travel Photo</h2>
              <button onClick={() => { setShowPhotoUploadModal(false); setShowPhotoCaptionStep(false); setPendingPhotoPath(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {!showPhotoCaptionStep ? (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Which country?</label>
                    <CountryCombobox
                      value={photoUploadCountry}
                      onChange={setPhotoUploadCountry}
                      placeholder="Select the country you photographed"
                    />
                  </div>
                  {photoUploadCountry && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Photo</label>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10 * 1024 * 1024}
                        onGetUploadParameters={async (file) => {
                          const res = await fetch("/api/storage/uploads/request-url", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                          });
                          const data = await res.json() as { uploadURL: string; objectPath: string };
                          setPendingPhotoPath(data.objectPath);
                          return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type as string } };
                        }}
                        onComplete={(result) => {
                          if ((result.successful ?? []).length > 0) setShowPhotoCaptionStep(true);
                        }}
                      >
                        <div className="w-full border-2 border-dashed border-border rounded-xl py-10 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer">
                          <Camera className="w-8 h-8" />
                          <span className="text-sm font-medium">Click to upload photo</span>
                          <span className="text-xs">JPG, PNG, WebP up to 10 MB</span>
                        </div>
                      </ObjectUploader>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Caption (optional)</label>
                    <input
                      value={pendingPhotoCaption}
                      onChange={(e) => setPendingPhotoCaption(e.target.value)}
                      placeholder="Where was this? What's the story?"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                      maxLength={120}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button
                      className="flex-1"
                      disabled={createPhoto.isPending || !photoUploadCountry || !pendingPhotoPath}
                      onClick={() => {
                        if (!photoUploadCountry || !pendingPhotoPath) return;
                        createPhoto.mutate({
                          data: {
                            countryCode: photoUploadCountry,
                            objectPath: pendingPhotoPath,
                            caption: pendingPhotoCaption.trim() || undefined,
                          },
                        });
                      }}
                    >
                      {createPhoto.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Camera className="w-4 h-4 mr-1.5" />}
                      Save Photo
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowPhotoCaptionStep(false); setPendingPhotoPath(null); }}>Back</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

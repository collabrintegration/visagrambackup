import { Helmet } from "react-helmet-async";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  useListFriends,
  useListFriendRequests,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useRemoveFriend,
  useListTestimonials,
  useCreateTestimonial,
  useDeleteTestimonial,
  useGetCurrentAuthUser,
  useUpdateMyProfile,
  useGetPublicUserProfile,
  getGetCurrentAuthUserQueryKey,
  getGetPublicUserProfileQueryKey,
  useListGroups,
  useListGroupJoinRequests,
  useApproveGroupJoinRequest,
  useRejectGroupJoinRequest,
  useGetDmUnreadCount,
  useListPhotos,
  useCreatePhoto,
  useDeletePhoto,
  getListFriendsQueryKey,
  getListFriendRequestsQueryKey,
  getListTestimonialsQueryKey,
  getSearchUsersQueryKey,
  getListGroupsQueryKey,
  getListGroupJoinRequestsQueryKey,
  getGetDmUnreadCountQueryKey,
  getListPhotosQueryKey,
} from "@workspace/api-client-react";
import type { TravelPhoto } from "@workspace/api-client-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import UserProfileModal from "@/components/user-profile-modal";
import type { Group, GroupJoinRequest } from "@workspace/api-client-react";
import DmProfileTab from "@/components/dm-profile-tab";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserPlus, UserCheck, UserMinus, Search, Users, Inbox,
  Clock, MapPin, LogIn, X, Check, Loader2, Star, Trash2,
  Globe, ChevronLeft, ChevronRight, MessageSquare, Crown, Lock, ArrowLeft, Camera, Mail, Eye, EyeOff,
  CheckCircle2, Heart, CalendarDays, Venus, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function Avatar({
  url, name, size = "md",
}: { url?: string | null; name: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const cls = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base", xl: "w-20 h-20 text-2xl" }[size];
  if (url) return <img src={url} alt={name} className={`${cls} rounded-full object-cover shrink-0 ring-2 ring-border`} />;
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
}

// ── Left Panel: My Profile ────────────────────────────────────────────────────

function ProfilePanel({ friendCount }: { friendCount: number }) {
  const queryClient = useQueryClient();
  const { data: authData } = useGetCurrentAuthUser();
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameVal, setUsernameVal] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const updateProfile = useUpdateMyProfile({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetCurrentAuthUserQueryKey() });
        setIsUploadingPic(false);
      },
      onError: () => setIsUploadingPic(false),
    },
  });

  useEffect(() => {
    if (authData?.user) {
      const u = authData.user as { username?: string | null };
      setUsernameVal(u.username ?? "");
    }
  }, [authData?.user]);

  const saveUsername = useCallback(() => {
    const val = usernameVal.trim();
    if (val && !/^[a-z0-9_]{3,20}$/.test(val)) {
      setUsernameError("3–20 chars: letters, numbers, underscores only");
      return;
    }
    updateProfile.mutate(
      { data: { username: val || null } },
      {
        onSuccess: () => { setEditingUsername(false); setUsernameError(null); },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? "Username already taken";
          setUsernameError(msg);
        },
      },
    );
  }, [usernameVal, updateProfile]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPic(true);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      updateProfile.mutate({ data: { profileImageUrl: base64 } });
    };
    img.onerror = () => { URL.revokeObjectURL(url); setIsUploadingPic(false); };
    img.src = url;
    if (e.target) e.target.value = "";
  }, [updateProfile]);

  const user = authData?.user;

  // Fetch travel stats using the public profile endpoint (has visitedCount + wantToVisitCount)
  const { data: publicProfile } = useGetPublicUserProfile(user?.id ?? "", {
    query: {
      queryKey: getGetPublicUserProfileQueryKey(user?.id ?? ""),
      enabled: !!user?.id,
    },
  });

  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Traveler";
  const typedUser = user as {
    username?: string | null;
    isEmailPublic?: boolean;
    age?: number | null;
    sex?: string | null;
    location?: string | null;
    dateOfBirth?: string | null;
  };

  const visitedCount = publicProfile?.visitedCount ?? 0;
  const wantToVisitCount = publicProfile?.wantToVisitCount ?? 0;
  const hasTravel = visitedCount > 0 || wantToVisitCount > 0;

  return (
    <aside className="w-72 shrink-0 space-y-4">
      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Cover gradient */}
        <div className="h-20 bg-gradient-to-br from-primary/40 via-purple-500/30 to-pink-500/40" />
        <div className="px-5 pb-5 -mt-10">
          {/* Avatar + friends count row */}
          <div className="flex items-end justify-between">
            <div className="relative group w-20 h-20 shrink-0">
              <Avatar url={user.profileImageUrl} name={name} size="xl" />
              {!isUploadingPic && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  title="Change profile picture"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}
              {isUploadingPic && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            <div className="text-right pb-1">
              <p className="text-4xl font-extrabold leading-none text-foreground">{friendCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                <Users className="w-3 h-3" />Friends
              </p>
            </div>
          </div>

          {/* Name + username */}
          <div className="mt-3">
            <h2 className="text-xl font-bold leading-tight">{name}</h2>
            {editingUsername ? (
              <div className="mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground font-medium">@</span>
                  <input
                    value={usernameVal}
                    onChange={(e) => {
                      setUsernameVal(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                      setUsernameError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveUsername();
                      if (e.key === "Escape") { setEditingUsername(false); setUsernameError(null); }
                    }}
                    className="flex-1 bg-muted border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
                    placeholder="your_username"
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    onClick={saveUsername}
                    disabled={updateProfile.isPending}
                    className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 px-1"
                  >
                    {updateProfile.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditingUsername(false); setUsernameError(null); setUsernameVal(typedUser.username ?? ""); }}
                    className="text-xs text-muted-foreground hover:text-foreground px-1"
                  >
                    Cancel
                  </button>
                </div>
                {usernameError && (
                  <p className="text-[11px] text-red-400 mt-1 leading-tight">{usernameError}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  3–20 chars · letters, numbers, underscores
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5 group/uname">
                <p className="text-xs text-muted-foreground">
                  {typedUser.username ? `@${typedUser.username}` : <span className="italic opacity-60">No username — click to set one</span>}
                </p>
                <button
                  onClick={() => { setUsernameVal(typedUser.username ?? ""); setEditingUsername(true); setUsernameError(null); }}
                  className="opacity-0 group-hover/uname:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  title="Edit username"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Email row with privacy toggle */}
          {user.email && (
            <div className="mt-2 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate flex-1">
                {typedUser.isEmailPublic !== false ? user.email : "••••@••••"}
              </span>
              <button
                title={typedUser.isEmailPublic !== false ? "Email visible to others — click to hide" : "Email hidden from others — click to show"}
                onClick={() => updateProfile.mutate({ data: { isEmailPublic: !(typedUser.isEmailPublic !== false) } })}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {typedUser.isEmailPublic !== false
                  ? <Eye className="w-3.5 h-3.5" />
                  : <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                }
              </button>
            </div>
          )}

          {/* Info rows: location, age, sex */}
          <div className="mt-2 space-y-1">
            {typedUser.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{typedUser.location}</span>
              </div>
            )}
            {typedUser.age && (
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Age {typedUser.age}</span>
              </div>
            )}
            {typedUser.sex && (
              <div className="flex items-center gap-2">
                <Venus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{typedUser.sex}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {user.bio ? (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
              {user.bio}
            </p>
          ) : (
            <Link href="/profile"
              className="mt-3 pt-3 border-t border-border/60 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="text-base leading-none">✏️</span>
              Add a bio on your profile
            </Link>
          )}
        </div>
      </div>

      {/* Travel stats */}
      {hasTravel && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Travel Map</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Visited</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{visitedCount}</p>
              <p className="text-xs text-muted-foreground">countries</p>
            </div>
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Heart className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium">Wishlist</span>
              </div>
              <p className="text-2xl font-bold text-primary">{wantToVisitCount}</p>
              <p className="text-xs text-muted-foreground">countries</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick links</h3>
        {[
          { href: "/profile", label: "Edit Profile" },
          { href: "/tracker", label: "My Visa Tracker" },
        ].map((l) => (
          <Link key={l.href} href={l.href}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {l.label}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </div>
    </aside>
  );
}

// ── Right Panel: Friends List ─────────────────────────────────────────────────

type RightTab = "friends" | "requests" | "search" | "groups" | "messages";

function FriendRow({ id, firstName, lastName, profileImageUrl, homeCountry, friendshipSince, onRemove, onMessage }: {
  id: string; firstName?: string | null; lastName?: string | null;
  profileImageUrl?: string | null; homeCountry?: string | null; friendshipSince?: string | null;
  onRemove: () => void; onMessage: () => void;
}) {
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Traveler";
  const [, navigate] = useLocation();
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors group cursor-pointer" onClick={() => navigate(`/user/${id}`)}>
      <Avatar url={profileImageUrl} name={name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {homeCountry && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{homeCountry}</span>}
          {friendshipSince && <span className="text-xs text-muted-foreground">· {timeAgo(friendshipSince)}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onMessage(); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Message">
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        <button onClick={e => { e.stopPropagation(); onRemove(); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remove friend">
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Testimonials section ──────────────────────────────────────────────────────

function TestimonialsSection({ myId, myName, friendIds }: { myId: string; myName: string; friendIds: Set<string> }) {
  const queryClient = useQueryClient();
  const { data: testimonials = [], isLoading } = useListTestimonials(myId, { query: { queryKey: getListTestimonialsQueryKey(myId), enabled: !!myId } });
  const createTestimonial = useCreateTestimonial();
  const deleteTestimonial = useDeleteTestimonial();
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim() || text.trim().length < 10) return;
    // This is writing a testimonial ABOUT yourself from a friend — not applicable here
    // Instead we show the write box only to friends viewing this page
    // The form posts to /api/testimonials/{myId} but we need the currently logged-in user to be a friend
    // For the profile owner's own page, we show read-only testimonials
    // The write form is shown on OTHER people's pages — keep this for now as "invite a friend to write"
    setText("");
    setWriting(false);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <h3 className="font-semibold text-sm">Testimonials</h3>
          {testimonials.length > 0 && (
            <Badge variant="secondary" className="text-xs">{testimonials.length}</Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : testimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No testimonials yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Your friends can write kind words about you here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => {
            const authorName = [t.authorFirstName, t.authorLastName].filter(Boolean).join(" ") || "Traveler";
            return (
              <div key={t.id} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <Avatar url={t.authorImageUrl} name={authorName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{authorName}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{timeAgo(t.createdAt)}</span>
                        <button
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => deleteTestimonial.mutate({ id: t.id }, {
                            onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey(myId) }),
                          })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {t.authorCountry && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />{t.authorCountry}
                      </p>
                    )}
                    <p className="text-sm mt-2 leading-relaxed text-foreground/90 italic">"{t.content}"</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Write Testimonial (for friend's profile — shown in search results) ────────

function WriteTestimonialInline({ targetId, targetName, isFriend }: { targetId: string; targetName: string; isFriend: boolean }) {
  const queryClient = useQueryClient();
  const { data: existing = [] } = useListTestimonials(targetId, { query: { queryKey: getListTestimonialsQueryKey(targetId), enabled: isFriend } });
  const create = useCreateTestimonial();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => existing[0]?.content ?? "");

  if (!isFriend) return null;
  const alreadyWrote = existing.length > 0;

  return (
    <div className="mt-2">
      {!open ? (
        <button
          className="text-xs text-primary hover:underline flex items-center gap-1"
          onClick={() => { setOpen(true); setText(existing[0]?.content ?? ""); }}
        >
          <Star className="w-3 h-3" />
          {alreadyWrote ? "Edit your testimonial" : "Write a testimonial"}
        </button>
      ) : (
        <div className="mt-2 space-y-2">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Share something kind about ${targetName}…`}
            rows={3}
            maxLength={500}
            className="text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.length}/500</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" disabled={text.trim().length < 10 || create.isPending}
                onClick={() => create.mutate({ userId: targetId, data: { content: text.trim() } }, {
                  onSuccess: () => {
                    setOpen(false);
                    queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey(targetId) });
                  },
                })}
              >
                {create.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Groups tab components ─────────────────────────────────────────────────────

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
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors">
      {/* Emoji + badges row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-4xl leading-none">{group.emoji}</span>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">
            <Crown className="w-2.5 h-2.5" /> Admin
          </span>
          {group.isPrivate && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          )}
        </div>
      </div>

      {/* Name + description */}
      <div className="flex-1">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{group.name}</p>
        {group.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{group.description}</p>
        )}
      </div>

      {/* Member count */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="w-3 h-3" />
        <span>{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Link href={`/groups/${group.id}`}>
          <Button size="sm" className="w-full text-xs">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Open Chat
          </Button>
        </Link>
        {group.isPrivate && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg py-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" /> Join Requests
            {!isLoading && requests.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 font-bold">{requests.length}</span>
            )}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>

      {/* Join requests panel */}
      {expanded && group.isPrivate && (
        <div className="border-t border-border pt-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No pending join requests</p>
          ) : (
            (requests as GroupJoinRequest[]).map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                  {r.firstName?.[0]?.toUpperCase() ?? "T"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{[r.firstName, r.lastName].filter(Boolean).join(" ") || "Traveler"}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(r.createdAt ?? "")}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" className="h-6 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" disabled={approving || rejecting}
                    onClick={() => approve({ id: group.id, userId: r.userId })}>
                    <UserCheck className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                    disabled={approving || rejecting} onClick={() => reject({ id: group.id, userId: r.userId })}>
                    <X className="w-3 h-3 mr-1" /> Reject
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

interface FriendsListSectionProps {
  friends: { id: string; firstName?: string | null; lastName?: string | null; profileImageUrl?: string | null; homeCountry?: string | null }[];
  loading: boolean;
  onRemove: (id: string) => void;
  onMessage: (id: string) => void;
  onFindPeople: () => void;
}

const FRIENDS_PAGE_SIZE = 10;

function FriendsListSection({ friends, loading, onRemove, onMessage, onFindPeople }: FriendsListSectionProps) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const filtered = q.trim()
    ? friends.filter(f => {
        const name = [f.firstName, f.lastName].filter(Boolean).join(" ").toLowerCase();
        return name.includes(q.toLowerCase()) || (f.homeCountry ?? "").toLowerCase().includes(q.toLowerCase());
      })
    : friends;

  const totalPages = Math.ceil(filtered.length / FRIENDS_PAGE_SIZE);
  const paginated = filtered.slice(page * FRIENDS_PAGE_SIZE, (page + 1) * FRIENDS_PAGE_SIZE);

  const handleSearch = (val: string) => {
    setQ(val);
    setPage(0);
  };

  return (
    <div className="space-y-3">
      {friends.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search friends…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      )}
      <div className="rounded-2xl border border-border bg-card p-2 space-y-0.5">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground opacity-40" />
            <p className="font-semibold">No friends yet</p>
            <p className="text-sm text-muted-foreground">Search for travelers and send them a request.</p>
            <Button size="sm" onClick={onFindPeople}><Search className="w-3.5 h-3.5 mr-1.5" />Find People</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-muted-foreground">No friends match "<span className="text-foreground">{q}</span>"</p>
          </div>
        ) : (
          paginated.map(f => (
            <FriendRow
              key={f.id}
              {...f}
              onRemove={() => onRemove(f.id)}
              onMessage={() => onMessage(f.id)}
            />
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />Prev
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages} &nbsp;·&nbsp; {filtered.length} friend{filtered.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next<ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function FriendsGroupsTab() {
  const [groupSearch, setGroupSearch] = useState("");
  const { data: groups = [], isLoading } = useListGroups({
    query: { queryKey: getListGroupsQueryKey(), enabled: true },
  });

  const q = groupSearch.trim().toLowerCase();
  const myGroups = groups.filter((g) => g.isMember && !g.isAdmin).filter(g => !q || g.name.toLowerCase().includes(q));
  const adminGroups = groups.filter((g) => g.isAdmin).filter(g => !q || g.name.toLowerCase().includes(q));

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (myGroups.length === 0 && adminGroups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <Users className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="font-semibold">No groups yet</p>
        <p className="text-sm text-muted-foreground">Join or create travel groups to connect with fellow travelers.</p>
        <Link href="/groups"><Button size="sm"><Users className="w-3.5 h-3.5 mr-1.5" />Browse Groups</Button></Link>
      </div>
    );
  }

  const totalGroups = groups.filter(g => g.isMember || g.isAdmin).length;

  return (
    <div className="space-y-6">
      {totalGroups > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={groupSearch}
            onChange={e => setGroupSearch(e.target.value)}
            placeholder="Search groups…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      )}

      <div className="space-y-8">
        {adminGroups.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-sm">Groups I Admin</h3>
              <span className="text-xs text-muted-foreground">({adminGroups.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {adminGroups.map((g) => <AdminGroupPanel key={g.id} group={g} />)}
            </div>
          </div>
        )}

        {myGroups.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Groups I'm In</h3>
              <span className="text-xs text-muted-foreground">({myGroups.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {myGroups.map((g) => (
                <div key={g.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors">
                  {/* Emoji + privacy badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-4xl leading-none">{g.emoji}</span>
                    {g.isPrivate && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0 mt-1">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </span>
                    )}
                  </div>

                  {/* Name + description */}
                  <div className="flex-1">
                    <p className="font-semibold text-sm leading-tight line-clamp-2">{g.name}</p>
                    {g.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{g.description}</p>
                    )}
                  </div>

                  {/* Member count */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{g.memberCount} member{g.memberCount !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Action */}
                  <Link href={`/groups/${g.id}`}>
                    <Button size="sm" className="w-full text-xs">
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Open Chat
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/groups">
          <Button variant="outline" size="sm" className="w-full">
            <Users className="w-4 h-4 mr-2" /> Browse All Groups
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [rightTab, setRightTab] = useState<RightTab>("friends");
  const [dmOpenUserId, setDmOpenUserId] = useState<string | null>(null);
  const [searchRaw, setSearchRaw] = useState("");
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const [photoLightbox, setPhotoLightbox] = useState<TravelPhoto | null>(null);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [pendingPhotoPath, setPendingPhotoPath] = useState<string | null>(null);
  const [pendingPhotoCaption, setPendingPhotoCaption] = useState("");
  const [showPhotoCaptionStep, setShowPhotoCaptionStep] = useState(false);
  const searchQuery = useDebounce(searchRaw, 300);
  const [sexFilter, setSexFilter] = useState("");
  const [locationRaw, setLocationRaw] = useState("");
  const locationFilter = useDebounce(locationRaw, 400);
  const [minAgeRaw, setMinAgeRaw] = useState("");
  const [maxAgeRaw, setMaxAgeRaw] = useState("");
  const minAge = minAgeRaw ? Number(minAgeRaw) : undefined;
  const maxAge = maxAgeRaw ? Number(maxAgeRaw) : undefined;

  const { data: dmUnread } = useGetDmUnreadCount({
    query: { queryKey: getGetDmUnreadCountQueryKey(), enabled: isAuthenticated, refetchInterval: 15000 },
  });
  const dmBadge = (dmUnread?.unreadMessages ?? 0) + (dmUnread?.pendingRequests ?? 0);

  const { data: friends = [], isLoading: loadingFriends } = useListFriends({ query: { queryKey: getListFriendsQueryKey(), enabled: isAuthenticated } });
  const { data: requests = [], isLoading: loadingRequests } = useListFriendRequests({ query: { queryKey: getListFriendRequestsQueryKey(), enabled: isAuthenticated } });
  const searchParams = {
    ...(searchQuery.trim() ? { q: searchQuery } : {}),
    ...(sexFilter ? { sex: sexFilter } : {}),
    ...(locationFilter.trim() ? { location: locationFilter } : {}),
    ...(minAge != null && !isNaN(minAge) ? { minAge } : {}),
    ...(maxAge != null && !isNaN(maxAge) ? { maxAge } : {}),
  };
  const hasSearchInput = searchQuery.trim().length >= 2 || !!sexFilter || !!locationFilter.trim() || minAge != null || maxAge != null;
  const { data: searchResults = [], isLoading: loadingSearch } = useSearchUsers(
    searchParams,
    { query: { queryKey: getSearchUsersQueryKey(searchParams), enabled: isAuthenticated && hasSearchInput } },
  );

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();
  const removeFriend = useRemoveFriend();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListFriendRequestsQueryKey() });
  }, [queryClient]);

  const friendIds = new Set(friends.map(f => f.id));
  const myId = (authUser as { id?: string })?.id ?? "";
  const myName = [(authUser as { firstName?: string })?.firstName, (authUser as { lastName?: string })?.lastName].filter(Boolean).join(" ") || "Me";

  const photoQueryParams = { userId: myId, limit: 50 };
  const { data: photoData, isLoading: photosLoading } = useListPhotos(photoQueryParams, {
    query: { queryKey: getListPhotosQueryKey(photoQueryParams), enabled: !!myId },
  });
  const myPhotos = photoData?.photos ?? [];

  const createPhoto = useCreatePhoto({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey(photoQueryParams) });
        setShowPhotoUploadModal(false);
        setShowPhotoCaptionStep(false);
        setPendingPhotoPath(null);
        setPendingPhotoCaption("");
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

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Sign in to see friends</h2>
          <p className="text-muted-foreground max-w-sm">Connect with fellow travelers, share visa tips, and build your travel community.</p>
        </div>
        <Button onClick={() => navigate("/sign-in")}><LogIn className="w-4 h-4 mr-2" />Sign in</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Friends — Visagram</title></Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">

          {/* ── LEFT PANEL: My Profile ── */}
          <ProfilePanel friendCount={friends.length} />

          {/* ── RIGHT PANEL: Friends + Testimonials ── */}
          <div className="flex-1 min-w-0">

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-border mb-5">
              {([
                { key: "friends" as RightTab, label: "Friends", icon: Users, count: friends.length },
                { key: "messages" as RightTab, label: "Messages", icon: MessageSquare, count: dmBadge > 0 ? dmBadge : null },
                { key: "requests" as RightTab, label: "Requests", icon: Inbox, count: requests.length },
                { key: "groups" as RightTab, label: "My Groups", icon: Users, count: null },
                { key: "search" as RightTab, label: "Find People", icon: Search, count: null },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRightTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    rightTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <Badge variant={rightTab === tab.key ? "default" : "secondary"} className="text-xs px-1.5 py-0 h-5">{tab.count}</Badge>
                  )}
                </button>
              ))}
            </div>

            {/* ── Friends list ── */}
            {rightTab === "friends" && (
              <FriendsListSection
                friends={friends}
                loading={loadingFriends}
                onRemove={(id) => removeFriend.mutate({ userId: id }, { onSuccess: invalidate })}
                onMessage={(id) => { setDmOpenUserId(id); setRightTab("messages"); }}
                onFindPeople={() => setRightTab("search")}
              />
            )}

            {/* ── Requests ── */}
            {rightTab === "requests" && (
              <div className="space-y-2">
                {loadingRequests ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <Inbox className="w-10 h-10 text-muted-foreground opacity-40" />
                    <p className="font-semibold">No pending requests</p>
                    <p className="text-sm text-muted-foreground">Friend requests will appear here.</p>
                  </div>
                ) : (
                  requests.map(r => {
                    const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "Traveler";
                    return (
                      <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/user/${r.id}`)}>
                        <Avatar url={r.profileImageUrl} name={name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{name}</p>
                          {r.homeCountry && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" />{r.homeCountry}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">{r.createdAt ? timeAgo(r.createdAt) : ""}</p>
                        </div>
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <Button size="sm" className="text-xs" onClick={() => acceptRequest.mutate({ requesterId: r.id }, { onSuccess: invalidate })} disabled={acceptRequest.isPending}>
                            <Check className="w-3.5 h-3.5 mr-1" />Accept
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => declineRequest.mutate({ requesterId: r.id }, { onSuccess: invalidate })} disabled={declineRequest.isPending}>
                            <X className="w-3.5 h-3.5 mr-1" />Decline
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Search ── */}
            {rightTab === "search" && (
              <div className="space-y-4">
                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={searchRaw} onChange={e => setSearchRaw(e.target.value)} placeholder="Search by name or email…" className="pl-9" autoFocus />
                  {searchRaw && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchRaw("")}><X className="w-4 h-4" /></button>}
                </div>

                {/* Filters row */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Gender filter */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {["", "Male", "Female", "Non-binary", "Prefer not to say"].map(opt => (
                      <button
                        key={opt || "any"}
                        onClick={() => setSexFilter(opt)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                          sexFilter === opt
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        }`}
                      >
                        {opt || "Any gender"}
                      </button>
                    ))}
                  </div>

                  {/* Location filter */}
                  <div className="relative flex-1 min-w-[140px]">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={locationRaw}
                      onChange={e => setLocationRaw(e.target.value)}
                      placeholder="Filter by location…"
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>

                  {/* Age range filter */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="text-xs">Age:</span>
                    <input
                      type="number" min={13} max={120}
                      value={minAgeRaw}
                      onChange={e => setMinAgeRaw(e.target.value)}
                      placeholder="Min"
                      className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <span className="text-xs">–</span>
                    <input
                      type="number" min={13} max={120}
                      value={maxAgeRaw}
                      onChange={e => setMaxAgeRaw(e.target.value)}
                      placeholder="Max"
                      className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>

                  {/* Clear filters */}
                  {(sexFilter || locationRaw || minAgeRaw || maxAgeRaw) && (
                    <button
                      onClick={() => { setSexFilter(""); setLocationRaw(""); setMinAgeRaw(""); setMaxAgeRaw(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {!hasSearchInput ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <Search className="w-10 h-10 text-muted-foreground opacity-40" />
                    <p className="font-semibold">Find fellow travelers</p>
                    <p className="text-sm text-muted-foreground">Search by name, or use the filters above.</p>
                  </div>
                ) : loadingSearch ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <p className="font-semibold">No travelers found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map(u => {
                      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "Traveler";
                      const isFriend = u.friendshipStatus === "accepted";
                      const isPending = u.friendshipStatus === "pending";
                      return (
                        <div
                          key={u.id}
                          className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/40 hover:bg-card/80 transition-colors"
                          onClick={() => navigate(`/user/${u.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar url={u.profileImageUrl} name={name} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{name}</p>
                              {u.username && <p className="text-xs text-muted-foreground mt-0.5">@{u.username}</p>}
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                {u.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{u.location}</p>}
                                {u.age && <p className="text-xs text-muted-foreground">Age {u.age}</p>}
                                {u.sex && <p className="text-xs text-muted-foreground">{u.sex}</p>}
                                {!u.location && u.homeCountry && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{u.homeCountry}</p>}
                              </div>
                            </div>
                            {isFriend ? (
                              <Button variant="outline" size="sm" className="text-xs" onClick={e => e.stopPropagation()} disabled><UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />Friends</Button>
                            ) : isPending && u.iRequested ? (
                              <Button variant="outline" size="sm" className="text-xs" onClick={e => e.stopPropagation()} disabled><Clock className="w-3.5 h-3.5 mr-1" />Requested</Button>
                            ) : isPending && !u.iRequested ? (
                              <Button size="sm" className="text-xs" onClick={e => { e.stopPropagation(); sendRequest.mutate({ userId: u.id }, { onSuccess: invalidate }); }} disabled={sendRequest.isPending}>
                                <Check className="w-3.5 h-3.5 mr-1" />Accept
                              </Button>
                            ) : (
                              <Button size="sm" className="text-xs" onClick={e => { e.stopPropagation(); sendRequest.mutate({ userId: u.id }, { onSuccess: invalidate }); }} disabled={sendRequest.isPending}>
                                <UserPlus className="w-3.5 h-3.5 mr-1" />Add Friend
                              </Button>
                            )}
                          </div>
                          <WriteTestimonialInline targetId={u.id} targetName={name} isFriend={isFriend} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Messages ── */}
            {rightTab === "messages" && (
              <div className="space-y-3">
                <button
                  onClick={() => setRightTab("friends")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Friends
                </button>
                <DmProfileTab myId={myId} initialConvUserId={dmOpenUserId} />
              </div>
            )}

            {/* ── My Groups ── */}
            {rightTab === "groups" && (
              <FriendsGroupsTab />
            )}

            {/* ── Photos (shown under friends list, before testimonials) ── */}
            {rightTab === "friends" && myId && (
              <div className="mt-6 bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" /> Photos
                    {myPhotos.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">({myPhotos.length})</span>
                    )}
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => { setShowPhotoUploadModal(true); setShowPhotoCaptionStep(false); setPendingPhotoPath(null); setPendingPhotoCaption(""); }}>
                    <Camera className="w-3.5 h-3.5 mr-1.5" /> Upload Photo
                  </Button>
                </div>

                {photosLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : myPhotos.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => { setShowPhotoUploadModal(true); setShowPhotoCaptionStep(false); setPendingPhotoPath(null); setPendingPhotoCaption(""); }}
                  >
                    <Camera className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No photos yet — click to upload your first</p>
                  </div>
                ) : (
                  <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
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
            )}

            {/* ── Testimonials (shown under friends list) ── */}
            {rightTab === "friends" && myId && (
              <TestimonialsSection myId={myId} myName={myName} friendIds={friendIds} />
            )}
          </div>
        </div>
      </div>

      {profileModalUserId && (
        <UserProfileModal
          userId={profileModalUserId}
          onClose={() => setProfileModalUserId(null)}
          onInvalidate={invalidate}
        />
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
                      disabled={createPhoto.isPending || !pendingPhotoPath}
                      onClick={() => {
                        if (!pendingPhotoPath) return;
                        createPhoto.mutate({
                          data: {
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
    </>
  );
}

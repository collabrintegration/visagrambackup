import { useParams, Link, useLocation } from "wouter";
import {
  useGetPublicUserProfile,
  useListPhotos,
  useListTestimonials,
  useListUserFriends,
  useListUserGroups,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useAcceptDmRequest,
  useSendDm,
  getGetPublicUserProfileQueryKey,
  getListPhotosQueryKey,
  getListTestimonialsQueryKey,
  getListUserFriendsQueryKey,
  getListUserGroupsQueryKey,
  getGetDmInboxQueryKey,
  getGetDmRequestsQueryKey,
  getGetDmUnreadCountQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Globe, Loader2, Camera, Users, UserPlus,
  Check, MessageCircle, ChevronLeft, Star,
  CheckCircle2, Heart, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function Avatar({ url, name, size = 80 }: { url?: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <img src={url} alt={name} style={{ width: size, height: size }}
        className="rounded-full object-cover ring-4 ring-border" />
    );
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-gradient-to-br from-primary/80 to-pink-500/80 flex items-center justify-center text-white font-bold ring-4 ring-border">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function UserPublicProfilePage() {
  const { id: userId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [lightboxPhoto, setLightboxPhoto] = useState<{ objectPath: string; caption?: string | null; countryCode?: string | null } | null>(null);

  const myId = (user as { id?: string })?.id ?? "";

  const { data: profile, isLoading: profileLoading } = useGetPublicUserProfile(userId ?? "", {
    query: { queryKey: getGetPublicUserProfileQueryKey(userId ?? ""), enabled: !!userId },
  });

  const photoParams = { userId: userId ?? "", limit: 50 };
  const { data: photosData, isLoading: photosLoading } = useListPhotos(photoParams, {
    query: { queryKey: getListPhotosQueryKey(photoParams), enabled: !!userId },
  });
  const photos = photosData?.photos ?? [];

  const { data: testimonials = [], isLoading: testimonialsLoading } = useListTestimonials(userId ?? "", {
    query: { queryKey: getListTestimonialsQueryKey(userId ?? ""), enabled: !!userId },
  });

  const { data: userFriends = [], isLoading: friendsLoading } = useListUserFriends(userId ?? "", {
    query: { queryKey: getListUserFriendsQueryKey(userId ?? ""), enabled: !!userId },
  });

  const { data: userGroups = [], isLoading: groupsLoading } = useListUserGroups(userId ?? "", {
    query: { queryKey: getListUserGroupsQueryKey(userId ?? ""), enabled: !!userId },
  });

  const [showCommonGroupsOnly, setShowCommonGroupsOnly] = useState(false);
  const commonGroups = userGroups.filter(g => g.isMember || g.isAdmin);
  const displayedGroups = showCommonGroupsOnly ? commonGroups : userGroups;

  const sendRequest = useSendFriendRequest({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId ?? "") }),
    },
  });

  const acceptRequest = useAcceptFriendRequest({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId ?? "") }),
    },
  });

  const acceptDmRequest = useAcceptDmRequest({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId ?? "") }),
    },
  });

  const { toast } = useToast();
  const sendDm = useSendDm({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId ?? "") });
        queryClient.invalidateQueries({ queryKey: getGetDmInboxQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDmRequestsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDmUnreadCountQueryKey() });
        toast({ title: "Message request sent" });
      },
      onError: () => {
        toast({ title: "Couldn't send message request", variant: "destructive" });
      },
    },
  });

  if (!userId) return null;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">User not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/friends")}>Go back</Button>
      </div>
    );
  }

  const p = profile;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Traveler";
  const isOwnProfile = myId === p.id;
  const status = p.friendshipStatus;
  const dmStatus = p.dmStatus;

  function MessageButton() {
    if (isOwnProfile || !isAuthenticated) return null;
    if (dmStatus === "active") return (
      <Link href={`/messages/${p.id}?back=${encodeURIComponent(`/user/${p.id}`)}`}>
        <Button size="sm" variant="outline" className="w-full">
          <MessageCircle className="w-3.5 h-3.5 mr-1.5" />Message
        </Button>
      </Link>
    );
    if (dmStatus === "request" && p.dmRequestedByMe) return (
      <Badge variant="secondary" className="w-full justify-center text-muted-foreground py-1.5 text-xs">Message request sent</Badge>
    );
    if (dmStatus === "request" && !p.dmRequestedByMe) return (
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => acceptDmRequest.mutate({ userId: p.id }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(p.id) });
            navigate(`/messages/${p.id}?back=${encodeURIComponent(`/user/${p.id}`)}`);
          },
        })}
        disabled={acceptDmRequest.isPending}
      >
        {acceptDmRequest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <MessageCircle className="w-3.5 h-3.5 mr-1.5" />}
        Accept Message Request
      </Button>
    );
    if (dmStatus === "blocked" || dmStatus === "spam") return null;
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => sendDm.mutate({ userId: p.id, data: { content: `Hi, I'd like to connect!` } })}
        disabled={sendDm.isPending}
      >
        {sendDm.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <MessageCircle className="w-3.5 h-3.5 mr-1.5" />}
        Send Message Request
      </Button>
    );
  }

  function FriendButton() {
    if (isOwnProfile) {
      return (
        <Link href="/profile">
          <Button size="sm" variant="outline" className="w-full">Edit Profile</Button>
        </Link>
      );
    }
    if (!isAuthenticated) return null;
    if (status === "accepted") return (
      <Badge variant="secondary" className="w-full justify-center text-emerald-400 border-emerald-500/30 bg-emerald-500/10 py-1.5 text-xs">
        <Check className="w-3 h-3 mr-1" />Friends
      </Badge>
    );
    if (status === "pending" && p.iRequested) return (
      <Badge variant="secondary" className="w-full justify-center text-muted-foreground py-1.5 text-xs">Request sent</Badge>
    );
    if (status === "pending" && !p.iRequested) return (
      <Button size="sm" className="w-full" onClick={() => acceptRequest.mutate({ requesterId: p.id })} disabled={acceptRequest.isPending}>
        {acceptRequest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
        Accept Request
      </Button>
    );
    return (
      <Button size="sm" className="w-full" onClick={() => sendRequest.mutate({ userId: p.id })} disabled={sendRequest.isPending}>
        {sendRequest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
        Add Friend
      </Button>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* ── LEFT PANEL ── */}
        <aside className="w-full md:w-72 shrink-0 space-y-4">

          {/* Profile card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-primary/40 via-purple-500/30 to-pink-500/40" />
            <div className="px-5 pb-5 -mt-10">
              <div className="flex items-end justify-between">
                <div className="w-20 h-20 shrink-0">
                  <Avatar url={p.profileImageUrl} name={fullName} size={80} />
                </div>
                <div className="text-right pb-1">
                  <p className="text-4xl font-extrabold leading-none text-foreground">{userFriends.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                    <Users className="w-3 h-3" />Friends
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <h2 className="text-xl font-bold leading-tight">{fullName}</h2>
                {p.username && <p className="text-xs text-muted-foreground mt-0.5">@{p.username}</p>}
              </div>

              <div className="mt-2 space-y-1">
                {p.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">{p.location}</span>
                  </div>
                )}
                {p.homeCountry && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">From {p.homeCountry}</span>
                  </div>
                )}
                {p.age && <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Age {p.age}</span></div>}
                {p.sex && <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{p.sex}</span></div>}
              </div>

              {p.bio && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">{p.bio}</p>
              )}

              {!isOwnProfile && isAuthenticated && (
                <div className="mt-4 pt-3 border-t border-border/60 flex flex-col gap-2">
                  <FriendButton />
                  <MessageButton />
                </div>
              )}
              {isOwnProfile && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <FriendButton />
                </div>
              )}
            </div>
          </div>

          {/* Travel map (desktop only) */}
          {((p.visitedCount ?? 0) > 0 || (p.wantToVisitCount ?? 0) > 0) && (
            <div className="hidden md:block rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Travel Map</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Visited</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{p.visitedCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">countries</p>
                </div>
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Heart className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary font-medium">Wishlist</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{p.wantToVisitCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">countries</p>
                </div>
              </div>
            </div>
          )}

        </aside>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ── Friends ── */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Friends</h3>
              {userFriends.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">({userFriends.length})</span>
              )}
            </div>

            {friendsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : userFriends.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No friends yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {userFriends.map((friend) => {
                  const friendName = [friend.firstName, friend.lastName].filter(Boolean).join(" ") || "Traveler";
                  return (
                    <Link key={friend.id} href={`/user/${friend.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
                        {friend.profileImageUrl ? (
                          <img src={friend.profileImageUrl} alt={friendName} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-white">{friendName.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{friendName}</p>
                          {friend.homeCountry && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" />{friend.homeCountry}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Photos ── */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Photos</h3>
              {photos.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">({photos.length})</span>
              )}
            </div>

            {photosLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-xl">
                <Camera className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isOwnProfile ? "No photos yet — share your travel moments." : `${p.firstName ?? "This traveler"} hasn't shared any photos yet.`}
                </p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group break-inside-avoid rounded-xl overflow-hidden cursor-pointer border border-border hover:border-primary/40 transition-all"
                    onClick={() => setLightboxPhoto(photo)}
                  >
                    <img
                      src={`/api/storage${photo.objectPath}`}
                      alt={photo.caption ?? "Photo"}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {(photo.caption || photo.countryCode) && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                        {photo.caption && <p className="text-xs text-white/90 line-clamp-1">{photo.caption}</p>}
                        {photo.countryCode && <p className="text-[10px] text-white/60 mt-0.5">{photo.countryCode}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Groups ── */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Groups</h3>
                {userGroups.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">({userGroups.length})</span>
                )}
              </div>
              {isAuthenticated && !isOwnProfile && commonGroups.length > 0 && (
                <button
                  onClick={() => setShowCommonGroupsOnly(v => !v)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    showCommonGroupsOnly
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {showCommonGroupsOnly ? `Show all (${userGroups.length})` : `Common (${commonGroups.length})`}
                </button>
              )}
            </div>

            {groupsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : displayedGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  {showCommonGroupsOnly ? "No groups in common." : `${p.firstName ?? "This traveler"} hasn't joined any groups yet.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedGroups.map((g) => (
                  <Link key={g.id} href={`/groups/${g.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                        {g.emoji ?? "🌍"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{g.name}</p>
                        {g.memberCount != null && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3" />{g.memberCount} member{g.memberCount !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      {(g.isMember || g.isAdmin) && (
                        <Badge variant="secondary" className="text-xs shrink-0 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">In common</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Testimonials ── */}
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-400" />
              <h3 className="font-semibold text-sm">Testimonials</h3>
              {testimonials.length > 0 && (
                <Badge variant="secondary" className="text-xs">{testimonials.length}</Badge>
              )}
            </div>

            {testimonialsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : testimonials.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  {isOwnProfile
                    ? "Your friends can write kind words about you here."
                    : `${p.firstName ?? "This traveler"} hasn't received any testimonials yet.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {testimonials.map((t) => {
                  const authorName = [t.authorFirstName, t.authorLastName].filter(Boolean).join(" ") || "Traveler";
                  return (
                    <div key={t.id} className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {t.authorImageUrl ? (
                          <img src={t.authorImageUrl} alt={authorName} className="w-9 h-9 rounded-full object-cover ring-2 ring-border" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link href={`/user/${t.authorId}`}>
                            <span className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">{authorName}</span>
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {new Date(t.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <Star className="w-4 h-4 text-yellow-400 shrink-0" />
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">{t.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxPhoto(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white text-xl">✕</button>
            <img
              src={`/api/storage${lightboxPhoto.objectPath}`}
              alt={lightboxPhoto.caption ?? "Photo"}
              className="w-full rounded-xl object-contain max-h-[75vh]"
            />
            {(lightboxPhoto.caption || lightboxPhoto.countryCode) && (
              <div className="mt-3 px-1">
                {lightboxPhoto.caption && <p className="text-white/90 text-sm">{lightboxPhoto.caption}</p>}
                {lightboxPhoto.countryCode && <p className="text-white/50 text-xs mt-0.5">{lightboxPhoto.countryCode}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

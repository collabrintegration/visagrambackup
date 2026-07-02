import { useParams, Link, useLocation } from "wouter";
import {
  useGetPublicUserProfile,
  useListPhotos,
  useListTestimonials,
  useListGroups,
  useSendFriendRequest,
  useAcceptFriendRequest,
  getGetPublicUserProfileQueryKey,
  getListPhotosQueryKey,
  getListTestimonialsQueryKey,
  getListGroupsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Globe, Loader2, Camera, Users, UserPlus,
  Check, MessageCircle, ChevronLeft, Star, Image as ImageIcon,
  CheckCircle2, Heart, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

function Avatar({ url, name, size = 80 }: { url?: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-4 ring-border"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-gradient-to-br from-primary/80 to-pink-500/80 flex items-center justify-center text-white font-bold ring-4 ring-border"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

type Tab = "photos" | "groups" | "testimonials";

export default function UserPublicProfilePage() {
  const { id: userId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("photos");
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

  const { data: allGroups = [] } = useListGroups({
    query: { queryKey: getListGroupsQueryKey(), enabled: isAuthenticated },
  });
  const sharedGroups = allGroups.filter(g => g.isMember || g.isAdmin);

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
  const isFriend = status === "accepted";

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

      <div className="flex gap-6 items-start">

        {/* ── LEFT PANEL ── */}
        <aside className="w-72 shrink-0 space-y-4">

          {/* Profile card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Cover gradient */}
            <div className="h-20 bg-gradient-to-br from-primary/40 via-purple-500/30 to-pink-500/40" />

            <div className="px-5 pb-5 -mt-10">
              {/* Avatar + photo count */}
              <div className="flex items-end justify-between">
                <div className="w-20 h-20 shrink-0">
                  <Avatar url={p.profileImageUrl} name={fullName} size={80} />
                </div>
                <div className="text-right pb-1">
                  <p className="text-4xl font-extrabold leading-none text-foreground">{photos.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                    <Camera className="w-3 h-3" />Photos
                  </p>
                </div>
              </div>

              {/* Name + username */}
              <div className="mt-3">
                <h2 className="text-xl font-bold leading-tight">{fullName}</h2>
                {p.username && (
                  <p className="text-xs text-muted-foreground mt-0.5">@{p.username}</p>
                )}
              </div>

              {/* Info rows */}
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
                {p.age && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Age {p.age}</span>
                  </div>
                )}
                {p.sex && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{p.sex}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {p.bio && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                  {p.bio}
                </p>
              )}

              {/* Actions */}
              {!isOwnProfile && isAuthenticated && (
                <div className="mt-4 pt-3 border-t border-border/60 flex flex-col gap-2">
                  <FriendButton />
                  {isFriend && (
                    <Link href={`/messages/${p.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />Message
                      </Button>
                    </Link>
                  )}
                </div>
              )}
              {isOwnProfile && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <FriendButton />
                </div>
              )}
            </div>
          </div>

          {/* Travel stats */}
          {((p.visitedCount ?? 0) > 0 || (p.wantToVisitCount ?? 0) > 0) && (
            <div className="rounded-2xl border border-border bg-card p-4">
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

          {/* Stats summary */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stats</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold">{p.visitedCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Visited</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{p.wantToVisitCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Wishlist</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{photos.length}</p>
                <p className="text-xs text-muted-foreground">Photos</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{testimonials.length}</p>
                <p className="text-xs text-muted-foreground">Testimonials</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 min-w-0">

          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border mb-5">
            {([
              { key: "photos" as Tab, label: "Photos", icon: ImageIcon, count: photos.length },
              { key: "groups" as Tab, label: "Shared Groups", icon: Users, count: sharedGroups.length },
              { key: "testimonials" as Tab, label: "Testimonials", icon: Star, count: testimonials.length },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.count > 0 && (
                  <Badge variant={tab === t.key ? "default" : "secondary"} className="text-xs px-1.5 py-0 h-5">
                    {t.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Photos tab */}
          {tab === "photos" && (
            <div>
              {photosLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : photos.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Camera className="w-10 h-10 text-muted-foreground opacity-40" />
                  <p className="font-semibold">No photos yet</p>
                  <p className="text-sm text-muted-foreground">
                    {isOwnProfile ? "Share your travel moments." : `${p.firstName ?? "This traveler"} hasn't shared any photos yet.`}
                  </p>
                </div>
              ) : (
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-2 space-y-2">
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
          )}

          {/* Groups tab */}
          {tab === "groups" && (
            <div>
              {!isAuthenticated ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Users className="w-10 h-10 text-muted-foreground opacity-40" />
                  <p className="font-semibold">Sign in to see shared groups</p>
                </div>
              ) : sharedGroups.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Users className="w-10 h-10 text-muted-foreground opacity-40" />
                  <p className="font-semibold">No shared groups</p>
                  <p className="text-sm text-muted-foreground">
                    You and {p.firstName ?? "this traveler"} aren't in any groups together.
                  </p>
                  <Link href="/groups">
                    <Button size="sm" variant="outline"><Users className="w-3.5 h-3.5 mr-1.5" />Browse Groups</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedGroups.map(g => (
                    <Link key={g.id} href={`/groups/${g.id}`}>
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors cursor-pointer">
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
                        <Badge variant="secondary" className="text-xs shrink-0">Open Chat</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Testimonials tab */}
          {tab === "testimonials" && (
            <div>
              {testimonialsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : testimonials.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Star className="w-10 h-10 text-muted-foreground opacity-40" />
                  <p className="font-semibold">No testimonials yet</p>
                  <p className="text-sm text-muted-foreground">
                    {isOwnProfile
                      ? "Friends can leave you testimonials on your profile."
                      : `${p.firstName ?? "This traveler"} hasn't received any testimonials yet.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testimonials.map((t) => {
                    const authorName = [t.authorFirstName, t.authorLastName].filter(Boolean).join(" ") || "Traveler";
                    return (
                      <div key={t.id} className="bg-card border border-border rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          {t.authorImageUrl ? (
                            <img src={t.authorImageUrl} alt={authorName} className="w-9 h-9 rounded-full object-cover" />
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
          )}
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

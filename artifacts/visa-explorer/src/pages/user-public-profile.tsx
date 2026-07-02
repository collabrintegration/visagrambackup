import { useParams, Link } from "wouter";
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
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  User, MapPin, Globe, Loader2, Camera, Users, UserPlus,
  Check, MessageCircle, ChevronLeft, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

function Avatar({ url, name, size = 96 }: { url?: string | null; name: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover ring-4 ring-border" />;
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-primary/80 to-pink-500/80 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-border"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function UserPublicProfilePage() {
  const { id: userId } = useParams<{ id: string }>();
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

  const { data: allGroups = [] } = useListGroups({});
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
        <Link href="/friends"><Button variant="outline" className="mt-4">Go back</Button></Link>
      </div>
    );
  }

  const p = profile;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Traveler";
  const isOwnProfile = myId === p.id;
  const status = p.friendshipStatus;

  function FriendButton() {
    if (isOwnProfile) return null;
    if (!isAuthenticated) return (
      <Link href="/sign-in">
        <Button size="sm" variant="outline"><UserPlus className="w-3.5 h-3.5 mr-1.5" />Add Friend</Button>
      </Link>
    );
    if (status === "accepted") return (
      <Badge variant="secondary" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
        <Check className="w-3 h-3 mr-1" />Friends
      </Badge>
    );
    if (status === "pending" && p.iRequested) return (
      <Badge variant="secondary" className="text-muted-foreground">Request sent</Badge>
    );
    if (status === "pending" && !p.iRequested) return (
      <Button size="sm" onClick={() => acceptRequest.mutate({ requesterId: p.id })} disabled={acceptRequest.isPending}>
        {acceptRequest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
        Accept Request
      </Button>
    );
    return (
      <Button size="sm" variant="outline" onClick={() => sendRequest.mutate({ userId: p.id })} disabled={sendRequest.isPending}>
        {sendRequest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
        Add Friend
      </Button>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Back */}
      <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <Avatar url={profile.profileImageUrl} name={fullName} size={88} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 justify-between">
              <div>
                <h1 className="text-xl font-bold leading-tight">{fullName}</h1>
                {profile.username && <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <FriendButton />
                {!isOwnProfile && isAuthenticated && status === "accepted" && (
                  <Link href={`/messages/${profile.id}`}>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />Message
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />{profile.location}
                </span>
              )}
              {profile.homeCountry && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 shrink-0" />From {profile.homeCountry}
                </span>
              )}
              {profile.age && <span>{profile.age} yrs</span>}
              {profile.sex && <span>{profile.sex}</span>}
            </div>

            {profile.bio && <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>}

            {/* Stats */}
            <div className="flex gap-5 mt-4 pt-4 border-t border-border/60 text-center">
              <div>
                <p className="font-semibold text-sm">{profile.visitedCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Visited</p>
              </div>
              <div>
                <p className="font-semibold text-sm">{profile.wantToVisitCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Want to Visit</p>
              </div>
              <div>
                <p className="font-semibold text-sm">{photos.length}</p>
                <p className="text-xs text-muted-foreground">Photos</p>
              </div>
              <div>
                <p className="font-semibold text-sm">{testimonials.length}</p>
                <p className="text-xs text-muted-foreground">Testimonials</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Camera className="w-4 h-4 text-primary" />
          Photos
          {photos.length > 0 && <span className="text-xs font-normal text-muted-foreground">({photos.length})</span>}
        </h2>
        {photosLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : photos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No photos yet.</p>
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

      {/* Shared Groups */}
      {sharedGroups.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            Groups you share
          </h2>
          <div className="space-y-2">
            {sharedGroups.map(g => (
              <Link key={g.id} href={`/groups/${g.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                    {g.emoji ?? "🌍"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{g.name}</p>
                    {g.memberCount != null && (
                      <p className="text-xs text-muted-foreground">{g.memberCount} members</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-primary" />
          Testimonials
          {testimonials.length > 0 && <span className="text-xs font-normal text-muted-foreground">({testimonials.length})</span>}
        </h2>
        {testimonialsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : testimonials.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No testimonials yet.</p>
        ) : (
          <div className="space-y-3">
            {testimonials.map((t) => {
              const authorName = [t.authorFirstName, t.authorLastName].filter(Boolean).join(" ") || "Traveler";
              return (
                <div key={t.id} className="bg-muted/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {t.authorImageUrl ? (
                      <img src={t.authorImageUrl} alt={authorName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <Link href={`/user/${t.authorId}`}>
                      <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">{authorName}</span>
                    </Link>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(t.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{t.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxPhoto(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
              ✕
            </button>
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

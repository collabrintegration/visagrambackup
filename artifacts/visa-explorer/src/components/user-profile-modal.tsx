import { useGetPublicUserProfile, getGetPublicUserProfileQueryKey, useSendFriendRequest, useAcceptFriendRequest, getSearchUsersQueryKey, getListFriendRequestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, MapPin, Globe, CheckCircle2, Heart, UserPlus, UserCheck, Clock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function Avatar({ url, name, size = "lg" }: { url?: string | null; name: string; size?: "lg" | "xl" }) {
  const dim = size === "xl" ? "w-20 h-20 text-2xl" : "w-14 h-14 text-lg";
  if (url) {
    return <img src={url} alt={name} className={`${dim} rounded-full object-cover ring-2 ring-border`} />;
  }
  const initials = name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`${dim} rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary ring-2 ring-border`}>
      {initials || "?"}
    </div>
  );
}

interface Props {
  userId: string;
  onClose: () => void;
  onInvalidate?: () => void;
}

export default function UserProfileModal({ userId, onClose, onInvalidate }: Props) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useGetPublicUserProfile(userId, {
    query: { queryKey: getGetPublicUserProfileQueryKey(userId) },
  });

  const sendRequest = useSendFriendRequest({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId) });
        void queryClient.invalidateQueries({ queryKey: getSearchUsersQueryKey() });
        onInvalidate?.();
      },
    },
  });

  const acceptRequest = useAcceptFriendRequest({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId) });
        void queryClient.invalidateQueries({ queryKey: getListFriendRequestsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getSearchUsersQueryKey() });
        onInvalidate?.();
      },
    },
  });

  const name = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Traveler"
    : "…";

  const isFriend = profile?.friendshipStatus === "accepted";
  const isPending = profile?.friendshipStatus === "pending";
  const iRequested = profile?.iRequested === true;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-muted-foreground">Traveler Profile</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading || !profile ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <Avatar url={profile.profileImageUrl} name={name} size="xl" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg leading-tight">{name}</p>
                {profile.username && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {profile.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{profile.location}
                    </span>
                  )}
                  {!profile.location && profile.homeCountry && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3" />{profile.homeCountry}
                    </span>
                  )}
                  {profile.age && (
                    <span className="text-xs text-muted-foreground">Age {profile.age}</span>
                  )}
                  {profile.sex && (
                    <span className="text-xs text-muted-foreground">{profile.sex}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            )}

            {/* Travel stats */}
            {((profile.visitedCount ?? 0) > 0 || (profile.wantToVisitCount ?? 0) > 0) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Visited</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{profile.visitedCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">countries</p>
                </div>
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <Heart className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-primary font-medium">Wishlist</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{profile.wantToVisitCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">countries</p>
                </div>
              </div>
            )}

            {/* Friend action */}
            <div>
              {isFriend ? (
                <Button variant="outline" className="w-full" disabled>
                  <UserCheck className="w-4 h-4 mr-2 text-emerald-500" />
                  Already Friends
                </Button>
              ) : isPending && iRequested ? (
                <Button variant="outline" className="w-full" disabled>
                  <Clock className="w-4 h-4 mr-2" />
                  Request Sent
                </Button>
              ) : isPending && !iRequested ? (
                <Button
                  className="w-full"
                  onClick={() => acceptRequest.mutate({ requesterId: userId })}
                  disabled={acceptRequest.isPending}
                >
                  {acceptRequest.isPending
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <Check className="w-4 h-4 mr-2" />}
                  Accept Friend Request
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => sendRequest.mutate({ userId })}
                  disabled={sendRequest.isPending}
                >
                  {sendRequest.isPending
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <UserPlus className="w-4 h-4 mr-2" />}
                  Add Friend
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

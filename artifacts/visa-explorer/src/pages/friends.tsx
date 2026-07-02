import { Helmet } from "react-helmet-async";
import { useState, useCallback } from "react";
import {
  useListFriends,
  useListFriendRequests,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useRemoveFriend,
  getListFriendsQueryKey,
  getListFriendRequestsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserPlus, UserCheck, UserMinus, Search, Users, Inbox,
  Clock, MapPin, LogIn, X, Check, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function Avatar({ url, name, size = "md" }: { url?: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const sizeClass = size === "lg" ? "w-14 h-14 text-lg" : size === "sm" ? "w-8 h-8 text-xs" : "w-11 h-11 text-sm";
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white font-bold shrink-0`}>
      {initials || "?"}
    </div>
  );
}

type ActiveTab = "friends" | "requests" | "search";

export default function FriendsPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("friends");
  const [searchRaw, setSearchRaw] = useState("");
  const searchQuery = useDebounce(searchRaw, 300);

  const { data: friends = [], isLoading: loadingFriends } = useListFriends({
    query: { enabled: isAuthenticated },
  });
  const { data: requests = [], isLoading: loadingRequests } = useListFriendRequests({
    query: { enabled: isAuthenticated },
  });
  const { data: searchResults = [], isLoading: loadingSearch } = useSearchUsers(
    { q: searchQuery },
    { query: { enabled: isAuthenticated && searchQuery.trim().length >= 2 } },
  );

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();
  const removeFriend = useRemoveFriend();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListFriendRequestsQueryKey() });
  }, [queryClient]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Sign in to see friends</h2>
          <p className="text-muted-foreground max-w-sm">
            Connect with fellow travelers, share visa tips, and build your travel community.
          </p>
        </div>
        <Button onClick={() => navigate("/sign-in")}>
          <LogIn className="w-4 h-4 mr-2" />
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Friends — Visagram</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Friends</h1>
          <p className="text-muted-foreground">Connect with travelers from around the world</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {([
            { key: "friends", label: "Friends", icon: Users, count: friends.length },
            { key: "requests", label: "Requests", icon: Inbox, count: requests.length },
            { key: "search", label: "Find People", icon: Search, count: null },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <Badge variant={activeTab === tab.key ? "default" : "secondary"} className="text-xs px-1.5 py-0 h-5">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* ── Friends list ── */}
        {activeTab === "friends" && (
          <div className="space-y-2">
            {loadingFriends ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : friends.length === 0 ? (
              <EmptyState
                icon={<Users className="w-10 h-10 text-muted-foreground" />}
                title="No friends yet"
                description="Search for travelers and send them a friend request to get started."
                action={<Button size="sm" onClick={() => setActiveTab("search")}><Search className="w-4 h-4 mr-1.5" />Find People</Button>}
              />
            ) : (
              friends.map((f) => {
                const name = [f.firstName, f.lastName].filter(Boolean).join(" ") || "Traveler";
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <Avatar url={f.profileImageUrl} name={name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      {f.homeCountry && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {f.homeCountry}
                        </p>
                      )}
                      {f.friendshipSince && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Friends {timeAgo(f.friendshipSince)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        <Link href={`/messages/${f.id}`}>Message</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                        onClick={() => removeFriend.mutate({ userId: f.id }, { onSuccess: invalidate })}
                        disabled={removeFriend.isPending}
                      >
                        <UserMinus className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Friend requests ── */}
        {activeTab === "requests" && (
          <div className="space-y-2">
            {loadingRequests ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={<Inbox className="w-10 h-10 text-muted-foreground" />}
                title="No pending requests"
                description="When someone sends you a friend request, it will appear here."
              />
            ) : (
              requests.map((r) => {
                const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "Traveler";
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                  >
                    <Avatar url={r.profileImageUrl} name={name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      {r.homeCountry && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {r.homeCountry}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sent a friend request {r.createdAt ? timeAgo(r.createdAt) : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => acceptRequest.mutate({ requesterId: r.id }, { onSuccess: invalidate })}
                        disabled={acceptRequest.isPending}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => declineRequest.mutate({ requesterId: r.id }, { onSuccess: invalidate })}
                        disabled={declineRequest.isPending}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Search ── */}
        {activeTab === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-9"
                autoFocus
              />
              {searchRaw && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setSearchRaw("")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {searchQuery.trim().length < 2 ? (
              <EmptyState
                icon={<Search className="w-10 h-10 text-muted-foreground" />}
                title="Find fellow travelers"
                description="Type at least 2 characters to search by name or email."
              />
            ) : loadingSearch ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length === 0 ? (
              <EmptyState
                icon={<Users className="w-10 h-10 text-muted-foreground" />}
                title="No results found"
                description={`No users found matching "${searchQuery}". Try a different name.`}
              />
            ) : (
              <div className="space-y-2">
                {searchResults.map((u) => {
                  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "Traveler";
                  const status = u.friendshipStatus;
                  const iRequested = u.iRequested;

                  let actionBtn: React.ReactNode;
                  if (status === "accepted") {
                    actionBtn = (
                      <Button variant="outline" size="sm" className="text-xs" disabled>
                        <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                        Friends
                      </Button>
                    );
                  } else if (status === "pending" && iRequested) {
                    actionBtn = (
                      <Button variant="outline" size="sm" className="text-xs" disabled>
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Requested
                      </Button>
                    );
                  } else if (status === "pending" && !iRequested) {
                    actionBtn = (
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => sendRequest.mutate({ userId: u.id }, {
                          onSuccess: () => {
                            invalidate();
                            queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
                          },
                        })}
                        disabled={sendRequest.isPending}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Accept
                      </Button>
                    );
                  } else {
                    actionBtn = (
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => sendRequest.mutate({ userId: u.id }, { onSuccess: invalidate })}
                        disabled={sendRequest.isPending}
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        Add Friend
                      </Button>
                    );
                  }

                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
                    >
                      <Avatar url={u.profileImageUrl} name={name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{name}</p>
                        {u.homeCountry && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {u.homeCountry}
                          </p>
                        )}
                      </div>
                      {actionBtn}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="opacity-50">{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      </div>
      {action}
    </div>
  );
}

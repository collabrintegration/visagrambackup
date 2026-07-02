import { useState } from "react";
import { Link } from "wouter";
import {
  useListGroups,
  useCreateGroup,
  useJoinGroup,
  useLeaveGroup,
  getListGroupsQueryKey,
} from "@workspace/api-client-react";
import type { Group } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users, Plus, X, Loader2, LogIn, Lock, Globe, MessageSquare,
  UserCheck, UserPlus, Crown, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function userName(g: Group["lastMessage"]): string {
  if (!g) return "";
  const name = [g.firstName, g.lastName].filter(Boolean).join(" ");
  return name || "Traveler";
}

const EMOJI_OPTIONS = ["🌍","✈️","🗺️","🏖️","🏔️","🌏","🌐","🚀","🎒","🧳","🌴","🏕️","🚂","⛵","🛸","🏛️","🌺","🍜","🎉","🤝"];

export default function Groups() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🌍");
  const [isPrivate, setIsPrivate] = useState(false);
  const [search, setSearch] = useState("");

  const { data: groups = [], isLoading } = useListGroups({
    query: { queryKey: getListGroupsQueryKey(), refetchInterval: 30000 },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });

  const { mutate: createGroup, isPending: isCreating } = useCreateGroup({
    mutation: {
      onSuccess: () => {
        invalidate();
        setShowCreate(false);
        setName("");
        setDescription("");
        setEmoji("🌍");
        setIsPrivate(false);
      },
    },
  });

  const { mutate: joinGroup } = useJoinGroup({ mutation: { onSuccess: invalidate } });
  const { mutate: leaveGroup } = useLeaveGroup({ mutation: { onSuccess: invalidate } });

  const filtered = groups.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || (g.description ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border/60 bg-card/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" /> GROUPS
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Travel Groups</h1>
              <p className="text-muted-foreground max-w-xl">
                Join communities of travelers, share experiences, and chat in real time.
              </p>
            </div>
            {!authLoading && (
              isAuthenticated ? (
                <Button onClick={() => setShowCreate(true)} className="shrink-0">
                  <Plus className="w-4 h-4 mr-2" /> Create Group
                </Button>
              ) : (
                <Button onClick={login} variant="outline" className="shrink-0">
                  <LogIn className="w-4 h-4 mr-2" /> Sign in to join groups
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Groups grid */}
      <div className="container mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {search ? `No groups matching "${search}"` : "No groups yet — be the first to create one!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isAuthenticated={isAuthenticated}
                onJoin={() => joinGroup({ id: group.id })}
                onLeave={() => leaveGroup({ id: group.id })}
                onLogin={login}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-lg">Create a Group</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block font-medium">Pick an emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        emoji === e ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Group name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Southeast Asia Backpackers"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  maxLength={80}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this group about?"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  maxLength={300}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-10 h-5 rounded-full transition-colors ${isPrivate ? "bg-primary" : "bg-muted"} relative`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPrivate ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm font-medium">Private group</span>
                <span className="text-xs text-muted-foreground">(visible but invite-only)</span>
              </label>

              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1"
                  disabled={isCreating || !name.trim()}
                  onClick={() => createGroup({ data: { name, description: description || undefined, emoji, isPrivate } })}
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  Create Group
                </Button>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupCard({
  group,
  isAuthenticated,
  onJoin,
  onLeave,
  onLogin,
}: {
  group: Group;
  isAuthenticated: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{group.emoji}</span>
          <div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-1">{group.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {group.isPrivate ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <Lock className="w-2.5 h-2.5 mr-1" />Private
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <Globe className="w-2.5 h-2.5 mr-1" />Public
                </Badge>
              )}
              {group.isAdmin && (
                <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-400 border-amber-500/20">
                  <Crown className="w-2.5 h-2.5 mr-1" />Admin
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Users className="w-3.5 h-3.5" />
          {group.memberCount}
        </div>
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
      )}

      {/* Last message preview */}
      {group.lastMessage && (
        <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{userName(group.lastMessage)}:</span>{" "}
          <span className="line-clamp-1">{group.lastMessage.content}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        {group.isMember ? (
          <>
            <Link href={`/groups/${group.id}`} className="flex-1">
              <Button className="w-full h-8 text-xs" size="sm">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Open Chat
              </Button>
            </Link>
            {!group.isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={onLeave}
              >
                Leave
              </Button>
            )}
          </>
        ) : (
          <Button
            className="flex-1 h-8 text-xs"
            size="sm"
            variant="outline"
            onClick={isAuthenticated ? onJoin : onLogin}
          >
            {isAuthenticated ? (
              <><UserPlus className="w-3.5 h-3.5 mr-1.5" /> Join</>
            ) : (
              <><LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign in to join</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

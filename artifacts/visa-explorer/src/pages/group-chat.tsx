import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "wouter";
import {
  useGetGroup,
  useListGroupMessages,
  useCreateGroupMessage,
  useDeleteGroupMessage,
  useListGroupMembers,
  useJoinGroup,
  useLeaveGroup,
  useUpdateGroup,
  useDeleteGroup,
  useRemoveGroupMember,
  useSetGroupMemberRole,
  getGetGroupQueryKey,
  getListGroupMessagesQueryKey,
  getListGroupMembersQueryKey,
  getListGroupsQueryKey,
} from "@workspace/api-client-react";
import type { GroupMessage, GroupMember } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Send, Loader2, Users, Crown, Trash2, UserMinus, Settings,
  X, Lock, Globe, LogIn, UserPlus, Shield, ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GifPicker, GifPreview } from "@/components/gif-picker";

function timeStr(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function displayName(m: { firstName?: string | null; lastName?: string | null }): string {
  return [m.firstName, m.lastName].filter(Boolean).join(" ") || "Traveler";
}

function initials(m: { firstName?: string | null; lastName?: string | null }): string {
  const n = displayName(m);
  return n.slice(0, 2).toUpperCase();
}

export default function GroupChat() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);

  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const queryClient = useQueryClient();
  const userId = (user as { id?: string })?.id ?? "";

  const [message, setMessage] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editEmoji, setEditEmoji] = useState("🌍");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const groupKey = getGetGroupQueryKey(groupId);
  const messagesKey = getListGroupMessagesQueryKey(groupId);
  const membersKey = getListGroupMembersQueryKey(groupId);

  const { data: group, isLoading: groupLoading } = useGetGroup(groupId, {
    query: { queryKey: groupKey, refetchInterval: 10000 },
  });

  const { data: messages = [], isLoading: messagesLoading } = useListGroupMessages(groupId, {}, {
    query: {
      queryKey: messagesKey,
      enabled: !!group?.isMember,
      refetchInterval: 3000,
    },
  });

  const { data: members = [] } = useListGroupMembers(groupId, {
    query: { queryKey: membersKey, enabled: !!group?.isMember },
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: groupKey });
    void queryClient.invalidateQueries({ queryKey: messagesKey });
    void queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
  };

  const { mutate: joinGroup, isPending: isJoining } = useJoinGroup({
    mutation: { onSuccess: invalidateAll },
  });

  const { mutate: leaveGroup } = useLeaveGroup({
    mutation: { onSuccess: () => { invalidateAll(); } },
  });

  const { mutate: sendMessage, isPending: isSending } = useCreateGroupMessage({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: messagesKey });
        setMessage("");
        setGifUrl("");
        setShowGifPicker(false);
        inputRef.current?.focus();
      },
    },
  });

  const { mutate: deleteMessage } = useDeleteGroupMessage({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: messagesKey }) },
  });

  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroup({
    mutation: {
      onSuccess: (updated) => {
        void queryClient.invalidateQueries({ queryKey: groupKey });
        void queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        setShowSettings(false);
      },
    },
  });

  const [useLocation] = [() => ["", (p: string) => { window.location.href = p; }]];

  const { mutate: deleteGroup } = useDeleteGroup({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        window.location.href = "/groups";
      },
    },
  });

  const { mutate: removeMember } = useRemoveGroupMember({
    mutation: { onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersKey });
      void queryClient.invalidateQueries({ queryKey: groupKey });
    }},
  });

  const { mutate: setMemberRole } = useSetGroupMemberRole({
    mutation: { onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersKey });
      void queryClient.invalidateQueries({ queryKey: groupKey });
    }},
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (group && showSettings) {
      setEditName(group.name);
      setEditDesc(group.description ?? "");
      setEditEmoji(group.emoji);
    }
  }, [showSettings, group]);

  const handleSend = () => {
    if ((!message.trim() && !gifUrl) || isSending) return;
    sendMessage({ id: groupId, data: { content: message.trim() || undefined, gifUrl: gifUrl || undefined } });
  };

  if (groupLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Group not found</p>
        <Link href="/groups">
          <Button variant="outline">Back to Groups</Button>
        </Link>
      </div>
    );
  }

  const isAdmin = group.isAdmin;
  const isPrimaryAdmin = group.isPrimaryAdmin;
  const isMember = group.isMember;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur px-4 py-3 flex items-center gap-3">
        <Link href="/groups">
          <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>

        <span className="text-2xl">{group.emoji}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm truncate">{group.name}</h1>
            {group.isPrivate ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                <Lock className="w-2.5 h-2.5 mr-1" />Private
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                <Globe className="w-2.5 h-2.5 mr-1" />Public
              </Badge>
            )}
            {isAdmin && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-400 border-amber-500/20 shrink-0">
                <Crown className="w-2.5 h-2.5 mr-1" />Admin
              </Badge>
            )}
          </div>
          {group.description && (
            <p className="text-xs text-muted-foreground truncate">{group.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Members toggle (mobile only) */}
          <button
            onClick={() => setShowMembers((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted transition-colors md:hidden"
          >
            <Users className="w-4 h-4" />
            {group.memberCount}
          </button>
          {/* Member count badge (desktop — sidebar always visible) */}
          <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1.5">
            <Users className="w-4 h-4" />
            {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
          </span>

          {isAdmin && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body: chat + persistent members sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Chat area ── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Not a member gate */}
          {!isMember ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="text-5xl">{group.emoji}</div>
              <h2 className="text-xl font-semibold">{group.name}</h2>
              {group.description && <p className="text-muted-foreground max-w-sm">{group.description}</p>}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" /> {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
              </div>
              {isAuthenticated ? (
                <Button onClick={() => joinGroup({ id: groupId })} disabled={isJoining}>
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Join Group to Chat
                </Button>
              ) : (
                <Button onClick={login}>
                  <LogIn className="w-4 h-4 mr-2" /> Sign in to join
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No messages yet — say hello! 👋
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={msg.userId === userId}
                      isAdmin={isAdmin}
                      onDelete={() => deleteMessage({ id: groupId, messageId: msg.id })}
                      showAvatar={idx === 0 || messages[idx - 1].userId !== msg.userId}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border/60 bg-card/50 px-3 py-3 space-y-2">
                {gifUrl && (
                  <div className="flex items-start gap-2 pl-1">
                    <GifPreview url={gifUrl} />
                    <button
                      onClick={() => setGifUrl("")}
                      className="mt-1 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {showGifPicker && (
                  <div className="px-1">
                    <GifPicker value={gifUrl} onChange={(url) => { setGifUrl(url); setShowGifPicker(false); }} />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGifPicker((v) => !v)}
                    title="Add GIF"
                    className={`p-2 rounded-lg transition-colors shrink-0 ${showGifPicker ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message…"
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={(!message.trim() && !gifUrl) || isSending}
                    className="h-9 w-9 p-0 shrink-0"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Persistent members sidebar (desktop) ── */}
        {isMember && (
          <div className="hidden md:flex w-60 flex-col border-l border-border bg-card/30">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Members · {group.memberCount}
              </h3>
            </div>
            <div className="overflow-y-auto flex-1 py-2 space-y-0.5 px-2">
              {members.map((m) => (
                <MemberRow
                  key={m.userId}
                  member={m}
                  isPrimaryAdmin={isPrimaryAdmin}
                  isSelf={m.userId === userId}
                  onRemove={() => removeMember({ id: groupId, userId: m.userId })}
                  onPromote={() => setMemberRole({ id: groupId, userId: m.userId, data: { role: "admin" } })}
                  onDemote={() => setMemberRole({ id: groupId, userId: m.userId, data: { role: "member" } })}
                />
              ))}
            </div>
            {!isPrimaryAdmin && isMember && (
              <div className="p-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => leaveGroup({ id: groupId })}
                >
                  Leave Group
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Members slide-over (mobile only) ── */}
        {showMembers && isMember && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-end md:hidden"
            onClick={(e) => { if (e.target === e.currentTarget) setShowMembers(false); }}
          >
            <div className="w-full max-w-xs h-full bg-card border-l border-border flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Members · {group.memberCount}
                </h3>
                <button onClick={() => setShowMembers(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 py-2 space-y-0.5 px-2">
                {members.map((m) => (
                  <MemberRow
                    key={m.userId}
                    member={m}
                    isPrimaryAdmin={isPrimaryAdmin}
                    isSelf={m.userId === userId}
                    onRemove={() => removeMember({ id: groupId, userId: m.userId })}
                    onPromote={() => setMemberRole({ id: groupId, userId: m.userId, data: { role: "admin" } })}
                    onDemote={() => setMemberRole({ id: groupId, userId: m.userId, data: { role: "member" } })}
                  />
                ))}
              </div>
              {!isPrimaryAdmin && isMember && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => { leaveGroup({ id: groupId }); setShowMembers(false); }}
                  >
                    Leave Group
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings panel (admin only) */}
      {showSettings && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">Group Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Group name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  maxLength={300}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Emoji</label>
                <input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  className="w-20 bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                  maxLength={4}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  disabled={isUpdating || !editName.trim()}
                  onClick={() => updateGroup({ id: groupId, data: { name: editName, description: editDesc || undefined, emoji: editEmoji } })}
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Save Changes
                </Button>
                <Button variant="ghost" onClick={() => setShowSettings(false)}>Cancel</Button>
              </div>
              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm(`Delete "${group.name}"? This cannot be undone.`)) {
                      deleteGroup({ id: groupId });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Group
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  msg, isOwn, isAdmin, onDelete, showAvatar,
}: {
  msg: GroupMessage;
  isOwn: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  showAvatar: boolean;
}) {
  const [hover, setHover] = useState(false);
  const canDelete = isOwn || isAdmin;

  return (
    <div
      className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Avatar */}
      <div className="shrink-0 w-8">
        {showAvatar && (
          msg.profileImageUrl ? (
            <img src={msg.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center">
              {initials(msg)}
            </div>
          )
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {showAvatar && (
          <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
            <span className="text-xs font-medium">{displayName(msg)}</span>
            <span className="text-[10px] text-muted-foreground">{timeStr(msg.createdAt)}</span>
          </div>
        )}
        <div className={`flex items-end gap-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
          <div
            className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card border border-border rounded-tl-sm"
            }`}
          >
            {msg.content && <span>{msg.content}</span>}
            {msg.gifUrl && <GifPreview url={msg.gifUrl} />}
          </div>
          {canDelete && hover && (
            <button
              onClick={onDelete}
              className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {!showAvatar && (
          <span className="text-[10px] text-muted-foreground mt-0.5">{timeStr(msg.createdAt)}</span>
        )}
      </div>
    </div>
  );
}

function MemberRow({
  member, isPrimaryAdmin, isSelf, onRemove, onPromote, onDemote,
}: {
  member: GroupMember;
  isPrimaryAdmin: boolean;
  isSelf: boolean;
  onRemove: () => void;
  onPromote: () => void;
  onDemote: () => void;
}) {
  const isCoAdmin = member.role === "admin" && !member.isPrimary;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
        {initials(member)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName(member)}{isSelf ? " (you)" : ""}</p>
        {member.isPrimary ? (
          <p className="text-[10px] text-amber-400 flex items-center gap-1">
            <Crown className="w-2.5 h-2.5" /> Owner
          </p>
        ) : isCoAdmin ? (
          <p className="text-[10px] text-violet-400 flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" /> Admin
          </p>
        ) : null}
      </div>
      {isPrimaryAdmin && !isSelf && !member.isPrimary && (
        <div className="flex items-center gap-0.5">
          {isCoAdmin ? (
            <button
              onClick={onDemote}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
              title="Demote to member"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onPromote}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-400 hover:bg-violet-400/10 transition-colors"
              title="Promote to admin"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Remove member"
          >
            <UserMinus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

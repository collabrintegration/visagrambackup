import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useGetDmInbox,
  useGetDmRequests,
  useGetDmThread,
  useSendDm,
  useAcceptDmRequest,
  useBlockDmUser,
  useUnblockDmUser,
  useReportDmSpam,
  useMarkDmRead,
  getGetDmInboxQueryKey,
  getGetDmRequestsQueryKey,
  getGetDmThreadQueryKey,
  getGetDmUnreadCountQueryKey,
} from "@workspace/api-client-react";
import type { DmConversation, DmMessage } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare, Send, Loader2, ArrowLeft, Check, CheckCheck,
  ShieldX, Flag, X, ImageIcon, Search, Inbox, MailQuestion,
  UserX, MoreHorizontal, Lock, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GifPicker, GifPreview } from "@/components/gif-picker";
import MentionDropdown from "@/components/mention-dropdown";
import MentionText from "@/components/mention-text";
import { useMentionAutocomplete } from "@/hooks/use-mention-autocomplete";

function timeAgo(dt: string | null | undefined): string {
  if (!dt) return "";
  const d = new Date(dt);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(firstName?: string | null, lastName?: string | null) {
  return [(firstName ?? "")[0], (lastName ?? "")[0]].filter(Boolean).join("").toUpperCase() || "?";
}

function displayName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || "Traveler";
}

function Avatar({ img, firstName, lastName, size = "md" }: {
  img?: string | null; firstName?: string | null; lastName?: string | null; size?: "sm" | "md" | "lg";
}) {
  const sz = size === "sm" ? "w-8 h-8 text-[10px]" : size === "lg" ? "w-12 h-12 text-sm" : "w-10 h-10 text-xs";
  if (img) return <img src={img} alt="" className={`${sz} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0`}>
      {initials(firstName, lastName)}
    </div>
  );
}

function ConvItem({
  conv, selected, myId, onClick,
}: { conv: DmConversation; selected: boolean; myId: string; onClick: () => void }) {
  const isRequest = conv.status === "request";
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${selected ? "bg-muted/60 border-r-2 border-primary" : ""}`}
    >
      <div className="relative shrink-0">
        <Avatar img={conv.otherUserProfileImageUrl} firstName={conv.otherUserFirstName} lastName={conv.otherUserLastName} size="md" />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm font-medium truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}>
            {displayName(conv.otherUserFirstName, conv.otherUserLastName)}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(conv.lastMessageAt?.toString())}</span>
        </div>
        <div className="flex items-center gap-1">
          <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? "text-foreground/70" : "text-muted-foreground"}`}>
            {conv.lastMessage ?? (isRequest ? "Sent you a message" : "No messages yet")}
          </p>
          {isRequest && <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-400 shrink-0">New</Badge>}
        </div>
      </div>
    </button>
  );
}

function ThreadPanel({
  conv, myId, onBack,
}: { conv: DmConversation; myId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const otherId = conv.otherUserId;
  const bottomRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [showGif, setShowGif] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const inboxKey = getGetDmInboxQueryKey();
  const requestsKey = getGetDmRequestsQueryKey();
  const threadKey = getGetDmThreadQueryKey(otherId);
  const unreadKey = getGetDmUnreadCountQueryKey();

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: inboxKey });
    void qc.invalidateQueries({ queryKey: requestsKey });
    void qc.invalidateQueries({ queryKey: unreadKey });
  };

  const { data: msgs = [], isLoading } = useGetDmThread(otherId, {
    query: { queryKey: threadKey, refetchInterval: 3000 },
  });

  const { mutate: send, isPending: isSending } = useSendDm({
    mutation: {
      onSuccess: () => {
        setText(""); setGifUrl(""); setShowGif(false);
        void qc.invalidateQueries({ queryKey: threadKey });
        invalidateAll();
      },
    },
  });

  const { mutate: accept, isPending: isAccepting } = useAcceptDmRequest({
    mutation: { onSuccess: invalidateAll },
  });

  const { mutate: block } = useBlockDmUser({
    mutation: { onSuccess: invalidateAll },
  });

  const { mutate: unblock } = useUnblockDmUser({
    mutation: { onSuccess: invalidateAll },
  });

  const { mutate: spam } = useReportDmSpam({
    mutation: { onSuccess: invalidateAll },
  });

  const { mutate: markRead } = useMarkDmRead({
    mutation: { onSuccess: () => void qc.invalidateQueries({ queryKey: unreadKey }) },
  });

  useEffect(() => {
    if (msgs.length > 0 && conv.unreadCount > 0) {
      markRead({ userId: otherId });
    }
  }, [msgs.length, otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const handleSend = () => {
    if ((!text.trim() && !gifUrl) || isSending) return;
    send({ userId: otherId, data: { content: text.trim() || undefined, gifUrl: gifUrl || undefined } });
  };

  const isRequest = conv.status === "request" && conv.requestedBy === otherId;
  const isBlocked = conv.status === "blocked";
  const isSpam = conv.status === "spam";
  const iBlockedThem = (isBlocked || isSpam) && conv.blockedBy === myId;
  const theyBlockedMe = (isBlocked || isSpam) && conv.blockedBy !== myId;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card/30">
        <button onClick={onBack} className="md:hidden text-muted-foreground hover:text-foreground p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Link href={`/user/${otherId}`}>
          <Avatar img={conv.otherUserProfileImageUrl} firstName={conv.otherUserFirstName} lastName={conv.otherUserLastName} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/user/${otherId}`} className="hover:text-primary transition-colors">
            <p className="text-sm font-semibold truncate">{displayName(conv.otherUserFirstName, conv.otherUserLastName)}</p>
          </Link>
          {isRequest && <p className="text-xs text-amber-400">Message request · <Link href={`/user/${otherId}`} className="underline underline-offset-2 hover:text-amber-300">View profile</Link></p>}
          {iBlockedThem && <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> Blocked</p>}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl w-44 py-1 overflow-hidden">
              {iBlockedThem ? (
                <button
                  onClick={() => { unblock({ userId: otherId }); setShowMenu(false); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
                >
                  <UserX className="w-3.5 h-3.5" /> Unblock
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { if (confirm("Block this user?")) { block({ userId: otherId }); setShowMenu(false); } }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-destructive"
                  >
                    <ShieldX className="w-3.5 h-3.5" /> Block
                  </button>
                  <button
                    onClick={() => { if (confirm("Report as spam and block?")) { spam({ userId: otherId }); setShowMenu(false); } }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-destructive"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report spam
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request accept bar */}
      {isRequest && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-200">
            <span className="font-semibold">{displayName(conv.otherUserFirstName, conv.otherUserLastName)}</span> sent you a message request.
          </p>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" disabled={isAccepting} onClick={() => accept({ userId: otherId })}>
              {isAccepting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
              Accept
            </Button>
            <button
              onClick={() => { if (confirm("Block this user?")) block({ userId: otherId }); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              Block
            </button>
            <button
              onClick={() => { if (confirm("Report as spam?")) spam({ userId: otherId }); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Spam
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <MessageSquare className="w-10 h-10 text-muted mb-3" />
            <p className="text-sm text-muted-foreground">
              {isRequest ? "They sent you a message — accept to reply." : "No messages yet. Say hello!"}
            </p>
          </div>
        ) : (
          msgs.map((msg) => {
            const isOwn = msg.fromUserId === myId;
            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                {!isOwn && (
                  <Avatar img={conv.otherUserProfileImageUrl} firstName={conv.otherUserFirstName} lastName={conv.otherUserLastName} size="sm" />
                )}
                <div className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm break-words ${
                      isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm"
                    }`}
                  >
                    {msg.content && <span className="whitespace-pre-wrap">{msg.content}</span>}
                    {msg.gifUrl && <GifPreview url={msg.gifUrl} />}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-[10px] text-muted-foreground">{timeAgo(msg.createdAt)}</span>
                    {isOwn && (msg.isRead ? <CheckCheck className="w-3 h-3 text-primary" /> : <Check className="w-3 h-3 text-muted-foreground" />)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {theyBlockedMe ? (
        <div className="px-4 py-4 border-t border-border/60 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" /> You can't reply to this conversation.
        </div>
      ) : iBlockedThem ? (
        <div className="px-4 py-4 border-t border-border/60 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" /> You blocked this user. <button onClick={() => unblock({ userId: otherId })} className="text-primary hover:underline text-xs">Unblock</button>
        </div>
      ) : (
        <div className="border-t border-border/60 bg-card/30 px-3 py-3 space-y-2">
          {gifUrl && (
            <div className="flex items-start gap-2 pl-1">
              <GifPreview url={gifUrl} />
              <button onClick={() => setGifUrl("")} className="mt-1 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {showGif && (
            <div className="px-1">
              <GifPicker value={gifUrl} onChange={(url) => { setGifUrl(url); setShowGif(false); }} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGif((v) => !v)}
              title="Add GIF"
              className={`p-2 rounded-lg transition-colors shrink-0 ${showGif ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isRequest ? "Accept request first to reply…" : "Type a message…"}
              disabled={isRequest}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              size="sm"
              disabled={(!text.trim() && !gifUrl) || isSending || isRequest}
              onClick={handleSend}
              className="h-9 w-9 p-0 shrink-0"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const myId = (user as { id?: string })?.id ?? "";
  const qc = useQueryClient();

  const [tab, setTab] = useState<"inbox" | "requests">("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(routeUserId ?? null);
  const [search, setSearch] = useState("");
  const [showPanel, setShowPanel] = useState<"list" | "thread">(routeUserId ? "thread" : "list");

  const inboxKey = getGetDmInboxQueryKey();
  const requestsKey = getGetDmRequestsQueryKey();

  const { data: inbox = [], isLoading: inboxLoading } = useGetDmInbox({
    query: { queryKey: inboxKey, enabled: isAuthenticated, refetchInterval: 10000 },
  });

  const { data: requests = [], isLoading: requestsLoading } = useGetDmRequests({
    query: { queryKey: requestsKey, enabled: isAuthenticated, refetchInterval: 10000 },
  });

  const list = (tab === "inbox" ? inbox : requests).filter((c) => {
    if (!search) return true;
    const name = displayName(c.otherUserFirstName, c.otherUserLastName).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const selectedConv = [...inbox, ...requests].find((c) => c.otherUserId === selectedId) ?? null;

  function selectConv(conv: DmConversation) {
    setSelectedId(conv.otherUserId);
    setShowPanel("thread");
    navigate(`/messages/${conv.otherUserId}`);
  }

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <MessageSquare className="w-12 h-12 text-muted" />
        <h2 className="text-xl font-semibold">Sign in to view messages</h2>
        <Button onClick={login}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
      {/* ── Sidebar ── */}
      <div className={`flex flex-col w-full md:w-80 border-r border-border bg-card/20 shrink-0 ${showPanel === "thread" ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 pt-5 pb-3 border-b border-border/60">
          <h1 className="text-lg font-bold flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-primary" /> Messages
          </h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setTab("inbox")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "inbox" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
            >
              <Inbox className="w-3.5 h-3.5" /> Inbox
              {inbox.filter((c) => c.unreadCount > 0).length > 0 && (
                <span className="bg-white/20 rounded-full px-1.5 text-[10px]">{inbox.filter((c) => c.unreadCount > 0).length}</span>
              )}
            </button>
            <button
              onClick={() => setTab("requests")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === "requests" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
            >
              <MailQuestion className="w-3.5 h-3.5" /> Requests
              {requests.length > 0 && (
                <span className={`rounded-full px-1.5 text-[10px] ${tab === "requests" ? "bg-white/20" : "bg-primary/20 text-primary"}`}>{requests.length}</span>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {(inboxLoading || requestsLoading) ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-14 px-4">
              {tab === "inbox" ? <Inbox className="w-10 h-10 text-muted mx-auto mb-3" /> : <MailQuestion className="w-10 h-10 text-muted mx-auto mb-3" />}
              <p className="text-sm text-muted-foreground">
                {tab === "inbox" ? "Your inbox is empty" : "No message requests"}
              </p>
              {tab === "inbox" && (
                <p className="text-xs text-muted-foreground mt-1">Send a message to someone from the Community page.</p>
              )}
            </div>
          ) : (
            list.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                selected={selectedId === conv.otherUserId}
                myId={myId}
                onClick={() => selectConv(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Thread Panel ── */}
      <div className={`flex-1 flex flex-col overflow-hidden ${showPanel === "list" ? "hidden md:flex" : "flex"}`}>
        {selectedConv ? (
          <ThreadPanel
            conv={selectedConv}
            myId={myId}
            onBack={() => { setShowPanel("list"); setSelectedId(null); navigate("/messages"); }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <MessageSquare className="w-14 h-14 text-muted" />
            <div>
              <h2 className="text-lg font-semibold mb-1">Your messages</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Select a conversation or find someone in the Community to message.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/community")}>
              <ChevronRight className="w-4 h-4 mr-1.5" /> Browse Community
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

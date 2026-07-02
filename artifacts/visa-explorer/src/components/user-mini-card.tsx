import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Send, MessageSquare, X, Loader2, UserPlus, UserCheck, Clock } from "lucide-react";
import {
  useSendDm,
  useSendFriendRequest,
  useListFriends,
  useListFriendRequests,
  getListFriendsQueryKey,
  getListFriendRequestsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  className?: string;
}

function displayName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || "Traveler";
}

function initials(firstName?: string | null, lastName?: string | null) {
  const n = displayName(firstName, lastName);
  return n.slice(0, 2).toUpperCase();
}

export default function UserMiniCard({
  userId,
  firstName,
  lastName,
  profileImageUrl,
  className = "",
}: Props) {
  const { user, isAuthenticated, login } = useAuth();
  const myId = (user as { id?: string })?.id ?? "";
  const isSelf = !!myId && myId === userId;
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [, navigate] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Derive friendship status from cached query data (no extra network request)
  const { data: friends = [] } = useListFriends({
    query: { queryKey: getListFriendsQueryKey(), enabled: isAuthenticated },
  });
  const { data: requests = [] } = useListFriendRequests({
    query: { queryKey: getListFriendRequestsQueryKey(), enabled: isAuthenticated },
  });

  const isFriend = friends.some((f) => f.id === userId);
  // Pending: either I sent them a request (check via requests where addresseeId would be them)
  // or they sent me one (check in requests list)
  const incomingRequest = requests.find((r) => r.id === userId);
  const isPendingIncoming = !!incomingRequest;

  const { mutate: sendDm, isPending: dmPending } = useSendDm({
    mutation: {
      onSuccess: () => {
        setSent(true);
        setTimeout(() => {
          setOpen(false);
          setComposing(false);
          setSent(false);
          setText("");
          navigate(`/messages`);
        }, 900);
      },
    },
  });

  const { mutate: sendFriendRequest, isPending: frPending } = useSendFriendRequest({
    mutation: {
      onSuccess: () => {
        setRequestSent(true);
        void queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getListFriendRequestsQueryKey() });
      },
    },
  });

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false);
        setComposing(false);
        setSent(false);
        setText("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (composing && textRef.current) textRef.current.focus();
  }, [composing]);

  function handleSend() {
    if (!text.trim() || dmPending) return;
    sendDm({ userId, data: { content: text.trim() } });
  }

  const name = displayName(firstName, lastName);

  return (
    <div className="relative inline-block" ref={cardRef}>
      <button
        type="button"
        className={`hover:underline hover:text-primary transition-colors ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
          setComposing(false);
          setSent(false);
          setText("");
        }}
      >
        {name}
      </button>

      {open && (
        <div
          className="absolute z-50 top-full mt-1.5 left-0 bg-card border border-border rounded-2xl shadow-xl p-4 w-64"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="shrink-0">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center">
                  {initials(firstName, lastName)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{name}</p>
              <p className="text-xs text-muted-foreground">Visagram member</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action area */}
          {isSelf ? (
            <p className="text-xs text-muted-foreground text-center py-1">This is you</p>
          ) : sent ? (
            <div className="flex items-center gap-2 justify-center text-emerald-400 py-2">
              <span className="text-sm font-medium">Message sent! ✓</span>
            </div>
          ) : !composing ? (
            <div className="space-y-2">
              {/* Friend action */}
              {isAuthenticated && (
                isFriend ? (
                  <div className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 text-sm font-medium py-2 rounded-xl border border-emerald-500/20">
                    <UserCheck className="w-4 h-4" />
                    Already Friends
                  </div>
                ) : requestSent ? (
                  <div className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground text-sm font-medium py-2 rounded-xl">
                    <Clock className="w-4 h-4" />
                    Request Sent
                  </div>
                ) : isPendingIncoming ? (
                  <div className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground text-sm font-medium py-2 rounded-xl">
                    <Clock className="w-4 h-4" />
                    Request Pending
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={frPending}
                    onClick={() => sendFriendRequest({ userId })}
                    className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium py-2 rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {frPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Add Friend
                  </button>
                )
              )}

              {/* Message action */}
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) { login(); return; }
                  setComposing(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Send Message
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                ref={textRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  if (e.key === "Escape") { setComposing(false); setText(""); }
                }}
                placeholder={`Message ${firstName ?? "Traveler"}…`}
                rows={3}
                className="w-full resize-none text-sm bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setComposing(false); setText(""); }}
                  className="flex-1 text-xs text-muted-foreground py-1.5 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!text.trim() || dmPending}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-primary text-primary-foreground py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {dmPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

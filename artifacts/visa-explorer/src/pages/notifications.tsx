import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link } from "wouter";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
  getGetNotificationsUnreadCountQueryKey,
} from "@workspace/api-client-react";
import type { Notification } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, UserPlus, Mail, AtSign, MessageCircle, CheckCheck, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

function timeAgo(dt: string | null | undefined): string {
  if (!dt) return "";
  const d = new Date(dt);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(firstName?: string | null, lastName?: string | null) {
  return [(firstName ?? "")[0], (lastName ?? "")[0]].filter(Boolean).join("").toUpperCase() || "?";
}

function Avatar({ img, firstName, lastName }: { img?: string | null; firstName?: string | null; lastName?: string | null }) {
  if (img) return <img src={img} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0 text-xs">
      {initials(firstName, lastName)}
    </div>
  );
}

const TYPE_META: Record<Notification["type"], { icon: typeof Bell; label: string; color: string }> = {
  friend_request: { icon: UserPlus, label: "Friend request", color: "text-primary" },
  message_request: { icon: Mail, label: "Message request", color: "text-blue-500" },
  mention_qa: { icon: AtSign, label: "Mentioned you in Q&A", color: "text-amber-500" },
  mention_chat: { icon: MessageCircle, label: "Mentioned you in chat", color: "text-emerald-500" },
};

function NotificationRow({ n, onRead }: { n: Notification; onRead: (id: number) => void }) {
  const meta = TYPE_META[n.type];
  const Icon = meta.icon;
  return (
    <Link
      href={n.link}
      onClick={() => { if (!n.isRead) onRead(n.id); }}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl transition-colors hover:bg-muted/50 ${!n.isRead ? "bg-primary/5" : ""}`}
    >
      <Avatar img={n.actor.profileImageUrl} firstName={n.actor.firstName} lastName={n.actor.lastName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
          <span className="font-medium truncate">
            {[n.actor.firstName, n.actor.lastName].filter(Boolean).join(" ") || "Someone"}
          </span>
          <span className="text-muted-foreground shrink-0">· {meta.label}</span>
        </div>
        {n.preview && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{n.preview}</p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
    </Link>
  );
}

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const queryClient = useQueryClient();
  const [limit] = useState(30);

  const { data, isLoading } = useListNotifications(
    { limit },
    {
      query: {
        queryKey: getListNotificationsQueryKey({ limit }),
        enabled: isAuthenticated,
        refetchInterval: 15000,
      },
    }
  );

  const markRead = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ limit }) });
        queryClient.invalidateQueries({ queryKey: getGetNotificationsUnreadCountQueryKey() });
      },
    },
  });

  const markAllRead = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ limit }) });
        queryClient.invalidateQueries({ queryKey: getGetNotificationsUnreadCountQueryKey() });
      },
    },
  });

  const notifications = data?.notifications ?? [];
  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Helmet>
        <title>Notifications — Visagram</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        {isAuthenticated && hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            {markAllRead.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {!isAuthenticated && !authLoading ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Sign in to see your notifications</p>
          <Button onClick={() => login()}>
            <LogIn className="w-4 h-4 mr-1.5" />
            Sign in
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">You're all caught up — no notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {notifications.map(n => (
            <NotificationRow key={n.id} n={n} onRead={(id) => markRead.mutate({ id })} />
          ))}
        </div>
      )}
    </div>
  );
}

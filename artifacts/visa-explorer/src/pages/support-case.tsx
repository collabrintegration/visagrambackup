import { useState } from "react";
import { useParams } from "wouter";
import {
  useGetSupportCase, getGetSupportCaseQueryKey,
  useAddSupportComment, getGetMyCasesQueryKey,
} from "@workspace/api-client-react";
import type { AddSupportCommentBodyStatus } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send, ShieldAlert, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ADMIN_EMAIL = "collabrintegration@gmail.com";

const STATUS_META: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  open:        { label: "Open",        cls: "bg-blue-500/10 text-blue-400",    icon: ShieldAlert },
  in_progress: { label: "In Progress", cls: "bg-amber-500/10 text-amber-400",  icon: RefreshCw },
  resolved:    { label: "Resolved",    cls: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  closed:      { label: "Closed",      cls: "bg-zinc-500/10 text-zinc-400",    icon: XCircle },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SupportCasePage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const { user, isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  const admin = isAuthenticated && (user as { email?: string })?.email === ADMIN_EMAIL;

  const { data: supportCase, isLoading } = useGetSupportCase(id, {
    query: { queryKey: getGetSupportCaseQueryKey(id), enabled: isAuthenticated && id > 0 },
  });

  const { mutate: addComment, isPending: sending } = useAddSupportComment({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetSupportCaseQueryKey(id) });
        void queryClient.invalidateQueries({ queryKey: getGetMyCasesQueryKey() });
        setReply("");
        setNewStatus("");
      },
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShieldAlert className="w-12 h-12 text-muted" />
        <h2 className="text-xl font-bold">Sign in to view your case</h2>
        <Button onClick={login}>Sign in</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supportCase) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Case not found.</p>
        <Button variant="outline" asChild><Link href="/profile">Back to Profile</Link></Button>
      </div>
    );
  }

  const sm = STATUS_META[supportCase.status] ?? STATUS_META.open;
  const StatusIcon = sm.icon;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* Back */}
      <Link href="/profile">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </button>
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Case #{supportCase.id}</p>
            <h1 className="text-xl font-bold">{supportCase.subject}</h1>
          </div>
          <Badge variant="secondary" className={`flex items-center gap-1.5 border-none text-sm ${sm.cls}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {sm.label}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{supportCase.body}</p>
        <p className="text-xs text-muted-foreground mt-3">Opened {timeAgo(supportCase.createdAt)}</p>
      </div>

      {/* Comments thread */}
      {(supportCase.comments?.length ?? 0) > 0 && (
        <div className="space-y-3 mb-4">
          {(supportCase.comments ?? []).map((c) => (
            <div
              key={c.id}
              className={`rounded-xl p-4 border ${c.isAdmin
                ? "bg-primary/5 border-primary/20 ml-8"
                : "bg-muted/20 border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {c.isAdmin ? "Visafy Support" : "You"}
                </span>
                <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {supportCase.status !== "closed" && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">
            {admin ? "Reply as Support Agent" : "Add a Reply"}
          </h3>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={admin ? "Write your response..." : "Provide more details or ask a follow-up..."}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-28 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {admin && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Update status (optional)</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">Keep current ({sm.label})</option>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              disabled={sending || !reply.trim()}
              onClick={() => addComment({ id, data: { body: reply.trim(), ...(newStatus ? { status: newStatus as AddSupportCommentBodyStatus } : {}) } })}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
              Send Reply
            </Button>
          </div>
        </div>
      )}

      {supportCase.status === "closed" && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <XCircle className="w-6 h-6 mx-auto mb-2 text-zinc-500" />
          This case is closed. Open a new case if you need further help.
        </div>
      )}
    </div>
  );
}

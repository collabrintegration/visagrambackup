import { Helmet } from "react-helmet-async";
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import {
  useListVisaApplications,
  useCreateVisaApplication,
  useUpdateVisaApplication,
  useDeleteVisaApplication,
  useGetVisaTrackerAnalytics,
  getListVisaApplicationsQueryKey,
  getGetVisaTrackerAnalyticsQueryKey,
  useListCountries,
} from "@workspace/api-client-react";
import type { VisaApplication } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Loader2, Trash2, ChevronDown, ChevronUp, LogIn,
  ClipboardList, CheckCircle2, Clock, XCircle, AlertCircle,
  MinusCircle, Globe, Pencil, Check, X, BarChart3, TrendingUp, Timer, Search, Pin, PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountryCombobox from "@/components/country-combobox";

const VISA_CATEGORIES = [
  { value: "travel",      label: "Travel",      emoji: "✈️",  desc: "Tourist, visitor & transit visas" },
  { value: "work",        label: "Work",         emoji: "💼",  desc: "Work permits & employment visas" },
  { value: "pr",          label: "PR",           emoji: "🏠",  desc: "Permanent residency applications" },
  { value: "citizenship", label: "Citizenship",  emoji: "🛂",  desc: "Naturalisation & citizenship" },
  { value: "partner",     label: "Partner",      emoji: "💑",  desc: "Spouse, partner & family visas" },
] as const;

type CategoryValue = typeof VISA_CATEGORIES[number]["value"];

const POPULAR_COUNTRIES = [
  { code: "AU", name: "Australia",      flag: "🇦🇺" },
  { code: "CA", name: "Canada",         flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States",  flag: "🇺🇸" },
  { code: "DE", name: "Germany",        flag: "🇩🇪" },
  { code: "NZ", name: "New Zealand",    flag: "🇳🇿" },
  { code: "SG", name: "Singapore",      flag: "🇸🇬" },
  { code: "AE", name: "UAE",            flag: "🇦🇪" },
  { code: "PT", name: "Portugal",       flag: "🇵🇹" },
];

// First 7 popular countries are always pinned as default tabs
const PINNED_CODES = POPULAR_COUNTRIES.slice(0, 7).map((c) => c.code);

const STATUS_CONFIG = {
  applied:    { label: "Applied",    icon: Clock,        cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  in_review:  { label: "In Review",  icon: AlertCircle,  cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  approved:   { label: "Approved",   icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  rejected:   { label: "Rejected",   icon: XCircle,      cls: "bg-destructive/15 text-destructive border-destructive/30" },
  withdrawn:  { label: "Withdrawn",  icon: MinusCircle,  cls: "bg-muted text-muted-foreground border-border" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function userInitials(a: { firstName?: string | null; lastName?: string | null }) {
  return [(a.firstName ?? "")[0], (a.lastName ?? "")[0]].filter(Boolean).join("").toUpperCase() || "?";
}

function displayName(a: { firstName?: string | null; lastName?: string | null }) {
  return [a.firstName, a.lastName].filter(Boolean).join(" ") || "Traveler";
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusKey] ?? STATUS_CONFIG.applied;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 text-[11px] px-2 py-0.5 border ${cfg.cls}`}>
      <Icon className="w-2.5 h-2.5" />{cfg.label}
    </Badge>
  );
}

function DaysBadge({ days, status }: { days: number | null | undefined; status: string }) {
  if (days == null) return <span className="text-xs text-muted-foreground">—</span>;
  const done = status === "approved" || status === "rejected";
  return (
    <span className={`text-xs font-medium tabular-nums ${done ? "text-muted-foreground" : "text-amber-400"}`}>
      {days}d{!done && <span className="text-[10px] font-normal opacity-60 ml-0.5">so far</span>}
    </span>
  );
}

function InlineStatusEditor({ app, onSave }: { app: VisaApplication; onSave: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
        <StatusBadge status={app.status} />
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl w-40 py-1">
          {Object.entries(STATUS_CONFIG).map(([val, c]) => {
            const Icon = c.icon;
            return (
              <button key={val} onClick={() => { onSave(val); setOpen(false); }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors ${app.status === val ? "font-semibold text-primary" : ""}`}
              >
                <Icon className="w-3 h-3 shrink-0" />{c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommentCell({ app, onSave, isOwn }: { app: VisaApplication; onSave: (v: string) => void; isOwn: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(app.comment ?? "");
  if (!isOwn) return <span className="text-xs text-muted-foreground truncate max-w-[160px]">{app.comment || "—"}</span>;
  if (editing) return (
    <div className="flex items-center gap-1 min-w-[120px]">
      <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { onSave(val); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
        className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
        placeholder="Add note…" maxLength={200} />
      <button onClick={() => { onSave(val); setEditing(false); }} className="text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={() => setEditing(false)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group max-w-[160px]">
      <span className="truncate">{app.comment || <span className="italic opacity-50">Add note…</span>}</span>
      <Pencil className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100" />
    </button>
  );
}

function ApprovalBar({ rate }: { rate: number | null | undefined }) {
  if (rate == null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums">{rate}%</span>
    </div>
  );
}

function CaseTable({
  apps, userId, onUpdate, onDelete,
}: {
  apps: VisaApplication[];
  userId: string;
  onUpdate: (id: number, data: Partial<VisaApplication>) => void;
  onDelete: (id: number) => void;
}) {
  if (apps.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No entries yet — be the first to share your experience!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card/40">
            {["Traveler", "Title", "Nationality", "Applied", "Days", "Status", "Granted", "Note", ""].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {apps.map((app) => {
            const isOwn = app.userId === userId;
            return (
              <tr key={app.id} className={`hover:bg-muted/20 transition-colors ${isOwn ? "bg-primary/[0.03]" : ""}`}>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {app.profileImageUrl ? (
                      <img src={app.profileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {userInitials(app)}
                      </div>
                    )}
                    <span className="text-xs font-medium">
                      {displayName(app)}{isOwn && <span className="text-[10px] text-primary ml-1">(you)</span>}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 max-w-[160px]">
                  <span className="text-xs font-medium truncate block">{(app as VisaApplication & { title?: string | null }).title || <span className="text-muted-foreground/40">—</span>}</span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {app.passportCode ? (
                    <div className="flex items-center gap-1">
                      {app.passportFlag && <span className="text-sm">{app.passportFlag}</span>}
                      <span className="text-xs text-muted-foreground">{app.passportName ?? app.passportCode}</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground/40">—</span>}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground">{formatDate(app.applicationDate)}</span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <DaysBadge days={(app as VisaApplication & { processingDays?: number | null }).processingDays} status={app.status} />
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {isOwn ? (
                    <InlineStatusEditor app={app} onSave={(status) => onUpdate(app.id, { status: status as VisaApplication["status"] })} />
                  ) : (
                    <StatusBadge status={app.status} />
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground">{formatDate(app.grantedDate)}</span>
                </td>
                <td className="px-4 py-2.5">
                  <CommentCell app={app} isOwn={isOwn} onSave={(comment) => onUpdate(app.id, { comment })} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  {isOwn && (
                    <button onClick={() => { if (confirm("Remove this entry?")) onDelete(app.id); }}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DashboardPanel({
  category, apps, userId, onAddCase, onUpdate, onDelete,
}: {
  category: typeof VISA_CATEGORIES[number];
  apps: VisaApplication[];
  userId: string;
  onAddCase: (type: string) => void;
  onUpdate: (id: number, data: Partial<VisaApplication>) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const approved = apps.filter((a) => a.status === "approved").length;
  const pending = apps.filter((a) => a.status === "applied" || a.status === "in_review").length;
  const latest = apps.length > 0 ? apps[0].createdAt : null;
  const approvalRate = apps.length > 0 ? Math.round((approved / apps.length) * 100) : null;

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card/30">
      {/* Panel header — always visible */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-2xl">{category.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-base">{category.label}</h3>
            <span className="text-xs text-muted-foreground">{category.desc}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span className="text-xs font-medium tabular-nums">{apps.length} {apps.length === 1 ? "case" : "cases"}</span>
            {apps.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{pending} pending</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{approved} approved</span>
                {approvalRate !== null && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs font-medium text-emerald-400">{approvalRate}% approval</span>
                  </>
                )}
                {latest && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">updated {timeAgo(latest)}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onAddCase(category.value); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Visa
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expandable case table */}
      {expanded && (
        <div className="border-t border-border/60">
          <CaseTable apps={apps} userId={userId} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}

function AnalyticsPanel() {
  const { data: analytics, isLoading } = useGetVisaTrackerAnalytics({
    query: { queryKey: getGetVisaTrackerAnalyticsQueryKey() },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!analytics || analytics.total === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p>No data yet — be the first to add your application!</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total cases", value: analytics.total, sub: "community entries" },
          { label: "Approved", value: analytics.approved, sub: `${analytics.total > 0 ? ((analytics.approved / analytics.total) * 100).toFixed(0) : 0}% rate` },
          { label: "Pending", value: analytics.pending, sub: "awaiting decision" },
          { label: "Avg processing", value: analytics.avgDays != null ? `${analytics.avgDays}d` : "—", sub: "for completed cases" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
            <div className="text-2xl font-bold mb-0.5">{s.value}</div>
            <div className="text-xs font-medium">{s.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {analytics.byVisaType.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> By Category</h3>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-card/60">
                {["Category", "Cases", "Approval rate", "Avg days"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {analytics.byVisaType.map((row) => {
                  const cat = VISA_CATEGORIES.find((c) => c.value === row.visaType);
                  return (
                    <tr key={row.visaType} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs font-medium">{cat ? `${cat.emoji} ${cat.label}` : row.visaType}</td>
                      <td className="px-4 py-3 text-xs">{row.total}</td>
                      <td className="px-4 py-3"><ApprovalBar rate={row.approvalRate} /></td>
                      <td className="px-4 py-3 text-xs tabular-nums">{row.avgDays != null ? `${row.avgDays}d` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analytics.byPassport.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> By Nationality (top {analytics.byPassport.length})</h3>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-card/60">
                {["Passport", "Cases", "Approval rate", "Avg days"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {analytics.byPassport.map((row) => (
                  <tr key={row.passportCode} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.passportFlag && <span className="text-base">{row.passportFlag}</span>}
                        <span className="text-xs font-medium">{row.passportName ?? row.passportCode}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{row.total}</td>
                    <td className="px-4 py-3"><ApprovalBar rate={row.approvalRate} /></td>
                    <td className="px-4 py-3 text-xs tabular-nums">{row.avgDays != null ? `${row.avgDays}d` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analytics.byCountry.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Timer className="w-4 h-4 text-primary" /> By Destination (top {analytics.byCountry.length})</h3>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-card/60">
                {["Country", "Cases", "Approval rate", "Avg days"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {analytics.byCountry.map((row) => (
                  <tr key={row.countryCode} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/country/${row.countryCode}`} className="text-xs font-medium hover:text-primary transition-colors">{row.countryName}</Link>
                    </td>
                    <td className="px-4 py-3 text-xs">{row.total}</td>
                    <td className="px-4 py-3"><ApprovalBar rate={row.approvalRate} /></td>
                    <td className="px-4 py-3 text-xs tabular-nums">{row.avgDays != null ? `${row.avgDays}d` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackerPage() {
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const userId = (user as { id?: string })?.id ?? "";
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"dashboards" | "analytics">("dashboards");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [prefillType, setPrefillType] = useState<string>("travel");
  const [countrySearch, setCountrySearch] = useState("");

  const LS_KEY = "visagram_pinned_countries";
  const [userPinned, setUserPinned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as string[]; }
    catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(userPinned));
  }, [userPinned]);
  function togglePin(code: string) {
    setUserPinned((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fCountry, setFCountry] = useState<string | null>(null);
  const [fPassport, setFPassport] = useState<string | null>(null);
  const [fType, setFType] = useState<string>("travel");
  const [fDate, setFDate] = useState(new Date().toISOString().split("T")[0]);
  const [fStatus, setFStatus] = useState("applied");
  const [fComment, setFComment] = useState("");

  const { data: countries = [] } = useListCountries();
  const { data: apps = [], isLoading } = useListVisaApplications({
    query: { queryKey: getListVisaApplicationsQueryKey(), refetchInterval: 30000 },
  });

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: getListVisaApplicationsQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetVisaTrackerAnalyticsQueryKey() });
  };

  const { mutate: create, isPending: creating } = useCreateVisaApplication({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        closeModal();
      },
    },
  });

  const { mutate: update } = useUpdateVisaApplication({ mutation: { onSuccess: invalidateAll } });
  const { mutate: del } = useDeleteVisaApplication({ mutation: { onSuccess: invalidateAll } });

  function openModal(type: string) {
    if (!isAuthenticated) { login(); return; }
    setPrefillType(type);
    setFType(type);
    setFTitle("");
    setFCountry(null);
    setFPassport(null);
    setFDate(new Date().toISOString().split("T")[0]);
    setFStatus("applied"); setFComment("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  const countryNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    (countries as Array<{ code: string; name: string }>).forEach((c) => { m[c.code] = c.name; });
    return m;
  }, [countries]);

  function handleCreate() {
    if (!fCountry || !fType || !fDate || !fTitle.trim()) return;
    const fCountryName = countryNameMap[fCountry] ?? fCountry;
    create({
      data: {
        title: fTitle.trim(),
        countryCode: fCountry,
        countryName: fCountryName,
        passportCode: fPassport ?? undefined,
        visaType: fType as "travel" | "work" | "pr" | "citizenship" | "partner",
        applicationDate: fDate,
        status: fStatus as VisaApplication["status"],
        comment: fComment || undefined,
      },
    });
  }

  // Build entry-count map from actual data
  const entryCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of apps) {
      const key = a.countryCode.toUpperCase();
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [apps]);

  type TabCountry = { code: string; name: string; flag: string; count: number; pinned: boolean; userPinned: boolean };

  // Default tabs: system-pinned 7 popular + user-pinned + data countries
  const defaultCountryTabs = useMemo<TabCountry[]>(() => {
    const allPinnedCodes = [...new Set([...PINNED_CODES, ...userPinned])];
    const pinnedTabs: TabCountry[] = allPinnedCodes.map((code) => {
      const pop = POPULAR_COUNTRIES.find((p) => p.code === code);
      const dbCountry = (countries as Array<{ code: string; name: string }>).find((c) => c.code.toUpperCase() === code);
      const dataApp = apps.find((a) => a.countryCode.toUpperCase() === code);
      return {
        code,
        name: pop?.name ?? dataApp?.countryName ?? dbCountry?.name ?? code,
        flag: pop?.flag ?? "🏳",
        count: entryCountMap.get(code) ?? 0,
        pinned: true,
        userPinned: userPinned.includes(code),
      };
    });
    const extraTabs: TabCountry[] = [];
    for (const a of apps) {
      const key = a.countryCode.toUpperCase();
      if (!allPinnedCodes.includes(key) && !extraTabs.find((e) => e.code === key)) {
        extraTabs.push({
          code: key, name: a.countryName,
          flag: POPULAR_COUNTRIES.find((p) => p.code === key)?.flag ?? "🏳",
          count: entryCountMap.get(key) ?? 0,
          pinned: false,
          userPinned: false,
        });
      }
    }
    extraTabs.sort((a, b) => b.count - a.count);
    return [...pinnedTabs, ...extraTabs];
  }, [apps, entryCountMap, userPinned, countries]);

  // Filtered by search — searches full countries list from DB
  const visibleCountryTabs = useMemo<TabCountry[]>(() => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return defaultCountryTabs;
    return (countries as Array<{ code: string; name: string }>)
      .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .map((c) => {
        const code = c.code.toUpperCase();
        return {
          code,
          name: c.name,
          flag: POPULAR_COUNTRIES.find((p) => p.code === code)?.flag ?? "🏳",
          count: entryCountMap.get(code) ?? 0,
          pinned: PINNED_CODES.includes(code) || userPinned.includes(code),
          userPinned: userPinned.includes(code),
        };
      });
  }, [countrySearch, defaultCountryTabs, countries, entryCountMap, userPinned]);

  // Filter apps by selected country
  const filteredByCountry = useMemo(
    () => selectedCountry === "all" ? apps : apps.filter((a) => a.countryCode === selectedCountry),
    [apps, selectedCountry]
  );

  // Split by visa category
  const byCategory = useMemo(
    () => Object.fromEntries(
      VISA_CATEGORIES.map((cat) => [cat.value, filteredByCountry.filter((a) => a.visaType === cat.value)])
    ) as Record<CategoryValue, VisaApplication[]>,
    [filteredByCountry]
  );

  const selectedCountryInfo = defaultCountryTabs.find((c) => c.code === selectedCountry)
    ?? visibleCountryTabs.find((c) => c.code === selectedCountry);
  const totalCases = filteredByCountry.length;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Visa Application Tracker — Track Your Visa Status | Visagram</title>
        <meta name="description" content="Track all your visa applications in one place. Monitor status, deadlines, and processing times for every country you're applying to — stay organized before your trip." />
        <meta property="og:title" content="Visa Application Tracker — Track Your Visa Status | Visagram" />
        <meta property="og:description" content="Monitor all your visa applications, deadlines, and processing times in one organized dashboard on Visagram." />
        <meta property="og:url" content="https://visagram.io/tracker" />
        <meta property="og:image" content="https://visagram.io/og-image.png" />
        <meta name="twitter:image" content="https://visagram.io/og-image.png" />
      </Helmet>
      {/* ── Header ── */}
      <div className="border-b border-border/60 bg-card/30">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-widest mb-3">
                <ClipboardList className="w-4 h-4" /> Visa Timeline Trackers
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {selectedCountry === "all"
                  ? "Global Visa Tracker"
                  : `${selectedCountryInfo?.flag} ${selectedCountryInfo?.name} Visa Trackers`}
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Crowdsourced visa processing times. Share your application, track progress, and see real timelines from the community.
              </p>
            </div>
            {!authLoading && (
              isAuthenticated ? (
                <Button onClick={() => openModal("travel")}>
                  <Plus className="w-4 h-4 mr-2" /> Add Visa
                </Button>
              ) : (
                <Button variant="outline" onClick={login}>
                  <LogIn className="w-4 h-4 mr-2" /> Sign in to contribute
                </Button>
              )
            )}
          </div>

          {/* Quick stats */}
          {!isLoading && apps.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border/60">
              <div className="text-center">
                <div className="text-2xl font-bold">{apps.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total entries</div>
              </div>
              {(["applied", "in_review", "approved", "rejected"] as StatusKey[]).map((s) => {
                const count = apps.filter((a) => a.status === s).length;
                return (
                  <div key={s} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{STATUS_CONFIG[s].label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Tab bar (Dashboards / Analytics) ── */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 pt-2">
            {([
              { key: "dashboards", label: "Dashboards" },
              { key: "analytics",  label: "Analytics" },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Country tab bar ── */}
      {activeTab === "dashboards" && (
        <div className="border-b border-border/40 bg-card/20">
          <div className="container mx-auto px-4 py-3 space-y-2">
            {/* Search */}
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search countries…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
            </div>
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCountry("all")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${selectedCountry === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
              >
                🌍 All <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${selectedCountry === "all" ? "bg-white/20" : "bg-muted"}`}>{apps.length}</span>
              </button>
              {visibleCountryTabs.map((c) => {
                const isActive = selectedCountry === c.code;
                const hasData = c.count > 0;
                const isSystemPinned = PINNED_CODES.includes(c.code);
                return (
                  <div key={c.code} className="relative group/tab shrink-0">
                    <button
                      onClick={() => setSelectedCountry(c.code)}
                      className={`flex items-center gap-1.5 pl-4 pr-8 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all w-full ${
                        isActive ? "bg-primary text-primary-foreground" : `bg-card border border-border hover:border-primary/30 hover:text-foreground ${hasData ? "text-muted-foreground" : "text-muted-foreground/50"}`
                      }`}
                    >
                      {c.flag} {c.name}
                      {c.userPinned && !isActive && (
                        <Pin className="w-2.5 h-2.5 shrink-0 text-primary/60 fill-primary/40" />
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${isActive ? "bg-white/20" : hasData ? "bg-muted" : "bg-muted/40 text-muted-foreground/40"}`}>
                        {c.count}
                      </span>
                    </button>
                    {/* Pin / unpin button — hidden until hover, not shown for system-pinned */}
                    {!isSystemPinned && (
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePin(c.code); }}
                        title={c.userPinned ? "Unpin country" : "Pin country"}
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-all opacity-0 group-hover/tab:opacity-100 ${
                          c.userPinned
                            ? "text-primary hover:text-destructive"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {c.userPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                );
              })}
              {visibleCountryTabs.length === 0 && countrySearch && (
                <span className="text-sm text-muted-foreground px-2">No countries match "{countrySearch}"</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "analytics" ? (
          <AnalyticsPanel />
        ) : isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {selectedCountry !== "all" && (
              <p className="text-sm text-muted-foreground mb-2">
                Showing <span className="font-medium text-foreground">{totalCases}</span> {totalCases === 1 ? "case" : "cases"} for <span className="font-medium text-foreground">{selectedCountryInfo?.name}</span> — click any tracker to expand
              </p>
            )}
            {VISA_CATEGORIES.map((cat) => (
              <DashboardPanel
                key={cat.value}
                category={cat}
                apps={byCategory[cat.value as CategoryValue]}
                userId={userId}
                onAddCase={openModal}
                onUpdate={(id, data) => update({ id, data: data as Parameters<typeof update>[0]["data"] })}
                onDelete={(id) => del({ id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add case modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold">Add Visa</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Title *</label>
                <input
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  placeholder="e.g. UK Tourist Visa — applied Jan 2025"
                  maxLength={120}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
              </div>
              {/* Visa category */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visa Category *</label>
                <div className="flex flex-wrap gap-2">
                  {VISA_CATEGORIES.map((c) => (
                    <button key={c.value} onClick={() => setFType(c.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${fType === c.value ? "bg-primary text-primary-foreground" : "bg-background border border-border hover:border-primary/30"}`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination country */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Destination Country *</label>
                <CountryCombobox
                  value={fCountry}
                  onChange={(code) => setFCountry(code)}
                  placeholder="Select destination…"
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Nationality (passport)</label>
                <CountryCombobox
                  value={fPassport}
                  onChange={(code) => setFPassport(code)}
                  placeholder="Select passport country…"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Applied Date *</label>
                  <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Status *</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(([val, c]) => (
                    <button key={val} onClick={() => setFStatus(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${fStatus === val ? "bg-primary text-primary-foreground" : "bg-background border border-border hover:border-primary/30"}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes (optional)</label>
                <textarea value={fComment} onChange={(e) => setFComment(e.target.value)}
                  placeholder="Any details about your application, stream, office, etc…"
                  rows={2} maxLength={300}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
              <Button onClick={handleCreate} disabled={!fCountry || !fType || !fDate || !fTitle.trim() || creating} className="flex-1">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useListVisaApplications,
  useCreateVisaApplication,
  useUpdateVisaApplication,
  useDeleteVisaApplication,
  getListVisaApplicationsQueryKey,
  useListCountries,
} from "@workspace/api-client-react";
import type { VisaApplication } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Loader2, Trash2, MessageSquare, ChevronDown, LogIn,
  ClipboardList, CheckCircle2, Clock, XCircle, AlertCircle,
  MinusCircle, Search, X, Globe, Pencil, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountryCombobox from "@/components/country-combobox";

const VISA_TYPES = [
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "work", label: "Work", emoji: "💼" },
  { value: "study", label: "Study", emoji: "🎓" },
  { value: "pr", label: "PR", emoji: "🏠" },
  { value: "citizenship", label: "Citizenship", emoji: "🛂" },
] as const;

const STATUS_CONFIG = {
  applied:    { label: "Applied",     icon: Clock,        cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  in_review:  { label: "In Review",   icon: AlertCircle,  cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  approved:   { label: "Approved",    icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  rejected:   { label: "Rejected",    icon: XCircle,      cls: "bg-destructive/15 text-destructive border-destructive/30" },
  withdrawn:  { label: "Withdrawn",   icon: MinusCircle,  cls: "bg-muted text-muted-foreground border-border" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function userInitials(a: { firstName?: string | null; lastName?: string | null }): string {
  return [(a.firstName ?? "")[0], (a.lastName ?? "")[0]].filter(Boolean).join("").toUpperCase() || "?";
}

function displayName(a: { firstName?: string | null; lastName?: string | null }): string {
  return [a.firstName, a.lastName].filter(Boolean).join(" ") || "Traveler";
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusKey] ?? STATUS_CONFIG.applied;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 text-[11px] px-2 py-0.5 border ${cfg.cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </Badge>
  );
}

function InlineStatusEditor({
  app, onSave,
}: {
  app: VisaApplication;
  onSave: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[app.status as StatusKey] ?? STATUS_CONFIG.applied;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        <StatusBadge status={app.status} />
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl w-40 py-1 overflow-hidden">
          {Object.entries(STATUS_CONFIG).map(([val, c]) => {
            const Icon = c.icon;
            return (
              <button
                key={val}
                onClick={() => { onSave(val); setOpen(false); }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors ${app.status === val ? "font-semibold text-primary" : ""}`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommentCell({ app, onSave, isOwn }: { app: VisaApplication; onSave: (comment: string) => void; isOwn: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(app.comment ?? "");

  if (!isOwn) {
    return <span className="text-xs text-muted-foreground truncate max-w-[200px]">{app.comment || "—"}</span>;
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[140px]">
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onSave(val); setEditing(false); }
            if (e.key === "Escape") setEditing(false);
          }}
          className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 min-w-0"
          placeholder="Add a comment…"
          maxLength={200}
        />
        <button onClick={() => { onSave(val); setEditing(false); }} className="text-emerald-400 hover:text-emerald-300">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group max-w-[200px]">
      <span className="truncate">{app.comment || <span className="italic opacity-50">Add comment…</span>}</span>
      <Pencil className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default function TrackerPage() {
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const userId = (user as { id?: string })?.id ?? "";
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [fCountry, setFCountry] = useState<string | null>(null);
  const [fCountryName, setFCountryName] = useState("");
  const [fType, setFType] = useState<string>("travel");
  const [fDate, setFDate] = useState(new Date().toISOString().split("T")[0]);
  const [fStatus, setFStatus] = useState("applied");
  const [fComment, setFComment] = useState("");

  const { data: countries = [] } = useListCountries();
  const { data: apps = [], isLoading } = useListVisaApplications({
    query: { queryKey: getListVisaApplicationsQueryKey(), refetchInterval: 30000 },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListVisaApplicationsQueryKey() });

  const { mutate: create, isPending: creating } = useCreateVisaApplication({
    mutation: {
      onSuccess: () => {
        invalidate();
        setShowModal(false);
        setFCountry(null);
        setFCountryName("");
        setFType("travel");
        setFDate(new Date().toISOString().split("T")[0]);
        setFStatus("applied");
        setFComment("");
      },
    },
  });

  const { mutate: update } = useUpdateVisaApplication({
    mutation: { onSuccess: invalidate },
  });

  const { mutate: del } = useDeleteVisaApplication({
    mutation: { onSuccess: invalidate },
  });

  const countryMap = useMemo(() => {
    const m: Record<string, string> = {};
    (countries as Array<{ code: string; name: string }>).forEach((c) => { m[c.code] = c.name; });
    return m;
  }, [countries]);

  const filtered = useMemo(() => {
    let r = apps;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((a) =>
        a.countryName.toLowerCase().includes(q) ||
        a.visaType.toLowerCase().includes(q) ||
        (a.comment ?? "").toLowerCase().includes(q) ||
        displayName(a).toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") r = r.filter((a) => a.visaType === typeFilter);
    if (statusFilter !== "all") r = r.filter((a) => a.status === statusFilter);
    return r;
  }, [apps, search, typeFilter, statusFilter]);

  const handleCountryChange = (code: string | null) => {
    setFCountry(code);
    setFCountryName(code ? (countryMap[code] ?? code) : "");
  };

  const handleCreate = () => {
    if (!fCountry || !fCountryName || !fType || !fDate) return;
    create({
      data: {
        countryCode: fCountry,
        countryName: fCountryName,
        visaType: fType as "travel" | "work" | "study" | "pr" | "citizenship",
        applicationDate: fDate,
        status: fStatus as "applied" | "in_review" | "approved" | "rejected" | "withdrawn",
        comment: fComment || undefined,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-widest mb-3">
                <ClipboardList className="w-4 h-4" /> Visa Tracker
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Application Dashboard</h1>
              <p className="text-muted-foreground max-w-xl">
                Community-managed visa application tracker. Log your application, track the status, and ask questions about your journey.
              </p>
            </div>
            {!authLoading && (
              isAuthenticated ? (
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add My Application
                </Button>
              ) : (
                <Button variant="outline" onClick={login}>
                  <LogIn className="w-4 h-4 mr-2" /> Sign in to add entry
                </Button>
              )
            )}
          </div>

          {/* Stats bar */}
          {!isLoading && apps.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-border/60">
              {(["applied", "in_review", "approved", "rejected"] as StatusKey[]).map((s) => {
                const count = apps.filter((a) => a.status === s).length;
                const cfg = STATUS_CONFIG[s];
                return (
                  <div key={s} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cfg.label}</div>
                  </div>
                );
              })}
              <div className="text-center">
                <div className="text-2xl font-bold">{apps.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total entries</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country, type, user…"
              className="w-full bg-card border border-border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
            >
              All types
            </button>
            {VISA_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value === typeFilter ? "all" : t.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${typeFilter === t.value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
            >
              All statuses
            </button>
            {(Object.keys(STATUS_CONFIG) as StatusKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s === statusFilter ? "all" : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <ClipboardList className="w-12 h-12 mx-auto text-muted mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {apps.length === 0 ? "No entries yet" : "No results found"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {apps.length === 0
                ? "Be the first to track your visa application journey."
                : "Try adjusting your filters."}
            </p>
            {isAuthenticated && apps.length === 0 && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add My Application
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Traveler</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Country</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Applied</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Granted</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Comment</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((app) => {
                  const isOwn = app.userId === userId;
                  const vt = VISA_TYPES.find((t) => t.value === app.visaType);
                  return (
                    <tr key={app.id} className={`hover:bg-muted/30 transition-colors ${isOwn ? "bg-primary/3" : ""}`}>
                      {/* Traveler */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {app.profileImageUrl ? (
                            <img src={app.profileImageUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                              {userInitials(app)}
                            </div>
                          )}
                          <span className="text-xs font-medium">
                            {displayName(app)}
                            {isOwn && <span className="text-[10px] text-primary ml-1">(you)</span>}
                          </span>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/country/${app.countryCode}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                          <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium">{app.countryName}</span>
                        </Link>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs">
                          {vt ? `${vt.emoji} ${vt.label}` : app.visaType}
                        </span>
                      </td>

                      {/* Applied Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">{formatDate(app.applicationDate)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isOwn ? (
                          <InlineStatusEditor
                            app={app}
                            onSave={(status) => update({ id: app.id, data: { status: status as "applied" | "in_review" | "approved" | "rejected" | "withdrawn" } })}
                          />
                        ) : (
                          <StatusBadge status={app.status} />
                        )}
                      </td>

                      {/* Granted Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">
                          {app.grantedDate ? (
                            <span className="text-emerald-400 font-medium">{formatDate(app.grantedDate)}</span>
                          ) : "—"}
                        </span>
                      </td>

                      {/* Comment */}
                      <td className="px-4 py-3 max-w-[240px]">
                        <CommentCell
                          app={app}
                          isOwn={isOwn}
                          onSave={(comment) => update({ id: app.id, data: { comment } })}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 justify-end">
                          <Link href={`/community?country=${app.countryCode}&visa=${app.visaType}`}>
                            <button
                              title="Ask a question about this visa"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          {isOwn && (
                            <button
                              title="Delete entry"
                              onClick={() => {
                                if (confirm("Delete this application entry?")) del({ id: app.id });
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Track My Application
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Country *</label>
                <CountryCombobox
                  value={fCountry}
                  onChange={handleCountryChange}
                  placeholder="Which country are you applying for?"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Visa Type *</label>
                <div className="grid grid-cols-5 gap-2">
                  {VISA_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setFType(t.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                        fType === t.value
                          ? "bg-primary/15 border-primary text-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <span className="text-lg">{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Application Date *</label>
                <input
                  type="date"
                  value={fDate}
                  onChange={(e) => setFDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Current Status</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(([val, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={val}
                        onClick={() => setFStatus(val)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          fStatus === val
                            ? `${cfg.cls} border-current`
                            : "bg-background border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <Icon className="w-3 h-3 shrink-0" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Comment <span className="opacity-50">(optional)</span></label>
                <textarea
                  value={fComment}
                  onChange={(e) => setFComment(e.target.value)}
                  placeholder="Any notes — processing time, documents requested, etc."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  maxLength={200}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1"
                  disabled={creating || !fCountry || !fType || !fDate}
                  onClick={handleCreate}
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  Add Entry
                </Button>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

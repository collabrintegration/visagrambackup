import { useState } from "react";
import {
  useListVisaGuideEntries,
  useCreateVisaGuideEntry,
  useUpdateVisaGuideEntry,
  useDeleteVisaGuideEntry,
  getListVisaGuideEntriesQueryKey,
  useListCountries,
  getListCountriesQueryKey,
} from "@workspace/api-client-react";
import type { VisaGuideEntry } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Loader2, Trash2, Pencil, X, ExternalLink, LogIn,
  Check, Globe, Clock, DollarSign, Calendar, FileText, Link,
  MessageSquare, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountryCombobox from "@/components/country-combobox";

const CATEGORIES = [
  { value: "travel",      label: "Travel",      emoji: "✈️",  desc: "Tourist, visitor & transit visas" },
  { value: "work",        label: "Work",         emoji: "💼",  desc: "Work permits & employment visas" },
  { value: "pr",          label: "PR",           emoji: "🏠",  desc: "Permanent residency pathways" },
  { value: "citizenship", label: "Citizenship",  emoji: "🛂",  desc: "Naturalisation & citizenship routes" },
  { value: "partner",     label: "Partner",      emoji: "💑",  desc: "Spouse, partner & family visas" },
] as const;

type Category = typeof CATEGORIES[number]["value"];

function displayName(e: { firstName?: string | null; lastName?: string | null }) {
  return [e.firstName, e.lastName].filter(Boolean).join(" ") || "Community Member";
}

function initials(e: { firstName?: string | null; lastName?: string | null }) {
  return [(e.firstName ?? "")[0], (e.lastName ?? "")[0]].filter(Boolean).join("").toUpperCase() || "?";
}

function timeAgo(s: string) {
  const d = new Date(s);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const EMPTY_FORM = {
  visaRequired: true,
  processingTime: "",
  officialFee: "",
  maxStay: "",
  requirements: "",
  applicationUrl: "",
  notes: "",
};

export default function VisaGuidePage() {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();

  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [activeTab, setActiveTab] = useState<Category>("travel");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<VisaGuideEntry | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const entriesKey = getListVisaGuideEntriesQueryKey(countryCode ? { countryCode, category: activeTab } : undefined);

  const { data: entries = [], isLoading } = useListVisaGuideEntries(
    countryCode ? { countryCode, category: activeTab } : undefined,
    { query: { queryKey: entriesKey, enabled: !!countryCode } }
  );

  const { data: countries = [] } = useListCountries({}, { query: { queryKey: getListCountriesQueryKey({}), staleTime: Infinity } });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: getListVisaGuideEntriesQueryKey({ countryCode, category: activeTab }) });
  };

  const { mutate: createEntry, isPending: isCreating } = useCreateVisaGuideEntry({
    mutation: { onSuccess: () => { invalidate(); closeModal(); } },
  });

  const { mutate: updateEntry, isPending: isUpdating } = useUpdateVisaGuideEntry({
    mutation: { onSuccess: () => { invalidate(); closeModal(); } },
  });

  const { mutate: deleteEntry } = useDeleteVisaGuideEntry({
    mutation: { onSuccess: invalidate },
  });

  const userId = (useAuth() as { user?: { id?: string } }).user?.id ?? "";

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }

  function openEdit(e: VisaGuideEntry) {
    setEditing(e);
    setForm({
      visaRequired: e.visaRequired,
      processingTime: e.processingTime ?? "",
      officialFee: e.officialFee ?? "",
      maxStay: e.maxStay ?? "",
      requirements: e.requirements ?? "",
      applicationUrl: e.applicationUrl ?? "",
      notes: e.notes ?? "",
    });
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditing(null); setForm({ ...EMPTY_FORM }); }

  function handleSubmit() {
    if (!countryCode || !countryName) return;
    const data = {
      countryCode,
      countryName,
      category: activeTab,
      visaRequired: form.visaRequired,
      processingTime: form.processingTime || undefined,
      officialFee: form.officialFee || undefined,
      maxStay: form.maxStay || undefined,
      requirements: form.requirements || undefined,
      applicationUrl: form.applicationUrl || undefined,
      notes: form.notes || undefined,
    };
    if (editing) {
      updateEntry({ id: editing.id, data });
    } else {
      createEntry({ data });
    }
  }

  const cat = CATEGORIES.find((c) => c.value === activeTab)!;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
          <LayoutDashboard className="w-3.5 h-3.5" /> Visa Guide
        </div>
        <h1 className="text-3xl font-bold mb-2">Country Visa Dashboards</h1>
        <p className="text-muted-foreground">
          Community-contributed visa information for every country — Travel, Work, PR, Citizenship, and Partner visas.
        </p>
      </div>

      {/* Country Selector */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Select a Country
        </label>
        <CountryCombobox
          value={countryCode}
          onChange={(code) => {
            setCountryCode(code ?? "");
            const found = countries.find((c) => c.code === code);
            setCountryName(found?.name ?? "");
          }}
          placeholder="Search for a country…"
        />
      </div>

      {/* No country selected */}
      {!countryCode && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Choose a country to begin</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Select any country above to see community-contributed visa information across all categories.
            </p>
          </div>
        </div>
      )}

      {/* Country dashboard */}
      {countryCode && (
        <>
          {/* Country title */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{countryName}</h2>
              <p className="text-sm text-muted-foreground">Visa information contributed by the community</p>
            </div>
            {isAuthenticated ? (
              <Button onClick={openCreate} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Add Entry
              </Button>
            ) : (
              <Button onClick={login} size="sm" variant="outline" className="gap-1.5">
                <LogIn className="w-4 h-4" /> Sign in to contribute
              </Button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 bg-muted/40 rounded-xl p-1 mb-6 overflow-x-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveTab(c.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === c.value
                    ? "bg-card shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Tab description */}
          <p className="text-xs text-muted-foreground mb-5">{cat.emoji} {cat.desc}</p>

          {/* Entries */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border rounded-2xl text-center">
              <span className="text-4xl">{cat.emoji}</span>
              <div>
                <p className="font-semibold mb-1">No {cat.label} visa info yet for {countryName}</p>
                <p className="text-sm text-muted-foreground">Be the first to add information for this category.</p>
              </div>
              {isAuthenticated ? (
                <Button onClick={openCreate} size="sm" className="gap-1.5 mt-1">
                  <Plus className="w-4 h-4" /> Add Entry
                </Button>
              ) : (
                <Button onClick={login} size="sm" variant="outline" className="gap-1.5">
                  <LogIn className="w-4 h-4" /> Sign in to contribute
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {entries.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  isOwn={e.userId === userId}
                  onEdit={() => openEdit(e)}
                  onDelete={() => { if (confirm("Delete this entry?")) deleteEntry({ id: e.id }); }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="font-semibold text-lg">
                {editing ? "Edit Entry" : `Add ${cat.emoji} ${cat.label} Visa Info`}
              </h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Visa Required toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div>
                  <p className="text-sm font-medium">Visa Required</p>
                  <p className="text-xs text-muted-foreground">Does this country require a visa?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, visaRequired: !f.visaRequired }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.visaRequired ? "bg-primary" : "bg-muted border border-border"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.visaRequired ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Processing Time */}
              <Field
                label="Processing Time"
                icon={<Clock className="w-3.5 h-3.5" />}
                placeholder="e.g. 2–4 weeks"
                value={form.processingTime}
                onChange={(v) => setForm((f) => ({ ...f, processingTime: v }))}
              />

              {/* Official Fee */}
              <Field
                label="Official Fee"
                icon={<DollarSign className="w-3.5 h-3.5" />}
                placeholder="e.g. $160 USD"
                value={form.officialFee}
                onChange={(v) => setForm((f) => ({ ...f, officialFee: v }))}
              />

              {/* Max Stay (travel only) */}
              {activeTab === "travel" && (
                <Field
                  label="Max Stay"
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  placeholder="e.g. 90 days"
                  value={form.maxStay}
                  onChange={(v) => setForm((f) => ({ ...f, maxStay: v }))}
                />
              )}

              {/* Requirements */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Key Requirements
                </label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                  placeholder="e.g. Valid passport (6+ months), bank statements, return ticket, hotel booking"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  maxLength={800}
                />
              </div>

              {/* Application URL */}
              <Field
                label="Official Application URL"
                icon={<Link className="w-3.5 h-3.5" />}
                placeholder="https://..."
                value={form.applicationUrl}
                onChange={(v) => setForm((f) => ({ ...f, applicationUrl: v }))}
              />

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Notes / Tips
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Anything else travelers should know…"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  maxLength={600}
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6 shrink-0">
              <Button
                className="flex-1"
                disabled={isCreating || isUpdating}
                onClick={handleSubmit}
              >
                {(isCreating || isUpdating) ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
                {editing ? "Save Changes" : "Add Entry"}
              </Button>
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, icon, placeholder, value, onChange }: {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
        maxLength={200}
      />
    </div>
  );
}

function EntryCard({ entry, isOwn, onEdit, onDelete }: {
  entry: VisaGuideEntry;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.value === entry.category);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
            {initials(entry)}
          </div>
          <div>
            <p className="text-sm font-semibold">{displayName(entry)}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgo(entry.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="secondary"
            className={`text-[10px] px-2 py-0.5 ${entry.visaRequired ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"}`}
          >
            {entry.visaRequired ? "Visa Required" : "Visa Free"}
          </Badge>
          {isOwn && (
            <div className="flex gap-0.5 ml-1">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {entry.processingTime && (
          <StatChip icon={<Clock className="w-3 h-3" />} label="Processing" value={entry.processingTime} />
        )}
        {entry.officialFee && (
          <StatChip icon={<DollarSign className="w-3 h-3" />} label="Fee" value={entry.officialFee} />
        )}
        {entry.maxStay && (
          <StatChip icon={<Calendar className="w-3 h-3" />} label="Max Stay" value={entry.maxStay} />
        )}
      </div>

      {/* Requirements */}
      {entry.requirements && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Requirements
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{entry.requirements}</p>
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <div className="mb-3 p-3 bg-muted/40 rounded-lg">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Notes
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{entry.notes}</p>
        </div>
      )}

      {/* Application URL */}
      {entry.applicationUrl && (
        <a
          href={entry.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
        >
          <ExternalLink className="w-3 h-3" /> Official Application Portal
        </a>
      )}
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
        {icon} {label}
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

import { useParams, useSearch } from "wouter";
import { useState } from "react";
import {
  useGetCountry, getGetCountryQueryKey,
  useGetCountryReviews, getGetCountryReviewsQueryKey,
  useCreateCountryReview,
  useGetCountryQuestions, getGetCountryQuestionsQueryKey,
  useCreateCountryQuestion,
  useGetQuestionAnswers, getGetQuestionAnswersQueryKey,
  usePostAnswer,
  useUpsertTravelEntry, useDeleteTravelEntry, useGetTravelMap, getGetTravelMapQueryKey,
  useGetVisaReports, getGetVisaReportsQueryKey,
  useSubmitVisaReport,
} from "@workspace/api-client-react";
import type { QuestionSummary } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, MapPin, Coins, Languages, ArrowLeft, Loader2, Camera, Clock, DollarSign, CalendarDays, RefreshCw, Repeat, ExternalLink, FileText, Phone, Car, Users, Star, MessageSquare, ChevronDown, ChevronUp, CheckCircle2, Heart, PlusCircle, Send, BarChart2, TrendingUp, Award, X } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCountryImageUrl, getCountryFallbackImageUrl, getCountryLandmarkInfo } from "@/lib/countryImages";
import { getCountryDetails } from "@/lib/countryDetails";
import AdUnit from "@/components/ad-unit";

const ENTRY_STYLE: Record<string, { label: string; pill: string }> = {
  visa_free:       { label: "Visa-Free",       pill: "bg-emerald-500/10 text-emerald-400" },
  visa_on_arrival: { label: "Visa on Arrival",  pill: "bg-blue-500/10 text-blue-400" },
  evisa:           { label: "eVisa",            pill: "bg-amber-500/10 text-amber-400" },
  visa_required:   { label: "Visa Required",    pill: "bg-rose-500/10 text-rose-400" },
};

function visaTypeLabel(type: string) {
  const map: Record<string, string> = {
    tourist:       "Tourist Visa",
    business:      "Business Visa",
    student:       "Student Visa",
    work:          "Work Visa",
    transit:       "Transit Visa",
    digital_nomad: "Digital Nomad Visa",
    retirement:    "Retirement Visa",
    investor:      "Investor Visa",
  };
  return map[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function entriesLabel(entries: string | null | undefined) {
  if (!entries) return null;
  const map: Record<string, string> = { single: "Single Entry", double: "Double Entry", multiple: "Multiple Entry" };
  return map[entries.toLowerCase()] ?? entries;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 ${i <= (hover || value) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CountryDetail() {
  const { code } = useParams<{ code: string }>();
  const search = useSearch();
  const fromCode = new URLSearchParams(search).get("from")?.toUpperCase() ?? null;

  const { data: country, isLoading } = useGetCountry(code || "", {
    query: {
      enabled: !!code,
      queryKey: getGetCountryQueryKey(code || "")
    }
  });

  const imageUrl = code ? getCountryImageUrl(code) : null;
  const landmarkInfo = code ? getCountryLandmarkInfo(code) : null;
  const countryFacts = code ? getCountryDetails(code) : null;

  // When arriving from a passport context (e.g., ?from=AU), filter visas to that passport
  const fromPassportVisas = fromCode
    ? (country?.visas ?? []).filter(v => v.passportCountryCode === fromCode)
    : null;
  const fromPassportSample = fromPassportVisas?.[0];
  const backHref = fromCode ? `/explore` : "/explore";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold mb-2">Country Not Found</h2>
        <Link href="/explore" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[400px] max-h-[600px] overflow-hidden">
        <img
          src={imageUrl ?? getCountryFallbackImageUrl(code ?? "xx", 1600, 900)}
          alt={landmarkInfo?.landmark ?? country.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(code ?? "xx", 1600, 900); }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        <div className="relative z-10 h-full flex flex-col justify-between p-6 md:px-8">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to destinations
          </Link>
          <div>
            <div className="flex items-end gap-5 mb-4">
              <span className="text-7xl md:text-8xl drop-shadow-lg leading-none">{country.flagEmoji}</span>
              <div>
                <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-3 drop-shadow-sm">
                  {country.name}
                </h1>
                <div className="flex flex-wrap gap-3 text-sm font-medium text-white/75">
                  {country.continent && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                      <Globe className="w-3.5 h-3.5" /> {country.continent}
                    </div>
                  )}
                  {country.capital && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                      <MapPin className="w-3.5 h-3.5" /> {country.capital}
                    </div>
                  )}
                  {country.currency && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                      <Coins className="w-3.5 h-3.5" /> {country.currency}
                    </div>
                  )}
                  {country.language && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                      <Languages className="w-3.5 h-3.5" /> {country.language}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {landmarkInfo && (
              <div className="flex items-center gap-1.5 text-white/50 text-xs">
                <Camera className="w-3 h-3" />
                <span>{landmarkInfo.landmark}</span>
                <span className="text-white/30">·</span>
                <span>Photo by {landmarkInfo.credit} on Unsplash</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-10 pb-24 space-y-8">

        {/* ── Passport context banner ── */}
        {fromCode && fromPassportSample && (
          <div className="flex items-center gap-4 p-4 bg-card border border-primary/20 rounded-2xl">
            <span className="text-4xl">{fromPassportSample.passportCountryFlag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Entry requirements for</div>
              <div className="font-bold text-lg leading-tight">
                {fromPassportSample.passportCountryName} citizens visiting {country.name}
              </div>
            </div>
            <Link href="/explore" className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-full">
              <ArrowLeft className="w-3 h-3" /> Back
            </Link>
          </div>
        )}

        {/* ── Visa rules card ── */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="flex justify-between items-end mb-8 border-b border-border pb-5">
            <div>
              <h2 className="text-2xl font-bold">
                {fromCode ? "Entry Options" : "Visa Requirements"}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {fromCode && fromPassportSample
                  ? `Ways ${fromPassportSample.passportCountryName} passport holders can enter ${country.name} — fees, duration, and application links.`
                  : `Entry rules for travelers visiting ${country.name} — duration, fees, and official application links.`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">
                {fromCode ? (fromPassportVisas?.length ?? 0) : (country.visas?.length ?? 0)}
              </span>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                {fromCode ? "Options" : "Total Rules"}
              </p>
            </div>
          </div>

          {/* Passport-specific: full-width detailed cards */}
          {fromCode ? (
            fromPassportVisas && fromPassportVisas.length > 0 ? (
              <div className="space-y-4">
                {fromPassportVisas.map((visa) => {
                  const style = ENTRY_STYLE[visa.entryType] ?? { label: visa.entryType, pill: "bg-muted text-muted-foreground" };
                  const el = entriesLabel(visa.entries);
                  const typeLabel = visaTypeLabel(visa.visaType);
                  return (
                    <div key={visa.id} className="border border-border rounded-xl overflow-hidden">
                      {/* Header row */}
                      <div className="flex items-center gap-3 p-4 bg-muted/20 border-b border-border/60">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-bold text-base flex-1">{typeLabel}</span>
                        <Badge variant="secondary" className={`font-semibold border-none text-xs ${style.pill}`}>
                          {style.label}
                        </Badge>
                        {el && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5">
                            <Repeat className="w-3 h-3" /> {el}
                          </span>
                        )}
                      </div>
                      {/* Stats row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/50">
                        <div className="p-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Max Stay</div>
                          <div className="font-bold text-lg">{visa.durationDays ? `${visa.durationDays} days` : "Unlimited"}</div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><DollarSign className="w-3.5 h-3.5" /> Fee</div>
                          <div className="font-bold text-lg">{visa.fee ? `$${visa.fee}` : "Free"}</div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><CalendarDays className="w-3.5 h-3.5" /> Validity</div>
                          <div className="font-bold text-lg">{visa.validityDays ? `${visa.validityDays} days` : "—"}</div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><RefreshCw className="w-3.5 h-3.5" /> Processing</div>
                          <div className="font-bold text-lg">{visa.processingDays ? `~${visa.processingDays} days` : "Instant"}</div>
                        </div>
                      </div>
                      {/* Apply footer */}
                      <div className="flex items-center border-t border-border/60 divide-x divide-border/60">
                        <Link
                          href={`/visa/${visa.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted/30 transition-all"
                        >
                          Full details
                        </Link>
                        {visa.officialUrl ? (
                          <a
                            href={visa.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-all"
                          >
                            Apply now <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground/40">
                            No official link
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 mx-auto text-muted mb-3" />
                <p className="font-semibold mb-1">No specific data for this passport</p>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  We don't have entry rules for {fromPassportSample?.passportCountryName ?? fromCode} passport holders visiting {country.name} yet. Check the official embassy website.
                </p>
              </div>
            )
          ) : (
            /* Generic: compact grid of all passport rules */
            country.visas && country.visas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {country.visas.map((visa) => {
                  const style = ENTRY_STYLE[visa.entryType] ?? { label: visa.entryType, pill: "bg-muted text-muted-foreground" };
                  const el = entriesLabel(visa.entries);
                  const typeLabel = visaTypeLabel(visa.visaType);
                  return (
                    <div key={visa.id} className="flex flex-col border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group">
                      <div className="p-4 pb-3 border-b border-border/60">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{visa.passportCountryFlag}</span>
                            <span className="font-bold group-hover:text-primary transition-colors text-sm leading-tight">{visa.passportCountryName}</span>
                          </div>
                          <Badge variant="secondary" className={`font-semibold border-none text-xs shrink-0 ${style.pill}`}>
                            {style.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5">
                            <FileText className="w-3 h-3" /> {typeLabel}
                          </span>
                          {el && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5">
                              <Repeat className="w-3 h-3" /> {el}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-border/50 flex-1">
                        <div className="p-3">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5"><Clock className="w-3 h-3" /> Max Stay</div>
                          <div className="font-semibold text-sm">{visa.durationDays ? `${visa.durationDays} days` : "Unlimited"}</div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5"><DollarSign className="w-3 h-3" /> Fee</div>
                          <div className="font-semibold text-sm">{visa.fee ? `$${visa.fee}` : "Free"}</div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5"><CalendarDays className="w-3 h-3" /> Valid For</div>
                          <div className="font-semibold text-sm">{visa.validityDays ? `${visa.validityDays} days` : "—"}</div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5"><RefreshCw className="w-3 h-3" /> Processing</div>
                          <div className="font-semibold text-sm">{visa.processingDays ? `${visa.processingDays} days` : "Instant"}</div>
                        </div>
                      </div>
                      <div className="flex items-center border-t border-border/60 divide-x divide-border/60">
                        <Link href={`/visa/${visa.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted/30 transition-all">
                          Full details
                        </Link>
                        {visa.officialUrl ? (
                          <a href={visa.officialUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-all">
                            Apply <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted/40 cursor-default">No link</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                No visa rules documented for this destination yet.
              </div>
            )
          )}
        </div>

        {/* ── Country Facts ── */}
        {countryFacts && (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6">Country Facts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <Languages className="w-3.5 h-3.5" /> Official Languages
                </div>
                <p className="font-semibold text-sm">{countryFacts.officialLanguages.join(", ")}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <Coins className="w-3.5 h-3.5" /> Currency
                </div>
                <p className="font-semibold text-sm">
                  <span className="text-primary mr-1">{countryFacts.currencySymbol}</span>
                  {countryFacts.currencyName}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <Clock className="w-3.5 h-3.5" /> Timezone
                </div>
                <p className="font-semibold text-sm">{countryFacts.timezone}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <Globe className="w-3.5 h-3.5" /> Religions
                </div>
                <p className="font-semibold text-sm">{countryFacts.religions.join(", ")}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <Phone className="w-3.5 h-3.5" /> Calling Code
                </div>
                <p className="font-semibold text-sm">{countryFacts.callingCode}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <Users className="w-3.5 h-3.5" /> Population
                </div>
                <p className="font-semibold text-sm">{countryFacts.population}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <Car className="w-3.5 h-3.5" /> Driving Side
                </div>
                <p className="font-semibold text-sm capitalize">{countryFacts.drivingSide} side</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Ad unit — between visa cards and community sections ── */}
        <div className="py-2">
          <AdUnit slot="2345678901" format="auto" className="pt-5" />
        </div>

        {/* ── Travel Map Quick-Add ── */}
        {code && <TravelMapSection code={code} countryName={country.name} flagEmoji={country.flagEmoji ?? ""} />}

        {/* ── Reviews ── */}
        {code && <ReviewsSection code={code} countryName={country.name} />}

        {/* ── Q&A ── */}
        {code && <QASection code={code} countryName={country.name} />}

        {/* ── Visa Processing Times ── */}
        {code && <VisaReportsSection code={code} countryName={country.name} />}

      </div>
    </div>
  );
}

/* ─────────── Travel Map section ─────────── */
function TravelMapSection({ code, countryName, flagEmoji }: { code: string; countryName: string; flagEmoji: string }) {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [] } = useGetTravelMap({
    query: { queryKey: getGetTravelMapQueryKey(), enabled: isAuthenticated },
  });

  const { mutate: upsert, isPending: isUpserting } = useUpsertTravelEntry({
    mutation: {
      onSuccess: () => { void queryClient.invalidateQueries({ queryKey: getGetTravelMapQueryKey() }); },
    },
  });
  const { mutate: remove, isPending: isRemoving } = useDeleteTravelEntry({
    mutation: {
      onSuccess: () => { void queryClient.invalidateQueries({ queryKey: getGetTravelMapQueryKey() }); },
    },
  });

  const current = entries.find((e) => e.countryCode === code);
  const isPending = isUpserting || isRemoving;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{flagEmoji}</span>
        <h2 className="text-lg font-bold">Add to My Travel Map</h2>
      </div>
      {!isAuthenticated ? (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground flex-1">Sign in to track {countryName} on your map.</p>
          <Button size="sm" onClick={login}><CheckCircle2 className="w-4 h-4 mr-1.5" /> Sign in</Button>
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap">
          <Button
            size="sm"
            variant={current?.status === "visited" ? "default" : "outline"}
            disabled={isPending}
            onClick={() =>
              current?.status === "visited"
                ? remove({ code })
                : upsert({ code, data: { status: "visited" } })
            }
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
            {current?.status === "visited" ? "✓ Visited" : "Mark as Visited"}
          </Button>
          <Button
            size="sm"
            variant={current?.status === "want_to_visit" ? "default" : "outline"}
            disabled={isPending}
            onClick={() =>
              current?.status === "want_to_visit"
                ? remove({ code })
                : upsert({ code, data: { status: "want_to_visit" } })
            }
          >
            <Heart className="w-4 h-4 mr-1.5 text-primary" />
            {current?.status === "want_to_visit" ? "✓ Saved" : "Want to Visit"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─────────── Reviews section ─────────── */
function ReviewsSection({ code, countryName }: { code: string; countryName: string }) {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [overall, setOverall] = useState(0);
  const [ease, setEase] = useState(0);
  const [welcome, setWelcome] = useState(0);
  const [body, setBody] = useState("");

  const { data: reviewsData } = useGetCountryReviews(code, {
    query: { queryKey: getGetCountryReviewsQueryKey(code) },
  });

  const { mutate: submitReview, isPending: submitting } = useCreateCountryReview({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetCountryReviewsQueryKey(code) });
        setShowForm(false);
        setTitle(""); setOverall(0); setEase(0); setWelcome(0); setBody("");
      },
    },
  });

  const reviews = reviewsData?.reviews ?? [];
  const avg = reviewsData?.avgRatings;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> Traveler Reviews
          </h2>
          {avg && avg.overall != null && reviews.length > 0 && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <StarRow rating={avg.overall} />
                <span className="text-sm font-semibold">{avg.overall.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
              </div>
            </div>
          )}
        </div>
        {isAuthenticated && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" /> Write a Review
          </Button>
        )}
        {!isAuthenticated && (
          <Button size="sm" variant="outline" onClick={login}>
            Sign in to review
          </Button>
        )}
      </div>

      {showForm && (
        <form
          className="bg-muted/30 rounded-xl p-5 space-y-4 border border-border/60"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !overall) return;
            submitReview({ code, data: { title: title.trim(), overallRating: overall, easeRating: ease || overall, welcomeRating: welcome || overall, body: body.trim() || undefined } });
          }}
        >
          <h3 className="font-semibold text-sm">Your review of {countryName}</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience in one line…"
                maxLength={120}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Overall *</label>
              <StarInput value={overall} onChange={setOverall} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ease of Entry</label>
                <StarInput value={ease} onChange={setEase} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Welcoming</label>
                <StarInput value={welcome} onChange={setWelcome} />
              </div>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience (optional)..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting || !overall || !title.trim()}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
              Submit
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="w-8 h-8 mx-auto mb-2 text-muted" />
          <p className="text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border/60 last:border-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {(r.user?.firstName || "A")[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{r.user?.firstName || "Traveler"}</span>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
              </div>
              {r.title && <p className="text-sm font-semibold mb-1">{r.title}</p>}
              <StarRow rating={r.overallRating} />
              {r.body && <p className="text-sm text-muted-foreground mt-2">{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── Q&A section ─────────── */
function QASection({ code, countryName }: { code: string; countryName: string }) {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: questions = [] } = useGetCountryQuestions(code, {
    query: { queryKey: getGetCountryQuestionsQueryKey(code) },
  });

  const { mutate: submitQ, isPending: submittingQ } = useCreateCountryQuestion({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetCountryQuestionsQueryKey(code) });
        setShowForm(false); setTitle(""); setBody("");
      },
    },
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Questions & Answers
        </h2>
        {isAuthenticated && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" /> Ask a Question
          </Button>
        )}
        {!isAuthenticated && (
          <Button size="sm" variant="outline" onClick={login}>
            Sign in to ask
          </Button>
        )}
      </div>

      {showForm && (
        <form
          className="bg-muted/30 rounded-xl p-5 space-y-3 border border-border/60"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            submitQ({ code, data: { title: title.trim(), body: body.trim() || "" } });
          }}
        >
          <h3 className="font-semibold text-sm">Ask about {countryName}</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your question (required)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add more context (optional)..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submittingQ || !title.trim()}>
              {submittingQ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
              Post Question
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted" />
          <p className="text-sm">No questions yet. Ask the community!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionItem
              key={q.id}
              q={q}
              isExpanded={expanded === q.id}
              onToggle={() => setExpanded(expanded === q.id ? null : q.id)}
              isAuthenticated={isAuthenticated}
              onLogin={login}
              queryClient={queryClient}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionItem({
  q, isExpanded, onToggle, isAuthenticated, onLogin, queryClient,
}: {
  q: QuestionSummary;
  isExpanded: boolean;
  onToggle: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [answerText, setAnswerText] = useState("");

  const { data: qaData, isLoading: answersLoading } = useGetQuestionAnswers(q.id, {
    query: { queryKey: getGetQuestionAnswersQueryKey(q.id), enabled: isExpanded },
  });
  const answers = qaData?.answers ?? [];

  const { mutate: submitAnswer, isPending: submittingA } = usePostAnswer({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetQuestionAnswersQueryKey(q.id) });
        setAnswerText("");
      },
    },
  });

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <div
        className="w-full text-left p-4 hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link href={`/questions/${q.id}`} onClick={(e) => e.stopPropagation()}>
              <p className="font-medium text-sm hover:text-primary transition-colors">{q.title}</p>
            </Link>
            {q.body && !isExpanded && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{q.body}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{q.answersCount} {q.answersCount === 1 ? "answer" : "answers"}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/60 p-4 space-y-4">
          {q.body && <p className="text-sm text-muted-foreground">{q.body}</p>}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Asked by {q.user?.firstName || "Anonymous"} · {timeAgo(q.createdAt)}
            </p>
            <Link href={`/questions/${q.id}`}>
              <span className="text-xs text-primary hover:underline flex items-center gap-1">
                View full discussion →
              </span>
            </Link>
          </div>

          {answersLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : answers.length > 0 ? (
            <div className="space-y-3">
              {answers.map((a) => (
                <div key={a.id} className="pl-4 border-l-2 border-primary/30">
                  <p className="text-sm">{a.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.user?.firstName || "Anonymous"} · {timeAgo(a.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No answers yet.</p>
          )}

          {isAuthenticated ? (
            <div className="flex gap-2">
              <input
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write an answer..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && answerText.trim()) {
                    e.preventDefault();
                    submitAnswer({ id: q.id, data: { body: answerText.trim() } });
                  }
                }}
              />
              <Button
                size="sm"
                disabled={submittingA || !answerText.trim()}
                onClick={() => submitAnswer({ id: q.id, data: { body: answerText.trim() } })}
              >
                {submittingA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={onLogin}>Sign in to answer</Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────── Visa Reports / Processing Times ─────────── */
const RESULT_STYLE: Record<string, { label: string; cls: string }> = {
  approved: { label: "Approved", cls: "bg-emerald-500/10 text-emerald-400" },
  denied:   { label: "Denied",   cls: "bg-rose-500/10 text-rose-400" },
  pending:  { label: "Pending",  cls: "bg-amber-500/10 text-amber-400" },
};

const VISA_TYPES = [
  "Tourist", "Business", "Student", "Work", "Transit",
  "Digital Nomad", "Retirement", "Investor", "Other",
];

function VisaReportsSection({ code, countryName }: { code: string; countryName: string }) {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [passportCode, setPassportCode] = useState("");
  const [visaType, setVisaType] = useState("Tourist");
  const [appliedAt, setAppliedAt] = useState("");
  const [decidedAt, setDecidedAt] = useState("");
  const [result, setResult] = useState<"approved" | "denied" | "pending">("approved");
  const [notes, setNotes] = useState("");

  const { data: stats, isLoading } = useGetVisaReports(code, {}, {
    query: { queryKey: getGetVisaReportsQueryKey(code, {}) },
  });

  const { mutate: submit, isPending: submitting } = useSubmitVisaReport({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetVisaReportsQueryKey(code, {}) });
        setShowForm(false);
        setPassportCode(""); setAppliedAt(""); setDecidedAt(""); setNotes("");
        setResult("approved"); setVisaType("Tourist");
      },
    },
  });

  const reports = stats?.reports ?? [];
  const count = stats?.count ?? 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" /> Processing Times
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Community-reported visa application timelines for {countryName}
          </p>
        </div>
        {isAuthenticated && !showForm ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" /> Share Report
          </Button>
        ) : !isAuthenticated ? (
          <Button size="sm" variant="outline" onClick={login}>Sign in to share</Button>
        ) : null}
      </div>

      {/* Stats strip */}
      {count > 0 && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{count}</div>
            <div className="text-xs text-muted-foreground mt-1">Reports</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{stats.avgDays != null ? `${stats.avgDays}d` : "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">Avg Processing</div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.approvedCount ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Approved</div>
          </div>
          <div className="bg-rose-500/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-rose-400">{stats.deniedCount ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Denied</div>
          </div>
        </div>
      )}

      {/* By-passport breakdown */}
      {(stats?.byPassport?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> By Passport
          </h3>
          <div className="space-y-2">
            {(stats?.byPassport ?? []).map((p) => (
              <div key={p.passportCode} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                <span className="text-lg">{p.passportFlag ?? "🌍"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{p.passportName ?? p.passportCode}</span>
                    <Badge variant="secondary" className="text-xs border-none bg-primary/10 text-primary">{p.count} {p.count === 1 ? "report" : "reports"}</Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {p.avgDays != null && <span><Clock className="w-3 h-3 inline mr-0.5" />{p.avgDays}d avg</span>}
                    {(p.approvedCount ?? 0) > 0 && <span className="text-emerald-400">✓ {p.approvedCount} approved</span>}
                    {(p.deniedCount ?? 0) > 0 && <span className="text-rose-400">✗ {p.deniedCount} denied</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit form */}
      {showForm && (
        <form
          className="bg-muted/30 rounded-xl p-5 space-y-4 border border-border/60"
          onSubmit={(e) => {
            e.preventDefault();
            if (!passportCode || !appliedAt) return;
            submit({
              code,
              data: {
                passportCode: passportCode.toUpperCase(),
                visaType,
                appliedAt,
                decidedAt: decidedAt || undefined,
                result,
                notes: notes || undefined,
              },
            });
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Share Your Visa Experience</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Your Passport (code, e.g. NG)</label>
              <input
                value={passportCode}
                onChange={(e) => setPassportCode(e.target.value.toUpperCase())}
                placeholder="US, IN, NG…"
                maxLength={2}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Visa Type</label>
              <select
                value={visaType}
                onChange={(e) => setVisaType(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {VISA_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Applied On</label>
              <input
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Decided On (optional)</label>
              <input
                type="date"
                value={decidedAt}
                onChange={(e) => setDecidedAt(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Result</label>
            <div className="flex gap-2">
              {(["approved", "denied", "pending"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResult(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${result === r ? RESULT_STYLE[r].cls + " ring-1 ring-current" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                >
                  {RESULT_STYLE[r].label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any tips or context (e.g. which consulate, documents requested)..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting || !passportCode || !appliedAt}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Award className="w-4 h-4 mr-1.5" />}
              Submit Report
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Reports list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : reports.length === 0 && !showForm ? (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart2 className="w-8 h-8 mx-auto mb-2 text-muted" />
          <p className="text-sm">No reports yet. Share your visa experience to help others!</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" /> Recent Reports
          </h3>
          {reports.slice(0, 8).map((r) => {
            const rs = RESULT_STYLE[r.result] ?? RESULT_STYLE.pending;
            return (
              <div key={r.id} className="flex items-start gap-3 p-4 bg-muted/20 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{r.visaType} Visa</span>
                    <Badge variant="secondary" className={`text-xs border-none ${rs.cls}`}>{rs.label}</Badge>
                    {r.processingDays != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {r.processingDays} days
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">· 🛂 {r.passportCode}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Applied: {new Date(r.appliedAt).toLocaleDateString()}
                    {r.decidedAt && ` · Decided: ${new Date(r.decidedAt).toLocaleDateString()}`}
                    {r.user?.firstName && ` · By ${r.user.firstName}`}
                  </div>
                  {r.notes && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{r.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

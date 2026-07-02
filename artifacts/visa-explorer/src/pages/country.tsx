import { Helmet } from "react-helmet-async";
import { useParams, useSearch } from "wouter";
import { useState } from "react";
import {
  useGetCountry, getGetCountryQueryKey,
  useGetCountryReviews, getGetCountryReviewsQueryKey,
  useCreateCountryReview, useDeleteCountryReview,
  useGetCountryQuestions, getGetCountryQuestionsQueryKey,
  useCreateCountryQuestion, useDeleteQuestion,
  useGetQuestionAnswers, getGetQuestionAnswersQueryKey,
  usePostAnswer,
  useUpsertTravelEntry, useDeleteTravelEntry, useGetTravelMap, getGetTravelMapQueryKey,
  useGetVisaReports, getGetVisaReportsQueryKey,
  useSubmitVisaReport,
  useListVisaGuideEntries, useCreateVisaGuideEntry, useUpdateVisaGuideEntry, useDeleteVisaGuideEntry,
  getListVisaGuideEntriesQueryKey,
  useListVisaApplications, useCreateVisaApplication, useUpdateVisaApplication, useDeleteVisaApplication,
  getListVisaApplicationsQueryKey,
} from "@workspace/api-client-react";
import type { QuestionSummary, VisaGuideEntry, VisaApplication } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, MapPin, Coins, Languages, ArrowLeft, Loader2, Camera, Clock, DollarSign, CalendarDays, RefreshCw, Repeat, ExternalLink, FileText, Phone, Car, Users, Star, MessageSquare, ChevronDown, ChevronUp, CheckCircle2, Heart, PlusCircle, Send, BarChart2, TrendingUp, Award, X, Trash2, Plus, Pencil, Check, AlertCircle, MinusCircle, Link as LinkIcon } from "lucide-react";
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
      <Helmet>
        <title>{country.name} Visa Requirements & Reviews — Visagram</title>
        <meta name="description" content={`Find visa requirements for ${country.name}${country.capital ? ` (capital: ${country.capital})` : ""}${country.continent ? `, ${country.continent}` : ""}. Read real traveler reviews, ask questions, and track your ${country.name} visa application.`} />
        <meta property="og:title" content={`${country.name} Visa Requirements & Reviews — Visagram`} />
        <meta property="og:description" content={`Discover visa requirements, traveler reviews, and entry rules for ${country.name}. Join the community and plan your trip with confidence.`} />
        <meta property="og:url" content={`https://visagram.app/country/${code}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          "name": country.name,
          "description": `Visa requirements, traveler reviews, and entry rules for ${country.name}.`,
          "url": `https://visagram.app/country/${code}`,
          "touristType": country.continent
        })}</script>
      </Helmet>
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

        {/* ── Visa Tracker & Community Guide ── */}
        {code && <CountryTrackerSection code={code} countryName={country.name} />}

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
  const { user, isAuthenticated, login } = useAuth();
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

  const { mutate: deleteReview } = useDeleteCountryReview({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: getGetCountryReviewsQueryKey(code) }),
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                  {user?.id === r.user?.userId && (
                    <button
                      onClick={() => { if (confirm("Delete your review?")) deleteReview({ code }); }}
                      className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
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

  const { mutate: deleteQ } = useDeleteQuestion({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: getGetCountryQuestionsQueryKey(code) }),
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
              onDelete={deleteQ}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionItem({
  q, isExpanded, onToggle, isAuthenticated, onLogin, queryClient, onDelete,
}: {
  q: QuestionSummary;
  isExpanded: boolean;
  onToggle: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  queryClient: ReturnType<typeof useQueryClient>;
  onDelete?: (args: { id: number }) => void;
}) {
  const [answerText, setAnswerText] = useState("");
  const { user: authUser } = useAuth();

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
            {onDelete && authUser?.id === q.user?.userId && (
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("Delete this question?")) onDelete({ id: q.id }); }}
                className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete question"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
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

/* ─────────── Visa Tracker & Community Guide section ─────────── */
const TRACKER_CATS = [
  { value: "travel",      label: "Travel",      emoji: "✈️",  desc: "Tourist, visitor & transit visas" },
  { value: "work",        label: "Work",         emoji: "💼",  desc: "Work permits & employment visas" },
  { value: "pr",          label: "PR",           emoji: "🏠",  desc: "Permanent residency applications" },
  { value: "citizenship", label: "Citizenship",  emoji: "🛂",  desc: "Naturalisation & citizenship" },
  { value: "partner",     label: "Partner",      emoji: "💑",  desc: "Spouse, partner & family visas" },
] as const;

type TrackerCat = typeof TRACKER_CATS[number]["value"];

const APP_STATUS = {
  applied:   { label: "Applied",    icon: Clock,        cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  in_review: { label: "In Review",  icon: AlertCircle,  cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  approved:  { label: "Approved",   icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  rejected:  { label: "Rejected",   icon: X,            cls: "bg-destructive/15 text-destructive border-destructive/30" },
  withdrawn: { label: "Withdrawn",  icon: MinusCircle,  cls: "bg-muted text-muted-foreground border-border" },
} as const;

type AppStatusKey = keyof typeof APP_STATUS;

function appFmt(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function appInitials(a: { firstName?: string | null; lastName?: string | null }) {
  return [(a.firstName ?? "")[0], (a.lastName ?? "")[0]].filter(Boolean).join("").toUpperCase() || "?";
}
function appName(a: { firstName?: string | null; lastName?: string | null }) {
  return [a.firstName, a.lastName].filter(Boolean).join(" ") || "Traveler";
}

const GUIDE_EMPTY = { visaRequired: true, processingTime: "", officialFee: "", maxStay: "", requirements: "", applicationUrl: "", notes: "" };

function CountryTrackerSection({ code, countryName }: { code: string; countryName: string }) {
  const { user, isAuthenticated, login } = useAuth();
  const userId = (user as { id?: string })?.id ?? "";
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TrackerCat>("travel");

  /* — Guide state — */
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState<VisaGuideEntry | null>(null);
  const [gForm, setGForm] = useState({ ...GUIDE_EMPTY });

  /* — Case state — */
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cPassport, setCPassport] = useState<string | null>(null);
  const [cDate, setCDate] = useState(new Date().toISOString().split("T")[0]);
  const [cStatus, setCStatus] = useState<AppStatusKey>("applied");
  const [cComment, setCComment] = useState("");
  const [cEditStatus, setCEditStatus] = useState<Record<number, boolean>>({});

  /* — Guide queries — */
  const guideKey = getListVisaGuideEntriesQueryKey({ countryCode: code, category: activeTab });
  const { data: guideEntries = [], isLoading: guideLoading } = useListVisaGuideEntries(
    { countryCode: code, category: activeTab },
    { query: { queryKey: guideKey } }
  );
  const invalidateGuide = () => void qc.invalidateQueries({ queryKey: guideKey });

  const { mutate: createGuide, isPending: creatingGuide } = useCreateVisaGuideEntry({ mutation: { onSuccess: () => { invalidateGuide(); closeGuide(); } } });
  const { mutate: updateGuide, isPending: updatingGuide } = useUpdateVisaGuideEntry({ mutation: { onSuccess: () => { invalidateGuide(); closeGuide(); } } });
  const { mutate: deleteGuide } = useDeleteVisaGuideEntry({ mutation: { onSuccess: invalidateGuide } });

  /* — Case queries — */
  const appKey = getListVisaApplicationsQueryKey();
  const { data: allApps = [], isLoading: appsLoading } = useListVisaApplications({ query: { queryKey: appKey } });
  const apps = allApps.filter((a) => a.countryCode === code && a.visaType === activeTab);
  const invalidateApps = () => void qc.invalidateQueries({ queryKey: appKey });

  const { mutate: createApp, isPending: creatingApp } = useCreateVisaApplication({ mutation: { onSuccess: () => { invalidateApps(); closeCase(); } } });
  const { mutate: updateApp } = useUpdateVisaApplication({ mutation: { onSuccess: invalidateApps } });
  const { mutate: deleteApp } = useDeleteVisaApplication({ mutation: { onSuccess: invalidateApps } });

  function openGuideCreate() { setEditingGuide(null); setGForm({ ...GUIDE_EMPTY }); setShowGuideModal(true); }
  function openGuideEdit(e: VisaGuideEntry) { setEditingGuide(e); setGForm({ visaRequired: e.visaRequired, processingTime: e.processingTime ?? "", officialFee: e.officialFee ?? "", maxStay: e.maxStay ?? "", requirements: e.requirements ?? "", applicationUrl: e.applicationUrl ?? "", notes: e.notes ?? "" }); setShowGuideModal(true); }
  function closeGuide() { setShowGuideModal(false); setEditingGuide(null); setGForm({ ...GUIDE_EMPTY }); }
  function submitGuide() {
    const data = { countryCode: code, countryName, category: activeTab, visaRequired: gForm.visaRequired, processingTime: gForm.processingTime || undefined, officialFee: gForm.officialFee || undefined, maxStay: gForm.maxStay || undefined, requirements: gForm.requirements || undefined, applicationUrl: gForm.applicationUrl || undefined, notes: gForm.notes || undefined };
    editingGuide ? updateGuide({ id: editingGuide.id, data }) : createGuide({ data });
  }

  function openCase() { if (!isAuthenticated) { login(); return; } setCTitle(""); setCPassport(null); setCDate(new Date().toISOString().split("T")[0]); setCStatus("applied"); setCComment(""); setShowCaseModal(true); }
  function closeCase() { setShowCaseModal(false); }
  function submitCase() {
    if (!cTitle.trim() || !cDate) return;
    createApp({ data: { title: cTitle.trim(), countryCode: code, countryName, passportCode: cPassport ?? undefined, visaType: activeTab as "travel" | "work" | "pr" | "citizenship" | "partner", applicationDate: cDate, status: cStatus, comment: cComment || undefined } });
  }

  const cat = TRACKER_CATS.find((c) => c.value === activeTab)!;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/60">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" /> Visa Tracker & Community Guide
        </h2>
        {/* Category tabs */}
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1 overflow-x-auto">
          {TRACKER_CATS.map((c) => (
            <button key={c.value} onClick={() => setActiveTab(c.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === c.value ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span>{c.emoji}</span>{c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* ── Guide Entries ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary" /> Community Info</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.emoji} {cat.desc}</p>
            </div>
            {isAuthenticated ? (
              <Button size="sm" onClick={openGuideCreate} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Info</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={login} className="gap-1.5">Sign in to contribute</Button>
            )}
          </div>

          {guideLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : guideEntries.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3 border border-dashed border-border/60 rounded-xl text-center">
              <span className="text-3xl">{cat.emoji}</span>
              <div>
                <p className="text-sm font-medium">No {cat.label} visa info yet for {countryName}</p>
                <p className="text-xs text-muted-foreground">Be the first to share community knowledge.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {guideEntries.map((e) => (
                <div key={e.id} className="bg-background border border-border/60 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {((e.firstName ?? "")[0] || "?").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{[e.firstName, e.lastName].filter(Boolean).join(" ") || "Community"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${e.visaRequired ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                        {e.visaRequired ? "Visa Required" : "Visa Free"}
                      </Badge>
                      {e.userId === userId && (
                        <div className="flex gap-0.5 ml-1">
                          <button onClick={() => openGuideEdit(e)} className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Pencil className="w-3 h-3" /></button>
                          <button onClick={() => { if (confirm("Delete?")) deleteGuide({ id: e.id }); }} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {e.processingTime && <div className="bg-muted/50 rounded-lg px-2.5 py-1.5"><div className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Processing</div><p className="text-xs font-semibold">{e.processingTime}</p></div>}
                    {e.officialFee && <div className="bg-muted/50 rounded-lg px-2.5 py-1.5"><div className="text-[10px] text-muted-foreground flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" />Fee</div><p className="text-xs font-semibold">{e.officialFee}</p></div>}
                    {e.maxStay && <div className="bg-muted/50 rounded-lg px-2.5 py-1.5"><div className="text-[10px] text-muted-foreground flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" />Max Stay</div><p className="text-xs font-semibold">{e.maxStay}</p></div>}
                  </div>
                  {e.requirements && <p className="text-xs text-muted-foreground leading-relaxed mb-2">{e.requirements}</p>}
                  {e.notes && <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1.5">{e.notes}</p>}
                  {e.applicationUrl && <a href={e.applicationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"><ExternalLink className="w-3 h-3" />Official portal</a>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Application Cases ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> Application Timeline</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{apps.length} communit{apps.length === 1 ? "y case" : "y cases"} shared for {countryName} {cat.label}</p>
            </div>
            <Button size="sm" onClick={openCase} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add My Case</Button>
          </div>

          {appsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : apps.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3 border border-dashed border-border/60 rounded-xl text-center">
              <TrendingUp className="w-8 h-8 text-muted" />
              <div>
                <p className="text-sm font-medium">No cases yet</p>
                <p className="text-xs text-muted-foreground">Share your {cat.label} visa application to help others.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/40">
                    {["Applicant", "Nationality", "Applied", "Days", "Status", "Notes", ""].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {apps.map((app) => {
                    const isOwn = app.userId === userId;
                    const sc = APP_STATUS[app.status as AppStatusKey] ?? APP_STATUS.applied;
                    const ScIcon = sc.icon;
                    return (
                      <tr key={app.id} className={`hover:bg-muted/20 transition-colors ${isOwn ? "bg-primary/[0.03]" : ""}`}>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {app.profileImageUrl ? (
                              <img src={app.profileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{appInitials(app)}</div>
                            )}
                            <span className="text-xs font-medium">{appName(app)}{isOwn && <span className="text-[10px] text-primary ml-1">(you)</span>}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {app.passportCode ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {app.passportFlag && <span>{app.passportFlag}</span>}
                              {app.passportName ?? app.passportCode}
                            </span>
                          ) : <span className="text-xs text-muted-foreground/40">—</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-xs text-muted-foreground">{appFmt(app.applicationDate)}</span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {(app as VisaApplication & { processingDays?: number | null }).processingDays != null ? (
                            <span className="text-xs font-medium text-amber-400">{(app as VisaApplication & { processingDays?: number | null }).processingDays}d</span>
                          ) : <span className="text-xs text-muted-foreground/40">—</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {isOwn && cEditStatus[app.id] ? (
                            <div className="flex flex-col gap-1 w-28">
                              {(Object.keys(APP_STATUS) as AppStatusKey[]).map((s) => (
                                <button key={s} onClick={() => { updateApp({ id: app.id, data: { status: s } }); setCEditStatus((p) => ({ ...p, [app.id]: false })); }}
                                  className={`text-left text-[11px] px-2 py-1 rounded-lg flex items-center gap-1.5 hover:bg-muted transition-colors ${app.status === s ? "font-semibold text-primary" : ""}`}>
                                  {s === app.status && <Check className="w-2.5 h-2.5" />}{APP_STATUS[s].label}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <button onClick={() => isOwn && setCEditStatus((p) => ({ ...p, [app.id]: true }))}
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${isOwn ? "cursor-pointer hover:opacity-80" : "cursor-default"} ${sc.cls}`}>
                              <ScIcon className="w-2.5 h-2.5" />{sc.label}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2.5 max-w-[160px]">
                          <span className="text-xs text-muted-foreground truncate block">{app.comment || "—"}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          {isOwn && <button onClick={() => { if (confirm("Remove?")) deleteApp({ id: app.id }); }} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Guide Modal ── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeGuide(); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h3 className="font-semibold">{editingGuide ? "Edit Info" : `Add ${cat.emoji} ${cat.label} Visa Info`}</h3>
              <button onClick={closeGuide} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div><p className="text-sm font-medium">Visa Required</p><p className="text-xs text-muted-foreground">Is a visa needed?</p></div>
                <button type="button" onClick={() => setGForm((f) => ({ ...f, visaRequired: !f.visaRequired }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${gForm.visaRequired ? "bg-primary" : "bg-muted border border-border"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${gForm.visaRequired ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              {([
                { key: "processingTime", icon: <Clock className="w-3.5 h-3.5" />, label: "Processing Time", ph: "e.g. 2–4 weeks" },
                { key: "officialFee", icon: <DollarSign className="w-3.5 h-3.5" />, label: "Official Fee", ph: "e.g. $160 USD" },
                ...(activeTab === "travel" ? [{ key: "maxStay", icon: <CalendarDays className="w-3.5 h-3.5" />, label: "Max Stay", ph: "e.g. 90 days" }] : []),
                { key: "applicationUrl", icon: <LinkIcon className="w-3.5 h-3.5" />, label: "Official URL", ph: "https://..." },
              ] as { key: keyof typeof gForm; icon: React.ReactNode; label: string; ph: string }[]).map(({ key, icon, label, ph }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">{icon} {label}</label>
                  <input value={gForm[key] as string} onChange={(e) => setGForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" maxLength={200} />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Key Requirements</label>
                <textarea value={gForm.requirements} onChange={(e) => setGForm((f) => ({ ...f, requirements: e.target.value }))} placeholder="e.g. Valid passport, bank statements, return ticket…"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50" maxLength={800} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Notes / Tips</label>
                <textarea value={gForm.notes} onChange={(e) => setGForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anything else travelers should know…"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary/50" maxLength={600} />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5 shrink-0">
              <Button className="flex-1" disabled={creatingGuide || updatingGuide} onClick={submitGuide}>
                {(creatingGuide || updatingGuide) ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
                {editingGuide ? "Save Changes" : "Add Info"}
              </Button>
              <Button variant="ghost" onClick={closeGuide}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Case Modal ── */}
      {showCaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeCase(); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Add {cat.emoji} {cat.label} Application — {countryName}</h3>
              <button onClick={closeCase} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Title *</label>
                <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="e.g. Japan Tourist Visa — March 2025" maxLength={120}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Your Nationality (passport)</label>
                <select value={cPassport ?? ""} onChange={(e) => setCPassport(e.target.value || null)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                  <option value="">Select passport country…</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Leave blank if you prefer not to share</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Applied Date *</label>
                <input type="date" value={cDate} onChange={(e) => setCDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Current Status *</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(APP_STATUS) as [AppStatusKey, typeof APP_STATUS[AppStatusKey]][]).map(([val, c]) => (
                    <button key={val} onClick={() => setCStatus(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${cStatus === val ? "bg-primary text-primary-foreground" : "bg-background border border-border hover:border-primary/30"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes (optional)</label>
                <textarea value={cComment} onChange={(e) => setCComment(e.target.value)} placeholder="Stream, office, any helpful details…"
                  rows={2} maxLength={300}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <Button variant="outline" onClick={closeCase} className="flex-1">Cancel</Button>
              <Button onClick={submitCase} disabled={!cDate || !cTitle.trim() || creatingApp} className="flex-1">
                {creatingApp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

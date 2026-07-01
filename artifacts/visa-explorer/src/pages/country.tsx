import { useParams, useSearch } from "wouter";
import { useGetCountry, getGetCountryQueryKey } from "@workspace/api-client-react";
import { Globe, MapPin, Coins, Languages, ArrowLeft, Loader2, Camera, Clock, DollarSign, CalendarDays, RefreshCw, Repeat, ExternalLink, FileText, Phone, Car, Users } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { getCountryImageUrl, getCountryFallbackImageUrl, getCountryLandmarkInfo } from "@/lib/countryImages";
import { getCountryDetails } from "@/lib/countryDetails";

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
      </div>
    </div>
  );
}

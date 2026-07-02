import { Helmet } from "react-helmet-async";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import {
  useListCountries, getListCountriesQueryKey,
  useListDestinationsByPassport, getListDestinationsByPassportQueryKey,
  useListVisas, getListVisasQueryKey,
} from "@workspace/api-client-react";
import { Search, Map as MapIcon, Globe, ArrowRight, Filter, DollarSign, Clock, CheckCircle2, HelpCircle, FileWarning, AlertCircle, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getCountryImageUrl, getCountryFallbackImageUrl } from "@/lib/countryImages";

type EntryType = "visa_free" | "visa_on_arrival" | "evisa" | "visa_required";

const ACCESS_GROUPS: { type: EntryType; label: string; short: string; icon: typeof CheckCircle2; color: string; pill: string }[] = [
  { type: "visa_free",       label: "Visa-Free",       short: "Just show up — no visa paperwork needed.",                 icon: CheckCircle2, color: "text-emerald-400", pill: "bg-emerald-500/10 text-emerald-400" },
  { type: "visa_on_arrival", label: "Visa on Arrival",  short: "Get stamped at the airport. No advance application.",     icon: HelpCircle,   color: "text-blue-400",    pill: "bg-blue-500/10 text-blue-400" },
  { type: "evisa",           label: "eVisa",            short: "Apply online beforehand — quick, easy, no embassy visit.", icon: FileWarning,  color: "text-amber-400",   pill: "bg-amber-500/10 text-amber-400" },
  { type: "visa_required",   label: "Visa Required",    short: "Embassy visit required. Plan ahead before your trip.",    icon: AlertCircle,  color: "text-rose-400",    pill: "bg-rose-500/10 text-rose-400" },
];

interface PickedCountry { code: string; name: string; flagEmoji: string }

export default function Explore() {
  const [activeTab, setActiveTab] = useState<"countries" | "visas">("countries");

  // ── Browse Countries state ──
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState<string>("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // ── Search Visas combobox state ──
  const [passportQuery, setPassportQuery] = useState("");     // typed text
  const [pickedPassport, setPickedPassport] = useState<PickedCountry | null>(null); // resolved selection
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Queries ──
  const { data: countries, isLoading: loadingCountries } = useListCountries(
    { search: search || undefined, continent: continent || undefined },
    { query: {
        enabled: activeTab === "countries",
        queryKey: getListCountriesQueryKey({ search: search || undefined, continent: continent || undefined }),
      }
    }
  );

  // Live suggestions for the passport combobox
  const isCodeLike = passportQuery.length <= 3 && /^[a-zA-Z]+$/.test(passportQuery);
  const { data: suggestions, isLoading: loadingSuggestions } = useListCountries(
    { search: passportQuery || undefined },
    { query: {
        enabled: activeTab === "visas" && passportQuery.length >= 1 && !pickedPassport,
        queryKey: getListCountriesQueryKey({ search: passportQuery || undefined }),
      }
    }
  );

  // Filter suggestions: if it looks like a code (≤3 chars), match by code prefix too
  const filteredSuggestions = (suggestions?.slice(0, 8) ?? []).filter(c => {
    if (!passportQuery) return false;
    const q = passportQuery.toUpperCase();
    return (
      c.code.startsWith(q) ||
      c.name.toUpperCase().includes(q)
    );
  });

  const { data: destinations, isLoading: loadingDestinations } = useListDestinationsByPassport(
    { passportCode: selectedCode ?? "" },
    { query: {
        enabled: !!selectedCode,
        queryKey: getListDestinationsByPassportQueryKey({ passportCode: selectedCode ?? "" }),
      }
    }
  );

  const { data: visaData, isLoading: loadingVisas } = useListVisas(
    { passportCountry: pickedPassport?.code || undefined, limit: 50 },
    { query: {
        enabled: activeTab === "visas" && !!pickedPassport,
        queryKey: getListVisasQueryKey({ passportCountry: pickedPassport?.code || undefined, limit: 50 }),
      }
    }
  );

  const selectedCountry = countries?.find(c => c.code === selectedCode);
  const continents = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"];
  const groupedDestinations = ACCESS_GROUPS.map(g => ({
    ...g,
    items: destinations?.destinations.filter(d => d.entryType === g.type) ?? [],
  }));

  function pickPassport(c: PickedCountry) {
    setPickedPassport(c);
    setPassportQuery(c.name);
    setDropdownOpen(false);
  }

  function clearPassport() {
    setPickedPassport(null);
    setPassportQuery("");
    setDropdownOpen(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Explore Destinations — Visa Requirements by Country | Visagram</title>
        <meta name="description" content="Browse visa requirements for 190+ countries. Filter by your passport to instantly see where you can travel visa-free, on arrival, with an eVisa, or with a full visa." />
        <meta property="og:title" content="Explore Destinations — Visa Requirements by Country | Visagram" />
        <meta property="og:description" content="Browse visa requirements for 190+ countries. Filter by your passport to instantly see where you can travel visa-free, on arrival, or with a visa." />
        <meta property="og:url" content="https://visagram.io/explore" />
        <meta property="og:image" content="https://visagram.io/og-image.png" />
        <meta name="twitter:image" content="https://visagram.io/og-image.png" />
      </Helmet>
      {/* ── Header ── */}
      <div className="bg-card/40 border-b border-border py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-serif font-bold mb-1">Explore Destinations</h1>
          <p className="text-muted-foreground mb-7 text-sm">
            Pick your home country to instantly see every destination your passport can unlock.
          </p>

          {/* Tab switch */}
          <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit mb-6 border border-border">
            {(["countries", "visas"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedCode(null); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "countries" ? "Browse Countries" : "Search Visas"}
              </button>
            ))}
          </div>

          {/* ── Browse Countries: search + region filters ── */}
          {activeTab === "countries" && (
            <div className="flex flex-col md:flex-row gap-3 max-w-4xl">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search countries..."
                  className="pl-9 h-11 bg-card border-border"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedCode(null); }}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                <button
                  onClick={() => setContinent("")}
                  className={`whitespace-nowrap px-4 h-11 rounded-lg font-medium text-sm transition-all border ${
                    !continent ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All regions
                </button>
                {continents.map(c => (
                  <button
                    key={c}
                    onClick={() => setContinent(c)}
                    className={`whitespace-nowrap px-4 h-11 rounded-lg font-medium text-sm transition-all border ${
                      continent === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Search Visas: passport combobox ── */}
          {activeTab === "visas" && (
            <div className="max-w-sm" ref={comboRef}>
              <div className="relative">
                {/* Icon / flag */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {pickedPassport
                    ? <span className="text-lg leading-none">{pickedPassport.flagEmoji}</span>
                    : <Globe className="w-4 h-4 text-muted-foreground" />
                  }
                </div>

                <Input
                  placeholder="Country name or code (e.g. Japan, US)..."
                  className={`pl-9 h-11 bg-card border-border pr-9 ${pickedPassport ? "font-medium text-foreground" : ""}`}
                  value={passportQuery}
                  onFocus={() => { if (!pickedPassport) setDropdownOpen(true); }}
                  onChange={(e) => {
                    setPassportQuery(e.target.value);
                    setPickedPassport(null);
                    setDropdownOpen(true);
                  }}
                  autoComplete="off"
                />

                {/* Clear button */}
                {(passportQuery || pickedPassport) && (
                  <button
                    onClick={clearPassport}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Dropdown */}
                {dropdownOpen && passportQuery.length >= 1 && !pickedPassport && (
                  <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                    {loadingSuggestions ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
                      </div>
                    ) : filteredSuggestions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">No countries match "{passportQuery}"</div>
                    ) : (
                      filteredSuggestions.map(c => (
                        <button
                          key={c.code}
                          onMouseDown={(e) => e.preventDefault()}   // keep focus on input
                          onClick={() => pickPassport({ code: c.code, name: c.name, flagEmoji: c.flagEmoji })}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                        >
                          <span className="text-xl">{c.flagEmoji}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{c.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">{c.code}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {!pickedPassport && (
                <p className="text-xs text-muted-foreground mt-2">
                  Type a country name like <span className="font-medium text-foreground">Japan</span> or a 2-letter code like <span className="font-medium text-foreground">US</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="container mx-auto px-4 py-10 pb-24">

        {/* ════════ Browse Countries tab ════════ */}
        {activeTab === "countries" && (
          <>
            {/* STEP 1: no selection yet — show country picker */}
            {!selectedCode && (
              <>
                {loadingCountries ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
                  </div>
                ) : countries?.length === 0 ? (
                  <div className="text-center py-24">
                    <MapIcon className="w-14 h-14 mx-auto text-muted mb-4" />
                    <h3 className="text-xl font-bold mb-2">No countries found</h3>
                    <p className="text-muted-foreground text-sm">Try adjusting your search or region filter.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-5">
                      <span className="font-semibold text-foreground">Select your home country below</span> — we'll show you everywhere your passport can take you.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {countries?.map((country) => {
                        const imgUrl = getCountryImageUrl(country.code, 480, 220);
                        return (
                          <button
                            key={country.code}
                            onClick={() => setSelectedCode(country.code)}
                            className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all text-left cursor-pointer"
                          >
                            <div className="relative h-32 overflow-hidden bg-muted">
                              <img
                                src={imgUrl ?? getCountryFallbackImageUrl(country.code, 480, 220)}
                                alt={country.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(country.code, 480, 220); }}
                              />
                              <div className="absolute bottom-2 left-3 text-3xl drop-shadow-md">{country.flagEmoji}</div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-1">{country.name}</h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Globe className="w-3 h-3" /><span>{country.continent}</span>
                              </div>
                            </div>
                            <div className="px-4 py-3 border-t border-border/60 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                              <span>Select as my country</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* STEP 2: country selected — show identity + destinations */}
            {selectedCode && (
              <div>
                {/* Identity banner */}
                <div className="relative rounded-2xl overflow-hidden mb-8 border border-border">
                  <img
                    src={getCountryImageUrl(selectedCode, 1200, 300) ?? getCountryFallbackImageUrl(selectedCode, 1200, 300)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(selectedCode, 1200, 300); }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
                  <div className="relative z-10 flex items-center justify-between px-6 md:px-8 py-7">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl md:text-6xl drop-shadow-lg">{selectedCountry?.flagEmoji}</span>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-0.5">Your current country</div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white">{selectedCountry?.name}</h2>
                        {destinations && (
                          <p className="text-white/60 text-sm mt-1">
                            Your passport unlocks{" "}
                            <span className="text-white font-semibold">{destinations.totalDestinations} destinations</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCode(null)}
                      className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" /> Change
                    </button>
                  </div>
                </div>

                {/* Quick stats */}
                {destinations && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                    {ACCESS_GROUPS.map(({ type, label, icon: Icon, color }) => {
                      const count = destinations.destinations.filter(d => d.entryType === type).length;
                      return (
                        <div key={type} className="rounded-xl p-4 border border-border bg-card">
                          <Icon className={`w-4 h-4 ${color} mb-2`} />
                          <div className={`text-2xl font-black ${color}`}>{count}</div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {loadingDestinations ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-12">
                    {groupedDestinations.map(({ type, label, short, icon: Icon, color, pill, items }) => {
                      if (items.length === 0) return null;
                      return (
                        <section key={type}>
                          <div className="flex items-start gap-3 mb-5 pb-4 border-b border-border">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-border bg-card">
                              <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <h3 className="text-lg font-bold">{label}</h3>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pill}`}>{items.length} countries</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">{short}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items.map(dest => {
                              const code = dest.destinationCountryCode ?? "xx";
                              const imgUrl = getCountryImageUrl(code, 400, 180);
                              return (
                                <Link
                                  key={dest.id}
                                  href={`/country/${code}?from=${selectedCode}`}
                                  className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                                >
                                  <div className="h-20 overflow-hidden">
                                    <img
                                      src={imgUrl ?? getCountryFallbackImageUrl(code, 400, 180)}
                                      alt=""
                                      className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                                      onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(code, 400, 180); }}
                                    />
                                  </div>
                                  <div className="px-3.5 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{dest.destinationCountryFlag}</span>
                                      <span className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{dest.destinationCountryName}</span>
                                    </div>
                                    {dest.durationDays && (
                                      <span className="text-xs text-muted-foreground ml-1 shrink-0">{dest.durationDays}d</span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ════════ Search Visas tab ════════ */}
        {activeTab === "visas" && (
          <>
            {!pickedPassport ? (
              <div className="text-center py-20">
                <Globe className="w-12 h-12 mx-auto text-muted mb-4" />
                <h3 className="text-xl font-bold mb-2">Search by passport</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Type a country name like <span className="font-medium text-foreground">Japan</span>, or a code like{" "}
                  <span className="font-medium text-foreground">US</span>, to see all their visa rules.
                </p>
              </div>
            ) : loadingVisas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array(9).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
              </div>
            ) : visaData?.visas.length === 0 ? (
              <div className="text-center py-24">
                <Filter className="w-14 h-14 mx-auto text-muted mb-4" />
                <h3 className="text-xl font-bold mb-2">No visa rules found</h3>
                <p className="text-muted-foreground text-sm">No data yet for this country. Try another.</p>
              </div>
            ) : (
              <>
                {/* Passport identity strip */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-card border border-border rounded-xl">
                  <span className="text-3xl">{pickedPassport.flagEmoji}</span>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Showing results for</div>
                    <div className="font-bold text-lg">{pickedPassport.name} passport</div>
                  </div>
                  <span className="text-sm text-muted-foreground">{visaData?.visas.length} rules found</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visaData?.visas.map((visa) => {
                    const imgUrl = getCountryImageUrl(visa.destinationCountryCode ?? "", 480, 220);
                    return (
                      <Link
                        key={visa.id}
                        href={`/visa/${visa.id}`}
                        className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        <div className="h-24 overflow-hidden">
                          <img
                            src={imgUrl ?? getCountryFallbackImageUrl(visa.destinationCountryCode ?? "xx", 480, 220)}
                            alt=""
                            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity group-hover:scale-105 duration-500"
                            onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(visa.destinationCountryCode ?? "xx", 480, 220); }}
                          />
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2.5 mb-3">
                            <span className="text-3xl">{visa.destinationCountryFlag}</span>
                            <div>
                              <h4 className="font-bold leading-tight">{visa.destinationCountryName}</h4>
                              <p className="text-xs text-muted-foreground">For {visa.passportCountryName} passport holders</p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs font-medium border-none mb-3 ${
                              visa.entryType === "visa_free"       ? "bg-emerald-500/10 text-emerald-400"
                              : visa.entryType === "visa_on_arrival" ? "bg-blue-500/10 text-blue-400"
                              : visa.entryType === "evisa"           ? "bg-amber-500/10 text-amber-400"
                              : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {visa.entryType.replace(/_/g, " ")}
                          </Badge>
                          <div className="flex justify-between text-sm pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{visa.durationDays ? `${visa.durationDays} days` : "Unlimited"}</span>
                            </div>
                            <div className="flex items-center gap-1 font-medium">
                              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{visa.fee ? `$${visa.fee}` : "Free"}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

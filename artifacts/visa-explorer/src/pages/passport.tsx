import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListCountries, getListCountriesQueryKey, useListDestinationsByPassport, getListDestinationsByPassportQueryKey, useGetPassportRankings, getGetPassportRankingsQueryKey } from "@workspace/api-client-react";
import { CheckCircle2, FileWarning, HelpCircle, AlertCircle, Loader2, Globe, ChevronDown, Search } from "lucide-react";
import { getCountryImageUrl, getCountryFallbackImageUrl, getCountryLandmarkInfo } from "@/lib/countryImages";

type EntryType = "visa_free" | "visa_on_arrival" | "evisa" | "visa_required";

const ACCESS_GROUPS: { type: EntryType; label: string; tagline: string; icon: typeof CheckCircle2; color: string; bg: string }[] = [
  {
    type: "visa_free",
    label: "Visa-Free",
    tagline: "Just show up — no visa needed at all.",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    type: "visa_on_arrival",
    label: "Visa on Arrival",
    tagline: "Get your visa stamp at the airport when you land.",
    icon: HelpCircle,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    type: "evisa",
    label: "e-Visa",
    tagline: "Apply online before your trip — quick and easy.",
    icon: FileWarning,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    type: "visa_required",
    label: "Visa Required",
    tagline: "You'll need to apply at the embassy before traveling.",
    icon: AlertCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
];

export default function PassportPower() {
  const [selectedPassport, setSelectedPassport] = useState<string>("US");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: countries, isLoading: loadingCountries } = useListCountries(
    {},
    { query: { queryKey: getListCountriesQueryKey({}) } }
  );

  const { data: passportData, isLoading: loadingData } = useListDestinationsByPassport(
    { passportCode: selectedPassport },
    {
      query: {
        enabled: !!selectedPassport,
        queryKey: getListDestinationsByPassportQueryKey({ passportCode: selectedPassport })
      }
    }
  );

  const { data: rankings } = useGetPassportRankings({
    query: { queryKey: getGetPassportRankingsQueryKey() }
  });

  const myRank = rankings?.find(r => r.code === selectedPassport);

  const selectedCountry = countries?.find(c => c.code === selectedPassport);
  const heroImg = selectedPassport ? getCountryImageUrl(selectedPassport, 1200, 400) : null;
  const landmarkInfo = selectedPassport ? getCountryLandmarkInfo(selectedPassport) : null;

  const filteredCountries = countries?.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-passport-dropdown]")) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const groupedDestinations = ACCESS_GROUPS.map(group => ({
    ...group,
    destinations: passportData?.destinations.filter(d => d.entryType === group.type) ?? [],
  }));

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Passport Power Rankings — Compare Passport Strength | Visagram</title>
        <meta name="description" content="Compare the strength of passports from 190+ countries. See how many destinations each passport unlocks visa-free, on arrival, or with an eVisa." />
        <meta property="og:title" content="Passport Power Rankings — Compare Passport Strength | Visagram" />
        <meta property="og:description" content="Compare the strength of passports from 190+ countries and discover where your passport unlocks visa-free access." />
        <meta property="og:url" content="https://visagram.app/passport" />
      </Helmet>
      {/* ── Identity hero ── */}
      <div className="relative overflow-hidden h-64 md:h-72">
        {/* Background landmark photo of selected passport country */}
        <img
          src={heroImg ?? getCountryFallbackImageUrl(selectedPassport, 1200, 400)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(selectedPassport, 1200, 400); }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/85" />

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-8">
          {/* Passport identity label */}
          <div className="flex items-center gap-3 mb-4">
            {selectedCountry && (
              <span className="text-5xl drop-shadow-lg">{selectedCountry.flagEmoji}</span>
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-0.5">Your passport</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {selectedCountry?.name ?? "Select your passport"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {passportData && (
                  <p className="text-white/60 text-sm">
                    Access to <span className="text-white font-semibold">{passportData.totalDestinations} destinations</span>
                  </p>
                )}
                {myRank && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/25 border border-primary/40 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    🏆 Ranked #{myRank.rank} of {rankings?.length} passports
                  </span>
                )}
              </div>
            </div>
          </div>

          {landmarkInfo && (
            <div className="text-white/35 text-xs">{landmarkInfo.landmark} · Photo by {landmarkInfo.credit} on Unsplash</div>
          )}
        </div>
      </div>

      {/* ── Passport picker ── */}
      <div className="container mx-auto px-4 -mt-6 relative z-20 mb-10">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xl max-w-xl">
          <p className="text-sm font-semibold text-muted-foreground mb-3">Change your passport country</p>

          {loadingCountries ? (
            <div className="h-12 bg-muted rounded-xl animate-pulse" />
          ) : (
            <div className="relative" data-passport-dropdown>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between gap-2 h-12 px-4 bg-muted rounded-xl text-left font-medium hover:bg-muted/70 transition-colors border border-border"
              >
                <span className="flex items-center gap-2.5">
                  {selectedCountry && <span className="text-xl">{selectedCountry.flagEmoji}</span>}
                  <span>{selectedCountry?.name ?? "Select country"}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-14 left-0 right-0 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        autoFocus
                        placeholder="Search countries..."
                        className="w-full pl-9 pr-3 py-2.5 bg-muted rounded-lg text-sm outline-none placeholder:text-muted-foreground"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredCountries?.map(c => (
                      <button
                        key={c.code}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors text-sm ${c.code === selectedPassport ? "bg-primary/10 text-primary font-semibold" : ""}`}
                        onClick={() => {
                          setSelectedPassport(c.code);
                          setDropdownOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <span className="text-xl">{c.flagEmoji}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 pb-24">
        {loadingData ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
        ) : passportData ? (
          <div className="space-y-10">
            {/* Access summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ACCESS_GROUPS.map(({ type, label, icon: Icon, color, bg }) => {
                const count = passportData.destinations.filter(d => d.entryType === type).length;
                return (
                  <div key={type} className={`rounded-2xl p-5 border ${bg}`}>
                    <Icon className={`w-5 h-5 ${color} mb-3`} />
                    <div className={`text-3xl font-black mb-1 ${color}`}>{count}</div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
                  </div>
                );
              })}
            </div>

            {/* Grouped destinations */}
            {groupedDestinations.map(({ type, label, tagline, icon: Icon, color, bg, destinations }) => {
              if (destinations.length === 0) return null;
              return (
                <div key={type}>
                  {/* Section header */}
                  <div className="flex items-start gap-4 mb-5 pb-4 border-b border-border">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${bg}`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{label} <span className="text-muted-foreground font-normal text-base">· {destinations.length} countries</span></h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{tagline}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {destinations.map(dest => {
                      const imgUrl = getCountryImageUrl(dest.destinationCountryCode ?? "", 400, 180);
                      return (
                        <Link
                          key={dest.id}
                          href={`/country/${dest.destinationCountryCode}?from=${selectedPassport}`}
                          className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/25 transition-all"
                        >
                          <div className="h-20 overflow-hidden">
                            <img
                              src={imgUrl ?? getCountryFallbackImageUrl(dest.destinationCountryCode ?? "xx", 400, 180)}
                              alt=""
                              className="w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                              onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(dest.destinationCountryCode ?? "xx", 400, 180); }}
                            />
                          </div>
                          <div className="px-3.5 py-3 flex items-center gap-2.5">
                            <span className="text-2xl">{dest.destinationCountryFlag}</span>
                            <span className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                              {dest.destinationCountryName}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

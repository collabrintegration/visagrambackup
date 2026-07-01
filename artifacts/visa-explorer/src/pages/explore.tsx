import { useState } from "react";
import { Link } from "wouter";
import { useListCountries, getListCountriesQueryKey, useListVisas, getListVisasQueryKey } from "@workspace/api-client-react";
import { Search, Map as MapIcon, Globe, ArrowRight, Filter, DollarSign, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getCountryImageUrl } from "@/lib/countryImages";

export default function Explore() {
  const [activeTab, setActiveTab] = useState<"countries" | "visas">("countries");
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState<string>("");
  const [passportCode, setPassportCode] = useState<string>("");

  const { data: countries, isLoading: loadingCountries } = useListCountries(
    { search: search || undefined, continent: continent || undefined },
    { query: {
        enabled: activeTab === "countries",
        queryKey: getListCountriesQueryKey({ search: search || undefined, continent: continent || undefined })
      }
    }
  );

  const { data: visaData, isLoading: loadingVisas } = useListVisas(
    { passportCountry: passportCode || undefined, continent: continent || undefined, limit: 50 },
    { query: {
        enabled: activeTab === "visas",
        queryKey: getListVisasQueryKey({ passportCountry: passportCode || undefined, continent: continent || undefined, limit: 50 })
      }
    }
  );

  const continents = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/40 border-b border-border py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-serif font-bold mb-2">Explore Destinations</h1>
          <p className="text-muted-foreground mb-8 max-w-xl">
            Browse every country in our database and discover their visa policies, entry requirements, and stay limits.
          </p>

          {/* Tab switch */}
          <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit mb-6 border border-border">
            {(["countries", "visas"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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

          {/* Search + continent filter */}
          <div className="flex flex-col md:flex-row gap-3 max-w-4xl">
            <div className="relative flex-1 max-w-sm">
              {activeTab === "countries" ? (
                <>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search countries..."
                    className="pl-9 h-11 bg-card border-border"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Your passport code (e.g. US, GB, IN)..."
                    className="pl-9 h-11 bg-card border-border uppercase"
                    value={passportCode}
                    onChange={(e) => setPassportCode(e.target.value.toUpperCase())}
                    maxLength={2}
                  />
                </>
              )}
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
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-10 pb-24">
        {activeTab === "countries" ? (
          loadingCountries ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
            </div>
          ) : countries?.length === 0 ? (
            <div className="text-center py-24">
              <MapIcon className="w-14 h-14 mx-auto text-muted mb-4" />
              <h3 className="text-xl font-bold mb-2">No destinations found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {countries?.map((country) => {
                const imgUrl = getCountryImageUrl(country.code, 480, 220);
                return (
                  <Link
                    key={country.code}
                    href={`/country/${country.code}`}
                    className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-32 overflow-hidden bg-muted">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={country.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full gradient-hero opacity-40" />
                      )}
                      {/* Flag overlay */}
                      <div className="absolute bottom-2 left-3 text-3xl drop-shadow-md">
                        {country.flagEmoji}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
                        {country.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        <span>{country.continent}</span>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-border/60 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>View visa rules</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          loadingVisas ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array(9).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
          ) : visaData?.visas.length === 0 ? (
            <div className="text-center py-24">
              <Filter className="w-14 h-14 mx-auto text-muted mb-4" />
              <h3 className="text-xl font-bold mb-2">No visa rules found</h3>
              <p className="text-muted-foreground text-sm">Try a different passport code or region filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visaData?.visas.map((visa) => {
                const imgUrl = getCountryImageUrl(visa.destinationCountryCode ?? "", 480, 220);
                return (
                  <Link
                    key={visa.id}
                    href={`/visa/${visa.id}`}
                    className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    {imgUrl && (
                      <div className="h-24 overflow-hidden">
                        <img src={imgUrl} alt="" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity group-hover:scale-105 duration-500" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="text-3xl">{visa.destinationCountryFlag}</span>
                        <div>
                          <h4 className="font-bold leading-tight">{visa.destinationCountryName}</h4>
                          <p className="text-xs text-muted-foreground">For {visa.passportCountryName} citizens</p>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`text-xs font-medium border-none mb-3 ${
                          visa.entryType === "visa_free" ? "bg-emerald-500/10 text-emerald-400"
                          : visa.entryType === "visa_on_arrival" ? "bg-blue-500/10 text-blue-400"
                          : visa.entryType === "evisa" ? "bg-amber-500/10 text-amber-400"
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
          )
        )}
      </div>
    </div>
  );
}

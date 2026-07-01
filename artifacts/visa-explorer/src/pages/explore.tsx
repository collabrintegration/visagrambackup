import { useState } from "react";
import { Link } from "wouter";
import { useListCountries, getListCountriesQueryKey, useListVisas, getListVisasQueryKey } from "@workspace/api-client-react";
import { Search, Map as MapIcon, Globe, ArrowRight, Filter, DollarSign, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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

  const continents = ["Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-serif font-bold mb-4">Explore Destinations</h1>
          <p className="text-primary-foreground/80 max-w-2xl mb-8">
            Browse our comprehensive database of countries and territories to discover their visa requirements and entry policies.
          </p>
          
          <div className="flex flex-col gap-4 max-w-4xl">
            <div className="flex gap-4 border-b border-primary-foreground/20 pb-4">
              <button 
                onClick={() => setActiveTab("countries")}
                className={`font-medium pb-2 -mb-[17px] border-b-2 transition-colors ${activeTab === "countries" ? "border-secondary text-secondary" : "border-transparent hover:text-primary-foreground/80"}`}
              >
                Browse Countries
              </button>
              <button 
                onClick={() => setActiveTab("visas")}
                className={`font-medium pb-2 -mb-[17px] border-b-2 transition-colors ${activeTab === "visas" ? "border-secondary text-secondary" : "border-transparent hover:text-primary-foreground/80"}`}
              >
                Search Visas
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-2">
              <div className="relative flex-1">
                {activeTab === "countries" ? (
                  <>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      placeholder="Search countries by name..." 
                      className="pl-10 h-12 bg-card text-foreground border-transparent focus-visible:ring-secondary"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      placeholder="Enter passport code (e.g. US, GB, IN)..." 
                      className="pl-10 h-12 bg-card text-foreground border-transparent focus-visible:ring-secondary uppercase"
                      value={passportCode}
                      onChange={(e) => setPassportCode(e.target.value.toUpperCase())}
                      maxLength={2}
                    />
                  </>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                <button 
                  onClick={() => setContinent("")}
                  className={`whitespace-nowrap px-4 h-12 rounded-md font-medium text-sm transition-colors ${!continent ? 'bg-secondary text-secondary-foreground' : 'bg-primary-foreground/10 hover:bg-primary-foreground/20'}`}
                >
                  All Regions
                </button>
                {continents.map(c => (
                  <button
                    key={c}
                    onClick={() => setContinent(c)}
                    className={`whitespace-nowrap px-4 h-12 rounded-md font-medium text-sm transition-colors ${continent === c ? 'bg-secondary text-secondary-foreground' : 'bg-primary-foreground/10 hover:bg-primary-foreground/20'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {activeTab === "countries" ? (
          loadingCountries ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(12).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : countries?.length === 0 ? (
            <div className="text-center py-24">
              <MapIcon className="w-16 h-16 mx-auto text-muted mb-4" />
              <h3 className="text-xl font-bold font-serif mb-2">No destinations found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {countries?.map((country) => (
                <Link 
                  key={country.code} 
                  href={`/country/${country.code}`}
                  className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-secondary/50 transition-all"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-5xl mb-4">{country.flagEmoji}</div>
                    <h3 className="text-lg font-bold font-serif group-hover:text-secondary transition-colors line-clamp-1">{country.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{country.continent}</span>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between text-sm font-medium">
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">View details</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          loadingVisas ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(9).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : visaData?.visas.length === 0 ? (
            <div className="text-center py-24">
              <Filter className="w-16 h-16 mx-auto text-muted mb-4" />
              <h3 className="text-xl font-bold font-serif mb-2">No visa rules found</h3>
              <p className="text-muted-foreground">Try a different passport code or region.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visaData?.visas.map((visa) => (
                <Link 
                  key={visa.id} 
                  href={`/visa/${visa.id}`}
                  className="block bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-secondary/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{visa.destinationCountryFlag}</span>
                      <div>
                        <h4 className="font-bold text-lg leading-tight group-hover:text-secondary transition-colors">{visa.destinationCountryName}</h4>
                        <p className="text-xs text-muted-foreground">For {visa.passportCountryName} citizens</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                      {visa.entryType.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between text-sm pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{visa.durationDays ? `${visa.durationDays} days` : 'Unlimited'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>{visa.fee ? `$${visa.fee}` : 'Free'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

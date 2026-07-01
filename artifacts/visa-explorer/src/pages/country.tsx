import { useParams } from "wouter";
import { useGetCountry, getGetCountryQueryKey } from "@workspace/api-client-react";
import { Globe, MapPin, Coins, Languages, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function CountryDetail() {
  const { code } = useParams<{ code: string }>();
  
  const { data: country, isLoading } = useGetCountry(code || "", {
    query: {
      enabled: !!code,
      queryKey: getGetCountryQueryKey(code || "")
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold font-serif mb-2">Country Not Found</h2>
        <Link href="/explore" className="text-secondary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground pt-12 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
          <span className="text-[400px] leading-none">{country.flagEmoji}</span>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/explore" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-8 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to destinations
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-8xl shadow-sm">{country.flagEmoji}</span>
            <div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">{country.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-primary-foreground/80">
                {country.continent && (
                  <div className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {country.continent}</div>
                )}
                {country.capital && (
                  <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {country.capital}</div>
                )}
                {country.currency && (
                  <div className="flex items-center gap-1.5"><Coins className="w-4 h-4" /> {country.currency}</div>
                )}
                {country.language && (
                  <div className="flex items-center gap-1.5"><Languages className="w-4 h-4" /> {country.language}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-24">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">Visa Requirements</h2>
              <p className="text-muted-foreground mt-1">Rules for travelers visiting {country.name}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-serif font-bold text-primary">{country.visas?.length || 0}</span>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Total Rules</p>
            </div>
          </div>

          {country.visas && country.visas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {country.visas.map((visa) => (
                <Link key={visa.id} href={`/visa/${visa.id}`} className="block border border-border rounded-lg p-5 hover:border-secondary transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{visa.passportCountryFlag}</span>
                      <span className="font-bold">{visa.passportCountryName}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Entry Type</div>
                      <Badge variant="secondary" className="font-medium bg-secondary/10 text-secondary border-none">
                        {visa.entryType.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm pt-3 border-t border-border/50">
                      <div>
                        <div className="text-muted-foreground mb-0.5">Duration</div>
                        <div className="font-medium">{visa.durationDays ? `${visa.durationDays} days` : 'Unlimited'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground mb-0.5">Fee</div>
                        <div className="font-medium">{visa.fee ? `$${visa.fee}` : 'Free'}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
             <div className="text-center py-16 text-muted-foreground">
               No visa rules documented for this destination yet.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

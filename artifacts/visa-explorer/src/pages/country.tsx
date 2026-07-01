import { useParams } from "wouter";
import { useGetCountry, getGetCountryQueryKey } from "@workspace/api-client-react";
import { Globe, MapPin, Coins, Languages, ArrowLeft, Loader2, Camera } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { getCountryImageUrl, getCountryFallbackImageUrl, getCountryLandmarkInfo } from "@/lib/countryImages";

export default function CountryDetail() {
  const { code } = useParams<{ code: string }>();

  const { data: country, isLoading } = useGetCountry(code || "", {
    query: {
      enabled: !!code,
      queryKey: getGetCountryQueryKey(code || "")
    }
  });

  const imageUrl = code ? getCountryImageUrl(code) : null;
  const landmarkInfo = code ? getCountryLandmarkInfo(code) : null;

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
      {/* Hero with landmark photo */}
      <div className="relative h-[55vh] min-h-[400px] max-h-[600px] overflow-hidden">
        {/* Background image — falls back to Picsum if Unsplash fails */}
        <img
          src={imageUrl ?? getCountryFallbackImageUrl(code ?? "xx", 1600, 900)}
          alt={landmarkInfo?.landmark ?? country.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(code ?? "xx", 1600, 900); }}
        />

        {/* Dark overlay — stronger at top for nav readability, fades to solid at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6 md:px-8">
          {/* Back link */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to destinations
          </Link>

          {/* Country info at bottom of hero */}
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

            {/* Photo credit */}
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

      {/* Visa rules content */}
      <div className="container mx-auto px-4 py-10 pb-24">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="flex justify-between items-end mb-8 border-b border-border pb-5">
            <div>
              <h2 className="text-2xl font-bold">Visa Requirements</h2>
              <p className="text-muted-foreground mt-1 text-sm">Entry rules for travelers visiting {country.name}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">{country.visas?.length || 0}</span>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Total Rules</p>
            </div>
          </div>

          {country.visas && country.visas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {country.visas.map((visa) => (
                <Link
                  key={visa.id}
                  href={`/visa/${visa.id}`}
                  className="block border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-muted/10 transition-all group"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-2xl">{visa.passportCountryFlag}</span>
                    <span className="font-bold group-hover:text-primary transition-colors">{visa.passportCountryName}</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1.5">Entry Type</div>
                      <Badge
                        variant="secondary"
                        className={`font-medium border-none text-xs ${
                          visa.entryType === "visa_free"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : visa.entryType === "visa_on_arrival"
                            ? "bg-blue-500/10 text-blue-400"
                            : visa.entryType === "evisa"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {visa.entryType.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="flex justify-between text-sm pt-3 border-t border-border/50">
                      <div>
                        <div className="text-muted-foreground text-xs mb-0.5">Duration</div>
                        <div className="font-medium">{visa.durationDays ? `${visa.durationDays} days` : "Unlimited"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground text-xs mb-0.5">Fee</div>
                        <div className="font-medium">{visa.fee ? `$${visa.fee}` : "Free"}</div>
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

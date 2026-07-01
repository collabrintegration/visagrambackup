import { useGetStatsOverview, getGetStatsOverviewQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Plane, Globe2, ShieldCheck, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading } = useGetStatsOverview({
    query: { queryKey: getGetStatsOverviewQueryKey() }
  });

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground py-24 md:py-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary via-primary to-primary"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold font-serif leading-tight mb-6">
              The World's Borders, <span className="text-secondary italic">Demystified.</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl font-light">
              Your definitive guide to global visa requirements. Discover where your passport can take you, and plan your next journey with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/explore" className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-md font-medium hover:bg-secondary/90 transition-colors">
                Explore Destinations <MapPin className="w-4 h-4" />
              </Link>
              <Link href="/passport" className="inline-flex items-center justify-center gap-2 bg-primary-foreground/10 text-primary-foreground px-8 py-4 rounded-md font-medium hover:bg-primary-foreground/20 transition-colors">
                Check My Passport <ShieldCheck className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {isLoading || !stats ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-4xl font-serif font-bold text-primary">{stats.totalCountries}</h3>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Destinations</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-4xl font-serif font-bold text-primary">{stats.totalVisaRecords.toLocaleString()}</h3>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visa Rules</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-4xl font-serif font-bold text-secondary">{Math.round(stats.visaFreePercent)}%</h3>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Global Visa-Free Rate</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-4xl font-serif font-bold text-primary">{stats.mostAccessiblePassports.length > 0 ? stats.mostAccessiblePassports[0].countryCode : '-'}</h3>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Most Powerful Passport</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Passports */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-2">Most Powerful Passports</h2>
              <p className="text-muted-foreground">Highest visa-free access globally</p>
            </div>
            <Link href="/passport" className="hidden md:flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading || !stats ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : (
              stats.mostAccessiblePassports.slice(0, 6).map((passport, idx) => (
                <Link key={passport.countryCode} href={`/country/${passport.countryCode}`} className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Plane className="w-24 h-24 rotate-45 text-primary" />
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{passport.flagEmoji}</span>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-secondary transition-colors">{passport.countryName}</h3>
                      <p className="text-sm text-muted-foreground">Rank #{idx + 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <span className="text-sm font-medium text-muted-foreground">Visa-free Destinations</span>
                    <span className="font-serif font-bold text-xl text-primary">{passport.visaFreeCount}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

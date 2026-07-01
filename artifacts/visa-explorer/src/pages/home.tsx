import { useGetStatsOverview, getGetStatsOverviewQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Zap, Globe2, ShieldCheck, MapPin, TrendingUp, Plane } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading } = useGetStatsOverview({
    query: { queryKey: getGetStatsOverviewQueryKey() }
  });

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-white py-24 md:py-36">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              Real-time visa data for 50+ countries
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-serif leading-[1.05] mb-6 tracking-tight">
              Know before<br />
              <span className="text-white/60">you</span>{" "}
              <span className="underline decoration-white/40 decoration-4 underline-offset-4">go.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/75 mb-10 max-w-xl font-light leading-relaxed">
              Instant visa requirements, fees, and entry rules for every passport — country by country.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/explore" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-7 py-3.5 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5">
                Explore Destinations <MapPin className="w-4 h-4" />
              </Link>
              <Link href="/passport" className="inline-flex items-center justify-center gap-2 glass text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/15 transition-all">
                My Passport <ShieldCheck className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-10 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-border">
            {isLoading || !stats ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-2 md:px-8 first:pl-0">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
              ))
            ) : (
              <>
                <div className="space-y-1 md:px-8 first:pl-0">
                  <h3 className="text-3xl font-bold text-foreground">{stats.totalCountries}</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Destinations</p>
                </div>
                <div className="space-y-1 md:px-8">
                  <h3 className="text-3xl font-bold text-foreground">{stats.totalVisaRecords.toLocaleString()}</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Visa Rules</p>
                </div>
                <div className="space-y-1 md:px-8">
                  <h3 className="text-3xl font-bold text-primary">{Math.round(stats.visaFreePercent)}%</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Visa-Free Rate</p>
                </div>
                <div className="space-y-1 md:px-8">
                  <h3 className="text-3xl font-bold text-foreground">{stats.mostAccessiblePassports[0]?.countryCode ?? '—'}</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Top Passport</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Plan smarter, travel further</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Everything you need to know about visas — in seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Globe2, title: "Search any destination", desc: "Browse 50+ countries with detailed visa policies, fees, and requirements.", color: "text-primary bg-primary/10" },
              { icon: ShieldCheck, title: "Check your passport", desc: "Select your passport country to instantly see where you can travel and what's needed.", color: "text-secondary bg-secondary/10" },
              { icon: TrendingUp, title: "Compare & decide", desc: "Filter by entry type, fee range, and duration to find the right destination for you.", color: "text-violet-500 bg-violet-500/10" },
            ].map((item) => (
              <div key={item.title} className="bg-card border border-border rounded-2xl p-7 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top passports */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-1.5">Most powerful passports</h2>
              <p className="text-muted-foreground text-sm">Ranked by visa-free access worldwide</p>
            </div>
            <Link href="/passport" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Compare passports <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading || !stats ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
            ) : (
              stats.mostAccessiblePassports.slice(0, 6).map((passport, idx) => (
                <Link
                  key={passport.countryCode}
                  href={`/country/${passport.countryCode}`}
                  className="group relative bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 transition-all hover:-translate-y-0.5 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Plane className="w-20 h-20 rotate-12 text-primary" />
                  </div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <span className="text-3xl">{passport.flagEmoji}</span>
                    <div>
                      <h3 className="font-bold leading-tight group-hover:text-primary transition-colors">{passport.countryName}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Rank #{idx + 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3.5 border-t border-border">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Visa-free access</span>
                    <span className="font-bold text-lg text-primary">{passport.visaFreeCount} countries</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="gradient-hero rounded-3xl p-10 md:p-16 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_60%,black)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to explore?</h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">Start by checking what your passport can unlock — then dive into the details.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/explore" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-7 py-3.5 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg">
                  Browse all countries <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/passport" className="inline-flex items-center justify-center gap-2 glass text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/15 transition-all">
                  Check my passport
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

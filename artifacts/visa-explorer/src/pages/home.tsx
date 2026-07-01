import { useGetStatsOverview, getGetStatsOverviewQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Zap, Globe2, ShieldCheck, MapPin, CheckCircle2, Compass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading } = useGetStatsOverview({
    query: { queryKey: getGetStatsOverviewQueryKey() }
  });

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background py-28 md:py-40">
        {/* Subtle rose glow behind hero */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-rose-600/8 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-pink-700/6 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-sm font-medium mb-8 border border-rose-500/20">
            <Zap className="w-3.5 h-3.5" />
            Real-time visa requirements updated daily
          </div>

          <h1 className="text-5xl md:text-7xl font-bold font-serif leading-[1.08] mb-6 tracking-tight text-white max-w-4xl">
            Know before{" "}
            <br className="hidden md:block" />
            <span className="text-rose-gradient">you go.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
            Navigate global entry requirements instantly. Check if you need a visa, how long you can stay, and what documents to bring.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full font-semibold hover:bg-primary/90 transition-all shadow-rose-glow"
            >
              <Compass className="w-4 h-4" />
              Explore Destinations
            </Link>
            <Link
              href="/passport"
              className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border px-7 py-3.5 rounded-full font-semibold hover:bg-secondary/80 transition-all"
            >
              My Passport
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-card/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-border">
            {isLoading || !stats ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-2 text-center md:px-8">
                  <Skeleton className="h-9 w-20 mx-auto bg-muted" />
                  <Skeleton className="h-3.5 w-28 mx-auto bg-muted" />
                </div>
              ))
            ) : (
              <>
                <div className="space-y-1 text-center md:px-8">
                  <h3 className="text-3xl font-bold text-foreground">{stats.totalCountries}+</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Destinations</p>
                </div>
                <div className="space-y-1 text-center md:px-8">
                  <h3 className="text-3xl font-bold text-foreground">{stats.totalVisaRecords.toLocaleString()}</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Visa Rules</p>
                </div>
                <div className="space-y-1 text-center md:px-8">
                  <h3 className="text-3xl font-bold text-primary">{Math.round(stats.visaFreePercent)}%</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Visa-Free Rate</p>
                </div>
                <div className="space-y-1 text-center md:px-8">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="text-3xl font-bold text-foreground">{stats.mostAccessiblePassports[0]?.countryCode ?? '—'}</h3>
                    <span className="text-primary text-2xl font-bold leading-none">#1</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Top Passport</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How it works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Your journey begins with certainty. Three simple steps to travel confidence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: MapPin, title: "Search destination", desc: "Enter where you want to go. We cover every country and territory globally." },
              { icon: ShieldCheck, title: "Check passport", desc: "Select your passport country to see personalized entry requirements instantly." },
              { icon: CheckCircle2, title: "Compare & decide", desc: "View stay limits, required documents, and eVisa options side-by-side." },
            ].map((item) => (
              <div key={item.title} className="bg-card border border-border rounded-3xl p-8 hover:bg-card/80 hover:border-primary/20 transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top passports */}
      <section className="py-20 bg-card/20 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1.5">Most powerful passports</h2>
              <p className="text-muted-foreground text-sm">Ranked by visa-free access worldwide</p>
            </div>
            <Link href="/passport" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Compare passports <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading || !stats ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl bg-muted" />)
            ) : (
              stats.mostAccessiblePassports.slice(0, 6).map((passport, idx) => (
                <Link
                  key={passport.countryCode}
                  href={`/country/${passport.countryCode}`}
                  className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:bg-card/80 transition-all"
                >
                  <div className="flex items-center gap-3.5 mb-4">
                    <span className="text-3xl">{passport.flagEmoji}</span>
                    <div>
                      <h3 className="font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{passport.countryName}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Rank #{idx + 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3.5 border-t border-border">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Visa-free access</span>
                    <span className="font-bold text-lg text-primary">{passport.visaFreeCount}</span>
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
          <div className="relative gradient-hero rounded-3xl p-10 md:p-16 text-white text-center overflow-hidden">
            <div className="absolute inset-0 bg-black/20 [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to explore?</h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">Start by checking what your passport can unlock — then dive into the details.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/explore" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-semibold hover:bg-white/90 transition-all shadow-lg">
                  Browse all countries <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/passport" className="inline-flex items-center justify-center gap-2 glass text-white px-7 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-all">
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

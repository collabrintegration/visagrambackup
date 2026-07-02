import { useGetStatsOverview, getGetStatsOverviewQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Zap, Globe2, ShieldCheck, MapPin, CheckCircle2, Compass, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCountryImageUrl, getCountryFallbackImageUrl } from "@/lib/countryImages";
import AdUnit from "@/components/ad-unit";

function formatRefreshTime(iso: string | null | undefined): string {
  if (!iso) return "checking…";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffM = Math.floor(diffMs / 60_000);
  if (diffM < 2) return "just now";
  if (diffH < 1) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const floatingPhotos = [
  { code: "JP", pos: "top-[12%] right-[8%]",  size: "w-36 h-36", cls: "float-a", delay: "0s" },
  { code: "GR", pos: "top-[20%] left-[6%]",   size: "w-28 h-28", cls: "float-b", delay: "1.5s" },
  { code: "AU", pos: "bottom-[22%] right-[12%]", size: "w-32 h-32", cls: "float-c", delay: "0.8s" },
  { code: "FR", pos: "bottom-[18%] left-[8%]",  size: "w-24 h-24", cls: "float-a", delay: "2.2s" },
  { code: "IN", pos: "top-[45%] right-[22%]",   size: "w-20 h-20", cls: "float-b", delay: "3s" },
  { code: "NO", pos: "top-[35%] left-[18%]",    size: "w-20 h-20", cls: "float-c", delay: "1s" },
];

const marqueePhotos = ["JP", "FR", "GR", "AU", "IT", "BR", "MX", "ZA", "IN", "CA", "TR", "NZ", "NO", "SG", "TH"];

export default function Home() {
  const { data: stats, isLoading } = useGetStatsOverview({
    query: {
      queryKey: getGetStatsOverviewQueryKey(),
      refetchInterval: 5 * 60 * 1000,   // re-poll stats every 5 minutes
    }
  });

  return (
    <div className="w-full">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-background" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-900/12 blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-pink-900/8 blur-[80px]" />
          <div className="absolute bottom-1/4 left-1/4 w-60 h-60 rounded-full bg-rose-950/10 blur-[80px]" />
        </div>

        {/* Floating landmark photos */}
        {floatingPhotos.map(({ code, pos, size, cls, delay }) => {
          const url = getCountryImageUrl(code, 400, 400) ?? getCountryFallbackImageUrl(code, 400, 400);
          return (
            <div
              key={code}
              className={`absolute ${pos} ${size} ${cls} pointer-events-none hidden lg:block`}
              style={{ animationDelay: delay }}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover rounded-2xl opacity-20 shadow-2xl border border-white/5"
                onError={(e) => {
                  const img = e.currentTarget;
                  const fallback = getCountryFallbackImageUrl(code, 400, 400);
                  if (img.src !== fallback) img.src = fallback;
                }}
              />
            </div>
          );
        })}

        {/* Hero content */}
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center pt-28 pb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary/80 text-sm font-medium mb-8 border border-primary/20">
            {stats?.refreshInProgress ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            Live data · refreshed {formatRefreshTime(stats?.lastRefreshedAt)}
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-serif leading-[1.05] mb-6 tracking-tight text-white max-w-4xl">
            Know before{" "}
            <br className="hidden md:block" />
            <span className="text-rose-gradient">you go.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            Pick your passport, pick a destination — instantly know if you need a visa, how long you can stay, and what to prepare.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-20">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold hover:bg-primary/90 transition-all shadow-rose-glow"
            >
              <Compass className="w-4 h-4" />
              Explore Destinations
            </Link>
            <Link
              href="/passport"
              className="inline-flex items-center justify-center gap-2 bg-card border border-border text-foreground px-8 py-3.5 rounded-full font-semibold hover:bg-muted/40 transition-all"
            >
              My Passport
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>

          {/* Stats inline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 text-center w-full max-w-2xl">
            {isLoading || !stats ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-16 mx-auto bg-muted" />
                  <Skeleton className="h-3 w-24 mx-auto bg-muted" />
                </div>
              ))
            ) : (
              <>
                <div>
                  <div className="text-3xl font-bold text-foreground">{stats.totalCountries}+</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Destinations</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{stats.totalVisaRecords.toLocaleString()}</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Visa Rules</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{Math.round(stats.visaFreePercent)}%</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Visa-Free Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{stats.mostAccessiblePassports[0]?.flagEmoji ?? "🌍"}</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Top Passport</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Destination photo marquee ── */}
      <section className="overflow-hidden border-y border-border py-5 bg-card/20">
        <div className="flex marquee-track gap-4 w-max">
          {[...marqueePhotos, ...marqueePhotos].map((code, i) => {
            const url = getCountryImageUrl(code, 320, 160) ?? getCountryFallbackImageUrl(code, 320, 160);
            return (
              <div key={i} className="w-52 h-28 flex-shrink-0 rounded-xl overflow-hidden">
                <img
                  src={url}
                  alt={code}
                  className="w-full h-full object-cover opacity-60 hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    const img = e.currentTarget;
                    const fallback = getCountryFallbackImageUrl(code, 320, 160);
                    if (img.src !== fallback) img.src = fallback;
                  }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Ad unit — between hero and how-it-works ── */}
      <section className="bg-background py-8">
        <div className="container mx-auto px-4 flex justify-center">
          <AdUnit slot="1234567890" format="leaderboard" className="pt-5 w-full max-w-3xl" />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How Visagram works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Three steps to travel confidence — no surprises at the border.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: MapPin,       step: "01", title: "Pick a destination",   desc: "Search or browse the 50+ countries we cover. Click any to see entry rules." },
              { icon: ShieldCheck,  step: "02", title: "Select your passport", desc: "Choose your passport nationality on the Passport Power page to personalize results." },
              { icon: CheckCircle2, step: "03", title: "Know before you go",   desc: "See stay limits, fees, and whether you need a visa — instantly." },
            ].map((item) => (
              <div key={item.title} className="relative bg-card border border-border rounded-3xl p-8 hover:border-primary/25 transition-all group overflow-hidden">
                <div className="absolute top-6 right-7 text-5xl font-black text-muted/20 font-serif select-none">{item.step}</div>
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-6 border border-primary/20">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top passports ── */}
      <section className="py-20 bg-card/20 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1.5">Most powerful passports</h2>
              <p className="text-muted-foreground text-sm">Ranked by the number of countries you can enter without a visa</p>
            </div>
            <Link href="/passport" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Check yours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading || !stats ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl bg-muted" />)
            ) : (
              stats.mostAccessiblePassports.slice(0, 6).map((passport, idx) => {
                const imgUrl = getCountryImageUrl(passport.countryCode, 600, 200);
                return (
                  <Link
                    key={passport.countryCode}
                    href={`/passport?code=${passport.countryCode}`}
                    className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <div className="h-24 overflow-hidden">
                      <img
                        src={imgUrl ?? getCountryFallbackImageUrl(passport.countryCode, 600, 200)}
                        alt={passport.countryName}
                        className="w-full h-full object-cover opacity-30 group-hover:opacity-45 transition-opacity"
                        onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(passport.countryCode, 600, 200); }}
                      />
                    </div>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{passport.flagEmoji}</span>
                        <div>
                          <div className="font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{passport.countryName}</div>
                          <div className="text-xs text-muted-foreground">Rank #{idx + 1}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">{passport.visaFreeCount}</div>
                        <div className="text-xs text-muted-foreground">visa-free</div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="relative gradient-hero rounded-3xl p-10 md:p-16 text-white text-center overflow-hidden">
            <div className="absolute inset-0 bg-black/20 [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to explore?</h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">Start by checking what your passport can unlock — then plan your next trip with confidence.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/explore" className="inline-flex items-center justify-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-semibold hover:bg-white/90 transition-all shadow-lg">
                  Browse all destinations <ArrowRight className="w-4 h-4" />
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

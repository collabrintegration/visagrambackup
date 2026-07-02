import { Helmet } from "react-helmet-async";
import { useGetStatsOverview, getGetStatsOverviewQueryKey, useListGroups, getListGroupsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  ArrowRight, Zap, Globe2, ShieldCheck, MapPin, CheckCircle2, Compass,
  RefreshCw, Users, MessageSquare, Star, HelpCircle, Mountain, Utensils,
  Backpack, Camera, Ship, Coffee, Plane, Heart,
} from "lucide-react";
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
  { code: "JP", pos: "top-[10%] right-[7%]",      size: "w-36 h-36", cls: "float-a", delay: "0s" },
  { code: "GR", pos: "top-[22%] left-[5%]",        size: "w-28 h-28", cls: "float-b", delay: "1.5s" },
  { code: "AU", pos: "bottom-[20%] right-[11%]",   size: "w-32 h-32", cls: "float-c", delay: "0.8s" },
  { code: "FR", pos: "bottom-[16%] left-[7%]",     size: "w-24 h-24", cls: "float-a", delay: "2.2s" },
  { code: "IN", pos: "top-[47%] right-[22%]",      size: "w-20 h-20", cls: "float-b", delay: "3s" },
  { code: "NO", pos: "top-[37%] left-[17%]",       size: "w-20 h-20", cls: "float-c", delay: "1s" },
];

const marqueePhotos = ["JP", "FR", "GR", "AU", "IT", "BR", "MX", "ZA", "IN", "CA", "TR", "NZ", "NO", "SG", "TH"];

const ACTIVITIES = [
  { icon: Mountain,  label: "Trekking",      desc: "Find trek partners heading to Nepal, Patagonia, or the Alps", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", href: "/groups" },
  { icon: Utensils,  label: "Food & Dining",  desc: "Discover hidden gems and dine with locals around the world", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   href: "/groups" },
  { icon: Backpack,  label: "Backpacking",    desc: "Budget travel crews sharing hostels, tips, and itineraries", color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    href: "/groups" },
  { icon: Camera,    label: "Photography",    desc: "Catch golden hour together and swap shooting locations",    color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20",  href: "/groups" },
  { icon: Ship,      label: "Cruising",       desc: "Port-stop planning, shore excursions, and cabin tips",      color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20",    href: "/groups" },
  { icon: Coffee,    label: "Slow Travel",    desc: "Remote workers and long-stay travelers sharing life abroad", color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20",    href: "/groups" },
];

const SOCIAL_PROOF_ITEMS = [
  { quote: "Found 3 travel buddies for my Everest Base Camp trek through the hiking group. Changed my whole trip.", name: "Arjun S.", flag: "🇮🇳", type: "Trek buddy" },
  { quote: "Asked about hidden ramen spots in Tokyo on the Q&A and got 12 amazing recommendations in minutes.", name: "Claire M.", flag: "🇨🇦", type: "Food explorer" },
  { quote: "The Australia PR group helped me understand the visa process better than any consultant.", name: "Wei L.", flag: "🇸🇬", type: "PR applicant" },
];

export default function Home() {
  const { data: stats, isLoading } = useGetStatsOverview({
    query: { queryKey: getGetStatsOverviewQueryKey(), refetchInterval: 5 * 60 * 1000 },
  });

  const { data: groups = [] } = useListGroups({
    query: { queryKey: getListGroupsQueryKey() },
  });

  const topGroups = [...groups].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5);

  return (
    <div className="w-full">
      <Helmet>
        <title>Visagram — Discover Visa Requirements & Travel the World</title>
        <meta name="description" content="Plan your next trip with Visagram. Explore visa requirements for 190+ countries, read real traveler reviews, compare passport power, and track your visa applications." />
        <meta property="og:title" content="Visagram — Discover Visa Requirements & Travel the World" />
        <meta property="og:description" content="Plan your next trip with Visagram. Explore visa requirements for 190+ countries, read real traveler reviews, compare passport power, and track your visa applications." />
        <meta property="og:url" content="https://visagram.io/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Visagram",
          "url": "https://visagram.io",
          "description": "Discover visa requirements for 190+ countries, read community reviews, compare passport power, and track your visa applications.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://visagram.io/explore?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}</script>
      </Helmet>

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
            <div key={code} className={`absolute ${pos} ${size} ${cls} pointer-events-none hidden lg:block`} style={{ animationDelay: delay }}>
              <img src={url} alt="" className="w-full h-full object-cover rounded-2xl opacity-20 shadow-2xl border border-white/5"
                onError={(e) => { const img = e.currentTarget; const fb = getCountryFallbackImageUrl(code, 400, 400); if (img.src !== fb) img.src = fb; }} />
            </div>
          );
        })}

        {/* Hero content */}
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center pt-24 pb-16">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary/80 text-sm font-medium mb-8 border border-primary/20">
            {stats?.refreshInProgress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Live data · refreshed {formatRefreshTime(stats?.lastRefreshedAt)}
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-serif leading-[1.05] mb-5 tracking-tight text-white max-w-4xl">
            Travel smarter,{" "}
            <br className="hidden md:block" />
            <span className="text-rose-gradient">together.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-xl leading-relaxed">
            Visa rules for 190+ countries — plus communities, groups, and real traveler Q&A to help every step of the journey.
          </p>

          {/* Community mini-strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Mountain className="w-4 h-4 text-emerald-400" />Trekking crews</span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5"><Utensils className="w-4 h-4 text-amber-400" />Dining groups</span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-primary" />Visa Q&A</span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-400" />Travel buddies</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <Link href="/groups"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold hover:bg-primary/90 transition-all shadow-rose-glow">
              <Users className="w-4 h-4" /> Find Your Travel Group
            </Link>
            <Link href="/explore"
              className="inline-flex items-center justify-center gap-2 bg-card border border-border text-foreground px-8 py-3.5 rounded-full font-semibold hover:bg-muted/40 transition-all">
              <Compass className="w-4 h-4" /> Explore Destinations
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>

          {/* Stats */}
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
                  <div className="text-3xl font-bold">{stats.totalCountries}+</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Destinations</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{groups.length}+</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Active Groups</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{Math.round(stats.visaFreePercent)}%</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Visa-Free Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.totalVisaRecords.toLocaleString()}</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Visa Rules</div>
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
                <img src={url} alt={code} className="w-full h-full object-cover opacity-60 hover:opacity-90 transition-opacity"
                  onError={(e) => { const img = e.currentTarget; const fb = getCountryFallbackImageUrl(code, 320, 160); if (img.src !== fb) img.src = fb; }} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Travel Together — activity categories ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary/80 text-sm font-medium mb-5 border border-primary/20">
              <Plane className="w-3.5 h-3.5" /> Travel Together
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Whatever your trip, find your people</h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              From high-altitude treks to rooftop dinners — Visagram connects you with travelers who share your exact vibe and destination.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-12">
            {ACTIVITIES.map((act) => (
              <Link key={act.label} href={act.href}
                className={`group flex items-start gap-4 p-5 rounded-2xl border ${act.bg} hover:scale-[1.02] transition-all`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${act.bg}`}>
                  <act.icon className={`w-5 h-5 ${act.color}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1 group-hover:text-white transition-colors">{act.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{act.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/groups"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border text-sm font-semibold hover:border-primary/40 hover:text-primary transition-all">
              Browse all travel groups <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live groups strip ── */}
      {topGroups.length > 0 && (
        <section className="py-16 bg-card/20 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Active right now</h2>
                <p className="text-sm text-muted-foreground">Join the conversation — travelers are chatting live</p>
              </div>
              <Link href="/groups" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                See all groups <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {topGroups.map((g) => (
                <Link key={g.id} href={`/groups/${g.id}`}
                  className="flex flex-col gap-3 bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:bg-card/80 transition-all group">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{g.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{g.name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Users className="w-2.5 h-2.5" /> {g.memberCount} members
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[11px] text-emerald-400 font-medium">Active chat</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Community + Q&A — full section ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary/80 text-sm font-medium mb-5 border border-primary/20">
              <MessageSquare className="w-3.5 h-3.5" /> Community
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ask anything. Share everything.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Real answers from real travelers — visa tips, hidden restaurant recs, trek safety, visa bureaucracy hacks, and more.
            </p>
          </div>

          {/* 3-column feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-16">
            {/* Q&A */}
            <Link href="/community?tab=questions"
              className="group relative bg-card border border-border rounded-3xl p-7 hover:border-primary/40 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 border border-primary/20">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Visa Q&A</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  "Can I extend on arrival?" "Do I need travel insurance?" Ask — thousands of experienced travelers will answer.
                </p>
                <div className="space-y-2 mb-5">
                  {["🇦🇺 Australia transit without visa?", "🇨🇦 PR processing time?", "🇯🇵 Tourist entry open again?"].map((q) => (
                    <div key={q} className="text-xs bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground">{q}</div>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                  Ask a question <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* Reviews */}
            <Link href="/community?tab=reviews"
              className="group relative bg-card border border-border rounded-3xl p-7 hover:border-primary/40 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-11 h-11 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-5 border border-amber-500/20">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Traveler Reviews</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  Real star-rated reviews of visa processes, border experiences, and destinations — unfiltered.
                </p>
                <div className="space-y-2 mb-5">
                  {[
                    { flag: "🇸🇬", text: "Super smooth e-visa. Got approval in 2h.", stars: 5 },
                    { flag: "🇩🇪", text: "Appointment wait time is brutal but worth it.", stars: 3 },
                  ].map((r) => (
                    <div key={r.text} className="flex items-start gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-sm shrink-0">{r.flag}</span>
                      <span className="text-xs text-muted-foreground flex-1 leading-relaxed">{r.text}</span>
                      <span className="text-[10px] text-amber-400 shrink-0">{"★".repeat(r.stars)}</span>
                    </div>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 group-hover:gap-2.5 transition-all">
                  Read reviews <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* Groups */}
            <Link href="/groups"
              className="group relative bg-card border border-border rounded-3xl p-7 hover:border-primary/40 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-11 h-11 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-5 border border-emerald-500/20">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Travel Groups</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  Private and public group chats for every kind of traveler — solo, families, expats, and adventurers.
                </p>
                <div className="space-y-2 mb-5">
                  {["🏔️ Himalayas Trek 2025", "🍜 Street Food Asia", "🇨🇦 Canada PR Journey"].map((g) => (
                    <div key={g} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-xs text-muted-foreground flex-1">{g}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    </div>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 group-hover:gap-2.5 transition-all">
                  Join a group <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* Social proof quotes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {SOCIAL_PROOF_ITEMS.map((item) => (
              <div key={item.name} className="bg-card/50 border border-border/60 rounded-2xl p-5">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{item.quote}"</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{item.flag}</span>
                  <div>
                    <div className="text-xs font-semibold">{item.name}</div>
                    <div className="text-[11px] text-muted-foreground">{item.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ad ── */}
      <section className="bg-background py-4">
        <div className="container mx-auto px-4 flex justify-center">
          <AdUnit slot="1234567890" format="leaderboard" className="pt-5 w-full max-w-3xl" />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-card/20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything in one place</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Visa intel + community + groups — the whole travel stack.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: MapPin,       step: "01", title: "Check visa rules",        desc: "Search 190+ countries for entry requirements, stay limits, fees — personalized to your passport." },
              { icon: HelpCircle,   step: "02", title: "Ask the community",       desc: "Post questions, read real visa experiences, and get answers from travelers who've been there." },
              { icon: Users,        step: "03", title: "Find travel companions",  desc: "Join or create groups around a destination, activity, or visa journey. Chat in real time." },
            ].map((item) => (
              <div key={item.title} className="relative bg-card border border-border rounded-3xl p-8 hover:border-primary/25 transition-all overflow-hidden">
                <div className="absolute top-6 right-7 text-5xl font-black text-muted/20 font-serif select-none">{item.step}</div>
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-6 border border-primary/20">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top passports ── */}
      <section className="py-20 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-1.5">Most powerful passports</h2>
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
                  <Link key={passport.countryCode} href={`/passport?code=${passport.countryCode}`}
                    className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all">
                    <div className="h-24 overflow-hidden">
                      <img src={imgUrl ?? getCountryFallbackImageUrl(passport.countryCode, 600, 200)}
                        alt={passport.countryName}
                        className="w-full h-full object-cover opacity-30 group-hover:opacity-45 transition-opacity"
                        onError={(e) => { e.currentTarget.src = getCountryFallbackImageUrl(passport.countryCode, 600, 200); }} />
                    </div>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{passport.flagEmoji}</span>
                        <div>
                          <div className="font-bold group-hover:text-primary transition-colors">{passport.countryName}</div>
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

      {/* ── Final CTA ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="relative gradient-hero rounded-3xl p-10 md:p-16 text-white text-center overflow-hidden">
            <div className="absolute inset-0 bg-black/20 [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Your next adventure starts here.</h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                Whether you're planning a solo trek, a family trip, or navigating a visa application — your community is already here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                <Link href="/groups"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full font-semibold hover:bg-white/90 transition-all shadow-lg">
                  <Users className="w-4 h-4" /> Find your group
                </Link>
                <Link href="/community"
                  className="inline-flex items-center justify-center gap-2 glass text-white px-7 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-all border border-white/20">
                  <MessageSquare className="w-4 h-4" /> Browse Q&A
                </Link>
                <Link href="/explore"
                  className="inline-flex items-center justify-center gap-2 glass text-white px-7 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-all border border-white/20">
                  <Globe2 className="w-4 h-4" /> Explore destinations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

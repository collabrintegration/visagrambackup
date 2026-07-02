import { ExternalLink, Shield, Smartphone, FileCheck, Wifi } from "lucide-react";

interface AffiliateLinkCardProps {
  href: string;
  icon: React.ReactNode;
  accentClass: string;
  label: string;
  description: string;
  cta: string;
}

function AffiliateLinkCard({ href, icon, accentClass, label, description, cta }: AffiliateLinkCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`group flex items-center gap-3 rounded-xl border ${accentClass} transition-all p-3.5 w-full`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold shrink-0 group-hover:gap-2 transition-all opacity-70 group-hover:opacity-100">
        <span className="hidden sm:inline whitespace-nowrap">{cta}</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </div>
    </a>
  );
}

interface AffiliateLinksProps {
  countryName: string;
  countryCode: string;
}

export default function AffiliateLinks({ countryName, countryCode }: AffiliateLinksProps) {
  const airaloUrl = `https://www.airalo.com/search?country=${countryCode.toLowerCase()}&ref=visagram`;
  const ivisaUrl = `https://www.ivisa.com/?utm_source=visagram&utm_medium=affiliate&utm_campaign=country`;
  const safetywingUrl = "https://safetywing.com/?referenceID=26555527&utm_source=26555527&utm_medium=Ambassador";
  const nordvpnUrl = "https://go.nordvpn.net/aff_c?offer_id=15&aff_id=112249&url_id=902";

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Plan Your Trip to {countryName}</h2>
        <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground/50 select-none">
          Sponsored
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AffiliateLinkCard
          href={safetywingUrl}
          accentClass="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40"
          icon={
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-amber-400" />
            </div>
          }
          label="Travel Insurance"
          description={`SafetyWing covers medical emergencies in ${countryName} from $45/mo.`}
          cta="Get covered"
        />
        <AffiliateLinkCard
          href={airaloUrl}
          accentClass="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40"
          icon={
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Smartphone className="w-4.5 h-4.5 text-blue-400" />
            </div>
          }
          label={`eSIM for ${countryName}`}
          description={`Stay connected in ${countryName} with an Airalo eSIM — install before you land.`}
          cta="Get eSIM"
        />
        <AffiliateLinkCard
          href={ivisaUrl}
          accentClass="border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40"
          icon={
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <FileCheck className="w-4.5 h-4.5 text-violet-400" />
            </div>
          }
          label="Visa Application Help"
          description={`iVisa handles your ${countryName} visa paperwork — fast, simple, reliable.`}
          cta="Apply now"
        />
        <AffiliateLinkCard
          href={nordvpnUrl}
          accentClass="border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40"
          icon={
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Wifi className="w-4.5 h-4.5 text-emerald-400" />
            </div>
          }
          label="VPN for Travelers"
          description="NordVPN keeps your data safe on hotel and airport Wi-Fi — 67% off with this link."
          cta="Get deal"
        />
      </div>
    </div>
  );
}

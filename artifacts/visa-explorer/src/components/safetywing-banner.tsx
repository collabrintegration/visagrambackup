import { Shield, ExternalLink } from "lucide-react";

const AFFILIATE_URL =
  "https://safetywing.com/?referenceID=26555527&utm_source=26555527&utm_medium=Ambassador";

export default function SafetyWingBanner() {
  return (
    <a
      href={AFFILIATE_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all p-4 w-full"
    >
      <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
        <Shield className="w-5 h-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          Get travel insurance before your trip 🌍
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          SafetyWing covers medical emergencies worldwide — from $45/month.
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 shrink-0 group-hover:gap-2 transition-all">
        <span className="hidden sm:inline">Get covered</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </div>
    </a>
  );
}

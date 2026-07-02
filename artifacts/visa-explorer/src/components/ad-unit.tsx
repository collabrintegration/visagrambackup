import { useEffect, useRef } from "react";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "rectangle" | "leaderboard" | "fluid";
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXXX";

export default function AdUnit({ slot, format = "auto", className = "", style }: AdUnitProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  }, []);

  return (
    <div className={`ad-unit-wrapper relative ${className}`} style={style}>
      <div className="absolute -top-4 left-0 text-[10px] font-medium tracking-widest uppercase text-muted-foreground/40 select-none pointer-events-none">
        Advertisement
      </div>
      <ins
        ref={ref}
        className="adsbygoogle block"
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        style={{ display: "block", ...style }}
      />
    </div>
  );
}

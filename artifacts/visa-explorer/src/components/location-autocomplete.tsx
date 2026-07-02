import { useState, useEffect, useRef } from "react";
import { Loader2, MapPin } from "lucide-react";

interface Suggestion {
  label: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    country?: string;
    state?: string;
  };
  type: string;
  class: string;
}

function formatResult(r: NominatimResult): string | null {
  const city = r.address.city || r.address.town || r.address.municipality || r.address.village;
  const country = r.address.country;
  if (!city || !country) return null;
  return `${city}, ${country}`;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
}

export default function LocationAutocomplete({ value, onChange, placeholder = "Start typing a city…", className = "", hasError }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
    setSelected(!!value);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    setSelected(false);
    onChange(val);

    if (debounceTimer) clearTimeout(debounceTimer);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&limit=8&accept-language=en`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data: NominatimResult[] = await res.json();

        const seen = new Set<string>();
        const out: Suggestion[] = [];
        for (const r of data) {
          const label = formatResult(r);
          if (label && !seen.has(label)) {
            seen.add(label);
            out.push({ label });
          }
        }
        setSuggestions(out);
        setOpen(out.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function pick(label: string) {
    setQuery(label);
    onChange(label);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-9 pr-9 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 ${
            hasError ? "border-rose-500" : "border-border"
          } ${className}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {selected && !loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">✓</span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); pick(s.label); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

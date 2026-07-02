import { useState, useRef, useEffect } from "react";
import { useListCountries, getListCountriesQueryKey } from "@workspace/api-client-react";
import { Globe, ChevronDown, Check, Search } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (code: string | null) => void;
  placeholder?: string;
}

export default function CountryCombobox({ value, onChange, placeholder = "Select a country" }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const { data: countries = [] } = useListCountries({}, { query: { queryKey: getListCountriesQueryKey({}), staleTime: Infinity } });

  const selected = countries.find((c) => c.code === value);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 30);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className="w-full flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm hover:border-primary/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50"
      >
        {selected ? (
          <>
            <span className="text-base">{selected.flagEmoji}</span>
            <span className="flex-1 text-left truncate">{selected.name}</span>
          </>
        ) : (
          <>
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 text-left text-muted-foreground truncate">{placeholder}</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="bg-transparent text-sm flex-1 outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="w-5" />
                <span>Clear selection</span>
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">No countries found</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.code); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <Check className={`w-3.5 h-3.5 shrink-0 ${value === c.code ? "text-primary" : "text-transparent"}`} />
                  <span className="text-base">{c.flagEmoji}</span>
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

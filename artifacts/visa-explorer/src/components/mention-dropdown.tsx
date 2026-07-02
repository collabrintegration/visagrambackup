import type { MentionCandidate } from "@/hooks/use-mention-autocomplete";

function displayName(u: { firstName?: string | null; lastName?: string | null }) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || "Traveler";
}

interface Props {
  suggestions: MentionCandidate[];
  highlighted: number;
  onHover: (index: number) => void;
  onSelect: (user: MentionCandidate) => void;
  className?: string;
}

export default function MentionDropdown({ suggestions, highlighted, onHover, onSelect, className = "" }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div
      className={`absolute z-50 bottom-full mb-1.5 left-0 w-64 max-h-56 overflow-y-auto rounded-xl border border-border bg-background shadow-2xl shadow-black/20 py-1 ${className}`}
    >
      {suggestions.map((u, i) => (
        <button
          key={u.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(u);
          }}
          onMouseEnter={() => onHover(i)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
            i === highlighted ? "bg-primary/10" : "hover:bg-muted/60"
          }`}
        >
          {u.profileImageUrl ? (
            <img src={u.profileImageUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
              {displayName(u).slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName(u)}</p>
            <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

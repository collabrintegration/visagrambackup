import { useState } from "react";
import { ImageIcon, X, Search } from "lucide-react";

export const CURATED_GIFS = [
  { url: "https://media.giphy.com/media/3o7bu3XilJ5BOiSGic/giphy.gif", label: "Takeoff ✈️" },
  { url: "https://media.giphy.com/media/26BRrSvJEDf3KFZYQ/giphy.gif", label: "Beach 🏖️" },
  { url: "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif", label: "Night City 🌃" },
  { url: "https://media.giphy.com/media/xTiTntB8tz2uLyeAXm/giphy.gif", label: "Packing 🧳" },
  { url: "https://media.giphy.com/media/hTDrJuGpbGElaWFHSt/giphy.gif", label: "Boarding 🛫" },
  { url: "https://media.giphy.com/media/3o6Zt8jnHIHv4QoOGU/giphy.gif", label: "World 🌍" },
  { url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif", label: "Clapping 👏" },
  { url: "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif", label: "Cheers 🥂" },
  { url: "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif", label: "Celebrate 🎉" },
  { url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", label: "Wow 😮" },
  { url: "https://media.giphy.com/media/111ebonIs1Cuds/giphy.gif", label: "Thumbs Up 👍" },
  { url: "https://media.giphy.com/media/xT0xeuOy26Fk9eH60Q/giphy.gif", label: "Yes! ✅" },
  { url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif", label: "Happy 😄" },
  { url: "https://media.giphy.com/media/dNO9mDvYpSWGs/giphy.gif", label: "Dance 💃" },
  { url: "https://media.giphy.com/media/7r4g8V2UkVoI8/giphy.gif", label: "Excited 🤩" },
  { url: "https://media.giphy.com/media/xNBcChLQt7s9a/giphy.gif", label: "Grateful 🙏" },
  { url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif", label: "Hmm 🤔" },
  { url: "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif", label: "Confused 😕" },
  { url: "https://media.giphy.com/media/xUPGGDNsLvqsBOhuU0/giphy.gif", label: "Facepalm 🤦" },
  { url: "https://media.giphy.com/media/26FLdaDQ5f72FPbEI/giphy.gif", label: "Not Sure 😬" },
  { url: "https://media.giphy.com/media/l0HlFZfztaR5eFANO/giphy.gif", label: "Love ❤️" },
  { url: "https://media.giphy.com/media/yoJC2GnSClbPOkV0eA/giphy.gif", label: "Thanks 🙌" },
  { url: "https://media.giphy.com/media/Vccpm1O9gV1g4/giphy.gif", label: "Hug 🤗" },
  { url: "https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif", label: "Good Luck 🤞" },
  { url: "https://media.giphy.com/media/l3vR85wkOFpzkyTrW/giphy.gif", label: "No No No 🙅" },
  { url: "https://media.giphy.com/media/SRMkn7u1JkEHhbOiQb/giphy.gif", label: "Shocked 😱" },
  { url: "https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif", label: "100 💯" },
  { url: "https://media.giphy.com/media/3oEdva9BUHPHz2ofs4/giphy.gif", label: "Bye! 👋" },
  { url: "https://media.giphy.com/media/xT9IgG50Lg7rusFFf2/giphy.gif", label: "Welcome 🎊" },
  { url: "https://media.giphy.com/media/Is1O1TWV0LEJi/giphy.gif", label: "Approved ✅" },
  { url: "https://media.giphy.com/media/3oEdvaoSRHJtBQtrwc/giphy.gif", label: "Food 🍜" },
  { url: "https://media.giphy.com/media/l41lUJ1YoZB1lHVPG/giphy.gif", label: "Road Trip 🚗" },
  { url: "https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif", label: "Mountains 🏔️" },
  { url: "https://media.giphy.com/media/3o6Zt3AC93OAjItiyI/giphy.gif", label: "Culture 🏛️" },
  { url: "https://media.giphy.com/media/GYU7PWNeRkPwA/giphy.gif", label: "Win 🏆" },
  { url: "https://media.giphy.com/media/xT9IgDECMtkLpnFsOY/giphy.gif", label: "Baggage 🧳" },
];

export function GifPreview({ url }: { url: string }) {
  return (
    <div className="mt-3 rounded-xl overflow-hidden max-w-sm">
      <img
        src={url}
        alt="GIF"
        className="w-full max-h-64 object-contain bg-black/20"
        loading="lazy"
      />
    </div>
  );
}

export function GifPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? CURATED_GIFS.filter((g) =>
        g.label.toLowerCase().includes(search.toLowerCase())
      )
    : CURATED_GIFS;

  function select(url: string) {
    onChange(url);
    setOpen(false);
    setSearch("");
  }

  function clear() {
    onChange("");
    setOpen(false);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          {value ? "Change GIF" : "Add GIF"}
        </button>
        {value && (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        )}
      </div>

      {value && !open && <GifPreview url={value} />}

      {open && (
        <div className="mt-2 rounded-xl border border-border bg-card shadow-lg p-3 max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search GIFs…"
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto">
            {filtered.map((gif) => (
              <button
                key={gif.url}
                type="button"
                onClick={() => select(gif.url)}
                title={gif.label}
                className={`relative rounded-lg overflow-hidden aspect-square bg-black/20 border-2 transition-all hover:border-primary/60 ${
                  value === gif.url ? "border-primary" : "border-transparent"
                }`}
              >
                <img
                  src={gif.url}
                  alt={gif.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-4 py-6 text-center text-xs text-muted-foreground">
                No GIFs match "{search}"
              </div>
            )}
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Powered by Giphy
          </p>
        </div>
      )}
    </div>
  );
}

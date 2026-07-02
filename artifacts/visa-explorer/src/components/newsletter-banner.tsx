import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface NewsletterBannerProps {
  source?: string;
  variant?: "hero" | "inline";
}

export default function NewsletterBanner({ source = "website", variant = "inline" }: NewsletterBannerProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data = await res.json() as { success?: boolean; alreadySubscribed?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      } else {
        setStatus("success");
        setMessage(data.alreadySubscribed ? "You're already on the list!" : "You're in! We'll send updates to " + email.trim());
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (variant === "hero") {
    return (
      <div className="w-full max-w-md">
        {status === "success" ? (
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === "loading"}
              className="flex-1 h-10 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Subscribe <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="text-rose-400 text-xs mt-1.5">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight">Get visa updates in your inbox</h3>
          <p className="text-sm text-muted-foreground mt-0.5 mb-4">
            We'll alert you when visa rules change for countries you care about — no spam, ever.
          </p>
          {status === "success" ? (
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === "loading"}
                className="flex-1 min-w-0 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-50 w-full sm:w-auto"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {status === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Get updates <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="text-rose-400 text-xs mt-1.5">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

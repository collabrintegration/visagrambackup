import { useState } from "react";
import { Link } from "wouter";
import {
  useGetTravelMap,
  useUpsertTravelEntry,
  useDeleteTravelEntry,
  getGetTravelMapQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { Map, CheckCircle2, Heart, LogIn, Loader2, Trash2, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  visited: {
    label: "Visited",
    icon: CheckCircle2,
    pill: "bg-emerald-500/10 text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  want_to_visit: {
    label: "Want to Visit",
    icon: Heart,
    pill: "bg-primary/10 text-primary",
    ring: "ring-primary/30",
  },
} as const;

type TravelStatus = keyof typeof STATUS_CONFIG;

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [activeTab, setActiveTab] = useState<TravelStatus>("visited");
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading: mapLoading } = useGetTravelMap({
    query: {
      queryKey: getGetTravelMapQueryKey(),
      enabled: isAuthenticated,
    },
  });

  const { mutate: deletEntry, isPending: isDeleting } = useDeleteTravelEntry({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetTravelMapQueryKey() });
      },
    },
  });

  const isLoading = authLoading || (isAuthenticated && mapLoading);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Map className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Travel Map</h2>
          <p className="text-muted-foreground max-w-sm">
            Sign in to track the countries you've visited and places you want to explore.
          </p>
        </div>
        <Button onClick={login} size="lg">
          <LogIn className="w-4 h-4 mr-2" /> Sign in to continue
        </Button>
      </div>
    );
  }

  const visited = entries.filter((e) => e.status === "visited");
  const wantToVisit = entries.filter((e) => e.status === "want_to_visit");
  const active = activeTab === "visited" ? visited : wantToVisit;
  const cfg = STATUS_CONFIG[activeTab];

  return (
    <div className="min-h-screen bg-background">
      {/* Profile header */}
      <div className="border-b border-border/60 bg-card/30">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName ?? "Profile"}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : "Traveler"}
              </h1>
              {user?.email && (
                <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-8">
            <button
              onClick={() => setActiveTab("visited")}
              className={`text-left transition-colors ${activeTab === "visited" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className={`text-3xl font-bold ${activeTab === "visited" ? "text-primary" : ""}`}>
                {visited.length}
              </div>
              <div className="text-sm font-medium flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Visited
              </div>
            </button>
            <div className="w-px bg-border" />
            <button
              onClick={() => setActiveTab("want_to_visit")}
              className={`text-left transition-colors ${activeTab === "want_to_visit" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className={`text-3xl font-bold ${activeTab === "want_to_visit" ? "text-primary" : ""}`}>
                {wantToVisit.length}
              </div>
              <div className="text-sm font-medium flex items-center gap-1.5 mt-0.5">
                <Heart className="w-4 h-4 text-primary" /> Want to Visit
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : active.length === 0 ? (
          <div className="text-center py-20">
            <cfg.icon className="w-12 h-12 mx-auto text-muted mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {activeTab === "visited" ? "No visited countries yet" : "No countries saved yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {activeTab === "visited"
                ? "Go to any country page and mark it as visited to track your travels."
                : "Save countries you'd like to explore someday."}
            </p>
            <Button variant="outline" asChild>
              <Link href="/explore">
                <Globe className="w-4 h-4 mr-2" /> Browse Countries
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {active.map((entry) => (
              <div
                key={entry.countryCode}
                className={`bg-card border border-border rounded-2xl p-4 ring-1 ${cfg.ring} hover:border-primary/30 transition-all group relative`}
              >
                <Link href={`/country/${entry.countryCode}`}>
                  <div className="cursor-pointer">
                    <div className="text-5xl mb-3">{entry.countryFlag ?? "🌍"}</div>
                    <div className="font-semibold group-hover:text-primary transition-colors truncate">
                      {entry.countryName ?? entry.countryCode}
                    </div>
                    <Badge variant="secondary" className={`mt-2 text-xs border-none ${cfg.pill}`}>
                      <cfg.icon className="w-3 h-3 mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>
                </Link>
                <button
                  onClick={() => deletEntry({ code: entry.countryCode })}
                  disabled={isDeleting}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

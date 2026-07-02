import { useState } from "react";
import { Link } from "wouter";
import {
  useGetCommunityFeed,
  getGetCommunityFeedQueryKey,
} from "@workspace/api-client-react";
import type { FeedItem } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { MessageSquare, Star, Globe, Users, Loader2, MapPin, LogIn, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdUnit from "@/components/ad-unit";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function Community() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [page] = useState(1);

  const { data: feed, isLoading: feedLoading } = useGetCommunityFeed(
    { limit: 30 },
    {
      query: {
        queryKey: getGetCommunityFeedQueryKey({ limit: 30 }),
        enabled: true,
      },
    },
  );

  const isLoading = authLoading || feedLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border/60 bg-card/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-widest mb-3">
                <Users className="w-4 h-4" /> Community
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Travel Stories & Insights
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Real reviews, questions, and experiences from travelers around the world.
              </p>
            </div>
            {!authLoading && !isAuthenticated && (
              <Button onClick={login} className="shrink-0">
                <LogIn className="w-4 h-4 mr-2" /> Sign in to contribute
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !feed || feed.length === 0 ? (
          <div className="text-center py-24">
            <TrendingUp className="w-12 h-12 mx-auto text-muted mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to share a review or ask a question about a country.
            </p>
            {!isAuthenticated && (
              <Button onClick={login}>
                <LogIn className="w-4 h-4 mr-2" /> Sign in to get started
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((item, idx) => (
              <>
                <FeedCard key={`${item.type}-${item.id}`} item={item} />
                {(idx + 1) % 6 === 0 && idx < feed.length - 1 && (
                  <div key={`ad-${idx}`} className="py-2">
                    <AdUnit slot="3456789012" format="fluid" className="pt-5" />
                  </div>
                )}
              </>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const isReview = item.type === "review";

  return (
    <Link href={`/country/${item.countryCode}`}>
      <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
              {(item.user?.firstName || "A")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm truncate block">
                {item.user?.firstName || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(item.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="secondary"
              className={`text-xs border-none ${isReview ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-400"}`}
            >
              {isReview ? (
                <><Star className="w-3 h-3 mr-1" /> Review</>
              ) : (
                <><MessageSquare className="w-3 h-3 mr-1" /> Q&A</>
              )}
            </Badge>
          </div>
        </div>

        {/* Country badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {item.countryName ?? item.countryCode}
          </span>
          <MapPin className="w-3 h-3 text-muted-foreground/50 ml-1" />
        </div>

        {/* Content */}
        {isReview ? (
          <>
            {"overallRating" in item.data && typeof item.data.overallRating === "number" && (
              <div className="flex items-center gap-2 mb-2">
                <StarRow rating={item.data.overallRating} />
                <span className="text-xs text-muted-foreground font-medium">
                  {item.data.overallRating.toFixed(1)} / 5
                </span>
              </div>
            )}
            {"body" in item.data && typeof item.data.body === "string" && item.data.body && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {item.data.body}
              </p>
            )}
          </>
        ) : (
          <>
            {"title" in item.data && typeof item.data.title === "string" && (
              <p className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                {item.data.title}
              </p>
            )}
            {"body" in item.data && typeof item.data.body === "string" && item.data.body && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.data.body}
              </p>
            )}
            {"answersCount" in item.data && typeof item.data.answersCount === "number" && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                {item.data.answersCount} {item.data.answersCount === 1 ? "answer" : "answers"}
              </div>
            )}
          </>
        )}
      </div>
    </Link>
  );
}

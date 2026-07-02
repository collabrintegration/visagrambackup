import { Link, useLocation } from "wouter";
import { Compass, Map as MapIcon, Users, User, LogIn, LogOut, Loader2, ClipboardList, UserPlus, ChevronDown, Settings, MapPin } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useHealthCheck, getHealthCheckQueryKey, useGetDmUnreadCount, getGetDmUnreadCountQueryKey, useListFriendRequests, getListFriendRequestsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/global-search";
import ProfileCompletionGate from "@/components/profile-completion-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);
  const { data: health } = useHealthCheck({
    query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 60000 },
  });
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();

  const { data: unreadData } = useGetDmUnreadCount({
    query: {
      queryKey: getGetDmUnreadCountQueryKey(),
      enabled: isAuthenticated,
      refetchInterval: 15000,
    },
  });

  const { data: friendRequests = [] } = useListFriendRequests({
    query: {
      queryKey: getListFriendRequestsQueryKey(),
      enabled: isAuthenticated,
      refetchInterval: 30000,
    },
  });

  const totalBadge = (unreadData?.unreadMessages ?? 0) + (unreadData?.pendingRequests ?? 0) + friendRequests.length;

  const links = [
    { href: "/", label: "Home", icon: Compass },
    { href: "/friends", label: "Profile", icon: UserPlus },
    { href: "/community", label: "Community", icon: Users },
    { href: "/explore", label: "Explore\u00a0Visa", icon: MapIcon, matchPaths: ["/explore", "/passport"] },
    { href: "/tracker", label: "Tracker", icon: ClipboardList },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0 group" title="Visagram — The largest travel community">
            <div
              style={{
                width: 150,
                height: 68,
                backgroundImage: "url('/visagram-combined.png')",
                backgroundSize: "150px 150px",
                backgroundPosition: "0px -48px",
                backgroundRepeat: "no-repeat",
                mixBlendMode: "screen",
              }}
              className="opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = (link.matchPaths ?? [link.href]).some(p =>
                p === "/" ? location === p : location.startsWith(p)
              );
              const showBadge = link.href === "/friends" && isAuthenticated && totalBadge > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {totalBadge > 99 ? "99+" : totalBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Auth section */}
          <div className="flex items-center gap-2 shrink-0">
            {authLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : isAuthenticated ? (
              <>
                {/* Profile dropdown */}
                <div className="relative hidden md:block" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(o => !o)}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      profileOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Profile"}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[200]">
                      {/* User identity */}
                      <div className="px-4 py-4 border-b border-border/60 flex items-center gap-3">
                        {user?.profileImageUrl ? (
                          <img src={user.profileImageUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-border" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm leading-tight truncate">
                            {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Traveler"}
                          </p>
                          {(user as { username?: string | null })?.username && (
                            <p className="text-xs text-muted-foreground truncate">@{(user as { username?: string | null }).username}</p>
                          )}
                          {(user as { location?: string | null })?.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" />{(user as { location?: string | null }).location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick links */}
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          Edit Profile Settings
                        </Link>
                      </div>

                      {/* Sign out */}
                      <div className="border-t border-border/60 py-1">
                        <button
                          onClick={() => { setProfileOpen(false); logout(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile sign-out */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="md:hidden text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate("/sign-in")}>
                <LogIn className="w-4 h-4 mr-1.5" />
                Sign in
              </Button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-border/40 bg-background/95">
          <div className="flex items-center overflow-x-auto px-2 py-1 gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = (link.matchPaths ?? [link.href]).some(p =>
                p === "/" ? location === p : location.startsWith(p)
              );
              const showBadge = link.href === "/friends" && isAuthenticated && totalBadge > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {totalBadge > 99 ? "99+" : totalBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <ProfileCompletionGate />

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/visagram-logo.png" alt="Visagram" className="h-12 w-auto opacity-80" />
            <p className="text-xs text-muted-foreground">Navigate the world with precision.</p>
          </div>
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <div className="flex gap-4 text-sm">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <span>·</span>
              <a href="mailto:collabrintegration@gmail.com" className="hover:text-foreground transition-colors">Contact Us</a>
            </div>
            <div className="text-xs text-muted-foreground/60">collabrintegration@gmail.com</div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1 text-sm text-muted-foreground">
            <div>&copy; {new Date().getFullYear()} Visagram. Data is for informational purposes only.</div>
            {health && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${health.status === "ok" ? "bg-emerald-500" : "bg-red-500"}`} />
                <span>All systems {health.status}</span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

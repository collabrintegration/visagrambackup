import { Link, useLocation } from "wouter";
import { Compass, BookOpen, Map as MapIcon, Users, User, LogIn, LogOut, Loader2, Globe, ClipboardList } from "lucide-react";
import React from "react";
import { useHealthCheck, getHealthCheckQueryKey, useGetDmUnreadCount, getGetDmUnreadCountQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
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

  const totalBadge = (unreadData?.unreadMessages ?? 0) + (unreadData?.pendingRequests ?? 0);

  const links = [
    { href: "/", label: "Home", icon: Compass },
    { href: "/community", label: "Community", icon: Users },
    { href: "/groups", label: "Groups", icon: Globe },
    { href: "/explore", label: "Explore", icon: MapIcon },
    { href: "/passport", label: "Passport Power", icon: BookOpen },
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
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
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
                <Link
                  href="/profile"
                  className={`relative hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    location.startsWith("/profile")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <User className="w-4 h-4" />
                  {user?.firstName ?? "Profile"}
                  {totalBadge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {totalBadge > 99 ? "99+" : totalBadge}
                    </span>
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline ml-1.5">Sign out</span>
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
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
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
                </Link>
              );
            })}
            {isAuthenticated && (
              <Link
                href="/profile"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  location.startsWith("/profile") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </Link>
            )}
          </div>
        </div>
      </header>

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
              <a href="mailto:collabrintegration@gmail.com" className="hover:text-foreground transition-colors">Contact Us</a>
              <span>·</span>
              <a href="mailto:collabrintegration@gmail.com" className="hover:text-foreground transition-colors">Advertising &amp; Partnerships</a>
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

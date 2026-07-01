import { Link, useLocation } from "wouter";
import { Compass, Globe, BookOpen, Map as MapIcon } from "lucide-react";
import React from "react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const { data: health } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 60000,
    }
  });

  const links = [
    { href: "/", label: "Home", icon: Compass },
    { href: "/explore", label: "Explore", icon: MapIcon },
    { href: "/passport", label: "Passport Power", icon: BookOpen },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">
              Visa<span className="text-primary">fy</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

          <nav className="flex md:hidden items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`p-2 rounded-lg transition-all ${
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md gradient-hero flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="font-serif font-bold text-base leading-none">Visafy</p>
              <p className="text-xs text-muted-foreground mt-0.5">Navigate the world with precision.</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1 text-sm text-muted-foreground">
            <div>&copy; {new Date().getFullYear()} Visafy. Data is for informational purposes only.</div>
            {health && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${health.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span>All systems {health.status}</span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

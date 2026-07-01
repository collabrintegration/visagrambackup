import { Link, useLocation } from "wouter";
import { Compass, Globe, BookOpen, Map as MapIcon, Activity } from "lucide-react";
import React from "react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const { data: health } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 60000, // Check every minute
    }
  });

  const links = [
    { href: "/", label: "Home", icon: Compass },
    { href: "/explore", label: "Explore", icon: MapIcon },
    { href: "/passport", label: "Passport Power", icon: BookOpen },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-secondary selection:text-white">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-sm group-hover:bg-secondary transition-colors">
              <Globe className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">Visa Explorer</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-secondary ${
                    isActive ? "text-secondary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
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
        <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <p className="font-serif font-bold text-lg">Visa Explorer</p>
            <p className="text-sm text-muted-foreground mt-1">Navigate the world with precision.</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 text-sm text-muted-foreground">
            <div>&copy; {new Date().getFullYear()} Visa Explorer. Data is for informational purposes only.</div>
            {health && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${health.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Systems {health.status}</span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

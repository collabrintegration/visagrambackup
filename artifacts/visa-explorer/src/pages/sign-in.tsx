import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { LogIn, Globe } from "lucide-react";

export default function SignIn() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Background glow blobs */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(347 50% 42%) 0%, hsl(333 42% 28%) 50%, transparent 80%)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(320 40% 36%) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Card */}
      <div className="glass shadow-rose-glow rounded-2xl p-10 flex flex-col items-center gap-8 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex items-center justify-center"
            style={{ filter: "drop-shadow(0 0 12px hsl(347 50% 42% / 0.45))" }}
          >
            <img
              src="/visagram-logo.png"
              alt="Visagram"
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Tagline */}
          <div className="text-center">
            <p className="text-rose-gradient text-xl font-serif font-semibold tracking-tight">
              Know before you go.
            </p>
            <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
              Explore visa requirements, read community reviews,
              <br className="hidden sm:block" /> and track your travel map.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border/60" />

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 w-full">
          <Button
            size="lg"
            className="w-full shadow-rose-glow gap-2 text-sm font-semibold"
            onClick={login}
            disabled={isLoading}
          >
            <LogIn className="w-4 h-4" />
            Continue with Replit
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            By continuing you agree to Visagram's terms of use.
          </p>
        </div>

        {/* Decorative globe */}
        <div className="absolute bottom-6 right-6 opacity-5 pointer-events-none" aria-hidden="true">
          <Globe className="w-16 h-16" />
        </div>
      </div>
    </div>
  );
}

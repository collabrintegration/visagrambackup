import React from "react";
import { Globe, MapPin, ShieldCheck, ArrowRight, Compass, CheckCircle2, Zap } from "lucide-react";

export function EmeraldNight() {
  return (
    <div className="min-h-screen font-sans antialiased bg-emerald-950 text-emerald-50 selection:bg-teal-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-emerald-900/50 bg-emerald-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-50">
            <Globe className="w-8 h-8 text-teal-500" strokeWidth={2} />
            <span className="text-xl font-bold tracking-tight">Visafy</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-emerald-100">
            <a href="#" className="hover:text-teal-400 transition-colors">Home</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Explore</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Passport Power</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="hidden md:block text-sm font-medium text-emerald-100 hover:text-white transition-colors">
              Log in
            </a>
            <button className="px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)] hover:shadow-[0_0_25px_rgba(13,148,136,0.5)]">
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-900/40 blur-[100px]" />
          <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-800/30 blur-[80px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-800 text-emerald-300 text-xs font-medium mb-8">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span>Updated with 2024 visa policies</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-white">
            Know before you <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">go.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-emerald-200/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Navigate global travel requirements instantly. Check visa rules, passport strength, and entry policies for over 200 destinations worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-all shadow-[0_0_30px_rgba(13,148,136,0.25)] flex items-center justify-center gap-2 group">
              Explore Destinations
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-white font-semibold transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
              <Compass className="w-5 h-5 text-emerald-400" />
              My Passport
            </button>
          </div>
        </div>
      </main>

      {/* Stats Bar */}
      <div className="border-y border-emerald-900/50 bg-emerald-950/40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-emerald-900/50">
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white mb-1">50+</div>
              <div className="text-sm font-medium text-emerald-400">Destinations</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white mb-1">165</div>
              <div className="text-sm font-medium text-emerald-400">Visa Rules</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white mb-1">45%</div>
              <div className="text-sm font-medium text-emerald-400">Visa-Free Rate</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white mb-1">US</div>
              <div className="text-sm font-medium text-emerald-400">Top Passport</div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Travel smart.</h2>
            <p className="text-emerald-200/70 max-w-xl mx-auto text-lg">Three simple steps to ensure you're ready for your next adventure.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="p-8 rounded-3xl bg-emerald-900/20 border border-emerald-800/30 hover:border-emerald-700/50 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-teal-900/50 flex items-center justify-center mb-6 border border-teal-800/50 group-hover:bg-teal-800/50 transition-colors">
                <MapPin className="w-7 h-7 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Search destination</h3>
              <p className="text-emerald-200/60 leading-relaxed">
                Enter your dream destination and find out exactly what documentation you need to cross the border smoothly.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl bg-emerald-900/20 border border-emerald-800/30 hover:border-emerald-700/50 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-teal-900/50 flex items-center justify-center mb-6 border border-teal-800/50 group-hover:bg-teal-800/50 transition-colors">
                <ShieldCheck className="w-7 h-7 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Check passport</h3>
              <p className="text-emerald-200/60 leading-relaxed">
                Input your citizenship to see a personalized map of where you can travel without applying for a visa in advance.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl bg-emerald-900/20 border border-emerald-800/30 hover:border-emerald-700/50 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-teal-900/50 flex items-center justify-center mb-6 border border-teal-800/50 group-hover:bg-teal-800/50 transition-colors">
                <CheckCircle2 className="w-7 h-7 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Compare & decide</h3>
              <p className="text-emerald-200/60 leading-relaxed">
                Compare multiple destinations side-by-side to choose the path of least resistance for your next holiday.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-900/50 py-12 bg-emerald-950">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-teal-600" />
            <span className="text-lg font-bold text-emerald-100 tracking-tight">Visafy</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-emerald-400/60">
            <a href="#" className="hover:text-teal-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Contact</a>
          </div>
          
          <div className="text-sm text-emerald-500/50">
            &copy; {new Date().getFullYear()} Visafy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

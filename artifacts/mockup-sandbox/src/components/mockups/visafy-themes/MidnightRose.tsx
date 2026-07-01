import React from "react";
import { Globe, MapPin, ShieldCheck, Zap, ArrowRight, Compass, CheckCircle2 } from "lucide-react";

export function MidnightRose() {
  return (
    <div className="min-h-screen font-sans antialiased bg-zinc-950 text-zinc-300">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Globe className="w-6 h-6 text-rose-500" />
          <span className="text-xl font-bold tracking-tight">Visafy</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#" className="text-white hover:text-rose-400 transition-colors">Home</a>
          <a href="#" className="hover:text-white transition-colors">Explore</a>
          <a href="#" className="hover:text-white transition-colors">Passport Power</a>
        </div>
        <div className="hidden md:flex">
          <button className="px-5 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors border border-zinc-700">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-sm font-medium mb-8 border border-rose-500/20">
          <Zap className="w-4 h-4" />
          <span>Real-time visa requirements updated daily</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 max-w-4xl">
          Know before <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-600">you go.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Navigate global entry requirements instantly. Check if you need a visa, how long you can stay, and what documents to bring.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)]">
            <Compass className="w-5 h-5" />
            Explore Destinations
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-semibold flex items-center justify-center gap-2 transition-all border border-zinc-700">
            My Passport
            <ArrowRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </main>

      {/* Stats Bar */}
      <section className="border-y border-zinc-800/50 bg-zinc-900/30">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-zinc-800/50">
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-sm text-zinc-500 font-medium">Destinations</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">165</div>
              <div className="text-sm text-zinc-500 font-medium">Visa Rules</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">45%</div>
              <div className="text-sm text-zinc-500 font-medium">Visa-Free Rate</div>
            </div>
            <div className="text-center px-4">
              <div className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                US <span className="text-rose-500 text-3xl leading-none">#1</span>
              </div>
              <div className="text-sm text-zinc-500 font-medium">Top Passport</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">Your journey begins with certainty. Three simple steps to travel confidence.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-zinc-800/50 border border-zinc-700/50 p-8 rounded-3xl hover:bg-zinc-800 transition-colors">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
              <MapPin className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Search destination</h3>
            <p className="text-zinc-400 leading-relaxed">
              Enter where you want to go. We cover every country and territory globally.
            </p>
          </div>
          
          <div className="bg-zinc-800/50 border border-zinc-700/50 p-8 rounded-3xl hover:bg-zinc-800 transition-colors relative">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
              <ShieldCheck className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Check passport</h3>
            <p className="text-zinc-400 leading-relaxed">
              Select your passport country to see personalized entry requirements instantly.
            </p>
          </div>
          
          <div className="bg-zinc-800/50 border border-zinc-700/50 p-8 rounded-3xl hover:bg-zinc-800 transition-colors">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
              <CheckCircle2 className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Compare & decide</h3>
            <p className="text-zinc-400 leading-relaxed">
              View stay duration limits, required documents, and evisa options side-by-side.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white opacity-80">
            <Globe className="w-5 h-5 text-rose-500" />
            <span className="text-lg font-bold tracking-tight">Visafy</span>
          </div>
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Visafy. All rights reserved. Not legal advice.
          </p>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

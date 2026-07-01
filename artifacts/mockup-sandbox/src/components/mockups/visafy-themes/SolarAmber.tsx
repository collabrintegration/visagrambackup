import React from "react";
import { 
  Globe, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Compass, 
  CheckCircle2 
} from "lucide-react";

export function SolarAmber() {
  return (
    <div className="min-h-screen font-sans antialiased bg-slate-900 selection:bg-amber-500 selection:text-white flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-700 via-amber-500 to-yellow-400 text-white pb-20 sm:pb-28 lg:pb-32">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-yellow-300 blur-3xl mix-blend-overlay"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900 blur-3xl mix-blend-overlay"></div>
        </div>

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Visafy</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-amber-50">
            <a href="#" className="hover:text-white transition-colors">Home</a>
            <a href="#" className="hover:text-white transition-colors">Explore</a>
            <a href="#" className="hover:text-white transition-colors">Passport Power</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden sm:block text-amber-50 hover:text-white font-medium transition-colors">Log In</button>
            <button className="bg-white text-orange-700 hover:bg-orange-50 px-5 py-2.5 rounded-full font-semibold transition-all shadow-sm">
              Sign Up
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-10 sm:pt-28 lg:pt-36 flex flex-col items-center text-center">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.05] drop-shadow-sm">
            Know before <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 to-white drop-shadow-none">you go.</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-amber-50 mb-12 max-w-2xl font-medium leading-relaxed">
            Navigate global visa requirements instantly. Check your passport power, compare destinations, and travel with absolute confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl hover:-translate-y-0.5">
              <Compass className="w-5 h-5" />
              Explore Destinations
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:-translate-y-0.5 border border-white/20">
              <MapPin className="w-5 h-5" />
              My Passport
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-20 -mt-10 sm:-mt-14 max-w-7xl mx-auto px-6 w-full">
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/10 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x divide-slate-100">
          <div className="flex flex-col items-center text-center px-4">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">50+</span>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Destinations</span>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">165</span>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Visa Rules</span>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">45%</span>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Visa-Free Rate</span>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">US</span>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Top Passport</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="flex-1 bg-slate-900 pt-32 pb-24 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Travel smart.</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Everything you need to plan your trip without border surprises.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-3xl hover:bg-slate-800 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Search destination</h3>
              <p className="text-slate-400 leading-relaxed">
                Find exactly what you need to enter any country. Tourist, business, or transit — we've got you covered.
              </p>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-3xl hover:bg-slate-800 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Check passport</h3>
              <p className="text-slate-400 leading-relaxed">
                Select your nationality to instantly see where you can go visa-free, with eTA, or visa on arrival.
              </p>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-3xl hover:bg-slate-800 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Compare & decide</h3>
              <p className="text-slate-400 leading-relaxed">
                Weigh multiple destinations by entry requirements to pick the path of least resistance for your next trip.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="w-5 h-5" />
            <span className="font-bold text-lg">Visafy</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Visafy Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

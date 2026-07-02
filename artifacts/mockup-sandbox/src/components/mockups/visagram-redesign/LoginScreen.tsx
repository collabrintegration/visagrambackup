export function LoginScreen() {
  return (
    <div className="w-[390px] h-[844px] bg-[#0d0d14] flex flex-col overflow-hidden font-sans relative">

      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{ width: 300, height: 300, background: "#7c3aed", top: -60, left: -80 }}
        />
        <div
          className="absolute rounded-full opacity-15 blur-3xl"
          style={{ width: 250, height: 250, background: "#db2777", top: 120, right: -60 }}
        />
        <div
          className="absolute rounded-full opacity-10 blur-3xl"
          style={{ width: 200, height: 200, background: "#7c3aed", bottom: 100, left: 40 }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-4 flex-shrink-0 relative z-10">
        <span className="text-white text-sm font-semibold">9:41</span>
        <div className="flex gap-1 items-center">
          <div className="w-4 h-2.5 border border-white/40 rounded-sm relative">
            <div className="absolute inset-0.5 right-1 bg-white/70 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-between px-8 py-6 relative z-10">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-4 mt-8">
          {/* App icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7c3aed] to-[#db2777] flex items-center justify-center shadow-2xl shadow-[#7c3aed]/40">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tight">
              visa<span className="text-[#db2777]">gram</span>
            </h1>
            <p className="text-[#6b7280] text-sm mt-2 leading-relaxed">
              The travel community for visa explorers
            </p>
          </div>
        </div>

        {/* Social proof cards */}
        <div className="w-full flex flex-col gap-2.5 my-2">
          <div className="flex gap-2.5">
            <div className="flex-1 bg-[#13111e] border border-[#2d2b45] rounded-2xl p-3.5 flex flex-col gap-1">
              <span className="text-2xl font-black text-white">190+</span>
              <span className="text-[#6b7280] text-xs">Countries covered</span>
            </div>
            <div className="flex-1 bg-[#13111e] border border-[#2d2b45] rounded-2xl p-3.5 flex flex-col gap-1">
              <span className="text-2xl font-black text-white">50K+</span>
              <span className="text-[#6b7280] text-xs">Travelers connected</span>
            </div>
          </div>
          <div className="bg-[#13111e] border border-[#2d2b45] rounded-2xl p-3.5 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["🇧🇷", "🇫🇷", "🇮🇳", "🇯🇵"].map((flag, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-[#1e1b2e] border-2 border-[#0d0d14] flex items-center justify-center text-base"
                >
                  {flag}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Join thousands of travelers</p>
              <p className="text-[#6b7280] text-xs">sharing visa tips &amp; experiences</p>
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {["💬 Group chats", "🗺️ Visa tracker", "⭐ Reviews", "🤝 Community Q&A"].map((f) => (
            <span key={f} className="px-3 py-1.5 rounded-full bg-[#1e1b2e] border border-[#2d2b45] text-[#a78bfa] text-xs font-medium">
              {f}
            </span>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Primary: Sign in with Replit */}
          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#db2777] flex items-center justify-center gap-3 font-bold text-white text-base shadow-xl shadow-[#7c3aed]/30 active:opacity-90 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Continue with Replit
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2d2b45]" />
            <span className="text-[#4b5563] text-xs">or</span>
            <div className="flex-1 h-px bg-[#2d2b45]" />
          </div>

          {/* Secondary: explore without signing in */}
          <button className="w-full py-3.5 rounded-2xl border border-[#2d2b45] bg-[#13111e] text-[#9ca3af] text-sm font-medium flex items-center justify-center gap-2 active:opacity-80 transition-opacity">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Explore visas without signing in
          </button>
        </div>

        {/* Footer */}
        <p className="text-[#374151] text-xs text-center">
          By continuing you agree to our Terms &amp; Privacy Policy
        </p>
      </div>
    </div>
  );
}

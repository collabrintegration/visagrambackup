import { useState } from "react";

const CHATS = [
  { id: 1, emoji: "🇫🇷", name: "Paris Visa Group", last: "Anyone got the appointment slot?", time: "2m", unread: 3, members: 142 },
  { id: 2, emoji: "🌏", name: "Southeast Asia Travelers", last: "Thailand 60-day just got extended!", time: "14m", unread: 1, members: 891 },
  { id: 3, emoji: "🇨🇦", name: "Canada PR Journey", last: "My ITA arrived 🎉", time: "1h", unread: 0, members: 523 },
  { id: 4, emoji: "🇩🇪", name: "Germany Job Seekers", last: "Blue card processing update", time: "3h", unread: 0, members: 307 },
  { id: 5, emoji: "✈️", name: "Digital Nomads Hub", last: "Bali or Chiang Mai? 🤔", time: "5h", unread: 0, members: 2104 },
];

const DMS = [
  { id: 1, name: "Maria S.", flag: "🇧🇷", last: "Thanks for the tip!", time: "5m", unread: 1 },
  { id: 2, name: "James K.", flag: "🇬🇧", last: "Did you try the new portal?", time: "1h", unread: 0 },
  { id: 3, name: "Priya N.", flag: "🇮🇳", last: "Let me know how it goes 🤞", time: "2h", unread: 0 },
];

const FEED = [
  {
    id: 1, flag: "🇯🇵", country: "Japan", author: "Alex M.", time: "10m",
    text: "Finally got my Japan tourist visa approved after 3 weeks! The key was having a detailed itinerary. Happy to share my template 📋",
    likes: 47, comments: 12,
  },
  {
    id: 2, flag: "🇪🇺", country: "Schengen", author: "Sofia R.", time: "2h",
    text: "Pro tip: Apply for your Schengen visa at the embassy of the country you'll spend the most nights in, not your first entry point. Saved me so much confusion!",
    likes: 134, comments: 28,
  },
];

type Tab = "chats" | "community";

function Avatar({ emoji, size = 44 }: { emoji: string; size?: number }) {
  return (
    <div
      className="rounded-2xl bg-[#1e1b2e] border border-[#2d2b45] flex items-center justify-center flex-shrink-0 text-2xl"
      style={{ width: size, height: size }}
    >
      {emoji}
    </div>
  );
}

function InitialsAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full bg-gradient-to-br from-[#7c3aed] to-[#db2777] flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

export function HomeScreen() {
  const [tab, setTab] = useState<Tab>("chats");
  const [subTab, setSubTab] = useState<"groups" | "dms">("groups");

  return (
    <div className="w-[390px] h-[844px] bg-[#0d0d14] flex flex-col overflow-hidden font-sans">
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 flex-shrink-0">
        <span className="text-white text-sm font-semibold">9:41</span>
        <div className="flex gap-1 items-center">
          <div className="w-4 h-2.5 border border-white/40 rounded-sm relative">
            <div className="absolute inset-0.5 right-1 bg-white/70 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            visa<span className="text-[#db2777]">gram</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-[#1e1b2e] border border-[#2d2b45] flex items-center justify-center relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#db2777]" />
          </button>
          <button className="w-9 h-9 rounded-full bg-[#1e1b2e] border border-[#2d2b45] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex px-5 gap-1 mb-1 flex-shrink-0">
        {(["chats", "community"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t
                ? "bg-gradient-to-r from-[#7c3aed] to-[#db2777] text-white shadow-lg shadow-[#7c3aed]/25"
                : "bg-[#1a1826] text-[#6b7280] border border-[#2d2b45]"
            }`}
          >
            {t === "chats" ? "💬 Chats" : "🌍 Community"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "chats" && (
          <>
            {/* Sub-tabs: Groups / DMs */}
            <div className="flex px-5 gap-3 py-2 sticky top-0 bg-[#0d0d14] z-10">
              <button
                onClick={() => setSubTab("groups")}
                className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  subTab === "groups" ? "text-[#a78bfa] border-[#7c3aed]" : "text-[#4b5563] border-transparent"
                }`}
              >
                Groups
              </button>
              <button
                onClick={() => setSubTab("dms")}
                className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  subTab === "dms" ? "text-[#a78bfa] border-[#7c3aed]" : "text-[#4b5563] border-transparent"
                }`}
              >
                Direct Messages
              </button>
            </div>

            {subTab === "groups" && (
              <div className="flex flex-col px-4 gap-1 pb-4">
                {CHATS.map((c) => (
                  <button
                    key={c.id}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#1a1826] active:bg-[#1a1826] transition-colors text-left"
                  >
                    <Avatar emoji={c.emoji} size={50} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-white font-semibold text-sm truncate">{c.name}</span>
                        <span className="text-[#4b5563] text-xs flex-shrink-0 ml-2">{c.time}</span>
                      </div>
                      <p className="text-[#6b7280] text-xs truncate">{c.last}</p>
                      <p className="text-[#4b5563] text-xs mt-0.5">{c.members.toLocaleString()} members</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#db2777] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {subTab === "dms" && (
              <div className="flex flex-col px-4 gap-1 pb-4">
                {DMS.map((d) => (
                  <button
                    key={d.id}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#1a1826] transition-colors text-left"
                  >
                    <div className="relative">
                      <InitialsAvatar name={d.name} size={50} />
                      <span className="absolute -bottom-0.5 -right-0.5 text-base">{d.flag}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-white font-semibold text-sm">{d.name}</span>
                        <span className="text-[#4b5563] text-xs">{d.time}</span>
                      </div>
                      <p className="text-[#6b7280] text-xs truncate">{d.last}</p>
                    </div>
                    {d.unread > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#db2777] flex-shrink-0" />
                    )}
                  </button>
                ))}
                {/* New DM button */}
                <button className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-[#2d2b45] mt-1">
                  <div className="w-[50px] h-[50px] rounded-2xl bg-[#1e1b2e] border border-[#2d2b45] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <span className="text-[#7c3aed] text-sm font-semibold">New Message</span>
                </button>
              </div>
            )}
          </>
        )}

        {tab === "community" && (
          <div className="flex flex-col px-4 gap-3 pt-2 pb-4">
            {/* Stories / Active members row */}
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {["🇧🇷","🇫🇷","🇮🇳","🇨🇦","🇯🇵","🇩🇪","🇦🇺"].map((flag, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#db2777] p-0.5">
                    <div className="w-full h-full rounded-[14px] bg-[#1a1826] flex items-center justify-center text-2xl">
                      {flag}
                    </div>
                  </div>
                  <span className="text-[#6b7280] text-xs">Traveler</span>
                </div>
              ))}
            </div>

            {/* Feed posts */}
            {FEED.map((post) => (
              <div key={post.id} className="bg-[#13111e] border border-[#2d2b45] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#db2777] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {post.author[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{post.author}</p>
                    <p className="text-[#6b7280] text-xs">{post.flag} {post.country} · {post.time}</p>
                  </div>
                  <button className="px-3 py-1 rounded-full bg-[#1e1b2e] border border-[#2d2b45] text-[#a78bfa] text-xs font-medium">
                    Follow
                  </button>
                </div>
                <p className="text-[#e2e8f0] text-sm leading-relaxed mb-3">{post.text}</p>
                <div className="flex gap-4">
                  <button className="flex items-center gap-1.5 text-[#6b7280] text-xs hover:text-[#db2777] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-[#6b7280] text-xs hover:text-[#a78bfa] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-[#6b7280] text-xs hover:text-[#a78bfa] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="flex-shrink-0 bg-[#0d0d14] border-t border-[#1e1b2e] px-2 py-2 pb-5">
        <div className="flex">
          {[
            { icon: "💬", label: "Chats", active: true },
            { icon: "🌍", label: "Explore", active: false },
            { icon: "🗺️", label: "My Visas", active: false },
            { icon: "👤", label: "Profile", active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors ${
                item.active ? "" : ""
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[10px] font-semibold ${item.active ? "text-[#a78bfa]" : "text-[#4b5563]"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

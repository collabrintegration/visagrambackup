import { db, usersTable, groupsTable, groupMembersTable, groupMessagesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

// ── Dummy users ─────────────────────────────────────────────────────────────
const DUMMY_USERS = [
  { id: "seed-u-1",  firstName: "Sofia",   lastName: "Marchetti", email: "sofia.marchetti@example.com",   profileImageUrl: "https://i.pravatar.cc/150?u=sofia.marchetti@example.com",   homeCountry: "IT" },
  { id: "seed-u-2",  firstName: "James",   lastName: "Okafor",    email: "james.okafor@example.com",      profileImageUrl: "https://i.pravatar.cc/150?u=james.okafor@example.com",      homeCountry: "NG" },
  { id: "seed-u-3",  firstName: "Yuki",    lastName: "Tanaka",    email: "yuki.tanaka@example.com",       profileImageUrl: "https://i.pravatar.cc/150?u=yuki.tanaka@example.com",       homeCountry: "JP" },
  { id: "seed-u-4",  firstName: "Diego",   lastName: "Reyes",     email: "diego.reyes@example.com",       profileImageUrl: "https://i.pravatar.cc/150?u=diego.reyes@example.com",       homeCountry: "MX" },
  { id: "seed-u-5",  firstName: "Amara",   lastName: "Diallo",    email: "amara.diallo@example.com",      profileImageUrl: "https://i.pravatar.cc/150?u=amara.diallo@example.com",      homeCountry: "SN" },
  { id: "seed-u-6",  firstName: "Lena",    lastName: "Fischer",   email: "lena.fischer@example.com",      profileImageUrl: "https://i.pravatar.cc/150?u=lena.fischer@example.com",      homeCountry: "DE" },
  { id: "seed-u-7",  firstName: "Priya",   lastName: "Sharma",    email: "priya.sharma@example.com",      profileImageUrl: "https://i.pravatar.cc/150?u=priya.sharma@example.com",      homeCountry: "IN" },
  { id: "seed-u-8",  firstName: "Tom",     lastName: "Eriksen",   email: "tom.eriksen@example.com",       profileImageUrl: "https://i.pravatar.cc/150?u=tom.eriksen@example.com",       homeCountry: "NO" },
  { id: "seed-u-9",  firstName: "Maya",    lastName: "Chen",      email: "maya.chen@example.com",         profileImageUrl: "https://i.pravatar.cc/150?u=maya.chen@example.com",         homeCountry: "CN" },
  { id: "seed-u-10", firstName: "Alex",    lastName: "Petrov",    email: "alex.petrov@example.com",       profileImageUrl: "https://i.pravatar.cc/150?u=alex.petrov@example.com",       homeCountry: "RU" },
  { id: "seed-u-11", firstName: "Nadia",   lastName: "Hassan",    email: "nadia.hassan@example.com",      profileImageUrl: "https://i.pravatar.cc/150?u=nadia.hassan@example.com",      homeCountry: "EG" },
  { id: "seed-u-12", firstName: "Carlos",  lastName: "Souza",     email: "carlos.souza@example.com",      profileImageUrl: "https://i.pravatar.cc/150?u=carlos.souza@example.com",      homeCountry: "BR" },
  { id: "seed-u-13", firstName: "Aiko",    lastName: "Yamamoto",  email: "aiko.yamamoto@example.com",     profileImageUrl: "https://i.pravatar.cc/150?u=aiko.yamamoto@example.com",     homeCountry: "JP" },
  { id: "seed-u-14", firstName: "Finn",    lastName: "O'Brien",   email: "finn.obrien@example.com",       profileImageUrl: "https://i.pravatar.cc/150?u=finn.obrien@example.com",       homeCountry: "IE" },
  { id: "seed-u-15", firstName: "Zara",    lastName: "Ahmed",     email: "zara.ahmed@example.com",        profileImageUrl: "https://i.pravatar.cc/150?u=zara.ahmed@example.com",        homeCountry: "PK" },
];

// ── Groups ──────────────────────────────────────────────────────────────────
interface GroupDef {
  name: string;
  description: string;
  emoji: string;
  adminIdx: number; // index into DUMMY_USERS
  memberIdxs: number[];
  messages: Array<{ userIdx: number; content: string; gifUrl?: string }>;
}

const GROUPS: GroupDef[] = [
  // ── Country Groups ──────────────────────────────────────────────────────
  {
    name: "Japan Travelers",
    description: "Tips, stories, and visa advice for exploring Japan — cherry blossoms to bullet trains.",
    emoji: "🇯🇵",
    adminIdx: 2,
    memberIdxs: [0, 1, 3, 6, 12],
    messages: [
      { userIdx: 2, content: "Just got my Japan e-Visa approved in 3 days! The online system is so smooth 🎉" },
      { userIdx: 0, content: "Which entry port did you use? Narita or Haneda?" },
      { userIdx: 2, content: "Narita! Border control was super fast. IC gates handled everything.", gifUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80" },
      { userIdx: 6, content: "Don't sleep on Osaka. The food scene alone is worth the trip 🍜" },
      { userIdx: 12, content: "Kyoto in spring is absolutely magical. Book accommodations months ahead!" },
      { userIdx: 1, content: "Planning my first solo trip — any advice for the JR Pass?" },
      { userIdx: 3, content: "Get the 21-day pass if you plan to go to Hiroshima and Osaka. Totally worth it 👍" },
    ],
  },
  {
    name: "France & Paris Hub",
    description: "Everything about traveling to France — Schengen visas, Paris tips, hidden gems.",
    emoji: "🇫🇷",
    adminIdx: 5,
    memberIdxs: [0, 4, 7, 8, 10],
    messages: [
      { userIdx: 5, content: "Welcome everyone! This is the place for all things France 🥐🗼" },
      { userIdx: 0, content: "The Schengen application from Italy is straightforward. French consulate is well organized.", gifUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80" },
      { userIdx: 7, content: "Paris in September is the sweet spot — tourists thin out, weather is perfect" },
      { userIdx: 10, content: "Avoid August if you can — everything closes and it's packed with tourists" },
      { userIdx: 8, content: "Anyone been to Provence recently? Planning a lavender fields trip 💜" },
      { userIdx: 4, content: "Luberon Valley in June is pure magic! Here's a photo from my trip", gifUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80" },
    ],
  },
  {
    name: "Italy Explorers",
    description: "La dolce vita awaits — visa info, city guides, and regional tips for Italy.",
    emoji: "🇮🇹",
    adminIdx: 0,
    memberIdxs: [5, 7, 11, 13],
    messages: [
      { userIdx: 0, content: "Ciao everyone! Roma, Firenze, Venezia — let's plan the perfect Italian trip 🍝" },
      { userIdx: 5, content: "Schengen visa for Italy was processed in 5 working days from Berlin. No issues at all." },
      { userIdx: 7, content: "The Amalfi Coast is breathtaking but the roads are terrifying 😂", gifUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80" },
      { userIdx: 11, content: "Best tip: skip Venice in July. Come in November — misty and magical with no crowds" },
      { userIdx: 13, content: "Cinque Terre completely changed my life. Spent a week there and never wanted to leave 🌊" },
    ],
  },
  {
    name: "Thailand Community",
    description: "From Bangkok street food to island hopping — all things Thailand visa and travel.",
    emoji: "🇹🇭",
    adminIdx: 3,
    memberIdxs: [1, 4, 6, 9, 14],
    messages: [
      { userIdx: 3, content: "Thailand TR Visa extended for 30 days no questions asked at the immigration office 🙏" },
      { userIdx: 1, content: "Is the visa on arrival still working smoothly at Suvarnabhumi?" },
      { userIdx: 3, content: "Yes! Queue was 20 mins max when I arrived last week. Bring $35 USD in cash.", gifUrl: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600&q=80" },
      { userIdx: 6, content: "Koh Lanta has replaced Koh Phi Phi for me. Much quieter and the reefs are pristine 🤿" },
      { userIdx: 4, content: "Chiang Mai for digital nomads is 10/10. Coworking spaces everywhere and amazing food 🍛" },
      { userIdx: 9, content: "The night train from Bangkok to Chiang Mai is an experience you can't miss!" },
      { userIdx: 14, content: "Elephant Nature Park in Chiang Mai — ethical and absolutely unforgettable 🐘" },
    ],
  },
  {
    name: "Australia & NZ Visas",
    description: "Working holiday, tourist, and skilled migrant visa discussions for Australia & New Zealand.",
    emoji: "🇦🇺",
    adminIdx: 7,
    memberIdxs: [1, 2, 6, 11],
    messages: [
      { userIdx: 7, content: "Australian WHV (subclass 417) — best thing I ever did. 12 months working and traveling 🦘" },
      { userIdx: 1, content: "How hard is it to get farm work sponsored for the second year extension?" },
      { userIdx: 7, content: "Plenty of jobs in QLD and NT. Use Harvest Trail or Seek. Plan 3 months minimum.", gifUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&q=80" },
      { userIdx: 2, content: "NZ is incredible for hiking. Tongariro Alpine Crossing is in my top 5 of all time 🏔️" },
      { userIdx: 6, content: "New Zealanders are the friendliest people I've ever met. Such a welcoming country ❤️" },
    ],
  },
  {
    name: "Canada Immigration",
    description: "Express Entry, study permits, visitor visas, and moving to Canada — share your journey.",
    emoji: "🇨🇦",
    adminIdx: 8,
    memberIdxs: [0, 4, 6, 12, 14],
    messages: [
      { userIdx: 8, content: "Got my Canadian PR through Express Entry! CRS score was 468. The wait was worth it 🍁", gifUrl: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600&q=80" },
      { userIdx: 4, content: "Congratulations!! What NOC code did you use?" },
      { userIdx: 8, content: "NOC 21231 (Software Engineer). IELTS 8.5 helped a lot." },
      { userIdx: 6, content: "Vancouver winters are mild compared to Toronto. If you're weather-sensitive, BC is it 🌧️" },
      { userIdx: 12, content: "Student permit approved in 6 weeks. UBC is phenomenal 🎓" },
      { userIdx: 0, content: "Tim Hortons is not that good, I said what I said 😂" },
      { userIdx: 14, content: "LMAO it's a Canadian rite of passage. You'll grow to love it!" },
    ],
  },
  {
    name: "Germany & Schengen",
    description: "Berlin, Munich, Hamburg and the wider Schengen zone — visas, work permits, and relocation.",
    emoji: "🇩🇪",
    adminIdx: 5,
    memberIdxs: [0, 7, 9, 11, 13],
    messages: [
      { userIdx: 5, content: "German job seeker visa is open to skilled workers worldwide. 6 months to find a job — great deal!" },
      { userIdx: 9, content: "Blocked my whole week at the Ausländerbehörde. Took one day. Germany's bureaucracy is legendary 😅" },
      { userIdx: 5, content: "Anmeldung first, everything else follows. That's the golden rule.", gifUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80" },
      { userIdx: 11, content: "Berlin is the most international city I've ever lived in. English works everywhere" },
      { userIdx: 0, content: "Munich in October? Oktoberfest bucket list moment 🍺" },
      { userIdx: 7, content: "Neuschwanstein Castle in winter is a fairy tale. Go on a weekday to beat the crowds." },
    ],
  },
  {
    name: "UK Visa Circle",
    description: "Skilled Worker, Student, and Tourist visas for the UK — share experiences and tips.",
    emoji: "🇬🇧",
    adminIdx: 13,
    memberIdxs: [1, 2, 4, 7, 10],
    messages: [
      { userIdx: 13, content: "UK Standard Visitor Visa — 5 years, multiple entry. Apply well in advance! 🫖" },
      { userIdx: 1, content: "The biometric appointment system is backed up 6 weeks in Lagos. Book the moment you decide to go." },
      { userIdx: 2, content: "London in winter is underrated. No tourists, museums are gorgeous, pubs are cozy 🍺", gifUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80" },
      { userIdx: 7, content: "Edinburgh is worth the trip on its own. The castle, the Royal Mile... chef's kiss 🏰" },
      { userIdx: 4, content: "Skilled Worker visa approved in 3 weeks. NHS work is the smoothest sponsorship process." },
      { userIdx: 10, content: "Cotswolds in autumn is the most English thing you'll ever see 🍂" },
    ],
  },
  {
    name: "India Travel & Visa",
    description: "e-Visa on arrival, cultural immersion, and all things India — from the Himalayas to Kerala.",
    emoji: "🇮🇳",
    adminIdx: 6,
    memberIdxs: [3, 5, 8, 12, 14],
    messages: [
      { userIdx: 6, content: "India e-Tourist Visa is available for 169 countries. Apply 4 days before — approval is fast 🙏", gifUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80" },
      { userIdx: 3, content: "Rajasthan in October-March is golden. Jaisalmer, Udaipur, Jaipur — the whole Golden Triangle!" },
      { userIdx: 5, content: "Kerala backwaters — I spent 3 days on a houseboat and completely unplugged. Life-changing 🛶" },
      { userIdx: 8, content: "Food advice: always go where locals eat. The best biryani I had was at a no-sign shack in Hyderabad 🍛" },
      { userIdx: 14, content: "Varanasi at dawn is one of those experiences that rewires your brain 🕯️" },
      { userIdx: 12, content: "Avoid Delhi belly: stick to cooked food, sealed water, and restaurants with visible kitchens" },
    ],
  },
  {
    name: "Singapore & SEA",
    description: "Singapore as a hub for Southeast Asia — visas, transit tips, and island hopping routes.",
    emoji: "🇸🇬",
    adminIdx: 9,
    memberIdxs: [2, 3, 6, 13],
    messages: [
      { userIdx: 9, content: "Singapore needs zero visa for most passport holders. The cleanest, safest city I've ever visited 🦁" },
      { userIdx: 2, content: "Gardens by the Bay at night is otherworldly 🌳✨", gifUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80" },
      { userIdx: 3, content: "Use SG as a hub! Direct flights from here to Bali, Bangkok, KL, Manila are all under 2 hours" },
      { userIdx: 6, content: "Hawker centres > any restaurant. Lau Pa Sat is the move for dinner" },
      { userIdx: 13, content: "Sentosa isn't worth the hype but the cable car view is genuinely stunning" },
    ],
  },
  {
    name: "Brazil & South America",
    description: "From the Amazon to Patagonia — visa info, safe travel tips, and cultural gems.",
    emoji: "🇧🇷",
    adminIdx: 11,
    memberIdxs: [0, 3, 4, 8, 14],
    messages: [
      { userIdx: 11, content: "Brazil visa-free for US, EU, UK, and most countries now! Great news for travelers 🌴", gifUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&q=80" },
      { userIdx: 0, content: "Rio is stunning but take sensible precautions in tourist areas. Use registered taxis or Uber" },
      { userIdx: 3, content: "Florianópolis beaches rival anything in the Caribbean. Much less crowded 🏄" },
      { userIdx: 4, content: "Iguazú Falls from both Argentina AND Brazil side. Don't miss either! The scale is incomprehensible 🌊" },
      { userIdx: 8, content: "Brazilian food. The churrasco. THE PÃO DE QUEIJO. I need to go back immediately 🥩" },
      { userIdx: 14, content: "Buenos Aires is worth the side trip. Best steak I've ever eaten, incredible culture 🥩🇦🇷" },
    ],
  },
  {
    name: "Greece & Islands",
    description: "Santorini, Mykonos, Athens and beyond — Schengen entry, island hopping, and local secrets.",
    emoji: "🇬🇷",
    adminIdx: 4,
    memberIdxs: [0, 5, 7, 10, 13],
    messages: [
      { userIdx: 4, content: "Greece in May or September is perfection. Not too hot, crowds are manageable 🌊", gifUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80" },
      { userIdx: 0, content: "Santorini sunset from Oia. Nothing more to add. Just go." },
      { userIdx: 5, content: "Naxos is my favorite Greek island and I will die on this hill. Larger, local, beautiful." },
      { userIdx: 7, content: "Rhodes old town is a UNESCO site and completely underrated. Game of Thrones vibes 🏰" },
      { userIdx: 10, content: "Athens needs more than 2 days. The Acropolis Museum alone is half a day well spent" },
      { userIdx: 13, content: "Ferry hopping from Piraeus: Mykonos → Paros → Naxos → Santorini. The classic route 🛳️" },
    ],
  },
  {
    name: "Portugal Lovers",
    description: "Golden Visa, NHR tax regime, and why everyone is moving to Portugal right now.",
    emoji: "🇵🇹",
    adminIdx: 10,
    memberIdxs: [0, 4, 5, 8, 12],
    messages: [
      { userIdx: 10, content: "Portugal NHR regime ends soon but D8 Digital Nomad visa is still excellent. €3,280/month income req" },
      { userIdx: 0, content: "Lisbon has replaced Barcelona as my dream city. Pastel de nata is the reason 🥧", gifUrl: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80" },
      { userIdx: 4, content: "Porto is criminally underrated. The Douro Valley wine region is right there 🍷" },
      { userIdx: 5, content: "Alentejo for slow travel — cork forests, medieval villages, and zero tourists 🌾" },
      { userIdx: 8, content: "Cost of living is rising in Lisbon. Check out Setúbal or Braga for more affordable options" },
      { userIdx: 12, content: "Surfing in Nazaré! The biggest waves in the world. Watching is enough if you're not a surfer 🏄" },
    ],
  },
  {
    name: "Mexico & Latin America",
    description: "Cancún, Mexico City, and beyond — visas, safety guides, and authentic cultural experiences.",
    emoji: "🇲🇽",
    adminIdx: 3,
    memberIdxs: [1, 4, 8, 11, 14],
    messages: [
      { userIdx: 3, content: "Mexico City is one of the best food cities on earth, full stop. Contramar, Pujol, El Cardenal 🌮", gifUrl: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=600&q=80" },
      { userIdx: 1, content: "Oaxaca during Día de los Muertos is a life experience. The whole city transforms" },
      { userIdx: 4, content: "Yucatán peninsula: Mérida → Valladolid → Tulum → Bacalar. The perfect 2-week route" },
      { userIdx: 8, content: "FMM tourist card lasts 180 days. Great for longer stays and digital nomads 💻" },
      { userIdx: 11, content: "Cenotes near Tulum are magical but avoid the super touristy ones. Ask locals for hidden gems 🤿" },
      { userIdx: 14, content: "Colombia and Peru are incredible side trips from Mexico. LA PAZ IS INSANE altitude-wise 😅" },
    ],
  },
  {
    name: "South Korea Explorers",
    description: "K-culture, K-food, and Korea's incredibly efficient visa system — discuss here.",
    emoji: "🇰🇷",
    adminIdx: 2,
    memberIdxs: [0, 3, 6, 9, 12],
    messages: [
      { userIdx: 2, content: "K-ETA is now required for most visa-free travelers to Korea. Apply 72hrs before departure! ✈️" },
      { userIdx: 0, content: "Seoul subway is the best in the world. Clean, cheap, on time, AC in summer ❄️", gifUrl: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&q=80" },
      { userIdx: 9, content: "Busan > Seoul for vibes. Haeundae Beach, Gamcheon Culture Village, Jagalchi fish market 🐟" },
      { userIdx: 3, content: "Jeju Island is magical in any season. Hallasan hike is tough but worth every step 🌿" },
      { userIdx: 6, content: "Pro tip: Naver Maps > Google Maps for Korea. Way more accurate transit info" },
      { userIdx: 12, content: "Korean BBQ at midnight is a societal institution and I am here for it 🥩🍺" },
    ],
  },
  {
    name: "UAE & Middle East",
    description: "Dubai, Abu Dhabi, and the wider Gulf region — visas on arrival, golden visas, and luxury travel.",
    emoji: "🇦🇪",
    adminIdx: 14,
    memberIdxs: [1, 5, 8, 10, 11],
    messages: [
      { userIdx: 14, content: "UAE visa on arrival for 180+ nationalities. 30 days free! Easy extension online 🏙️", gifUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80" },
      { userIdx: 8, content: "Golden Visa changes everything. 10-year residency without sponsorship! Great for remote workers" },
      { userIdx: 5, content: "Dubai in November-April is perfect. December especially has the best weather" },
      { userIdx: 1, content: "Abu Dhabi's Sheikh Zayed Mosque is the most beautiful building I've ever stood in 🕌" },
      { userIdx: 10, content: "Desert safari + dune bashing is touristy but genuinely fun. Do the sunset one 🌅" },
      { userIdx: 11, content: "Oman is 2 hours from Dubai and feels like another planet. Muscat is stunning and calm" },
    ],
  },
  {
    name: "Netherlands & Benelux",
    description: "Amsterdam, windmills, and the Benelux region — Schengen tips and expat life.",
    emoji: "🇳🇱",
    adminIdx: 7,
    memberIdxs: [0, 5, 9, 13],
    messages: [
      { userIdx: 7, content: "Dutch DAFT visa for self-employed Americans is one of the best kept secrets in expat life 🚲" },
      { userIdx: 0, content: "Amsterdam in tulip season is something else entirely 🌷", gifUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80" },
      { userIdx: 5, content: "Keukenhof Gardens in April. Put it on your bucket list and go." },
      { userIdx: 9, content: "Belgian chocolate and waffles are not a cliché, they are FACTS 🍫" },
      { userIdx: 13, content: "Bruges is Europe's most charming small city. Half day from Brussels." },
    ],
  },
  {
    name: "Spain & Balearics",
    description: "Ibiza, Mallorca, Barcelona, Seville — Spain travel tips and digital nomad visa discussion.",
    emoji: "🇪🇸",
    adminIdx: 4,
    memberIdxs: [0, 3, 10, 11, 14],
    messages: [
      { userIdx: 4, content: "Spain Digital Nomad Visa (DNV) — €2,160/month income, 12-month initial permit. Big WIN 🎉" },
      { userIdx: 0, content: "Barcelona architecture alone justifies the trip. Sagrada Família is jaw-dropping 🏛️", gifUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80" },
      { userIdx: 3, content: "San Sebastián has the highest concentration of Michelin stars per capita in the world 🍽️" },
      { userIdx: 10, content: "Andalucía in spring: Seville → Córdoba → Granada → Ronda. Perfect road trip route 🌸" },
      { userIdx: 11, content: "Mallorca for off-peak travel is stunning. October is perfect — warm sea, zero crowds" },
      { userIdx: 14, content: "Siesta culture is real and I miss it every day back home 😴" },
    ],
  },
  {
    name: "New Zealand Adventures",
    description: "Lord of the Rings landscapes, Māori culture, and New Zealand visa guidance.",
    emoji: "🇳🇿",
    adminIdx: 7,
    memberIdxs: [2, 5, 6, 12],
    messages: [
      { userIdx: 7, content: "NZ ETA (Electronic Travel Authority) needed for most visa-waiver countries. $17 NZD, instant! 🥝", gifUrl: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80" },
      { userIdx: 2, content: "Fiordland National Park is another planet. Milford Sound in the mist = perfection 🌿" },
      { userIdx: 5, content: "Queenstown is touristy but bungee jumping off Kawarau Bridge is peak bucket list ✅" },
      { userIdx: 6, content: "Rotorua smells like eggs but the Māori cultural shows and geothermal pools are 100% worth it" },
      { userIdx: 12, content: "Abel Tasman coastal walk is NZ's most popular hike and for very good reason 🌊" },
    ],
  },
  {
    name: "Indonesia & Bali",
    description: "Bali visa on arrival, Lombok, Java, and island hopping across the Indonesian archipelago.",
    emoji: "🇮🇩",
    adminIdx: 6,
    memberIdxs: [1, 3, 9, 12, 14],
    messages: [
      { userIdx: 6, content: "Bali B211A social/cultural visa — perfect for digital nomads. 60 days extendable ✌️" },
      { userIdx: 1, content: "Canggu has become too developed. I prefer Sidemen or Munduk for the authentic Bali feel 🌺", gifUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80" },
      { userIdx: 3, content: "Sunrise at Mount Batur. 3am start. Worth every second of lost sleep 🌄" },
      { userIdx: 9, content: "The Gili Islands for snorkeling are perfect. No motorized vehicles — just bikes and horse carts 🐢" },
      { userIdx: 12, content: "Java: Borobudur at sunrise, Bromo crater, Yogyakarta's wayang culture. An entire trip in itself!" },
      { userIdx: 14, content: "Komodo Island to see actual living dragons is one of the most surreal experiences 🦎" },
    ],
  },

  // ── Scenic & Natural Wonder Groups ─────────────────────────────────────
  {
    name: "Northern Lights Chasers",
    description: "Chasing the Aurora Borealis across Norway, Iceland, Finland, and Canada — share your sightings!",
    emoji: "🌌",
    adminIdx: 7,
    memberIdxs: [0, 2, 5, 9, 12],
    messages: [
      { userIdx: 7, content: "Just caught my first aurora in Tromsø, Norway. No words. Here's proof 🌌", gifUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=80" },
      { userIdx: 0, content: "How many nights did you need? I heard you need to budget at least 3-4 for a good chance" },
      { userIdx: 7, content: "4 nights, saw it on nights 2 and 3. Get the free apps: Aurora Forecast or SpaceWeatherLive" },
      { userIdx: 2, content: "Iceland in February is special. Seeing the aurora over a black sand beach is other-dimensional 🌊" },
      { userIdx: 5, content: "Finnish Lapland glass igloos! You watch the aurora from your bed. Peak luxury 🛏️" },
      { userIdx: 9, content: "Yukon in Canada is massively underrated for auroras. Way fewer tourists than Norway" },
      { userIdx: 12, content: "KP Index 5+ is your magic number. Anything above that and you're almost guaranteed a show ✨" },
    ],
  },
  {
    name: "Patagonia Explorers",
    description: "Torres del Paine, Los Glaciares, and the wild end of the world — trekking Patagonia together.",
    emoji: "🏔️",
    adminIdx: 11,
    memberIdxs: [3, 7, 9, 13],
    messages: [
      { userIdx: 11, content: "W-Trek in Torres del Paine is the benchmark for all other hikes. Book your refugios 6 months out!", gifUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80" },
      { userIdx: 3, content: "Fitz Roy in El Chaltén is arguably even more dramatic than Torres. And it's free entry! 🎒" },
      { userIdx: 7, content: "Perito Moreno Glacier calving is one of the most dramatic natural shows on earth. The sound! 🧊" },
      { userIdx: 9, content: "Pack for 4 seasons in one day. Seriously. Sun, wind, rain, hail — all before lunch 😅" },
      { userIdx: 13, content: "October and November are magical — wildflowers everywhere and the worst crowds haven't arrived yet 🌸" },
    ],
  },
  {
    name: "Kyoto Cherry Blossoms",
    description: "Spring in Japan — hanami season timing, best spots, and everything sakura.",
    emoji: "🌸",
    adminIdx: 2,
    memberIdxs: [0, 6, 9, 12, 13],
    messages: [
      { userIdx: 2, content: "Peak bloom 2025: March 27 - April 5 in Kyoto. Book accommodation NOW if you haven't 🌸", gifUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&q=80" },
      { userIdx: 0, content: "Philosopher's Path at dawn before the crowds arrive. A completely different experience 🚶" },
      { userIdx: 6, content: "Maruyama Park at night during hanami is one of the most beautiful things I've ever seen 🕯️" },
      { userIdx: 9, content: "If Kyoto is fully booked, Nara and Osaka are gorgeous alternatives just 30-45 mins by train 🦌" },
      { userIdx: 12, content: "Bring a picnic blanket and sit under the trees at Hirano Shrine. Hidden gem compared to Maruyama" },
      { userIdx: 13, content: "The JR Pass is your best friend during cherry blossom season — hop between cities effortlessly 🚄" },
    ],
  },
  {
    name: "Machu Picchu Trekkers",
    description: "Inca Trail, Salkantay, and alternative routes to Machu Picchu — permits and prep advice.",
    emoji: "🏛️",
    adminIdx: 3,
    memberIdxs: [5, 9, 11, 14],
    messages: [
      { userIdx: 3, content: "Inca Trail permits sell out 6+ months in advance. Book through a licensed operator only!", gifUrl: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80" },
      { userIdx: 5, content: "Did Salkantay alternative — harder but wilder. Saw Machu Picchu with just our group and two condors 🦅" },
      { userIdx: 9, content: "Altitude sickness hits hard in Cusco. Give yourself 2 days to acclimatize before ANY hike. Coca tea helps" },
      { userIdx: 11, content: "The Sun Gate (Intipunku) arrival at dawn on the Inca Trail. I have replayed this moment 1000 times 🌅" },
      { userIdx: 14, content: "Take the bus down from the ruins and walk the steep zigzag path up once — incredible views the whole way" },
    ],
  },
  {
    name: "Amalfi Coast Lovers",
    description: "Positano, Ravello, and the Amalfi Drive — planning the perfect Southern Italy coast trip.",
    emoji: "🌊",
    adminIdx: 0,
    memberIdxs: [4, 5, 7, 11],
    messages: [
      { userIdx: 0, content: "Arrived in Positano at golden hour by ferry from Naples. The colours were unreal 🎨", gifUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80" },
      { userIdx: 4, content: "Ravello is the hidden gem. Fewer tourists, Villa Cimbrone gardens with the terrace view will stop your heart" },
      { userIdx: 5, content: "Hire a scooter for the Amalfi Drive if you're confident on roads. Life-changing perspective 🛵" },
      { userIdx: 7, content: "Path of the Gods hike above the coast — 8km, stunning. Best done west to east for the view" },
      { userIdx: 11, content: "Limoncello at every stop is not optional, it's mandatory 🍋" },
    ],
  },
  {
    name: "Santorini Dreamers",
    description: "Blue domes, sunsets, and everything you need to know about Santorini beyond the clichés.",
    emoji: "⛵",
    adminIdx: 4,
    memberIdxs: [0, 7, 9, 10, 13],
    messages: [
      { userIdx: 4, content: "Stayed in Imerovigli instead of Oia — half the price, better sunset views, fewer selfie sticks 📸", gifUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80" },
      { userIdx: 0, content: "The Red Beach and White Beach by boat from Akrotiri is the anti-Oia tour and it's wonderful" },
      { userIdx: 7, content: "Akrotiri archaeological site is a Bronze Age Pompeii and barely anyone visits. Go!" },
      { userIdx: 9, content: "The local Assyrtiko wine is world class. Santo Wines winery has the best sunset tasting 🍷" },
      { userIdx: 10, content: "June-August is too crowded and too hot. May or October is the sweet spot" },
      { userIdx: 13, content: "Arrived by ferry from Athens overnight. Waking up to the caldera views is the most cinematic thing 🌋" },
    ],
  },
  {
    name: "Safari Africa",
    description: "Kenya, Tanzania, South Africa, Botswana — planning and experiencing the African safari.",
    emoji: "🦁",
    adminIdx: 1,
    memberIdxs: [4, 5, 8, 11, 14],
    messages: [
      { userIdx: 1, content: "Just returned from the Maasai Mara during the Great Migration. Words genuinely fail me 🦓", gifUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80" },
      { userIdx: 4, content: "Chobe National Park in Botswana for elephants. 50,000 of them. FIFTY THOUSAND 🐘" },
      { userIdx: 5, content: "South Africa's Kruger on a self-drive safari is incredibly affordable and amazing. Big 5 in a week ✅" },
      { userIdx: 8, content: "Tanzania eVisa is fully online. Quick and straightforward. Kilimanjaro is calling 🏔️" },
      { userIdx: 11, content: "Rwanda gorilla trekking permit: $1,500 but an experience unlike anything else on earth 🦍" },
      { userIdx: 14, content: "Go in dry season (June-October) for best game viewing. Animals cluster around water sources 🌿" },
    ],
  },
  {
    name: "Maldives Divers & Snorkelers",
    description: "Overwater bungalows, coral reefs, and everything the Maldives has to offer above and below the surface.",
    emoji: "🐠",
    adminIdx: 9,
    memberIdxs: [0, 6, 7, 13],
    messages: [
      { userIdx: 9, content: "30-day visa on arrival free for all nationalities. Just book your accommodation and you're set 🐠", gifUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80" },
      { userIdx: 0, content: "Saw whale sharks snorkeling off South Ari Atoll. Nothing in my life prepared me for that experience 🦈" },
      { userIdx: 6, content: "Bioluminescent plankton on the beach at night is one of Earth's most magical displays 🌊✨" },
      { userIdx: 7, content: "Budget option: stay on a local island (Maafushi or Dhigurah) vs resort. Still paradise, 1/5 the price" },
      { userIdx: 13, content: "The marine life diversity here is unmatched. Mantas, turtles, reef sharks on every dive 🤿" },
    ],
  },

  // ── Special Interest Groups ─────────────────────────────────────────────
  {
    name: "Digital Nomads Hub",
    description: "Remote work, co-living spaces, visa strategies, and the best cities for location independence.",
    emoji: "💻",
    adminIdx: 5,
    memberIdxs: [0, 3, 6, 8, 10, 14],
    messages: [
      { userIdx: 5, content: "Nomad visa roundup 2025: Portugal (D8), Spain (DNV), Germany, Greece, Hungary, Thailand LTR, UAE 🗺️" },
      { userIdx: 0, content: "Chiang Mai is still unbeatable for the price-to-quality ratio. $1,200/month all-in is realistic 🇹🇭" },
      { userIdx: 3, content: "Medellín is having a moment. Incredible infrastructure, spring climate year-round, great coworking 🇨🇴" },
      { userIdx: 6, content: "Tbilisi, Georgia: visa-free for 365 days for most nationalities. Cheapest fast internet in Europe 🇬🇪", gifUrl: "https://images.unsplash.com/photo-1562880801-ece0e2c9a51f?w=600&q=80" },
      { userIdx: 8, content: "Bali Coworking scene: Dojo, Outpost, and Tropical Nomad are the big three. All solid." },
      { userIdx: 10, content: "Warning: 'digital nomad visa' doesn't always mean tax treaty. Always get local tax advice 💡" },
      { userIdx: 14, content: "Mexico CDMX has the best food of any nomad city I've lived in. And it's massive 🌮" },
    ],
  },
  {
    name: "Solo Female Travelers",
    description: "Safe travel tips, destination advice, and community for women exploring the world alone.",
    emoji: "👩‍✈️",
    adminIdx: 4,
    memberIdxs: [0, 6, 8, 10, 12, 14],
    messages: [
      { userIdx: 4, content: "This group exists because safety info should be shared, not gatekept. Welcome everyone 💪" },
      { userIdx: 0, content: "Georgia (country) is my top pick for solo female travel. Incredibly safe, incredibly beautiful 🇬🇪", gifUrl: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&q=80" },
      { userIdx: 6, content: "Always share your location with someone you trust. I use Trusted Contacts or WhatsApp live location 📍" },
      { userIdx: 8, content: "Japan is the gold standard for solo female travel safety. Never felt even slightly uncomfortable 🇯🇵" },
      { userIdx: 10, content: "Morocco tip: book a riad with a communal rooftop, meet other travelers, and explore in groups for medina visits 🏮" },
      { userIdx: 12, content: "Iceland has almost zero crime. You can hike alone with zero anxiety. True freedom 🌋" },
      { userIdx: 14, content: "Download maps offline before you go. No-signal mountain zones are not the time to realize Google Maps needs data 📱" },
    ],
  },
  {
    name: "Budget Backpackers",
    description: "Hostel hacks, cheap flights, free activities, and how to travel the world on a shoestring.",
    emoji: "🎒",
    adminIdx: 13,
    memberIdxs: [1, 3, 9, 11, 14],
    messages: [
      { userIdx: 13, content: "Southeast Asia on $35/day is extremely doable if you choose guesthouses over resorts 🎒" },
      { userIdx: 1, content: "Scott's Cheap Flights (now Going.com) has saved me thousands. Set alerts for your home airport! ✈️" },
      { userIdx: 3, content: "Warsaw, Krakow, Budapest, Belgrade — Eastern Europe is the best value in the world right now 💸" },
      { userIdx: 9, content: "Night trains = free hotel + transport. European overnight trains are having a comeback 🚂" },
      { userIdx: 11, content: "Couchsurfing still works and the community is amazing if you actively contribute and review 🛋️" },
      { userIdx: 14, content: "Free walking tours in every major city. Tip what you can — guides depend on it 🗺️" },
    ],
  },
  {
    name: "Luxury Travel & Retreats",
    description: "5-star resorts, private villas, private jets, and curated luxury experiences worldwide.",
    emoji: "✨",
    adminIdx: 8,
    memberIdxs: [0, 5, 7, 10],
    messages: [
      { userIdx: 8, content: "Aman Tokyo. That's the review. That's all. 10/10 no notes ✨", gifUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80" },
      { userIdx: 0, content: "Four Seasons Bora Bora overwater villa at dawn is a picture I will never stop staring at 🌺" },
      { userIdx: 5, content: "Private villa rentals via Airbnb Luxe for groups of 6+ often beat hotel pricing dramatically 🏡" },
      { userIdx: 7, content: "Emirates First Class Suite — the shower at 37,000 feet never gets old 🚿✈️" },
      { userIdx: 10, content: "Belmond train journeys (Venice Simplon-Orient-Express, Royal Scotsman) are a different kind of luxury 🚆" },
    ],
  },
  {
    name: "Family Travel Club",
    description: "Kid-friendly destinations, baby gear logistics, and how to travel brilliantly with children.",
    emoji: "👨‍👩‍👧‍👦",
    adminIdx: 12,
    memberIdxs: [0, 3, 5, 8, 10],
    messages: [
      { userIdx: 12, content: "Costa Rica with kids is perfect. Wildlife, volcanoes, beaches — and the eco-lodges are family-friendly 🦥" },
      { userIdx: 0, content: "Japan is incredible for families. Clean, safe, and kids get celebrity treatment wherever you go 🇯🇵", gifUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80" },
      { userIdx: 3, content: "Under 2? Most airlines let them fly free on your lap. Plan one big trip before they turn 2! ✈️" },
      { userIdx: 5, content: "Disneyland Paris vs Disney World: Paris is more compact and actually manageable with young kids 🎡" },
      { userIdx: 8, content: "Nordic countries for older kids — Norway fjords, Viking museums, the way of life itself teaches them so much" },
      { userIdx: 10, content: "Always pack a small backpack with activities for long flights. iPad + noise canceling headphones saved my sanity 🎧" },
    ],
  },
  {
    name: "Food Tourism Network",
    description: "Eating your way around the world — Michelin stars, street food markets, cooking classes, and culinary trails.",
    emoji: "🍽️",
    adminIdx: 6,
    memberIdxs: [0, 3, 4, 9, 11, 13],
    messages: [
      { userIdx: 6, content: "Bangkok street food is the most complex, layered cuisine I've encountered anywhere. Som tam, pad kra pao, mango sticky rice 🌶️" },
      { userIdx: 0, content: "Bologna, Italy is the real food capital of Italy. Forget Milan or Rome — this is where it's at 🍝", gifUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80" },
      { userIdx: 3, content: "Tokyo has more Michelin stars than Paris and London combined. The sushi omakase experience at a counter is magic 🍣" },
      { userIdx: 4, content: "Peru's food scene is in the top 3 globally and criminally underrated internationally. Ceviche alone is worth the flight ✈️" },
      { userIdx: 9, content: "Oaxacan mole. If you haven't been to Oaxaca specifically to eat, you have not yet lived 🫘" },
      { userIdx: 11, content: "Hawker centres in Singapore are where you go if you want cheap food cooked at Michelin-recognized standard 🇸🇬" },
      { userIdx: 13, content: "San Sebastián pintxos bar-hopping is the most fun cultural experience. Just order, eat, drink, repeat 🍷" },
    ],
  },
  {
    name: "Travel Photography",
    description: "Composition tips, golden hour guides, gear advice, and sharing your best travel shots.",
    emoji: "📸",
    adminIdx: 9,
    memberIdxs: [0, 2, 5, 7, 11, 13],
    messages: [
      { userIdx: 9, content: "Shot this from the Burj Khalifa observation deck at blue hour. Dubai lights are unreal 📸", gifUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80" },
      { userIdx: 0, content: "The rule: golden hour + blue hour are 80% of great travel photography. Wake up earlier than everyone." },
      { userIdx: 2, content: "Mirrorless over DSLR for travel now. Sony A7IV or Fuji X-T5 are the current top choices for serious shooters" },
      { userIdx: 5, content: "Phone cameras in 2025 are genuinely incredible. Pixel 9 Pro and iPhone 16 Pro shoot better than most tourists need 📱" },
      { userIdx: 7, content: "Capture people first, landscapes second. Faces and moments tell the story architecture cannot 👤" },
      { userIdx: 11, content: "ND filters for waterfalls and long exposure city shots. One essential piece of kit that costs under $50 🌊" },
      { userIdx: 13, content: "Google Street View planning — you can scout exact camera positions before you arrive. Time saver!" },
    ],
  },
  {
    name: "Wellness & Retreat Travel",
    description: "Yoga retreats, meditation centers, hot springs, and healing destinations around the world.",
    emoji: "🧘",
    adminIdx: 14,
    memberIdxs: [0, 4, 6, 10, 12],
    messages: [
      { userIdx: 14, content: "Ubud, Bali for yoga retreats is the global benchmark. The energy of the place is genuinely transformative 🧘", gifUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80" },
      { userIdx: 0, content: "Blue Lagoon, Iceland is touristy but the silica mud and geothermal heat in December darkness is magical ♨️" },
      { userIdx: 4, content: "Rishikesh, India for authentic yoga — stay on the Ganga banks, early morning aarti is transcendent 🙏" },
      { userIdx: 6, content: "Silent retreat in Plum Village (Thailand or France) — hardest and most valuable week of my life 🌸" },
      { userIdx: 10, content: "Japanese onsen culture is the perfect work detox. Rotemburo (outdoor hot spring) in winter snow 🌨️" },
      { userIdx: 12, content: "Sri Lanka Ayurvedic retreats are authentic and excellent value. 2 weeks of panchakarma for under $2,000 🌿" },
    ],
  },
  {
    name: "Adventure Sports Travelers",
    description: "Skydiving, surfing, mountaineering, white water rafting — extreme experiences and where to find them.",
    emoji: "🪂",
    adminIdx: 3,
    memberIdxs: [1, 5, 7, 9, 11, 13],
    messages: [
      { userIdx: 3, content: "Skydiving over the Swiss Alps in Interlaken. Nothing, and I mean nothing, compares 🪂", gifUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80" },
      { userIdx: 1, content: "Surfing Uluwatu in Bali. Expert only — the reef is brutal — but the most beautiful break I've ridden 🏄" },
      { userIdx: 5, content: "White water rafting the Zambezi below Victoria Falls is legitimately terrifying and completely worth it 🌊" },
      { userIdx: 7, content: "Via ferrata in the Dolomites — not technical climbing, but the exposure and views are dramatic 🏔️" },
      { userIdx: 9, content: "Bungee jumping in Queenstown. I have done it twice. I will do it again. That's all." },
      { userIdx: 11, content: "Kitesurfing in Tarifa, Spain — best consistent wind in Europe, incredible instructors 💨" },
      { userIdx: 13, content: "Ice climbing in Iceland is surreal. The colors in glacial ice are something no photo captures fully 🧊" },
    ],
  },
  {
    name: "Volunteer Travel Network",
    description: "Ethical volunteering abroad — wildlife conservation, education, community building, and responsible travel.",
    emoji: "🤝",
    adminIdx: 10,
    memberIdxs: [0, 4, 6, 8, 12, 14],
    messages: [
      { userIdx: 10, content: "Key rule: research your volunteer org carefully. Voluntourism done wrong harms more than it helps. GVI, Projects Abroad, and Global Vision International are well-vetted 🤝" },
      { userIdx: 0, content: "Wildlife rehab in South Africa — raising orphaned lion cubs is as amazing and heartbreaking as it sounds 🦁", gifUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80" },
      { userIdx: 4, content: "Teaching English in rural Vietnam for a month was the most humbling experience of my life 📚" },
      { userIdx: 6, content: "Marine conservation in the Maldives — coral reef restoration. Diving and doing good simultaneously 🐠" },
      { userIdx: 8, content: "Sea turtle monitoring in Costa Rica — you walk the beach at night and watch nesting mothers. Magical 🐢" },
      { userIdx: 12, content: "Build skills the community actually needs. General volunteering with no skills is often counterproductive. Come with something to offer 💡" },
      { userIdx: 14, content: "Workaway and HelpX are great platforms for exchange programs — work for accommodation + meals. Incredible value" },
    ],
  },
];

// ── Seed runner ──────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding dummy users…");
  for (const u of DUMMY_USERS) {
    await db
      .insert(usersTable)
      .values(u)
      .onConflictDoUpdate({
        target: usersTable.id,
        set: {
          firstName: u.firstName,
          lastName: u.lastName,
          profileImageUrl: u.profileImageUrl,
          homeCountry: u.homeCountry,
        },
      });
  }
  console.log(`✅ ${DUMMY_USERS.length} users upserted`);

  console.log("🌱 Seeding groups, members and messages…");
  let groupsCreated = 0;
  let messagesCreated = 0;

  for (const g of GROUPS) {
    // Create group (skip if name already exists)
    const adminUser = DUMMY_USERS[g.adminIdx];
    const [existing] = await db
      .select({ id: groupsTable.id })
      .from(groupsTable)
      .where(sql`lower(${groupsTable.name}) = lower(${g.name})`)
      .limit(1);

    let groupId: number;
    if (existing) {
      groupId = existing.id;
      console.log(`  ⏭  Group "${g.name}" already exists (id=${groupId})`);
    } else {
      const [created] = await db
        .insert(groupsTable)
        .values({
          name: g.name,
          description: g.description,
          emoji: g.emoji,
          adminId: adminUser.id,
          isPrivate: false,
        })
        .returning({ id: groupsTable.id });
      groupId = created.id;
      groupsCreated++;
      console.log(`  ✅ Created group "${g.name}" (id=${groupId})`);
    }

    // Add admin as member
    await db
      .insert(groupMembersTable)
      .values({ groupId, userId: adminUser.id, role: "admin" })
      .onConflictDoNothing();

    // Add other members
    for (const idx of g.memberIdxs) {
      const u = DUMMY_USERS[idx];
      await db
        .insert(groupMembersTable)
        .values({ groupId, userId: u.id, role: "member" })
        .onConflictDoNothing();
    }

    // Add messages — only if group has none yet (idempotent)
    const existingMsgs = await db
      .select({ id: groupMessagesTable.id })
      .from(groupMessagesTable)
      .where(eq(groupMessagesTable.groupId, groupId))
      .limit(1);

    if (existingMsgs.length === 0) {
      for (const m of g.messages) {
        const u = DUMMY_USERS[m.userIdx];
        await db.insert(groupMessagesTable).values({
          groupId,
          userId: u.id,
          content: m.content,
          gifUrl: m.gifUrl ?? null,
        });
        messagesCreated++;
      }
    }
  }

  console.log(`\n🎉 Done! ${groupsCreated} groups created, ${messagesCreated} messages inserted`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

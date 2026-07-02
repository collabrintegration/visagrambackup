import { db, usersTable, reviewsTable, questionsTable, answersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const SEED_USERS = [
  { id: "seed-user-1", firstName: "Sofia", lastName: "Marchetti", email: "sofia@example.com" },
  { id: "seed-user-2", firstName: "James", lastName: "Okafor", email: "james@example.com" },
  { id: "seed-user-3", firstName: "Yuki", lastName: "Tanaka", email: "yuki@example.com" },
  { id: "seed-user-4", firstName: "Diego", lastName: "Reyes", email: "diego@example.com" },
  { id: "seed-user-5", firstName: "Amara", lastName: "Diallo", email: "amara@example.com" },
  { id: "seed-user-6", firstName: "Lena", lastName: "Fischer", email: "lena@example.com" },
  { id: "seed-user-7", firstName: "Priya", lastName: "Sharma", email: "priya@example.com" },
  { id: "seed-user-8", firstName: "Tom", lastName: "Eriksen", email: "tom@example.com" },
];

const SEED_REVIEWS: Array<{
  userId: string;
  countryCode: string;
  title: string;
  overallRating: number;
  easeRating: number;
  welcomeRating: number;
  body: string;
}> = [
  // ── Japan ──
  {
    userId: "seed-user-1",
    countryCode: "JP",
    title: "Best trip of my life — flawless entry process",
    overallRating: 5,
    easeRating: 4,
    welcomeRating: 5,
    body: "Japan absolutely blew me away. The process of getting a tourist visa took about a week — fill out the forms online, book an appointment at the consulate, and you're done. Once there, border control was smooth and the officers were professional. Locals are incredibly helpful even with the language barrier. The train network makes everything effortless. Highly recommend.",
  },
  {
    userId: "seed-user-2",
    countryCode: "JP",
    title: "e-Visa from Nigeria in 4 days — smooth arrival at Narita",
    overallRating: 4,
    easeRating: 5,
    welcomeRating: 4,
    body: "The e-visa system Japan rolled out recently is a game changer. Applied online from Lagos, paid the fee, got approved in 4 days. Arrival at Narita was surprisingly quick — the automated gates handle most things. Japanese culture is a bit reserved but once people warm up they're fantastic. Definitely going back.",
  },
  // ── France ──
  {
    userId: "seed-user-3",
    countryCode: "FR",
    title: "Schengen paperwork is a marathon, but Paris delivers",
    overallRating: 4,
    easeRating: 3,
    welcomeRating: 4,
    body: "Paris was as beautiful as promised. The Schengen visa process is a bit of a paperwork marathon — bank statements, hotel bookings, travel insurance, employment letter — but it's manageable if you plan 6 weeks ahead. CDG airport customs was straightforward. The French can be standoffish at first but speak even a few words of French and the attitude completely changes.",
  },
  {
    userId: "seed-user-4",
    countryCode: "FR",
    title: "Visa-free entry as a Mexican — total ease",
    overallRating: 5,
    easeRating: 4,
    welcomeRating: 5,
    body: "Came with a Mexican passport so visa-free entry made everything so relaxed. Just showed up, answered a few questions at immigration, and walked right in. France rewards slow travel — rent an apartment for a month in a small town and you'll see a completely different side of the country. Food is everything they say it is.",
  },
  // ── Thailand ──
  {
    userId: "seed-user-5",
    countryCode: "TH",
    title: "Most welcoming country I've ever visited",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Thailand is probably the most welcoming country I've ever visited. On-arrival visa was painless — the queue moved fast at Suvarnabhumi, filled out one small form, paid the fee in baht (or USD), and done. Officers were friendly and efficient. Thais are genuinely warm to visitors everywhere from Bangkok street stalls to remote islands. Absolute must-visit.",
  },
  {
    userId: "seed-user-6",
    countryCode: "TH",
    title: "60-day tourist visa is fantastic for longer stays",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 5,
    body: "My second time in Thailand and it keeps getting better. The new 60-day tourist visa is great value if you're planning a longer stay. Pro tip: do the border run to extend if you want even more time — many expats do it regularly. The food and the people are the real attraction, not just the beaches.",
  },
  // ── Germany ──
  {
    userId: "seed-user-7",
    countryCode: "DE",
    title: "Efficient visa process, Berlin is incredibly diverse",
    overallRating: 4,
    easeRating: 3,
    welcomeRating: 3,
    body: "Germany is efficient as expected. The Schengen visa from India takes around 2–3 weeks and requires a lot of documentation, but VFS Global appointment slots aren't too hard to get in major cities. Berlin was incredibly diverse and welcoming; smaller cities less so but still perfectly fine. Public transport is world class.",
  },
  {
    userId: "seed-user-8",
    countryCode: "DE",
    title: "EU lane in 2 minutes — road trip heaven",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 4,
    body: "Free entry with a Scandinavian passport — just walked through the EU lane in about 2 minutes. Germany is incredible for road trips: autobahn, incredible rest stops, beautiful countryside. Munich to Berlin is a classic. Germans are direct and honest which I appreciate, even if it takes a little getting used to after sunnier countries.",
  },
  // ── Italy ──
  {
    userId: "seed-user-1",
    countryCode: "IT",
    title: "Chaos in the best way — Italians are magic",
    overallRating: 5,
    easeRating: 3,
    welcomeRating: 5,
    body: "Italy is chaos in the best way. Schengen visa from Italy specifically felt a little slow at the consulate — took almost 3 weeks — but that's an exception in my experience. Immigration at FCO airport was relaxed. Italians are the most naturally hospitable people; strangers will give you 30-minute walking tours because they're proud of their city. Go slow, eat well.",
  },
  {
    userId: "seed-user-3",
    countryCode: "IT",
    title: "Book skip-the-line tickets months in advance",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 4,
    body: "Beautiful country but a few things to know: tourist queues everywhere in summer (book skip-the-line tickets for major attractions months in advance), and some areas are noticeably more tourist-friendly than others. The language barrier is more present than in France or Germany. That said, the food alone justifies every hassle.",
  },
  // ── United States ──
  {
    userId: "seed-user-2",
    countryCode: "US",
    title: "B-2 visa from Nigeria: 400-day wait but worth it",
    overallRating: 3,
    easeRating: 2,
    welcomeRating: 3,
    body: "The B-2 tourist visa process from Nigeria is genuinely frustrating — interview wait times at the Lagos consulate can stretch to 400+ days. Applied online, paid the fee, waited, and had a 10-minute interview. Got approved thankfully. CBP at JFK was thorough but professional. Highly recommend printing out all your documents and hotel bookings; they do check. Worth it once you're in.",
  },
  {
    userId: "seed-user-4",
    countryCode: "US",
    title: "CBP officers more relaxed than their reputation at LAX",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 4,
    body: "The customs and border protection officers were notably more relaxed than the reputation suggests at LAX. The US is huge and the experience varies wildly by city — New York and LA are entirely different planets. Highly recommend giving both coasts a proper look.",
  },
  // ── South Africa ──
  {
    userId: "seed-user-5",
    countryCode: "ZA",
    title: "Hugely underrated — Cape Town is stunning",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 5,
    body: "South Africa is hugely underrated as a destination. Visa-free for many African passport holders and the process is simple for others. Cape Town is one of the most stunning cities in the world. Local people are warm and proud of their country in a really infectious way. The wildlife experience at Kruger needs no introduction. Safety requires awareness but is manageable with sensible precautions.",
  },
  // ── Indonesia ──
  {
    userId: "seed-user-6",
    countryCode: "ID",
    title: "Bali lives up to the hype — VOA in 20 minutes",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Bali lives up to the hype. Visa on arrival at Denpasar is one of the smoothest I've experienced — a dedicated area, quick process, pay USD 35 and you're through in 20 minutes even on a busy day. Balinese people have a warmth that feels completely genuine. The culture, the food, the landscapes — it's almost too much beauty in one place. Just avoid July–August crowds.",
  },
  // ── United Kingdom ──
  {
    userId: "seed-user-7",
    countryCode: "GB",
    title: "Standard Visitor Visa: solid documentation, quick decision",
    overallRating: 4,
    easeRating: 3,
    welcomeRating: 4,
    body: "The UK Standard Visitor Visa requires solid documentation — bank statements, property proof, employer letter, detailed itinerary. Applied online, biometrics at a VFS centre, got a decision in 11 working days. Border officers at Heathrow asked about 5 questions and that was that. London is one of the world's great cities; once you're in, it completely delivers.",
  },
  // ── Australia ──
  {
    userId: "seed-user-3",
    countryCode: "AU",
    title: "eVisitor in 2 days, Sydney exceeded expectations",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Australia's eVisitor visa for European passport holders was completely painless — applied online, approved in 2 days, free of charge. Sydney airport immigration was quick and friendly. Australians are some of the most relaxed and genuinely welcoming people I've encountered anywhere. The natural landscapes are simply extraordinary. Don't underestimate the distances though — Australia is enormous.",
  },
  {
    userId: "seed-user-8",
    countryCode: "AU",
    title: "ETA from Scandinavia — breezy process, endless wildlife",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Got the ETA (Electronic Travel Authority) in about an hour via the official app. Dead simple. The Great Ocean Road and the Daintree Rainforest were highlights — nowhere else on earth looks like that. Prices are high but the quality of life and the warmth of locals more than compensate. Go for at least a month if you can.",
  },
  // ── Canada ──
  {
    userId: "seed-user-1",
    countryCode: "CA",
    title: "eTA approved instantly, border officers very professional",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Canada is exceptional. The eTA for EU citizens takes about 5 minutes online and is usually approved within the hour. CBSA officers at YYZ were efficient and professional. Canadians are almost stereotypically friendly — the stereotype exists for good reason. Vancouver, Quebec City, and Banff are must-sees. Cold in winter but indescribably beautiful.",
  },
  {
    userId: "seed-user-4",
    countryCode: "CA",
    title: "TRV from Mexico: interview-free, 4-week processing",
    overallRating: 4,
    easeRating: 3,
    welcomeRating: 5,
    body: "Applied for a Canadian Temporary Resident Visa — took about 4 weeks online with no interview required. Documentation was extensive (bank statements, ties to home country, travel history) but the IRCC portal is user-friendly. Niagara Falls and Toronto are both great but the real gems are the national parks. Canadians were exceptionally warm to me throughout.",
  },
  // ── Singapore ──
  {
    userId: "seed-user-2",
    countryCode: "SG",
    title: "Visa-free, world-class airport — perfect transit hub",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Singapore grants visa-free access to Nigerian passports for 96 hours, which I used for a layover stay. Changi Airport is genuinely the best airport in the world — you barely want to leave it. Immigration was done in under 10 minutes. Singapore itself is immaculate, efficient, and multicultural in a way that feels very genuine. Expensive but worth every dollar for a few days.",
  },
  {
    userId: "seed-user-5",
    countryCode: "SG",
    title: "30-day visa-free stay — most efficient city on earth",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 4,
    body: "Senegalese passport allows 30 days visa-free in Singapore. The country works like clockwork. MRT is the cleanest metro I've ever used, hawker centres are incredible for affordable food, and Marina Bay at night is jaw-dropping. The one caveat: it's genuinely expensive for accommodation. Book well in advance and consider hostels in Little India.",
  },
  // ── UAE / Dubai ──
  {
    userId: "seed-user-6",
    countryCode: "AE",
    title: "Visa on arrival, Dubai is a world apart",
    overallRating: 4,
    easeRating: 5,
    welcomeRating: 4,
    body: "Germany passport enters UAE visa-free for 90 days — immigration at DXB took about 8 minutes including biometrics. Dubai is extraordinary in scale and ambition; it doesn't feel like any other city. The cultural contrast is stark but interesting. Things to note: alcohol laws are strict outside licensed venues, dress codes apply in malls and public spaces. As long as you respect local rules, everyone is very welcoming.",
  },
  {
    userId: "seed-user-7",
    countryCode: "AE",
    title: "India e-Visa to Dubai: 4 days, great experience",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 4,
    body: "Applied for a UAE e-Visa from India — process took about 4 days through the official portal, cost around $90 for 30 days. The large Indian expat community in Dubai makes it feel almost like home in parts. Abu Dhabi is quieter and worth a day trip. Shopping malls are overwhelming but the desert safari outside the city was the real highlight.",
  },
  // ── Vietnam ──
  {
    userId: "seed-user-8",
    countryCode: "VN",
    title: "e-Visa in 2 days — Hanoi and Ha Long Bay are extraordinary",
    overallRating: 5,
    easeRating: 4,
    welcomeRating: 5,
    body: "Vietnam's e-Visa was quick and simple — applied on the government portal, got it in 2 days, cost $25 for 90 days. Arrival at Noi Bai in Hanoi was slightly chaotic but the queues moved. The country itself is one of the most visually spectacular in Southeast Asia. Ha Long Bay is not overrated. Street food in Hanoi is among the best in the world. Strong recommendation.",
  },
  {
    userId: "seed-user-1",
    countryCode: "VN",
    title: "South to north on a motorbike — visa-free for Italians",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Italy gets 45 days visa-free in Vietnam — more than enough for the full south-to-north journey. Rented a semi-automatic motorbike in Ho Chi Minh City and rode up to Hanoi over 3 weeks. Vietnamese people along the route were endlessly kind — strangers invited us in for food, kids waved from every roadside. One of the best travel experiences of my life.",
  },
  // ── Spain ──
  {
    userId: "seed-user-2",
    countryCode: "ES",
    title: "Schengen from Nigeria: tough paperwork but Spain is worth it",
    overallRating: 4,
    easeRating: 3,
    welcomeRating: 5,
    body: "The Spanish consulate in Lagos is efficient for Schengen applications but the document list is extensive. Appointment booking was the hardest part — slots go fast. Once in Spain, the experience is spectacular. Barcelona has a different energy from Madrid entirely. Spaniards are loud, warm, and genuinely love to share their culture. The food scene is phenomenal. Would absolutely go through the visa process again.",
  },
  {
    userId: "seed-user-3",
    countryCode: "ES",
    title: "Visa-free Schengen for Japan — walked straight through",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Japanese passport = visa-free Schengen access, so entry to Spain was zero hassle. The contrast with Japan is striking — everything moves slower, louder, and more joyfully in Spain. The pintxos bars in San Sebastián are worth the trip alone. Architecture in Barcelona and Seville is otherworldly. Locals are very warm once you step outside the most tourist-heavy areas.",
  },
  // ── Portugal ──
  {
    userId: "seed-user-4",
    countryCode: "PT",
    title: "Most affordable Western Europe destination with easy Schengen entry",
    overallRating: 5,
    easeRating: 4,
    welcomeRating: 5,
    body: "Portugal is the best-value destination in Western Europe right now. Schengen visa from Mexico took 3 weeks but was straightforward. Lisbon and Porto are both stunning — cobblestoned streets, incredible seafood, and some of the friendliest people in Europe. The Alentejo region for a slower pace is completely magical. Highly recommend the Douro Valley wine region too.",
  },
  {
    userId: "seed-user-5",
    countryCode: "PT",
    title: "90-day visa-free — Lisbon digital nomad paradise",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Senegalese passport allows 90 days visa-free in Portugal — incredibly convenient. Spent two months in Lisbon working remotely. The city has an incredible concentration of co-working spaces, good internet, and great coffee. Portuguese people have a calm, open warmth that's different from the Mediterranean exuberance — equally charming. Cost of living is very reasonable compared to the quality of life.",
  },
  // ── India ──
  {
    userId: "seed-user-6",
    countryCode: "IN",
    title: "e-Visa in 72 hours — India is overwhelming in the best way",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 5,
    body: "India's e-Tourist Visa is the right way to go — applied on the government portal, paid online, got it in 72 hours. German passport makes this very smooth. India itself is a full sensory assault: colour, noise, heat, incredible food, ancient architecture. Don't try to rush it — plan for things to go sideways and you'll have an extraordinary time. Rajasthan was the highlight. Locals are intensely curious and hospitable.",
  },
  {
    userId: "seed-user-8",
    countryCode: "IN",
    title: "Kerala backwaters and Tamil Nadu temples — unforgettable",
    overallRating: 5,
    easeRating: 4,
    welcomeRating: 5,
    body: "Norwegian passport, e-Visa was approved in about 48 hours — very smooth. Spent 6 weeks focusing on South India which gets far less tourist traffic than the north. Kerala's backwaters are as peaceful as advertised. Tamil Nadu temple towns are overwhelming in scale and spiritual intensity. South Indians are exceptionally welcoming — strangers on trains will share their lunch with you. India changed how I think about the world.",
  },
  // ── Brazil ──
  {
    userId: "seed-user-7",
    countryCode: "BR",
    title: "Visa-free for India in 2024 — Rio is electric",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 5,
    body: "India and Brazil have a reciprocal visa-free agreement — showed up with my passport and walked right in at GRU. Brazilian immigration was very fast and friendly. Rio de Janeiro has a chaotic energy that's genuinely addictive. Cariocas (Rio locals) are among the most welcoming people on earth — strangers invited us to a family barbecue within two hours of landing. Safety precautions apply in certain areas but nothing that should deter you.",
  },
  {
    userId: "seed-user-1",
    countryCode: "BR",
    title: "Amazon and Pantanal from São Paulo — Italy enters visa-free",
    overallRating: 5,
    easeRating: 4,
    welcomeRating: 5,
    body: "Italy has visa-free access to Brazil up to 90 days. The sheer size and diversity of the country is staggering — coastal cities, Amazon jungle, Pantanal wetlands, and the cultural diversity of São Paulo all in one trip. Portuguese is more accessible than I expected for an Italian. Brazilians are warm, expressive, and love foreigners who make any effort at all with the language.",
  },
  // ── Turkey ──
  {
    userId: "seed-user-3",
    countryCode: "TR",
    title: "e-Visa in 15 minutes — Istanbul is unmissable",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Turkey's e-Visa for Japanese passport holders takes about 15 minutes online and costs €60. Istanbul is one of the world's truly great cities — the Hagia Sophia, Grand Bazaar, and Bosphorus alone justify the trip. Turkish people are extraordinarily hospitable; you will be offered tea in every shop whether you buy anything or not. The food is exceptional and incredibly affordable. Cappadocia is unlike anything else on earth.",
  },
  {
    userId: "seed-user-2",
    countryCode: "TR",
    title: "Nigerian e-Visa for Turkey — smooth process, incredible hospitality",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 5,
    body: "Applied for the Turkish e-Visa as a Nigerian — cost around $50, approved in 24 hours. Istanbul airport is modern and immigration was efficient. The Turkish people have a reputation for hospitality that is entirely deserved. Stayed in a family-run guesthouse in Cappadocia where the owner prepared breakfast, told us the history of the region, and drove us to the hot air balloon site at 5am. Extraordinary country.",
  },
  // ── Morocco ──
  {
    userId: "seed-user-4",
    countryCode: "MA",
    title: "Visa-free for Mexico — Marrakech medina is a world unto itself",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 4,
    body: "Mexican passport gets 90 days visa-free in Morocco. Entry at Casablanca was quick and friendly. Marrakech is intense — the medina is a labyrinth where you will get lost and it's wonderful. The souks are overwhelming but fascinating. Moroccans are direct salespeople in tourist areas but genuinely warm outside of that context. Chefchaouen, Fes, and the Sahara desert are extraordinary. Don't leave without a night in the desert.",
  },
  {
    userId: "seed-user-5",
    countryCode: "MA",
    title: "Senegal to Morocco — shared language makes everything easier",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Senegalese passport has 90-day visa-free access to Morocco — very convenient. Speaking French and basic Arabic made navigating the country so much easier. The Atlantic coast towns like Essaouira are calmer than Marrakech and incredibly beautiful. Moroccan mint tea culture is a genuine ritual — you'll be offered it everywhere. The mix of Arab, Berber, and French influences in the food is outstanding.",
  },
];

type QA = {
  userId: string;
  countryCode: string;
  passportCode?: string;
  title: string;
  body: string;
  resolved: boolean;
  answers: Array<{ userId: string; body: string; isAccepted: boolean }>;
};

const SEED_QA: QA[] = [
  // ── Japan ──
  {
    userId: "seed-user-2",
    countryCode: "JP",
    passportCode: "NG",
    title: "How long does Japan visa approval take from Nigeria?",
    body: "I'm planning a trip to Tokyo and Kyoto in about 8 weeks. How far in advance should I apply for the tourist visa, and what documents are the most critical?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-3",
        body: "From Lagos, plan for 3–5 weeks minimum. The Japan consulate in Abuja can be faster but the one in Lagos is busier. Required docs: bank statements (last 3–6 months), confirmed hotel bookings, flight itinerary, employment letter or proof of enrollment, passport photos. The key one people miss is a detailed day-by-day itinerary — Japan consulates really do want to see what you're doing each day.",
        isAccepted: true,
      },
      {
        userId: "seed-user-1",
        body: "Agree with the above. I'd also add: make sure your bank balance is healthy — they look for roughly ¥500,000+ equivalent as a comfortable amount for a 2-week stay. Don't apply with a just-topped-up account; they check transaction history.",
        isAccepted: false,
      },
    ],
  },
  {
    userId: "seed-user-7",
    countryCode: "JP",
    title: "Is Japan safe to visit solo as a woman?",
    body: "Thinking about doing 3 weeks solo around Tokyo, Osaka, and rural areas like Kyoto and the Japanese Alps. Curious about safety and any practical tips for solo female travelers.",
    resolved: true,
    answers: [
      {
        userId: "seed-user-1",
        body: "Japan is consistently ranked as one of the safest countries in the world for solo female travel. Crime rates are extremely low, streets are well-lit, and public transport is reliable even late at night. Women-only train carriages exist in cities during rush hour which is a nice option. The main challenge is language — get Google Translate with offline Japanese downloaded before you go. Rural areas are equally safe, often more so.",
        isAccepted: true,
      },
    ],
  },
  {
    userId: "seed-user-4",
    countryCode: "JP",
    passportCode: "MX",
    title: "Can I work remotely while on a Japan tourist visa?",
    body: "I'm a freelance designer and work 100% online for non-Japanese clients. Would working remotely on a tourist visa cause any issues?",
    resolved: false,
    answers: [
      {
        userId: "seed-user-3",
        body: "This is a grey area technically but in practice, remote work for foreign companies while on a tourist visa is widely done and Japan doesn't have an enforcement mechanism to detect it. The important line is: no working for Japanese companies or clients, no receiving payment from Japanese sources. Japan is reportedly working on a digital nomad visa so watch for that. For now, most digital nomads operate on tourist visas without issue.",
        isAccepted: false,
      },
      {
        userId: "seed-user-8",
        body: "Same situation as Scandinavia honestly. Japan rolled out a 'Specified Skilled Worker' visa recently but that's for physical in-country work. For pure remote work for overseas clients, tourist visa is what most people use and I've never heard of enforcement issues.",
        isAccepted: false,
      },
    ],
  },
  // ── Thailand ──
  {
    userId: "seed-user-5",
    countryCode: "TH",
    title: "Visa on arrival vs. e-visa for Thailand — which is easier?",
    body: "Flying into Bangkok next month. Debating whether to get the e-visa in advance or just use the VOA queue at the airport. Is the airport queue actually that bad?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-6",
        body: "If you're arriving at Suvarnabhumi during peak hours (especially evenings when international flights cluster), the VOA queue can be 45–90 minutes. If you have a long layover or arrive at an off-peak time it's totally fine. The e-visa is about 10–15 minutes of online form-filling and costs the same — if you have 2 weeks before travel, just do the e-visa and walk through the e-visa lane which is almost always empty.",
        isAccepted: true,
      },
      {
        userId: "seed-user-7",
        body: "Don't overthink it — VOA is reliable and the queue, even long, moves reasonably fast. I've done it 4 times now. Just have your photo, cash for the fee (baht or USD), hotel confirmation, and onward ticket ready before you reach the window.",
        isAccepted: false,
      },
    ],
  },
  {
    userId: "seed-user-8",
    countryCode: "TH",
    title: "Best time of year to visit Thailand — avoiding heat and crowds?",
    body: "Flexible on timing. What's the sweet spot between good weather, manageable tourist crowds, and reasonable prices?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-5",
        body: "November to February is the classic sweet spot — temperatures are cooler (25–30°C vs. the brutal 38°C of April), rain is rare, and the sea is calm in the Gulf of Thailand. The downside is it's peak season so Phuket and Koh Samui are crowded and pricier. If you want to dodge crowds, late October just after rainy season ends or early March before Easter is genuinely lovely — great weather, 20–30% fewer tourists.",
        isAccepted: true,
      },
    ],
  },
  // ── France ──
  {
    userId: "seed-user-6",
    countryCode: "FR",
    passportCode: "DE",
    title: "Any tips for getting a long-stay French visa as a non-EU?",
    body: "I'm a South Korean national and I'd like to stay in France for 3–4 months for a language course. What kind of visa is this and what's the process?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-1",
        body: "For 3–4 months you need a Long Stay Visa (visa de long séjour). If it's specifically for a language course, apply for a 'Student' or 'Visitor' long-stay visa depending on whether the course is registered with French education authorities. Apply at the VFS centre in Seoul 2–3 months before travel. Documents: enrollment letter from the language school, proof of accommodation, financial means (bank statements showing ~€65/day), health insurance covering the full stay. Process takes 3–6 weeks.",
        isAccepted: true,
      },
      {
        userId: "seed-user-3",
        body: "One thing to note: South Korea has a very efficient consular system and France consulates tend to process Korean applications quickly. I've heard 2 weeks for straightforward cases. Also — once you have the visa and arrive in France, you'll need to validate it online within 3 months (since COVID they shifted from the in-person OFII registration to an online portal). Don't skip this step.",
        isAccepted: false,
      },
    ],
  },
  // ── Italy ──
  {
    userId: "seed-user-1",
    countryCode: "IT",
    title: "Is it possible to drive in Italy on a foreign license?",
    body: "I have a US driver's license. Can I rent a car and drive in Italy, or do I need an International Driving Permit?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-4",
        body: "Technically yes, you need an International Driving Permit (IDP) to accompany your US license in Italy. However, in practice many rental companies hand you the keys without checking. The IDP is worth getting — it's around $20 from AAA in the US and takes 10 minutes. Carry both. If you're in a rental and get stopped by Carabinieri without an IDP, you can face a fine. Note: Italian traffic police can be unpredictable and they do check tourists occasionally.",
        isAccepted: true,
      },
    ],
  },
  // ── Germany ──
  {
    userId: "seed-user-3",
    countryCode: "DE",
    passportCode: "JP",
    title: "Do I need a visa for Germany as a Japanese citizen?",
    body: "Planning a 6-week trip through Germany, Austria, and the Netherlands. Do I need to apply for a Schengen visa or is Japan visa-free?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-6",
        body: "Great news — Japanese passport holders can enter the Schengen Area visa-free for up to 90 days in any 180-day period. No application needed. Just make sure your passport is valid for at least 3 months beyond your planned departure date from Schengen. For 6 weeks across Germany, Austria, and Netherlands you're well within the 90-day limit. At the border you may be asked for proof of accommodation and onward travel so have those ready.",
        isAccepted: true,
      },
    ],
  },
  // ── United States ──
  {
    userId: "seed-user-4",
    countryCode: "US",
    passportCode: "MX",
    title: "ESTA vs. B-2 visa — who needs which for visiting the US?",
    body: "My friend from Brazil says he just filled out an online form to visit the US. I'm from Mexico and apparently I need to do an interview? What's the difference?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-2",
        body: "Your friend used ESTA (Electronic System for Travel Authorization) — that's available to nationals of Visa Waiver Program countries (38 countries including Brazil, most of Europe, Japan, South Korea, etc.). It's a quick online form, costs $21, and grants 90 days. Mexico is NOT in the Visa Waiver Program, so Mexicans need a B-1/B-2 tourist visa — that requires paying the $185 MRV fee, filling out DS-160, and attending a consular interview. It's more work but once you have the visa it's often issued for 10 years with multiple entries.",
        isAccepted: true,
      },
      {
        userId: "seed-user-8",
        body: "Adding to the above: the US Embassy in Mexico City has long wait times (sometimes months for the interview slot), so apply well in advance. Also check consulates in Guadalajara, Monterrey, Tijuana — wait times vary by location. Once you have the 10-year visa, the US becomes very easy to visit.",
        isAccepted: false,
      },
    ],
  },
  // ── United Kingdom ──
  {
    userId: "seed-user-8",
    countryCode: "GB",
    passportCode: "SE",
    title: "Do Scandinavians need a UK visa after Brexit?",
    body: "I'm Swedish and planning a trip to London and Scotland. I used to go visa-free before Brexit — has anything changed?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-6",
        body: "Yes, things changed post-Brexit. EU and EEA nationals (including Swedes) no longer have automatic freedom of movement to the UK. For tourism up to 6 months, you can still enter visa-free — Sweden is not required to apply for a tourist visa for stays under 6 months. However, the UK is introducing the Electronic Travel Authorisation (ETA) for visa-free nationals, which became mandatory for EU visitors in early 2025. It's a simple online application, costs £10, and is valid for 2 years. Check gov.uk for current status and apply before you travel.",
        isAccepted: true,
      },
    ],
  },
  // ── Indonesia ──
  {
    userId: "seed-user-5",
    countryCode: "ID",
    title: "What vaccinations are recommended before visiting Indonesia?",
    body: "First time visiting Bali and planning to go off the beaten path to Lombok and Flores. What vaccinations should I get and are any mandatory?",
    resolved: false,
    answers: [
      {
        userId: "seed-user-6",
        body: "No vaccines are mandatory for Indonesia (unless arriving from a yellow fever-endemic country, in which case a yellow fever certificate is required). Recommended by most travel doctors: Hepatitis A, Typhoid, Tetanus-Diphtheria update, and Hepatitis B if not already done. For Flores and more rural areas some recommend Japanese Encephalitis — worth discussing with a travel clinic. Malaria prophylaxis is recommended for rural areas of Flores, though Bali and Lombok are generally considered low-risk. Start looking into this 6–8 weeks before travel.",
        isAccepted: false,
      },
    ],
  },
  // ── South Africa ──
  {
    userId: "seed-user-7",
    countryCode: "ZA",
    title: "Is Cape Town safe for tourists in 2025?",
    body: "I keep reading conflicting things about South Africa safety. We're a couple planning to visit Cape Town, the Winelands, and potentially the Garden Route. Should we be worried?",
    resolved: false,
    answers: [
      {
        userId: "seed-user-5",
        body: "Cape Town is very enjoyable for tourists who take sensible precautions. The key: stay in well-known tourist areas (Atlantic Seaboard, City Bowl, Southern Suburbs), use Uber or a reputable car service rather than hailing cabs, don't flash expensive equipment in busy areas, and avoid the Cape Flats townships unless on an organised tour. Car crime exists — park in secure parking, never leave bags visible. The Winelands and Garden Route are generally considered quite safe and are lovely. Most tourists have excellent experiences; the headlines don't reflect the tourist experience accurately.",
        isAccepted: false,
      },
    ],
  },
  // ── Australia ──
  {
    userId: "seed-user-4",
    countryCode: "AU",
    passportCode: "MX",
    title: "Can I get an Australian tourist visa from Mexico? How long does it take?",
    body: "I'm planning a 6-week trip to Australia and New Zealand. What visa do I need and what's the typical processing time from Mexico?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-3",
        body: "Mexican passport holders need a Visitor Visa (subclass 600) for Australia — not an eVisitor, which is EU-only. Apply online through the ImmiAccount portal. Processing times vary widely: anywhere from 1 day to 6 weeks, with most decisions in 2–4 weeks. Required docs: bank statements, employment evidence, travel history, return ticket. Cost is AUD 190. Once you have it, it's usually valid for 12 months with multiple entries, 3 months per stay — so plan accordingly for the 6-week trip.",
        isAccepted: true,
      },
      {
        userId: "seed-user-8",
        body: "Add travel insurance to your documents even if not strictly required — it demonstrates good faith and is genuinely essential in Australia where medical costs for non-residents are very high. Also apply 2–3 months before travel to be safe. August is the best time to visit the southeast (it's winter but mild). The northwest (WA) is best in the dry season, May–October.",
        isAccepted: false,
      },
    ],
  },
  // ── Singapore ──
  {
    userId: "seed-user-1",
    countryCode: "SG",
    title: "How much spending money do I need for a week in Singapore?",
    body: "Singapore has a reputation for being expensive. How much should I budget per day for a week of comfortable travel — not luxury, but not backpacker-hostel level either?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-2",
        body: "For mid-range travel in Singapore: budget around SGD 150–200/day (roughly USD 110–150). Breakdown: accommodation SGD 80–120 for a decent 3-star or boutique hostel private room, food SGD 30–50 if you mix hawker centres (SGD 4–8 per meal) with one nicer dinner, transport SGD 10–15 on the MRT, activities/admissions SGD 30–40. The good news: hawker food is both excellent and affordable. Gardens by the Bay, Sentosa, and the Botanic Gardens are free or cheap.",
        isAccepted: true,
      },
    ],
  },
  // ── UAE ──
  {
    userId: "seed-user-3",
    countryCode: "AE",
    title: "What should I know about dress codes and cultural rules in Dubai?",
    body: "First visit to Dubai as a young European woman. I've heard there are strict rules — what's actually enforced vs. what's just a guideline?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-6",
        body: "Dubai is far more relaxed than other Gulf countries but rules exist. Practically: cover shoulders and knees in malls and government buildings (many malls have reminder signs). On the beach and at beach clubs, normal swimwear is completely fine. Avoid public displays of affection — a stern word from security is possible. Alcohol is legal in licensed venues (hotels, licensed restaurants, bars) but not in public. Photography: always ask before photographing people, especially Emirati women. The rules are applied with context — tourists get far more leeway than residents. Be respectful and you'll be absolutely fine.",
        isAccepted: true,
      },
    ],
  },
  // ── Vietnam ──
  {
    userId: "seed-user-4",
    countryCode: "VN",
    title: "Is the Vietnam e-visa process reliable? Any pitfalls?",
    body: "I've heard the official Vietnam e-visa portal can be glitchy. Any tips for making the application go smoothly?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-8",
        body: "The official portal (evisa.xuatnhapcanh.gov.vn) works but has a reputation for timeouts and slow loading. Tips: use Chrome, avoid peak times (Vietnamese business hours), save your application number immediately, and upload photos/scans that are compressed below 2MB. The e-visa allows single entry — if you're doing a border run to Laos or Cambodia, you'll need a new e-visa or switch to a visa on arrival arrangement. Processing is usually 3 business days; apply 2 weeks before just in case.",
        isAccepted: true,
      },
    ],
  },
  // ── India ──
  {
    userId: "seed-user-5",
    countryCode: "IN",
    passportCode: "SN",
    title: "Can Senegalese passport holders get an India e-visa?",
    body: "I want to visit Rajasthan for about 3 weeks. I've heard India's e-visa depends on nationality — does it work for Senegalese passports?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-7",
        body: "Yes! Senegalese passport holders are eligible for the India e-Tourist Visa. Apply at indianvisaonline.gov.in at least 4 business days before arrival. Cost is USD 25 for 30 days or USD 40 for 1 year. You'll need a passport-size photo (white background), front and back scan of your passport bio page, and a credit/debit card for payment. The e-visa is emailed as a PDF — print it and carry it with your passport. Rajasthan is absolutely spectacular; plan at least Jaipur, Jodhpur, and Jaisalmer.",
        isAccepted: true,
      },
    ],
  },
  // ── Brazil ──
  {
    userId: "seed-user-2",
    countryCode: "BR",
    passportCode: "NG",
    title: "Do Nigerians need a visa for Brazil? Planning a World Cup 2026 trip",
    body: "Looking ahead to 2026. Does Nigeria have visa-free access to Brazil, or do I need to apply in advance?",
    resolved: false,
    answers: [
      {
        userId: "seed-user-4",
        body: "Nigerian passport holders currently need a Brazilian visa. Apply at the Brazilian consulate in Lagos or Abuja — it's not an e-visa; you'll attend in person. Required docs: bank statements, return ticket, hotel booking, employment/income proof, and a completed form. Cost is around USD 80. The good news: Brazilian consulates in Nigeria have a relatively straightforward process compared to some others, with decisions usually in 1–2 weeks for tourism. For World Cup 2026, apply at least 3–4 months before travel as demand will be very high.",
        isAccepted: false,
      },
    ],
  },
  // ── Turkey ──
  {
    userId: "seed-user-6",
    countryCode: "TR",
    title: "Is Turkey a good base for exploring multiple countries?",
    body: "I have 3 weeks and want to use Istanbul as a hub and potentially do day trips or short trips to nearby countries. What's feasible?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-3",
        body: "Istanbul is an excellent hub. Feasible nearby trips: Bulgaria (2.5 hours by bus to Sofia or Plovdiv, no visa needed for most nationalities), Greece via ferry from Istanbul or fly to Athens (1.5 hours), Georgia (2-hour flight to Tbilisi, visa-free for most), and Albania/North Macedonia if you're adventurous. Within Turkey itself: Cappadocia is 1.5 hours by domestic flight, Ephesus/Selçuk is 1 hour from Izmir, and the Turquoise Coast (Antalya) is a short flight. Three weeks gives you Istanbul (4–5 days minimum) + Cappadocia (2–3 days) + one or two international hops comfortably.",
        isAccepted: true,
      },
    ],
  },
  // ── Portugal ──
  {
    userId: "seed-user-8",
    countryCode: "PT",
    title: "Is Portugal's D8 Digital Nomad Visa worth applying for?",
    body: "I'm a freelancer earning around USD 2,500/month. I'd love to live in Lisbon for 6–12 months. Is the Digital Nomad Visa the right route?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-5",
        body: "The D8 (Digital Nomad Visa) is worth it for stays over 90 days. Requirements: proof of remote work or freelance income of at least €3,280/month (4× the Portuguese minimum wage as of 2024), NHR or regular tax status application, NIF (Portuguese tax number), and a Portuguese bank account or proof of international income. The process is done through the Portuguese consulate in your country; it typically takes 2–4 months. Once in Portugal, you register with SEF/AIMA for a residence permit. For shorter stays (under 90 days), your tourist entry still works without any visa application.",
        isAccepted: true,
      },
    ],
  },
  // ── Morocco ──
  {
    userId: "seed-user-7",
    countryCode: "MA",
    title: "How safe is Morocco for solo female travelers?",
    body: "I'm planning a solo trip through Marrakech, Fes, and the Sahara as a woman traveling alone. What should I expect and prepare for?",
    resolved: true,
    answers: [
      {
        userId: "seed-user-4",
        body: "Morocco is absolutely doable solo as a woman but it requires more mental preparation than, say, Japan or Portugal. Street harassment (verbal) is common in tourist areas — direct, confident non-engagement works best ('La shukran' — no thank you). Stay in riads in the medina (they're safe and social). Dress modestly outside tourist areas — covered shoulders and knees are respected even if not legally required. The desert and mountain regions are generally very safe. The experiences of connection with Moroccan families and the sheer beauty of the landscape are worth it. Many solo women travel Morocco regularly with great experiences.",
        isAccepted: true,
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Seeding community data...");

  console.log("  Creating seed users...");
  for (const user of SEED_USERS) {
    await db
      .insert(usersTable)
      .values(user)
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${SEED_USERS.length} users`);

  console.log("  Creating reviews...");
  let reviewCount = 0;
  for (const review of SEED_REVIEWS) {
    await db
      .insert(reviewsTable)
      .values(review)
      .onConflictDoUpdate({
        target: [reviewsTable.userId, reviewsTable.countryCode],
        set: {
          title: review.title,
          overallRating: review.overallRating,
          easeRating: review.easeRating,
          welcomeRating: review.welcomeRating,
          body: review.body,
        },
      });
    reviewCount++;
  }
  console.log(`  ✓ ${reviewCount} reviews`);

  console.log("  Creating Q&A...");
  let questionCount = 0;
  let answerCount = 0;
  for (const qa of SEED_QA) {
    const { answers, ...questionData } = qa;
    const existing = await db
      .select({ id: questionsTable.id })
      .from(questionsTable)
      .where(and(eq(questionsTable.userId, questionData.userId), eq(questionsTable.title, questionData.title)))
      .limit(1);
    if (existing.length > 0) {
      questionCount++;
      continue;
    }
    const [inserted] = await db
      .insert(questionsTable)
      .values(questionData)
      .returning({ id: questionsTable.id });
    questionCount++;

    for (const answer of answers) {
      await db
        .insert(answersTable)
        .values({ ...answer, questionId: inserted.id });
      answerCount++;
    }
  }
  console.log(`  ✓ ${questionCount} questions, ${answerCount} answers`);

  console.log("✅ Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

import { db, usersTable, reviewsTable, questionsTable, answersTable } from "@workspace/db";

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
  overallRating: number;
  easeRating: number;
  welcomeRating: number;
  body: string;
}> = [
  {
    userId: "seed-user-1",
    countryCode: "JP",
    overallRating: 5,
    easeRating: 4,
    welcomeRating: 5,
    body: "Japan absolutely blew me away. The process of getting a tourist visa took about a week — fill out the forms online, book an appointment at the consulate, and you're done. Once there, border control was smooth and the officers were professional. Locals are incredibly helpful even with the language barrier. The train network makes everything effortless. Highly recommend.",
  },
  {
    userId: "seed-user-2",
    countryCode: "JP",
    overallRating: 4,
    easeRating: 5,
    welcomeRating: 4,
    body: "The e-visa system Japan rolled out recently is a game changer. Applied online from Lagos, paid the fee, got approved in 4 days. Arrival at Narita was surprisingly quick — the automated gates handle most things. Japanese culture is a bit reserved but once people warm up they're fantastic. Definitely going back.",
  },
  {
    userId: "seed-user-3",
    countryCode: "FR",
    overallRating: 4,
    easeRating: 3,
    welcomeRating: 4,
    body: "Paris was as beautiful as promised. The Schengen visa process is a bit of a paperwork marathon — bank statements, hotel bookings, travel insurance, employment letter — but it's manageable if you plan 6 weeks ahead. CDG airport customs was straightforward. The French can be standoffish at first but speak even a few words of French and the attitude completely changes.",
  },
  {
    userId: "seed-user-4",
    countryCode: "FR",
    overallRating: 5,
    easeRating: 4,
    welcomeRating: 5,
    body: "Came with a Mexican passport so visa-free entry made everything so relaxed. Just showed up, answered a few questions at immigration, and walked right in. France rewards slow travel — rent an apartment for a month in a small town and you'll see a completely different side of the country. Food is everything they say it is.",
  },
  {
    userId: "seed-user-5",
    countryCode: "TH",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Thailand is probably the most welcoming country I've ever visited. On-arrival visa was painless — the queue moved fast at Suvarnabhumi, filled out one small form, paid the fee in baht (or USD), and done. Officers were friendly and efficient. Thais are genuinely warm to visitors everywhere from Bangkok street stalls to remote islands. Absolute must-visit.",
  },
  {
    userId: "seed-user-6",
    countryCode: "TH",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 5,
    body: "My second time in Thailand and it keeps getting better. The new 60-day tourist visa is great value if you're planning a longer stay. Pro tip: do the border run to extend if you want even more time — many expats do it regularly. The food and the people are the real attraction, not just the beaches.",
  },
  {
    userId: "seed-user-7",
    countryCode: "DE",
    overallRating: 4,
    easeRating: 3,
    welcomeRating: 3,
    body: "Germany is efficient as expected. The Schengen visa from India takes around 2–3 weeks and requires a lot of documentation, but VFS Global appointment slots aren't too hard to get in major cities. Berlin was incredibly diverse and welcoming; smaller cities less so but still perfectly fine. Public transport is world class.",
  },
  {
    userId: "seed-user-8",
    countryCode: "DE",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 4,
    body: "Free entry with a Scandinavian passport — just walked through the EU lane in about 2 minutes. Germany is incredible for road trips: autobahn, incredible rest stops, beautiful countryside. Munich to Berlin is a classic. Germans are direct and honest which I appreciate, even if it takes a little getting used to after sunnier countries.",
  },
  {
    userId: "seed-user-1",
    countryCode: "IT",
    overallRating: 5,
    easeRating: 3,
    welcomeRating: 5,
    body: "Italy is chaos in the best way. Schengen visa from Italy specifically felt a little slow at the consulate — took almost 3 weeks — but that's an exception in my experience. Immigration at FCO airport was relaxed. Italians are the most naturally hospitable people; strangers will give you 30-minute walking tours because they're proud of their city. Go slow, eat well.",
  },
  {
    userId: "seed-user-3",
    countryCode: "IT",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 4,
    body: "Beautiful country but a few things to know: tourist queues everywhere in summer (book skip-the-line tickets for major attractions months in advance), and some areas are noticeably more tourist-friendly than others. The language barrier is more present than in France or Germany. That said, the food alone justifies every hassle.",
  },
  {
    userId: "seed-user-2",
    countryCode: "US",
    overallRating: 3,
    easeRating: 2,
    welcomeRating: 3,
    body: "The B-2 tourist visa process from Nigeria is genuinely frustrating — interview wait times at the Lagos consulate can stretch to 400+ days. Applied online, paid the fee, waited, and had a 10-minute interview. Got approved thankfully. CBP at JFK was thorough but professional. Highly recommend printing out all your documents and hotel bookings; they do check. Worth it once you're in.",
  },
  {
    userId: "seed-user-4",
    countryCode: "US",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 4,
    body: "ESTA was a 5-minute process for me with a Mexican passport — well, wait, actually Mexicans need a full B-2 visa. My American wife sorted it. The customs and border protection officers were notably more relaxed than the reputation suggests at LAX. The US is huge and the experience varies wildly by city — New York and LA are entirely different planets.",
  },
  {
    userId: "seed-user-5",
    countryCode: "ZA",
    overallRating: 4,
    easeRating: 4,
    welcomeRating: 5,
    body: "South Africa is hugely underrated as a destination. Visa-free for many African passport holders and the process is simple for others. Cape Town is one of the most stunning cities in the world. Local people are warm and proud of their country in a really infectious way. The wildlife experience at Kruger needs no introduction. Safety requires awareness but is manageable with sensible precautions.",
  },
  {
    userId: "seed-user-6",
    countryCode: "ID",
    overallRating: 5,
    easeRating: 5,
    welcomeRating: 5,
    body: "Bali lives up to the hype. Visa on arrival at Denpasar is one of the smoothest I've experienced — a dedicated area, quick process, pay USD 35 and you're through in 20 minutes even on a busy day. Balinese people have a warmth that feels completely genuine. The culture, the food, the landscapes — it's almost too much beauty in one place. Just avoid July–August crowds.",
  },
  {
    userId: "seed-user-7",
    countryCode: "GB",
    overallRating: 4,
    easeRating: 3,
    welcomeRating: 4,
    body: "The UK Standard Visitor Visa requires solid documentation — bank statements, property proof, employer letter, detailed itinerary. Applied online, biometrics at a VFS centre, got a decision in 11 working days. Border officers at Heathrow asked about 5 questions and that was that. London is one of the world's great cities; once you're in, it completely delivers.",
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
      .onConflictDoNothing();
    reviewCount++;
  }
  console.log(`  ✓ ${reviewCount} reviews`);

  console.log("  Creating Q&A...");
  let questionCount = 0;
  let answerCount = 0;
  for (const qa of SEED_QA) {
    const { answers, ...questionData } = qa;
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

/**
 * Seed script: SEO-targeted Q&A based on trending 2026 visa searches.
 * Run with: pnpm --filter @workspace/scripts run seed:seo-qa
 */
import { db, usersTable, questionsTable, answersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const SEO_USERS = [
  { id: "seo-user-1", firstName: "Alex", lastName: "Chen", email: "alex.chen@example.com" },
  { id: "seo-user-2", firstName: "Maria", lastName: "Santos", email: "maria.santos@example.com" },
  { id: "seo-user-3", firstName: "Ravi", lastName: "Kumar", email: "ravi.kumar@example.com" },
  { id: "seo-user-4", firstName: "Fatima", lastName: "Al-Hassan", email: "fatima@example.com" },
  { id: "seo-user-5", firstName: "Lucas", lastName: "Müller", email: "lucas.muller@example.com" },
  { id: "seo-user-6", firstName: "Nadia", lastName: "Petrova", email: "nadia.petrova@example.com" },
  { id: "seo-user-7", firstName: "Jin", lastName: "Park", email: "jin.park@example.com" },
  { id: "seo-user-8", firstName: "Aisha", lastName: "Okonkwo", email: "aisha.okonkwo@example.com" },
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

const SEO_QA: QA[] = [
  // ── Japan ──────────────────────────────────────────────────────────────────
  {
    userId: "seo-user-1",
    countryCode: "JP",
    title: "Is Japan charging a new tourist entry tax in 2026?",
    body: "I've read conflicting things online — is Japan now charging a departure or entry tax for tourists? How much is it and how do I pay it?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-5",
        body: "Japan has had a departure tax (国際観光旅客税, kokusai kankō ryokaku zei) since January 2019 — it's ¥1,000 per person per departure and is automatically included in your airline ticket price. You don't need to pay it separately at the airport. Some popular destinations like Kyoto and Fujikawaguchiko have also introduced local tourism levies — Kyoto charges ¥200–¥1,000 per night at accommodation depending on room price — but these are collected at check-in by your hotel. There's no new national entry tax as of mid-2026.",
        isAccepted: true,
      },
      {
        userId: "seo-user-2",
        body: "Worth adding: Mount Fuji's Yoshida Trail now charges ¥2,000 and has a gate that closes at 4pm to manage crowds. Miyajima Island also charges ¥300. These are site-specific fees, not a Japan-wide entry tax. Always check the specific attraction's website before visiting.",
        isAccepted: false,
      },
    ],
  },
  {
    userId: "seo-user-3",
    countryCode: "JP",
    passportCode: "IN",
    title: "Japan introduced a new digital nomad visa — how do I apply?",
    body: "I heard Japan finally launched a digital nomad or freelancer visa in 2025. Is this confirmed? Who is eligible and what's the application process from India?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-7",
        body: "Yes, Japan launched a 'Specified Skilled Worker' and a digital nomad type stay under its 'Highly Skilled Professional' track in late 2024. The dedicated digital nomad visa is called the 'Designated Activities visa for Digital Nomads' — it allows 6 months stay (extendable) and is currently open to nationals of 49 countries with bilateral agreements. Requirements include: income of ¥10 million+ per year (about $65,000), proof of remote employment or freelance contracts with non-Japanese clients, private health insurance, and a clean criminal record. India nationals are currently eligible. Apply at the Japanese Embassy in your home country — processing takes 2–4 weeks.",
        isAccepted: true,
      },
    ],
  },
  // ── EU / Schengen ──────────────────────────────────────────────────────────
  {
    userId: "seo-user-2",
    countryCode: "FR",
    title: "What is the EU EES Entry/Exit System and how does it affect my trip to Europe?",
    body: "I keep seeing mentions of EES when searching for Europe travel in 2026. Does this replace the Schengen stamp? Do I need to do anything extra before my trip?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-5",
        body: "EES (Entry/Exit System) is the EU's new biometric border system that launched in late 2024. Instead of getting a passport stamp, border kiosks now capture your fingerprints and a facial scan each time you enter or exit the Schengen Area. This is automatic — you don't apply for it in advance. The key practical impact: the 90/180-day Schengen rule is now digitally enforced. Previously, worn passport stamps meant some travelers got away with overstaying; EES tracks your exact entry/exit dates electronically. If you're travelling legitimately, you just need to budget extra time at the border — first-time registration at the kiosk takes 5–10 minutes. Subsequent visits are faster.",
        isAccepted: true,
      },
      {
        userId: "seo-user-6",
        body: "One thing to note for frequent travelers: EES data is stored for 3 years (or 5 years if you've been refused entry or overstayed). This creates a digital history. If you've had any border issues in the past, those are now on record. For normal tourists this changes nothing — but it's a significant change from the stamp era.",
        isAccepted: false,
      },
    ],
  },
  {
    userId: "seo-user-4",
    countryCode: "DE",
    passportCode: "US",
    title: "What is ETIAS and do Americans need it for Europe in 2026?",
    body: "My European trip is planned for summer 2026. I heard there's a new 'ETIAS' system for the EU. Do I need to register for it before traveling? How much does it cost?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-1",
        body: "ETIAS (European Travel Information and Authorisation System) is essentially the EU equivalent of the US ESTA or Australia's ETA — a pre-travel authorisation for visa-exempt travelers. As of mid-2026, ETIAS is still pending launch. The European Commission has announced it will launch after EES is fully operational. Once live, US citizens (and nationals of around 60 other visa-waiver countries) will need to apply online before traveling to the Schengen Area. It's expected to cost €7, be valid for 3 years or until your passport expires (whichever is first), and cover multiple trips. Applications are supposed to take minutes and be approved within seconds in most cases, though complex cases could take up to 30 days.",
        isAccepted: true,
      },
      {
        userId: "seo-user-3",
        body: "Important clarification: ETIAS is not a visa. Americans don't need a Schengen visa and that's not changing. ETIAS is a security pre-screening — similar to how you fill in a passenger locator form. The 90/180 day limit doesn't change either. For summer 2026 travel, check the official ETIAS website (travel-europe.europa.eu) the week before your trip to see if it's launched by then.",
        isAccepted: false,
      },
    ],
  },
  {
    userId: "seo-user-6",
    countryCode: "DE",
    passportCode: "IN",
    title: "How long does a Germany Schengen visa take to process in 2026?",
    body: "I need a Schengen visa for Germany for a business trip in 6 weeks. I've heard appointment slots are very hard to get right now. What's the realistic timeline?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-5",
        body: "Germany Schengen visa processing from India in 2026 is genuinely difficult — appointment availability at VFS centres in major cities like Mumbai, Delhi, and Bangalore is often 4–8 weeks out. The official processing time after submitting is 15 calendar days (up to 30 for complex cases), but that clock starts only after your appointment. With the appointment wait plus processing, 8–10 weeks total is realistic. Practical tips: (1) Check appointment slots at multiple VFS centres — Hyderabad and Chennai sometimes have more availability than Mumbai/Delhi. (2) Check at midnight or early morning when cancellations are released. (3) Some travel agents have access to 'expedited' slots — legal, just more expensive. Apply via the official VFS Global portal only.",
        isAccepted: true,
      },
    ],
  },
  // ── Thailand ───────────────────────────────────────────────────────────────
  {
    userId: "seo-user-7",
    countryCode: "TH",
    title: "Did Thailand cut visa-free stay from 60 days to 30 days in 2026?",
    body: "I planned a 45-day Thailand trip based on the 60-day visa-free rule, but someone told me it changed. What's the current visa-free limit for Thailand in 2026?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-2",
        body: "Yes, this is confirmed. Thailand's Cabinet approved reducing the standard visa-free stay from 60 days back to 30 days on May 19, 2026, for most nationalities. The change came into effect after the 60-day experiment introduced in 2024 — while it boosted tourism numbers, authorities felt 60 days was being widely used as a de facto work visa by digital nomads and long-stay foreigners. The new 30-day limit applies to most Western passport holders including US, EU, UK, Australia, and Canada. If you need longer, your options are: (1) Get a 60-day Tourist Visa (TR) from a Thai embassy before travel — this is extendable by 30 more days in-country. (2) Apply for the Thailand Long-Term Resident (LTR) Visa if you meet the income requirements. (3) Do a border run, though Thailand has been tightening scrutiny on repeat border crossers.",
        isAccepted: true,
      },
      {
        userId: "seo-user-8",
        body: "Quick update on border runs: Thailand immigration has been issuing warnings to people who do multiple consecutive 30-day entries. While there's no official limit written in law, IO discretion at land borders means you might be questioned or denied entry if you've done several in a row. If you're planning a long stay, the proper TV or LTR visa is genuinely the cleaner option now.",
        isAccepted: false,
      },
    ],
  },
  // ── Saudi Arabia ───────────────────────────────────────────────────────────
  {
    userId: "seo-user-4",
    countryCode: "SA",
    title: "How do I apply for a Saudi Arabia tourist e-visa online? Who is eligible?",
    body: "Saudi Arabia tourism seems to be taking off in 2026. Is there an easy online visa process? I have a US passport — does that qualify?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-1",
        body: "Saudi Arabia launched its e-visa (eVisa) in 2019 and has been expanding eligibility since. As of 2026, nationals from 66 countries can apply online at visa.visitsaudi.com — this includes the US, all EU countries, UK, Canada, Australia, Japan, South Korea, and others. The eVisa costs approximately SAR 300 (~$80 USD), is valid for 1 year with multiple entries, and allows a total stay of up to 90 days. Processing is usually instant to 72 hours. Requirements: passport valid 6+ months, return ticket, credit card for payment, and a photo. Note: if you're female and under 25, you previously needed a male guardian's permission, but this rule was relaxed — you can now travel to Saudi as a solo woman. Dress code in public applies (covering shoulders and knees in most areas) though enforcement in tourist areas is light.",
        isAccepted: true,
      },
      {
        userId: "seo-user-6",
        body: "One practical tip: apply fresh, don't use third-party agents for Saudi eVisa — the official portal is straightforward and much cheaper. Also check if your passport is from one of the countries that can get a free eVisa (some GCC-adjacent nationalities qualify for waivers). Travel insurance is actually mandatory per the eVisa terms, though enforcement at entry is inconsistent.",
        isAccepted: false,
      },
    ],
  },
  // ── Canada ─────────────────────────────────────────────────────────────────
  {
    userId: "seo-user-3",
    countryCode: "CA",
    passportCode: "IN",
    title: "What is the Express Entry CRS cutoff score for 2026 and how do I improve my score?",
    body: "I have a CRS score of around 450 and I've been in the Express Entry pool for 8 months. The cutoffs keep fluctuating — what's realistic for getting an ITA in 2026?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-5",
        body: "As of mid-2026, Express Entry cutoffs vary significantly by draw type. All-program draws (Federal Skilled Worker, CEC, FST combined) have had cutoffs between 480–510 in 2026. Healthcare occupation draws have had lower cutoffs around 430–470. Trade occupation draws similar range. French language draws can be as low as 350–390 for French speakers. At 450, your best strategy: (1) Get a Canadian job offer — adds 50–200 points. (2) Improve your language score — moving from CLB 9 to CLB 10 in all categories can add 20–30 points. (3) Get a provincial nomination (PNP) — adds 600 points instantly, guaranteeing an ITA. Look at provincial draws that match your occupation. (4) If you have a sibling who's a Canadian PR/citizen, that adds 15 points. IRCC holds draws roughly every 2 weeks — check the official IRCC website for real-time results.",
        isAccepted: true,
      },
      {
        userId: "seo-user-8",
        body: "Critical point: Canada announced major immigration changes effective April 1, 2026. They've reduced the total immigration targets for 2026–2027 compared to previous years due to housing pressures. This means draw frequencies may slow down. PNP route is genuinely your best bet at 450 — many provinces have separate streams with lower CRS requirements where they nominate you directly.",
        isAccepted: false,
      },
    ],
  },
  // ── New Zealand ────────────────────────────────────────────────────────────
  {
    userId: "seo-user-2",
    countryCode: "NZ",
    passportCode: "US",
    title: "What is New Zealand's NZeTA and do I need one as a US citizen?",
    body: "I thought Americans don't need a visa for New Zealand, but my airline asked me about an NZeTA. Is this a visa? How much is it and how do I get one?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-7",
        body: "Great question — the NZeTA (New Zealand Electronic Travel Authority) is not a visa, it's a pre-travel authorisation similar to the US ESTA or Australia's ETA. As a US citizen you don't need a visa for New Zealand, but you DO need an NZeTA for stays up to 90 days. It's mandatory for all visa-waiver nationals since 2019. Cost: NZD $23 (~$14 USD) through the official NZeTA app, or NZD $17 if applied via the app (app is cheaper). Also includes a mandatory International Visitor Conservation and Tourism Levy (IVL) of NZD $100 on top. Processing is usually immediate to 72 hours. Apply at least 72 hours before departure via the official NZeTA app or Immigration New Zealand website (immigration.govt.nz). It's valid for 2 years and covers multiple trips.",
        isAccepted: true,
      },
    ],
  },
  // ── Vietnam ────────────────────────────────────────────────────────────────
  {
    userId: "seo-user-8",
    countryCode: "VN",
    title: "Can I get a Vietnam e-visa for 90 days in 2026? What's changed?",
    body: "I'm planning an extended stay in Vietnam and want to stay for about 3 months. The e-visa used to be only 30 days — has it been extended?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-4",
        body: "Yes — Vietnam significantly upgraded its e-visa in August 2023 and the changes are still in effect for 2026. The e-visa now allows: up to 90 days per entry (increased from 30), multiple-entry option available (previously single-entry only), open to all nationalities (around 80 countries had exemptions before; now everyone can apply). The e-visa costs $25 USD, applied online at evisa.xuatnhapcanh.gov.vn. Processing typically takes 3 business days but can take up to 5. Note: if your country has a bilateral visa-free agreement with Vietnam (US, EU, UK, and others get 45 days visa-free), you can enter without any application. For a 90-day stay, apply for the e-visa regardless of your nationality.",
        isAccepted: true,
      },
      {
        userId: "seo-user-1",
        body: "One gotcha: the e-visa portal has had issues with the official site. Use evisa.xuatnhapcanh.gov.vn — that is the legitimate government URL. There are many third-party sites that charge $50–$80 for the same e-visa but just submit your application to the same portal. No benefit, just more expensive. The official portal is fine if a bit slow.",
        isAccepted: false,
      },
    ],
  },
  // ── USA ────────────────────────────────────────────────────────────────────
  {
    userId: "seo-user-3",
    countryCode: "US",
    passportCode: "IN",
    title: "How do I check my H-1B lottery selection status for FY2027?",
    body: "Registration for the H-1B lottery closed in March 2026. How do I find out if I was selected? What happens next if I was picked?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-5",
        body: "USCIS notifies H-1B lottery results through the myUSCIS online account — log in at my.uscis.gov. Under 'My Cases,' selected beneficiaries (and their employers/attorneys) will see the registration status change to 'Selected.' USCIS completed the FY2027 initial selection in early April 2026. If you were selected: your employer has until June 30, 2026 to file the full H-1B petition. If selected in a 'reserve' pool, you may get a second chance if initially-selected petitions are withdrawn. If not selected: unfortunately there's no appeal — you'd need to register again next March for FY2028. Consider alternatives like O-1 (extraordinary ability), L-1 (intracompany transfer), or the EB-1/EB-2 green card pathways which don't have a lottery.",
        isAccepted: true,
      },
      {
        userId: "seo-user-6",
        body: "For FY2027: USCIS issued approximately 85,000 selections (65,000 regular cap + 20,000 advanced degree exemption). Total registrations were again in the hundreds of thousands, so odds were roughly 14–20% depending on whether you had a US master's degree. The FY2027 H-1B start date for approved workers is October 1, 2026.",
        isAccepted: false,
      },
    ],
  },
  {
    userId: "seo-user-7",
    countryCode: "US",
    passportCode: "NG",
    title: "What questions are typically asked at a US F-1 student visa interview in 2026?",
    body: "I have my US student visa interview at the embassy in Lagos next month. What are consular officers actually asking these days? Any tips for Nigerian applicants specifically?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-2",
        body: "US F-1 interviews in Nigeria (Abuja and Lagos) are notoriously thorough — plan for 2–5 minutes of focused questions. Most common in 2026: (1) 'Why this specific university/program?' — know your program cold. (2) 'How will you fund your studies?' — have exact figures ready, be able to name the source. (3) 'What will you do after graduation?' — the key answer is 'return to Nigeria to [specific career].' Demonstrating home ties is crucial. (4) 'Do you have family in the US?' — a yes isn't disqualifying but explain you plan to return. (5) 'Why not study in Nigeria or another country?' — be specific about the program's unique aspects. Tips: dress formally, speak English clearly and confidently, bring all documents but let the officer ask — don't dump them unprompted. Refusal rate from Nigeria is high (~40%+) largely due to strong immigrant intent concerns, so ties-to-home evidence (family, property, job offer letters for after graduation) is your strongest card.",
        isAccepted: true,
      },
      {
        userId: "seo-user-4",
        body: "Adding: consular officers can see your previous US visa applications and any prior refusals. If you've been denied before, be prepared to explain what changed. Don't memorize scripted answers — officers are trained to spot them and will pivot to harder questions. Know your I-20, your university's location and ranking, your intended major's career path, and your sponsor's financial details by heart.",
        isAccepted: false,
      },
    ],
  },
  // ── Australia ──────────────────────────────────────────────────────────────
  {
    userId: "seo-user-1",
    countryCode: "AU",
    title: "What is Australia's new Skills in Demand visa replacing the 482 TSS?",
    body: "I'm on a 482 TSS visa sponsorship pathway and heard it's being replaced. What is the new 'Skills in Demand' visa and how does it affect my existing situation?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-7",
        body: "Australia's Skills in Demand (SID) visa (subclass 819/186 replacement framework) launched in December 2023, replacing the Temporary Skill Shortage (TSS) 482 visa. Key differences: The SID visa has three streams — Specialist Skills (for high-income earners, no occupation list required), Core Skills (most common; requires occupation on the new Core Skills Occupation List, CSOL), and Essential Skills (for lower-wage essential workers, launching later). If you're already on a 482 visa, you're not affected immediately — existing 482 visas remain valid. Future sponsorships from your employer will come under the SID framework. The pathway to permanent residency has been improved: Specialist Skills stream holders can apply for PR after 2 years (down from 3). Income thresholds for Specialist Skills are around AUD $135,000+. Check the Department of Home Affairs website for the current CSOL to confirm your occupation.",
        isAccepted: true,
      },
      {
        userId: "seo-user-3",
        body: "One important update for 2026: Australia also raised its Temporary Skilled Migration Income Threshold (TSMIT) to AUD $73,150 per year — this is the minimum salary your sponsor must pay you under the SID Core Skills stream. If your current role pays below this, your employer needs to raise your salary or your sponsorship could be affected at renewal.",
        isAccepted: false,
      },
    ],
  },
  // ── UAE ────────────────────────────────────────────────────────────────────
  {
    userId: "seo-user-6",
    countryCode: "AE",
    title: "Who gets UAE / Dubai visa on arrival in 2026 and how long can I stay?",
    body: "Flying into Dubai Transit from South Africa and thinking of adding a few days stopover. Do South Africans get visa on arrival in UAE or do I need to apply in advance?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-8",
        body: "South African passport holders are not on the UAE visa-on-arrival list, so you'll need to apply for a visa in advance. The good news: the UAE tourist visa is easy to get online. Options: (1) Apply through Emirates, Etihad, or Flydubai airline portals — they offer 30-day or 90-day tourist visas, often processed within 24–48 hours. Cost is approximately AED 200–350 for a 30-day single entry. (2) Apply through the UAE ICP (Federal Authority for Identity) at icp.gov.ae. For Dubai stopovers specifically, if you're transiting on Emirates and staying airside, no visa is needed. If you're leaving the airport (which you should for a 'stopover'), you need a transit visa or tourist visa. Countries that DO get visa on arrival include US, UK, EU, Australia, Japan, and GCC citizens — about 50 nationalities total.",
        isAccepted: true,
      },
    ],
  },
  // ── UK ─────────────────────────────────────────────────────────────────────
  {
    userId: "seo-user-5",
    countryCode: "GB",
    passportCode: "IN",
    title: "How long does it take to get a UK visa biometric appointment in 2026?",
    body: "I need a Standard Visitor Visa for the UK for a conference in 8 weeks. How far out are biometric appointments at VFS in India right now? Is there a way to get a faster slot?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-3",
        body: "UK visa biometric appointment availability in India in mid-2026 is extremely tight — in Mumbai and Delhi you're often looking at 4–7 weeks wait for a standard slot. This is a well-known bottleneck. Options to get a faster appointment: (1) Check the VFS portal at midnight or early morning — cancellations and newly released slots appear then. (2) Pay for the 'Priority Service' which guarantees an appointment within 5 working days and faster UKVI processing (cost: around INR 30,000–50,000 extra on top of the standard visa fee). (3) Check smaller VFS centres — Hyderabad, Chennai, Kolkata, and Pune sometimes have earlier slots than Mumbai/Delhi. (4) The 'Super Priority' service (decision within 2 working days) is available at select centres but costs significantly more. Bottom line: for 8 weeks out, if you can't get a standard slot in the next 1–2 weeks, book Priority.",
        isAccepted: true,
      },
      {
        userId: "seo-user-1",
        body: "UK visa fees also increased in early 2025: Standard Visitor Visa is now £115. Processing time after biometrics is 15 working days standard (3 weeks), or 5 working days for Priority. Factor in the biometric appointment wait PLUS the processing time when planning. 8 weeks is workable but tight — act now.",
        isAccepted: false,
      },
    ],
  },
  // ── Portugal ───────────────────────────────────────────────────────────────
  {
    userId: "seo-user-2",
    countryCode: "PT",
    passportCode: "US",
    title: "How do I apply for Portugal's Digital Nomad Visa (D8) as an American in 2026?",
    body: "I want to live and work remotely from Lisbon for at least a year. I've heard Portugal has the best digital nomad visa in Europe. What are the income requirements and how do I actually apply?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-4",
        body: "Portugal's D8 (Digital Nomad) visa is indeed one of Europe's most popular. Here's the full breakdown for US applicants in 2026: Income requirement: minimum €3,280/month (~4x Portugal's minimum wage) — this must be provable through employment contracts, client invoices, or bank statements. For a year-long stay you'd typically show 3–6 months of consistent income at or above that threshold. Application steps: (1) Apply at the Portuguese consulate in your US state — NY, Boston, SF, or DC are the main ones. Some have appointment waits of 2–4 months, so book early. (2) Documents needed: proof of income, employment contract or client contracts proving remote work for non-Portuguese clients, NIF (Portuguese tax number — get this online or at a consulate), proof of accommodation in Portugal (lease or Airbnb), criminal background check apostilled, health insurance covering Portugal, passport photos. (3) The D8 initially grants a 4-month entry visa; once in Portugal you convert it to a 2-year residence permit at SEF/AIMA. After 5 years, you can apply for permanent residency.",
        isAccepted: true,
      },
      {
        userId: "seo-user-6",
        body: "One heads up: Portugal's immigration agency rebranded from SEF to AIMA in 2023. The process is the same but appointments at AIMA for in-country permit conversion have been notoriously backlogged. Join Facebook groups like 'Americans in Portugal' and 'Digital Nomads in Lisbon' for real-time tips. Also: you'll need to get a NIF number before arriving — you can do this remotely through a Portuguese fiscal representative for around €150.",
        isAccepted: false,
      },
    ],
  },
  // ── Indonesia (Bali) ───────────────────────────────────────────────────────
  {
    userId: "seo-user-8",
    countryCode: "ID",
    title: "What is the Bali tourist levy and how do I pay it? Does it apply to all of Indonesia?",
    body: "I keep reading about a new Bali fee for tourists. How much is it, how is it collected, and does it apply if I'm visiting other Indonesian islands like Lombok or Komodo?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-2",
        body: "Bali introduced a foreign tourist levy of IDR 150,000 (~$10 USD) per international visitor, which came into effect on February 14, 2024, and remains in place for 2026. It is specific to Bali only — does not apply to other Indonesian islands like Lombok, Komodo, Java, or Sulawesi. How to pay: you can pay online in advance at lovebali.baliprov.go.id using a credit card, or pay at dedicated kiosks on arrival at Ngurah Rai International Airport (Denpasar). If you pay online, you'll get a QR code to show at immigration. The levy is separate from and in addition to the Indonesia e-visa ($35–50 USD depending on type) — they're different payments. The fund is specifically earmarked for Bali environmental and cultural preservation projects.",
        isAccepted: true,
      },
    ],
  },
  // ── South Korea ────────────────────────────────────────────────────────────
  {
    userId: "seo-user-7",
    countryCode: "KR",
    title: "Do I need a K-ETA or visa for South Korea in 2026?",
    body: "I have a US passport and want to visit Seoul for 3 weeks. I've heard about a K-ETA system — is it still required or did South Korea change its entry policy?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-5",
        body: "Good timing to check — South Korea's K-ETA (Korea Electronic Travel Authorization) requirement has been changing. K-ETA was launched in 2021 and required pre-registration from citizens of visa-waiver countries. However, South Korea suspended the K-ETA requirement for US, UK, EU, and many other nationalities for extended periods to boost tourism recovery post-COVID. As of 2026, US passport holders can enter South Korea for up to 90 days WITHOUT a visa and WITHOUT K-ETA — just your passport is sufficient. Always verify this on the official Korean immigration website (immigration.go.kr) before travel, as the policy has toggled on and off. If K-ETA is reinstated, it's simple to apply online, takes 1–3 days, costs around $10 USD, and is valid for 2 years.",
        isAccepted: true,
      },
      {
        userId: "seo-user-3",
        body: "Adding context: South Korea does still require K-ETA for some nationalities (mainly countries that weren't in the waiver program historically). The exemption has mainly applied to OECD countries and a few others. If you're not from the US/EU/UK/Australia, check your specific nationality on immigration.go.kr. Also: South Korea's entry is strict about illegal substances — even CBD oil is prohibited and can result in arrest.",
        isAccepted: false,
      },
    ],
  },
  // ── Mexico ─────────────────────────────────────────────────────────────────
  {
    userId: "seo-user-4",
    countryCode: "MX",
    passportCode: "IN",
    title: "Can Indian passport holders visit Mexico without a visa in 2026?",
    body: "Planning a trip to Cancun and Mexico City with a US tourist visa. I've heard that having a valid US visa might allow entry to Mexico without a separate Mexican visa. Is this true?",
    resolved: true,
    answers: [
      {
        userId: "seo-user-8",
        body: "Yes, this is one of the best lesser-known travel hacks for Indian passport holders! Mexico allows visa-free entry to nationals of countries that hold a valid US visa (B1/B2), a valid Schengen visa, a valid Canadian visa, or a valid UK visa — this is Mexico's 'Visa Facilitation' policy. Requirements: your US (or Schengen/Canadian/UK) visa must be valid, not expired — Mexico also accepts US visas that expired within the last 10 years in some interpretations, but to be safe use a currently valid one. The INM (Mexican immigration) officer at the border typically asks a few questions — purpose of visit, how long you plan to stay. Allowed stay is up to 180 days as a tourist (though typically officers stamp 30–90 days initially; request more if you need it). This policy is official but enforce with discretion — print a copy of the Mexico INM (National Migration Institute) facilitation list to have on hand at the airport just in case.",
        isAccepted: true,
      },
      {
        userId: "seo-user-1",
        body: "Confirming this worked for me as an Indian passport holder with a valid US B1/B2 visa flying into Cancun. The immigration officer asked to see my US visa, checked it was valid, and stamped me in for 90 days. No pre-registration required, no fee for entry specifically for the visa facilitation — just standard tourism stamp. Keep in mind: if your US visa is single-entry and you've already used it, it won't count for this purpose.",
        isAccepted: false,
      },
    ],
  },
];

async function seedSeoQA() {
  console.log("🌍 Seeding SEO-targeted visa Q&A...");

  console.log("  Upserting SEO seed users...");
  for (const user of SEO_USERS) {
    await db
      .insert(usersTable)
      .values(user)
      .onConflictDoUpdate({
        target: usersTable.id,
        set: { firstName: user.firstName, lastName: user.lastName },
      });
  }

  console.log("  Inserting trending Q&A...");
  let qCount = 0;
  let aCount = 0;

  for (const qa of SEO_QA) {
    const { answers, ...questionData } = qa;

    const existing = await db
      .select({ id: questionsTable.id })
      .from(questionsTable)
      .where(and(eq(questionsTable.userId, questionData.userId), eq(questionsTable.title, questionData.title)))
      .limit(1);

    if (existing.length > 0) {
      qCount++;
      continue;
    }

    const [inserted] = await db
      .insert(questionsTable)
      .values(questionData)
      .returning({ id: questionsTable.id });
    qCount++;

    for (const answer of answers) {
      await db.insert(answersTable).values({ ...answer, questionId: inserted.id });
      aCount++;
    }
  }

  console.log(`  ✓ ${qCount} questions, ${aCount} answers inserted`);
  console.log("✅ SEO Q&A seed complete.");
  process.exit(0);
}

seedSeoQA().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

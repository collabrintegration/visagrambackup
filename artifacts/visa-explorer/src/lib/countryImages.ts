/**
 * Maps country codes to Unsplash photo IDs of famous tourist landmarks.
 * Usage: https://images.unsplash.com/photo-{id}?w=1600&q=80&fit=crop&crop=entropy
 */
export const countryLandmarkPhotos: Record<string, { photoId: string; landmark: string; credit: string }> = {
  AE: { photoId: "1512453979798-5ea266f8880c", landmark: "Burj Khalifa, Dubai",            credit: "Dan Novac" },
  AR: { photoId: "1612294037637-ec328d0e075e", landmark: "Perito Moreno Glacier",          credit: "Agustín Lautaro" },
  AT: { photoId: "1516483638261-f4dbaf036963", landmark: "Hallstatt, Austria",             credit: "Ionut Comanici" },
  AU: { photoId: "1506905925346-21bda4d32df4", landmark: "Sydney Opera House",             credit: "Dan Freeman" },
  BR: { photoId: "1619546813-6bc0b153ac0c",    landmark: "Christ the Redeemer, Rio",       credit: "Raphael Nogueira" },
  CA: { photoId: "1517935706615-2717063c2225", landmark: "Banff National Park",            credit: "Sebastian Unrau" },
  CH: { photoId: "1491555103944-7c647fd857e6", landmark: "Swiss Alps, Matterhorn",         credit: "Daniel Seßler" },
  CL: { photoId: "1489824904134-891ab64532f1", landmark: "Torres del Paine, Patagonia",   credit: "Sebastián Morales" },
  CN: { photoId: "1508804185872-173f1fdb3a61", landmark: "Great Wall of China",            credit: "William Olivieri" },
  CO: { photoId: "1576561216318-44c90b993401", landmark: "Cartagena, Colombia",            credit: "Mauricio Muñoz" },
  CZ: { photoId: "1541849546-216549ae216d",    landmark: "Prague Old Town",                credit: "Pedro Szekely" },
  DE: { photoId: "1467269204594-9661b134dd2b", landmark: "Neuschwanstein Castle",          credit: "Sebastiano Piazzi" },
  EG: { photoId: "1553913861-c0f3c2715b68",    landmark: "Pyramids of Giza",              credit: "Jeremy Bezanger" },
  ES: { photoId: "1543783207-ec64e4d3bde6",    landmark: "Sagrada Família, Barcelona",    credit: "Diego Gennaro" },
  ET: { photoId: "1580745899767-13dfee886a04", landmark: "Simien Mountains, Ethiopia",    credit: "Annie Spratt" },
  FJ: { photoId: "1559494007-9f5847c49d94",    landmark: "Bora Bora, Fiji Waters",        credit: "Belle Co" },
  FR: { photoId: "1499856871958-5b9627545d1a", landmark: "Eiffel Tower, Paris",           credit: "Anthony DELANOIX" },
  GB: { photoId: "1513635269975-59663e0ac1ad", landmark: "Tower Bridge, London",          credit: "Benjamin Davies" },
  GR: { photoId: "1504512485720-7d8fbf882726", landmark: "Santorini, Greece",             credit: "James Stamler" },
  HU: { photoId: "1519197924294-4ba991a11128", landmark: "Budapest Parliament",           credit: "Kit Suman" },
  ID: { photoId: "1537996194471-e657df975ab4", landmark: "Bali Temples, Indonesia",       credit: "Artem Beliaikin" },
  IL: { photoId: "1543993494-5f54bdc7399d",    landmark: "Jerusalem Old City",            credit: "Sander Crombach" },
  IN: { photoId: "1564507592333-c60657eea523", landmark: "Taj Mahal, Agra",              credit: "David Rodrigo" },
  IT: { photoId: "1531572753322-ad063cecc140", landmark: "Colosseum, Rome",              credit: "Mathew Schwartz" },
  JP: { photoId: "1528360983277-13d401cdc186", landmark: "Mount Fuji, Japan",            credit: "David Edelstein" },
  KE: { photoId: "1516426122078-c23e76319801", landmark: "Maasai Mara, Kenya",           credit: "Nam Anh" },
  KR: { photoId: "1540573133985-87b6da6d54a9", landmark: "Gyeongbokgung Palace, Seoul",  credit: "Sava Bobov" },
  MA: { photoId: "1539020140153-e479b8f22986", landmark: "Sahara Desert, Morocco",       credit: "Cristina Gottardi" },
  MX: { photoId: "1518638150340-f706e86654de", landmark: "Chichen Itza, Mexico",         credit: "Josh Mills" },
  MY: { photoId: "1508009603885-50cf7c579365", landmark: "Petronas Towers, KL",          credit: "Chuttersnap" },
  NG: { photoId: "1627894005463-4f6cf0ce1501", landmark: "Lagos Skyline, Nigeria",       credit: "Tope A. Asokere" },
  NL: { photoId: "1512470876302-972faa2aa9a4", landmark: "Amsterdam Canals",             credit: "Dariusz Sankowski" },
  NO: { photoId: "1520769669658-f07657f5a307", landmark: "Northern Lights, Norway",      credit: "Jonatan Pie" },
  NZ: { photoId: "1469854523086-cc02fe5d8800", landmark: "Milford Sound, New Zealand",   credit: "Tobias Keller" },
  PE: { photoId: "1526392060635-9d6019884377", landmark: "Machu Picchu, Peru",           credit: "Alexander Kunze" },
  PH: { photoId: "1518560814081-1a5cf3c6f3a4", landmark: "Palawan, Philippines",         credit: "Jared Erondu" },
  PK: { photoId: "1558618666-fcd25c85cd64",    landmark: "Badshahi Mosque, Lahore",      credit: "Meriç Dağlı" },
  PL: { photoId: "1562654501-a0ccc0fc3fb1",    landmark: "Wawel Castle, Kraków",         credit: "Manik Roy" },
  PT: { photoId: "1555881400-74d7acaacd8b",    landmark: "Lisbon Trams, Portugal",       credit: "Alexander Popov" },
  QA: { photoId: "1590179068383-b9c69aacebd3", landmark: "Doha Skyline, Qatar",          credit: "Konevi" },
  RU: { photoId: "1513326738677-b964603b3b4a", landmark: "St Basil's Cathedral, Moscow", credit: "Michael Parulava" },
  SA: { photoId: "1586724237558-c80a60532ef0", landmark: "Al-Ula, Saudi Arabia",         credit: "Noura Alhammadi" },
  SE: { photoId: "1509356843151-3e7d96241e11", landmark: "Stockholm Archipelago",        credit: "Philip Bum" },
  SG: { photoId: "1525625293386-3f8f99389edd", landmark: "Gardens by the Bay, Singapore","credit": "Hu Chen" },
  TH: { photoId: "1528181304800-259b08848526", landmark: "Wat Arun Temple, Bangkok",     credit: "Florian Wehde" },
  TR: { photoId: "1524231757912-21f4fe3a7200", landmark: "Hagia Sophia, Istanbul",       credit: "Spencer Davis" },
  TZ: { photoId: "1516026672322-bc52d61a55d5", landmark: "Serengeti, Tanzania",          credit: "Hu Chen" },
  UA: { photoId: "1585776245991-cf89dd7fc73a", landmark: "Kyiv Pechersk Lavra",          credit: "Serge Kutuzov" },
  US: { photoId: "1501594907135-23f5b1c2f61d", landmark: "Grand Canyon, USA",            credit: "Omer Salom" },
  VN: { photoId: "1528127269322-539801943592", landmark: "Ha Long Bay, Vietnam",          credit: "Ishan" },
  ZA: { photoId: "1539579083956-bfe37e3394a2", landmark: "Table Mountain, Cape Town",    credit: "Roger Starnes Sr." },
};

export function getCountryImageUrl(code: string, width = 1600, height = 900): string | null {
  const entry = countryLandmarkPhotos[code.toUpperCase()];
  if (!entry) return null;
  return `https://images.unsplash.com/photo-${entry.photoId}?w=${width}&h=${height}&q=80&fit=crop&crop=entropy`;
}

/**
 * Always returns a beautiful fallback image (Picsum Photos).
 * Seeded by country code so each country gets a consistent, appealing photo.
 * Use this as the `onError` replacement when the primary Unsplash image fails.
 */
export function getCountryFallbackImageUrl(code: string, width = 800, height = 400): string {
  return `https://picsum.photos/seed/${code.toLowerCase()}-country/${width}/${height}`;
}

export function getCountryLandmarkInfo(code: string) {
  return countryLandmarkPhotos[code.toUpperCase()] ?? null;
}

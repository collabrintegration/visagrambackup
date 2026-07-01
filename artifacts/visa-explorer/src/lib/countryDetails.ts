export interface CountryDetails {
  officialLanguages: string[];
  religions: string[];
  currencySymbol: string;
  currencyName: string;
  timezone: string;
  population: string;
  callingCode: string;
  drivingSide: "left" | "right";
}

const data: Record<string, CountryDetails> = {
  AE: { officialLanguages: ["Arabic"], religions: ["Islam"], currencySymbol: "د.إ", currencyName: "UAE Dirham (AED)", timezone: "UTC+4", population: "9.9M", callingCode: "+971", drivingSide: "right" },
  AR: { officialLanguages: ["Spanish"], religions: ["Roman Catholic", "Evangelical"], currencySymbol: "$", currencyName: "Argentine Peso (ARS)", timezone: "UTC-3", population: "46M", callingCode: "+54", drivingSide: "right" },
  AT: { officialLanguages: ["German"], religions: ["Roman Catholic", "Lutheran"], currencySymbol: "€", currencyName: "Euro (EUR)", timezone: "UTC+1 / +2", population: "9M", callingCode: "+43", drivingSide: "right" },
  AU: { officialLanguages: ["English"], religions: ["Christian", "No religion"], currencySymbol: "$", currencyName: "Australian Dollar (AUD)", timezone: "UTC+8 to +11", population: "26M", callingCode: "+61", drivingSide: "left" },
  BR: { officialLanguages: ["Portuguese"], religions: ["Roman Catholic", "Evangelical"], currencySymbol: "R$", currencyName: "Brazilian Real (BRL)", timezone: "UTC-5 to -2", population: "215M", callingCode: "+55", drivingSide: "right" },
  CA: { officialLanguages: ["English", "French"], religions: ["Christian", "No religion"], currencySymbol: "$", currencyName: "Canadian Dollar (CAD)", timezone: "UTC-8 to -3:30", population: "38M", callingCode: "+1", drivingSide: "right" },
  CH: { officialLanguages: ["German", "French", "Italian", "Romansh"], religions: ["Christian", "No religion"], currencySymbol: "Fr", currencyName: "Swiss Franc (CHF)", timezone: "UTC+1 / +2", population: "8.7M", callingCode: "+41", drivingSide: "right" },
  CL: { officialLanguages: ["Spanish"], religions: ["Roman Catholic", "Evangelical"], currencySymbol: "$", currencyName: "Chilean Peso (CLP)", timezone: "UTC-4 / -3", population: "19M", callingCode: "+56", drivingSide: "right" },
  CN: { officialLanguages: ["Mandarin Chinese"], religions: ["Buddhism", "Taoism", "No religion"], currencySymbol: "¥", currencyName: "Renminbi (CNY)", timezone: "UTC+8", population: "1.4B", callingCode: "+86", drivingSide: "right" },
  CO: { officialLanguages: ["Spanish"], religions: ["Roman Catholic", "Evangelical"], currencySymbol: "$", currencyName: "Colombian Peso (COP)", timezone: "UTC-5", population: "52M", callingCode: "+57", drivingSide: "right" },
  CZ: { officialLanguages: ["Czech"], religions: ["No religion", "Roman Catholic"], currencySymbol: "Kč", currencyName: "Czech Koruna (CZK)", timezone: "UTC+1 / +2", population: "10.7M", callingCode: "+420", drivingSide: "right" },
  DE: { officialLanguages: ["German"], religions: ["Christian", "No religion", "Islam"], currencySymbol: "€", currencyName: "Euro (EUR)", timezone: "UTC+1 / +2", population: "84M", callingCode: "+49", drivingSide: "right" },
  EG: { officialLanguages: ["Arabic"], religions: ["Islam", "Christianity"], currencySymbol: "£", currencyName: "Egyptian Pound (EGP)", timezone: "UTC+2", population: "105M", callingCode: "+20", drivingSide: "right" },
  ES: { officialLanguages: ["Spanish"], religions: ["Roman Catholic", "No religion"], currencySymbol: "€", currencyName: "Euro (EUR)", timezone: "UTC+1 / +2", population: "47M", callingCode: "+34", drivingSide: "right" },
  ET: { officialLanguages: ["Amharic"], religions: ["Christianity", "Islam"], currencySymbol: "Br", currencyName: "Ethiopian Birr (ETB)", timezone: "UTC+3", population: "123M", callingCode: "+251", drivingSide: "right" },
  FJ: { officialLanguages: ["English", "Fijian", "Hindi"], religions: ["Christianity", "Hinduism", "Islam"], currencySymbol: "$", currencyName: "Fijian Dollar (FJD)", timezone: "UTC+12", population: "930K", callingCode: "+679", drivingSide: "left" },
  FR: { officialLanguages: ["French"], religions: ["No religion", "Roman Catholic", "Islam"], currencySymbol: "€", currencyName: "Euro (EUR)", timezone: "UTC+1 / +2", population: "68M", callingCode: "+33", drivingSide: "right" },
  GB: { officialLanguages: ["English"], religions: ["Christian", "No religion", "Islam"], currencySymbol: "£", currencyName: "British Pound (GBP)", timezone: "UTC+0 / +1", population: "67M", callingCode: "+44", drivingSide: "left" },
  GR: { officialLanguages: ["Greek"], religions: ["Greek Orthodox"], currencySymbol: "€", currencyName: "Euro (EUR)", timezone: "UTC+2 / +3", population: "10.7M", callingCode: "+30", drivingSide: "right" },
  HU: { officialLanguages: ["Hungarian"], religions: ["Roman Catholic", "Calvinist"], currencySymbol: "Ft", currencyName: "Hungarian Forint (HUF)", timezone: "UTC+1 / +2", population: "10M", callingCode: "+36", drivingSide: "right" },
  ID: { officialLanguages: ["Indonesian"], religions: ["Islam", "Christianity", "Hinduism"], currencySymbol: "Rp", currencyName: "Indonesian Rupiah (IDR)", timezone: "UTC+7 to +9", population: "275M", callingCode: "+62", drivingSide: "left" },
  IL: { officialLanguages: ["Hebrew", "Arabic"], religions: ["Judaism", "Islam", "Christianity"], currencySymbol: "₪", currencyName: "Israeli Shekel (ILS)", timezone: "UTC+2 / +3", population: "9.5M", callingCode: "+972", drivingSide: "right" },
  IN: { officialLanguages: ["Hindi", "English"], religions: ["Hinduism", "Islam", "Christianity", "Sikhism"], currencySymbol: "₹", currencyName: "Indian Rupee (INR)", timezone: "UTC+5:30", population: "1.4B", callingCode: "+91", drivingSide: "left" },
  IT: { officialLanguages: ["Italian"], religions: ["Roman Catholic", "No religion"], currencySymbol: "€", currencyName: "Euro (EUR)", timezone: "UTC+1 / +2", population: "60M", callingCode: "+39", drivingSide: "right" },
  JP: { officialLanguages: ["Japanese"], religions: ["Shinto", "Buddhism", "No religion"], currencySymbol: "¥", currencyName: "Japanese Yen (JPY)", timezone: "UTC+9", population: "125M", callingCode: "+81", drivingSide: "left" },
  KE: { officialLanguages: ["Swahili", "English"], religions: ["Christianity", "Islam"], currencySymbol: "KSh", currencyName: "Kenyan Shilling (KES)", timezone: "UTC+3", population: "55M", callingCode: "+254", drivingSide: "left" },
  KR: { officialLanguages: ["Korean"], religions: ["No religion", "Christianity", "Buddhism"], currencySymbol: "₩", currencyName: "South Korean Won (KRW)", timezone: "UTC+9", population: "52M", callingCode: "+82", drivingSide: "right" },
  MA: { officialLanguages: ["Arabic", "Berber"], religions: ["Islam"], currencySymbol: "د.م.", currencyName: "Moroccan Dirham (MAD)", timezone: "UTC+1", population: "37M", callingCode: "+212", drivingSide: "right" },
  MX: { officialLanguages: ["Spanish"], religions: ["Roman Catholic", "Evangelical"], currencySymbol: "$", currencyName: "Mexican Peso (MXN)", timezone: "UTC-8 to -5", population: "130M", callingCode: "+52", drivingSide: "right" },
  MY: { officialLanguages: ["Malay"], religions: ["Islam", "Buddhism", "Christianity", "Hinduism"], currencySymbol: "RM", currencyName: "Malaysian Ringgit (MYR)", timezone: "UTC+8", population: "33M", callingCode: "+60", drivingSide: "left" },
  NG: { officialLanguages: ["English"], religions: ["Islam", "Christianity"], currencySymbol: "₦", currencyName: "Nigerian Naira (NGN)", timezone: "UTC+1", population: "220M", callingCode: "+234", drivingSide: "right" },
  NL: { officialLanguages: ["Dutch"], religions: ["No religion", "Christian", "Islam"], currencySymbol: "€", currencyName: "Euro (EUR)", timezone: "UTC+1 / +2", population: "17.6M", callingCode: "+31", drivingSide: "right" },
  NO: { officialLanguages: ["Norwegian"], religions: ["Church of Norway", "No religion"], currencySymbol: "kr", currencyName: "Norwegian Krone (NOK)", timezone: "UTC+1 / +2", population: "5.4M", callingCode: "+47", drivingSide: "right" },
  NZ: { officialLanguages: ["English", "Māori", "NZ Sign Language"], religions: ["Christian", "No religion"], currencySymbol: "$", currencyName: "New Zealand Dollar (NZD)", timezone: "UTC+12 / +13", population: "5.1M", callingCode: "+64", drivingSide: "left" },
  PE: { officialLanguages: ["Spanish", "Quechua", "Aymara"], religions: ["Roman Catholic", "Evangelical"], currencySymbol: "S/.", currencyName: "Peruvian Sol (PEN)", timezone: "UTC-5", population: "33M", callingCode: "+51", drivingSide: "right" },
  PH: { officialLanguages: ["Filipino", "English"], religions: ["Roman Catholic", "Islam"], currencySymbol: "₱", currencyName: "Philippine Peso (PHP)", timezone: "UTC+8", population: "115M", callingCode: "+63", drivingSide: "right" },
  PK: { officialLanguages: ["Urdu", "English"], religions: ["Islam"], currencySymbol: "₨", currencyName: "Pakistani Rupee (PKR)", timezone: "UTC+5", population: "231M", callingCode: "+92", drivingSide: "left" },
  PL: { officialLanguages: ["Polish"], religions: ["Roman Catholic"], currencySymbol: "zł", currencyName: "Polish Złoty (PLN)", timezone: "UTC+1 / +2", population: "38M", callingCode: "+48", drivingSide: "right" },
  PT: { officialLanguages: ["Portuguese"], religions: ["Roman Catholic", "No religion"], currencySymbol: "€", currencyName: "Euro (EUR)", timezone: "UTC+0 / +1", population: "10.3M", callingCode: "+351", drivingSide: "right" },
  QA: { officialLanguages: ["Arabic"], religions: ["Islam"], currencySymbol: "ر.ق", currencyName: "Qatari Riyal (QAR)", timezone: "UTC+3", population: "2.9M", callingCode: "+974", drivingSide: "right" },
  RU: { officialLanguages: ["Russian"], religions: ["Russian Orthodox", "Islam", "No religion"], currencySymbol: "₽", currencyName: "Russian Ruble (RUB)", timezone: "UTC+2 to +12", population: "144M", callingCode: "+7", drivingSide: "right" },
  SA: { officialLanguages: ["Arabic"], religions: ["Islam"], currencySymbol: "﷼", currencyName: "Saudi Riyal (SAR)", timezone: "UTC+3", population: "35M", callingCode: "+966", drivingSide: "right" },
  SE: { officialLanguages: ["Swedish"], religions: ["Church of Sweden", "No religion"], currencySymbol: "kr", currencyName: "Swedish Krona (SEK)", timezone: "UTC+1 / +2", population: "10.4M", callingCode: "+46", drivingSide: "right" },
  SG: { officialLanguages: ["English", "Malay", "Mandarin", "Tamil"], religions: ["Buddhism", "Christianity", "Islam", "Taoism", "Hinduism"], currencySymbol: "$", currencyName: "Singapore Dollar (SGD)", timezone: "UTC+8", population: "5.9M", callingCode: "+65", drivingSide: "left" },
  TH: { officialLanguages: ["Thai"], religions: ["Buddhism", "Islam"], currencySymbol: "฿", currencyName: "Thai Baht (THB)", timezone: "UTC+7", population: "72M", callingCode: "+66", drivingSide: "left" },
  TR: { officialLanguages: ["Turkish"], religions: ["Islam", "No religion"], currencySymbol: "₺", currencyName: "Turkish Lira (TRY)", timezone: "UTC+3", population: "85M", callingCode: "+90", drivingSide: "right" },
  TZ: { officialLanguages: ["Swahili", "English"], religions: ["Christianity", "Islam"], currencySymbol: "Sh", currencyName: "Tanzanian Shilling (TZS)", timezone: "UTC+3", population: "63M", callingCode: "+255", drivingSide: "left" },
  UA: { officialLanguages: ["Ukrainian"], religions: ["Ukrainian Orthodox", "Catholic"], currencySymbol: "₴", currencyName: "Ukrainian Hryvnia (UAH)", timezone: "UTC+2 / +3", population: "44M", callingCode: "+380", drivingSide: "right" },
  US: { officialLanguages: ["English"], religions: ["Christian", "No religion", "Judaism"], currencySymbol: "$", currencyName: "US Dollar (USD)", timezone: "UTC-10 to -5", population: "335M", callingCode: "+1", drivingSide: "right" },
  VN: { officialLanguages: ["Vietnamese"], religions: ["No religion", "Buddhism", "Catholicism"], currencySymbol: "₫", currencyName: "Vietnamese Đồng (VND)", timezone: "UTC+7", population: "97M", callingCode: "+84", drivingSide: "right" },
  ZA: { officialLanguages: ["Zulu", "Xhosa", "Afrikaans", "English", "+ 7 more"], religions: ["Christianity", "African traditional", "Islam"], currencySymbol: "R", currencyName: "South African Rand (ZAR)", timezone: "UTC+2", population: "60M", callingCode: "+27", drivingSide: "left" },
};

export function getCountryDetails(code: string): CountryDetails | null {
  return data[code.toUpperCase()] ?? null;
}

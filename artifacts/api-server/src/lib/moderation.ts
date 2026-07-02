// ── Content moderation ───────────────────────────────────────────────────────
// Text: simple profanity keyword block
// Images: block known adult/NSFW domains

const BAD_WORDS = new Set([
  "porn", "pornography", "xxx", "nude", "nudity", "nsfw", "hentai",
  "onlyfans", "camgirl", "stripclub", "escort", "prostitut",
]);

const BLOCKED_IMAGE_DOMAINS = new Set([
  "pornhub.com", "xvideos.com", "xhamster.com", "xnxx.com", "redtube.com",
  "youporn.com", "tube8.com", "spankbang.com", "eporner.com", "beeg.com",
  "fapello.com", "thothub.to", "coomer.party", "onlyfans.com", "fansly.com",
  "rule34.xxx", "nhentai.net", "gelbooru.com", "danbooru.donmai.us",
]);

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  for (const word of BAD_WORDS) {
    if (lower.includes(word)) return true;
  }
  return false;
}

export function isBlockedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (BLOCKED_IMAGE_DOMAINS.has(hostname)) return true;
    // Block file extensions that are clearly adult content patterns
    if (/\/(nude|nsfw|porn|xxx|hentai|adult)/i.test(parsed.pathname)) return true;
    return false;
  } catch {
    return false; // not a valid URL — let DB validation handle it
  }
}

export function moderateMessage(content: string | undefined, gifUrl: string | undefined): string | null {
  if (content && containsProfanity(content)) {
    return "Your message contains content that is not allowed on this platform.";
  }
  if (gifUrl && isBlockedImageUrl(gifUrl)) {
    return "This image URL is not allowed on this platform.";
  }
  return null; // OK
}

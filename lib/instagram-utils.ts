import type { Reel } from "./instagram-types";

export type InstagramMedia = {
  id?: string;
  media_type?: string;
  media_product_type?: string;
  permalink?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp?: string;
};

export function normalizeReelPermalink(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(url.hostname)) return null;
    if (!/^\/reel\/[\w-]+\/?$/.test(url.pathname)) return null;
    return `https://www.instagram.com${url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`}`;
  } catch {
    return null;
  }
}

export function selectRecentReels(media: InstagramMedia[], limit = 3): Reel[] {
  const seen = new Set<string>();
  return media
    .filter((item) => item.media_product_type === "REELS" || (item.media_type === "VIDEO" && item.permalink?.includes("/reel/")))
    .map((item) => ({ item, permalink: normalizeReelPermalink(item.permalink) }))
    .filter(({ item, permalink }) => Boolean(item.id && item.timestamp && permalink))
    .sort((a, b) => Date.parse(b.item.timestamp!) - Date.parse(a.item.timestamp!))
    .flatMap(({ item, permalink }) => {
      if (seen.has(item.id!)) return [];
      seen.add(item.id!);
      return [{
        id: item.id!,
        permalink: permalink!,
        thumbnailUrl: item.thumbnail_url?.startsWith("https://") ? item.thumbnail_url : null,
        caption: (item.caption || "").trim().slice(0, 180),
        postedAt: item.timestamp!,
      }];
    })
    .slice(0, limit);
}

export function reelEmbedUrl(permalink: string): string | null {
  const safe = normalizeReelPermalink(permalink);
  return safe ? `${safe}embed/` : null;
}

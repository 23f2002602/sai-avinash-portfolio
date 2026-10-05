export const instagramAccounts = ["s.ai.tories", "awwe.shit"] as const;
export type InstagramHandle = (typeof instagramAccounts)[number];

export type Reel = {
  id: string;
  permalink: string;
  thumbnailUrl: string | null;
  caption: string;
  postedAt: string;
};

export type ReelAccount = {
  handle: InstagramHandle;
  profileUrl: string;
  reels: Reel[];
  updatedAt: string | null;
};

export type ReelsResponse = {
  accounts: ReelAccount[];
};

export function isInstagramHandle(value: unknown): value is InstagramHandle {
  return typeof value === "string" && instagramAccounts.includes(value as InstagramHandle);
}

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import {
  instagramAccounts,
  type InstagramHandle,
  type ReelAccount,
  type ReelsResponse,
} from "./instagram-types";
import { selectRecentReels, type InstagramMedia } from "./instagram-utils";

type StoredToken = {
  token: string;
  userId: string;
  expiresAt: number;
};

type CachedReels = {
  reels: ReelAccount["reels"];
  updatedAt: string;
};

type TokenResponse = { access_token: string; expires_in?: number; user_id?: number | string };
type ProfileResponse = { id: string; username: string };
type MediaResponse = { data: InstagramMedia[]; paging?: { next?: string } };

const graphBase = "https://graph.instagram.com";
let redisClient: Redis | null | undefined;

function redis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

function requireRedis(): Redis {
  const client = redis();
  if (!client) throw new Error("Redis is not configured");
  return client;
}

function encryptionKey(): Buffer {
  const raw = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY;
  const key = raw ? Buffer.from(raw, "base64") : Buffer.alloc(0);
  if (key.length !== 32) throw new Error("Instagram token encryption key must be 32 bytes in base64");
  return key;
}

function seal(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}

function unseal(value: string): string {
  const packed = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), packed.subarray(0, 12));
  decipher.setAuthTag(packed.subarray(12, 28));
  return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString("utf8");
}

async function graphJson<T>(url: URL, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    // The request URL can contain a token, so never include it in an error.
    throw new Error(`Instagram API returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function clientConfig() {
  const id = process.env.INSTAGRAM_CLIENT_ID;
  const secret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  if (!id || !secret || !redirectUri) throw new Error("Instagram app credentials are not configured");
  if (!redirectUri.startsWith("https://")) throw new Error("Instagram redirect URL must use HTTPS");
  return { id, secret, redirectUri };
}

export async function beginConnection(handle: InstagramHandle): Promise<string> {
  const { id, redirectUri } = clientConfig();
  const state = randomBytes(24).toString("base64url");
  await requireRedis().set(`instagram:oauth:${state}`, handle, { ex: 600 });
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "instagram_business_basic");
  url.searchParams.set("state", state);
  url.searchParams.set("force_authentication", "1");
  return url.toString();
}

export async function finishConnection(state: string, code: string): Promise<InstagramHandle> {
  const client = requireRedis();
  const handle = await client.get<InstagramHandle>(`instagram:oauth:${state}`);
  if (!handle || !instagramAccounts.includes(handle)) throw new Error("Invalid or expired connection state");
  await client.del(`instagram:oauth:${state}`);

  const { id, secret, redirectUri } = clientConfig();
  const short = await graphJson<TokenResponse>(new URL("https://api.instagram.com/oauth/access_token"), {
    method: "POST",
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "authorization_code", redirect_uri: redirectUri, code }),
  });
  const longUrl = new URL(`${graphBase}/access_token`);
  longUrl.search = new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: secret, access_token: short.access_token }).toString();
  const long = await graphJson<TokenResponse>(longUrl);
  const profileUrl = new URL(`${graphBase}/me`);
  profileUrl.search = new URLSearchParams({ fields: "id,username", access_token: long.access_token }).toString();
  const profile = await graphJson<ProfileResponse>(profileUrl);
  if (profile.username.toLowerCase() !== handle) throw new Error("The connected Instagram account did not match the selected handle");

  const stored: StoredToken = {
    token: seal(long.access_token),
    userId: profile.id,
    expiresAt: Date.now() + (long.expires_in || 60 * 24 * 60 * 60) * 1000,
  };
  await client.set(`instagram:token:${handle}`, stored);
  try {
    await syncAccount(handle);
  } catch {
    // A connection can succeed even if the first media fetch is temporarily unavailable.
  }
  return handle;
}

async function activeToken(handle: InstagramHandle): Promise<string> {
  const client = requireRedis();
  const stored = await client.get<StoredToken>(`instagram:token:${handle}`);
  if (!stored) throw new Error(`Instagram account ${handle} has not been connected`);
  let token = unseal(stored.token);
  if (stored.expiresAt - Date.now() < 30 * 24 * 60 * 60 * 1000) {
    const url = new URL(`${graphBase}/refresh_access_token`);
    url.search = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token }).toString();
    const fresh = await graphJson<TokenResponse>(url);
    token = fresh.access_token;
    await client.set(`instagram:token:${handle}`, {
      ...stored,
      token: seal(token),
      expiresAt: Date.now() + (fresh.expires_in || 60 * 24 * 60 * 60) * 1000,
    } satisfies StoredToken);
  }
  return token;
}

async function fetchReels(token: string): Promise<ReelAccount["reels"]> {
  const media: InstagramMedia[] = [];
  let url: URL | null = new URL(`${graphBase}/me/media`);
  url.search = new URLSearchParams({
    fields: "id,caption,media_type,media_product_type,permalink,thumbnail_url,timestamp",
    limit: "25",
    access_token: token,
  }).toString();

  for (let page = 0; page < 5 && url; page++) {
    const response: MediaResponse = await graphJson<MediaResponse>(url);
    media.push(...response.data);
    if (selectRecentReels(media).length >= 3 || !response.paging?.next) break;
    const next: URL = new URL(response.paging.next);
    if (next.hostname !== "graph.instagram.com" || next.protocol !== "https:") break;
    url = next;
  }
  return selectRecentReels(media);
}

export async function syncAccount(handle: InstagramHandle): Promise<number> {
  const token = await activeToken(handle);
  const reels = await fetchReels(token);
  const cached: CachedReels = { reels, updatedAt: new Date().toISOString() };
  await requireRedis().set(`instagram:reels:${handle}`, cached);
  return reels.length;
}

export async function getReelsResponse(): Promise<ReelsResponse> {
  const client = redis();
  const accounts = await Promise.all(instagramAccounts.map(async (handle): Promise<ReelAccount> => {
    let cached: CachedReels | null = null;
    if (client) {
      try { cached = await client.get<CachedReels>(`instagram:reels:${handle}`); } catch { /* keep profile links available */ }
    }
    return {
      handle,
      profileUrl: `https://www.instagram.com/${handle}/`,
      reels: cached?.reels || [],
      updatedAt: cached?.updatedAt || null,
    };
  }));
  return { accounts };
}

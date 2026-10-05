import test from "node:test";
import assert from "node:assert/strict";
import { normalizeReelPermalink, reelEmbedUrl, selectRecentReels } from "../lib/instagram-utils";

test("selects only real reels, newest first, without duplicates", () => {
  const reels = selectRecentReels([
    { id: "photo", media_type: "IMAGE", permalink: "https://www.instagram.com/p/photo/", timestamp: "2026-10-04T00:00:00Z" },
    { id: "older", media_type: "VIDEO", permalink: "https://www.instagram.com/reel/older/", timestamp: "2026-09-01T00:00:00Z" },
    { id: "newer", media_product_type: "REELS", permalink: "https://instagram.com/reel/newer/", timestamp: "2026-10-01T00:00:00Z", caption: "New" },
    { id: "newer", media_product_type: "REELS", permalink: "https://instagram.com/reel/newer/", timestamp: "2026-10-01T00:00:00Z" },
    { id: "bad", media_product_type: "REELS", permalink: "https://example.com/reel/bad/", timestamp: "2026-10-05T00:00:00Z" },
  ]);
  assert.deepEqual(reels.map((reel) => reel.id), ["newer", "older"]);
  assert.equal(reels[0].permalink, "https://www.instagram.com/reel/newer/");
});

test("embeds only Instagram reel URLs", () => {
  assert.equal(normalizeReelPermalink("https://www.instagram.com/reel/abc123/?igsh=123"), "https://www.instagram.com/reel/abc123/");
  assert.equal(reelEmbedUrl("https://instagram.com/reel/abc123/"), "https://www.instagram.com/reel/abc123/embed/");
  assert.equal(reelEmbedUrl("https://www.instagram.com/p/abc123/"), null);
  assert.equal(reelEmbedUrl("https://evil.example/reel/abc123/"), null);
});

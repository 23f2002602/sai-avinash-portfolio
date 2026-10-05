"use client";

import { useEffect, useState } from "react";
import {
  instagramAccounts,
  type InstagramHandle,
  type Reel,
  type ReelAccount,
  type ReelsResponse,
} from "@/lib/instagram-types";
import { reelEmbedUrl } from "@/lib/instagram-utils";

const accountNames: Record<InstagramHandle, string> = {
  "s.ai.tories": "Stories & observations",
  "awwe.shit": "The other side",
};

function ReelCard({ reel, account, featured }: { reel: Reel; account: ReelAccount; featured?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const embed = reelEmbedUrl(reel.permalink);
  return (
    <article className={`reel-card${featured ? " reel-featured" : ""}`}>
      <div className="reel-frame">
        {playing && embed ? (
          <iframe
            src={embed}
            title={`Instagram reel by @${account.handle}`}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" className="reel-play" onClick={() => setPlaying(true)} aria-label={`Play Instagram reel by @${account.handle}`}>
            {reel.thumbnailUrl ? <img src={reel.thumbnailUrl} alt="" loading="lazy" /> : <span className="reel-placeholder" aria-hidden="true">SA / {account.handle}</span>}
            <span className="play-glyph" aria-hidden="true">▶</span>
          </button>
        )}
        <span className="reel-frame-label micro">@{account.handle}</span>
      </div>
      <div className="reel-meta">
        <div>
          <span className="micro">{featured ? "Latest / featured" : "Recent reel"}</span>
          <p>{reel.caption || `A reel from @${account.handle}`}</p>
        </div>
        <a href={reel.permalink} target="_blank" rel="noopener noreferrer" aria-label={`Open reel by @${account.handle} on Instagram`}>↗</a>
      </div>
    </article>
  );
}

function EmptyAccount({ handle, loading }: { handle: InstagramHandle; loading: boolean }) {
  return (
    <div className="reel-empty">
      <span className="micro">@{handle} / {accountNames[handle]}</span>
      <strong>{loading ? "Finding his latest stories…" : "His story continues here."}</strong>
      <p>{loading ? "" : "Take a look at the moments Avinash shares on Instagram."}</p>
      <a href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noopener noreferrer">Open Instagram ↗</a>
    </div>
  );
}

export function ReelsSection() {
  const [feed, setFeed] = useState<ReelsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/instagram/reels", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Feed unavailable");
        return response.json() as Promise<ReelsResponse>;
      })
      .then(setFeed)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const accounts = instagramAccounts.map((handle) => feed?.accounts.find((account) => account.handle === handle) || {
    handle,
    profileUrl: `https://www.instagram.com/${handle}/`,
    reels: [],
    updatedAt: null,
  });
  const recent = accounts.flatMap((account) => account.reels.slice(1).map((reel) => ({ reel, account })));

  return (
    <section className="chapter reels-section" id="reels" aria-labelledby="reels-title">
      <div className="chapter-label"><span className="micro">Chapter 05 / 06</span><span className="micro">The Storyteller</span></div>
      <div className="reels-heading">
        <div><p className="section-eyebrow">The moments between chapters</p><h2 id="reels-title">And sometimes,<br /><em>he hits record.</em></h2></div>
        <p>There&apos;s a side of Avinash that lives beyond his resume. These are the moments and stories he shares along the way.</p>
      </div>
      <div className="featured-reels">
        {accounts.map((account) => account.reels[0]
          ? <ReelCard key={account.handle} account={account} reel={account.reels[0]} featured />
          : <EmptyAccount key={account.handle} handle={account.handle} loading={loading} />)}
      </div>
      {recent.length > 0 && <div className="recent-reels">{recent.map(({ reel, account }) => <ReelCard key={reel.id} reel={reel} account={account} />)}</div>}
      <div className="reels-footer"><span className="micro">Public reels open in Instagram if an embed cannot play.</span><div><a href="https://www.instagram.com/s.ai.tories/" target="_blank" rel="noopener noreferrer">@s.ai.tories ↗</a><a href="https://www.instagram.com/awwe.shit/" target="_blank" rel="noopener noreferrer">@awwe.shit ↗</a></div></div>
    </section>
  );
}

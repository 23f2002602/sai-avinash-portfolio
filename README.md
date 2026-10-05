# Sai Avinash — Portfolio

A six chapter portfolio built with Next.js and ready for Vercel. The opening portrait is `/public/avinash-portrait.jpg`; the résumé and IIT Madras photo are also served locally.

The portfolio is one colourful story in two consecutive acts. The first half introduces Avinash through a Diet Coke ritual: reveal, holding, opening, sipping, and enjoying. His original portrait is the first image, with an illustrated can as a prop; subsequent scenes use the original character artwork in `components/coke-story-art.tsx`. The narrative remains in `components/avinash-story.tsx`. Native scrolling, reverse scrolling, scene buttons, and the skip link all work.

Typography combines Manrope, Lora, Caveat, and IBM Plex Mono. The film styling is in `app/notebook.css`, with the maximalist composition in `app/maximal.css` and scene overlays in `components/poster-layers.tsx`. Bold chapter numbers, staggered project cards, and a typographic interlude extend the treatment through the portfolio. Moving over the artwork adds depth; **A little more fizz** replays the bubble effect. The header’s motion switch stops decorative effects, and reduced motion preferences are respected automatically. Scrolling and keyboard scene navigation remain available. Projects have individual sketches, category filters, and keyboard accessible detail panels. Canvas drawing pauses offscreen and in hidden tabs.

## Run locally

`components/mini-avinash.tsx` draws a personalised SVG mini-me from Avinash's portrait: swept black hair, rounded-square glasses, beard, navy jacket and checked lapels. One character is reused for waving, holding/opening/sipping Diet Coke, enjoying it, grinding coffee, and offering a cup. Its blink, wave and small movements obey reduced motion. Run `npx tsx scripts/export-mini-avatar.tsx` to refresh the standalone transparent SVGs in `public/mini-me/` and `public/mini-avinash.svg`. These illustrations are authored vectors; they do not need the image-generation API.

The second half follows a coffee-making process while the visitor reads projects, leadership, reels, and contact: beans, grinding, brewing, milk, stirring, and enjoying. `components/coffee-journey.tsx` keeps the process illustration alongside the content; on mobile it becomes a compact sticky strip. `components/coffee-process-art.tsx` contains the original SVG process drawings. The stage buttons move to the relevant part of the portfolio; tapping the artwork replays its motion. Both acts are always on the same page. There is no theme switch or stored colour preference. The colour system and process motion are in `app/drink-journey.css`, with can and cup drawings in `components/drink-art.tsx`. All decorative motion respects the motion switch and reduced-motion preference.

For a locked local build cache, PowerShell can use a fresh directory: `$env:PORTFOLIO_BUILD_DIR='.next-verify-themes'; npm run build`. Normal builds and Vercel still use `.next`.

The personal interests section is in `components/curiosity-atlas.tsx`, with original shaded illustrations in `components/interest-object.tsx`. It covers eleven interests and distinguishes finance and economics as future learning directions. Objects float, respond to hover and keyboard focus, and reveal a description on selection. A drawn thread follows scroll progress; mobile keeps the selected description visible while browsing.

The transparent running cutouts are woven into `components/curiosity-atlas.tsx` as a decorative character following the illustrated thread on scroll. The poses appear in the supplied order: `shared image (1).jpg` → `shared image.jpg` → `shared image (3).jpg`. On mobile the character occupies the unused final cell of the interests grid. There is no separate running section or player. The prop cannot intercept clicks or keyboard focus, and the motion switch / reduced motion preference freezes it in its first pose. `scripts/prepare-running-images.py` regenerates the WebP cutouts and tight `prop-*.webp` crops in `public/running/`; original photographs are preserved.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The portfolio works without Instagram credentials; the reels chapter shows links to both profiles until the accounts are connected.

## Deploy and connect Instagram

1. Import this directory into Vercel as a Next.js project. Connect an Upstash Redis database through Vercel Marketplace; make sure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are available in the project.
2. Create a Meta developer app with **Instagram API with Instagram Login**. Give it `instagram_business_basic` access for both Creator accounts. Register `https://YOUR-DOMAIN/api/instagram/callback` as an allowed redirect URL. Depending on the Meta app's mode, both accounts may need to be assigned as testers or the app may need review.
3. Copy the remaining variables from `.env.example` into Vercel project settings. Generate a separate random value for the encryption key, administrator secret, and `CRON_SECRET`. Keep these server side and never commit them. Set `INSTAGRAM_REDIRECT_URI` to the exact registered production URL.
4. Deploy, then open `/admin/instagram`. Enter the administrator secret, connect `@s.ai.tories`, and repeat for `@awwe.shit`. Log in to the matching Instagram account during each authorization.
5. Vercel calls `/api/instagram/refresh` every day at 05:00 UTC. It refreshes tokens before expiry and updates the latest three reels per account. The public route `/api/instagram/reels` returns cached public reel details only. If Meta is temporarily unavailable, the last successful cache stays visible.

The Meta client secret, account tokens, encryption key, Redis token, and administrator secret never reach the browser. Account tokens are encrypted before storage in Redis. A reel loads Instagram's player only after a visitor chooses to play it; direct links remain available if embeds are blocked.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

`scripts/verify-story.mjs` checks the story in Chrome through its debugging port (`9224`). Start Chrome with an isolated test profile and remote debugging enabled, then run the script with the app running on `localhost:3210`; set `STORY_TEST_URL` to test another local port. It verifies the first portrait, full viewport composition, scroll progression and reverse travel, skip and release into the portfolio, particles, pointer and touch interactions, all six mobile scenes, project details, reduced motion, and keyboard navigation.

## Content

Verified portfolio text and social URLs live in `lib/content.ts`. The older one chapter HTML file remains in `portfolio/` as a reference; the site entry point is now `app/page.tsx`.

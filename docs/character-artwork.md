# Avinash character artwork

The character is a realistic 3D raster portrait, generated from `Media (4).jpg` (face and jacket) and `shared image (4).jpg` (body proportions and profile). The master is reused for each pose to preserve identity, clothing, lighting and framing. All seven poses have been generated and inspected; the site uses the finished WebP set.

Generation uses the imagegen skill's bundled CLI, GPT Image 2, high quality, 1536×2048. The source prompt and pose instructions live in `output/imagegen/master-prompt.txt` and `output/imagegen/pose-prompts.json`; full-resolution cutouts are saved alongside them. WebP versions are exported to `public/avinash-3d/`.

The current Azure route is `@openai-aifoundry-swc-001/gpt-image-2` through the Syngenta Portkey gateway. `scripts/image-gateway-proxy.mjs` adapts the local transport to that model alias; it does not modify the bundled generation CLI. Configure the gateway credential in the process environment and start the adapter with `node scripts/image-gateway-proxy.mjs`. In another terminal, set `OPENAI_BASE_URL` to `http://127.0.0.1:9235/v1`, set a non-secret local transport placeholder for `OPENAI_API_KEY`, and run `./scripts/generate-character.ps1`. Never save credentials in these files.

The CLI generates against a uniform green background. The skill's chroma helper produces real alpha with edge despill. Inspect every face, hand and cutout edge before enabling the asset set in `lib/character-assets.ts`. `node scripts/prepare-character-assets.mjs` checks dimensions and alpha and exports WebP with quality 90 and full-quality alpha.

Browser verification uses a local Chromium debugging endpoint at port 9224 and `STORY_TEST_URL`. Both verification scripts save screenshots only to a unique temporary directory. They never regenerate or overwrite artwork. `STORY_ALLOW_PENDING_ASSETS=1` is an explicit layout-only mode for working before image generation is finished; strict verification is the default.

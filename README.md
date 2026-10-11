# The Pond

A dark-green reading room for top tweets about identity.md, with custom AI-equipped Pepe illustrations. Browse the feed, sort by likes/date/replies, search people or ideas, explore four topics, save posts locally, copy original links, and read the source posts on X.

The finished static site is in **[dist/index.html](dist/index.html)**. Source, pinned dependencies, and lockfile are in **[web/](web/)**. The export is self-contained: fonts, illustrations, favicon, social image, and available author avatars are local. It makes no API requests at runtime.

## Install and run

Requires Node.js 22.12+ and npm. This delivery was checked with Node 22.23.3 and npm 10.9.9.

```sh
cd web
npm ci
npm run dev
```

Open the local URL printed by Vite. The development server is only for editing.

## Rebuild and preview the delivery

```sh
cd web
npm run typecheck
npm test
npm run build
npm run preview
```

The build replaces repo-root `dist/`. Vite uses `base: './'`; navigation uses `#feed`, `#topics`, and `#saved`, so a static host needs no route rewrites. Serve the export over HTTP(S), rather than opening it through `file://`.

After dependencies are installed, building and testing the data logic require no network. Installation from the lockfile also passed with `npm ci --offline` against the populated npm cache. A first install on a fresh machine needs registry access; no registry archives or dependency directories are included in the delivery.

## Browser checks

```sh
cd web
npx playwright install chromium
npm run test:browser
```

The script starts its own temporary HTTP server, serves the actual export under `/preview/`, opens Chromium, tests the site, writes screenshots/results into `docs/`, and closes both browser and server. It does not depend on a separately running preview. Browser installation requires a download once and the usual Chromium system libraries. `PLAYWRIGHT_BROWSERS_PATH` can select an existing installation; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an installed Chromium executable directly.

To regenerate the social preview from the bundled vector illustration and font, run `npm run generate:social`, then rebuild. The supplied 1200×630 PNG is already ready to use.

## Actual validation

The task prohibited modifying repository `node_modules/`, so dependencies and checks ran in a source-identical build workspace at `/tmp/imd-pond-revision/web`, with npm and browser caches also under `/tmp`. The tested export was copied byte-for-byte into this repository; no dependency/cache directories were created here.

| Command/check | Recorded result |
| --- | --- |
| `npm ci --offline --cache /tmp/imd-pond-revision-cache --no-audit --no-fund` | Passed; 75 packages installed from the lockfile/cache |
| `npm run typecheck` | Passed; no TypeScript errors |
| `npm test` | Passed; 8 tests covering real-data rankings, combined filters, bookmark normalization, and provenance |
| `npm run build` | Passed; Vite production export generated, with relative asset URLs |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/imd-tools/ms-playwright/chromium_headless_shell-1246/chrome-headless-shell-linux64/chrome-headless-shell npm run test:browser` | Passed; 46 checks, no console errors or failed resources |
| Axe 4.11, Chromium 154.0.8037.0 | Zero automated violations in desktop/mobile feeds, empty search, and about dialog; manual-review items remain documented |
| Responsive rendering | Checked at 320, 390, 520, 521, 760, 900, 1100, 1280, and 1440 CSS px; no horizontal document overflow |
| 390px first screen | Full first quotation at y=747.72–824.50 and Read on X at y=653.72–697.72, with scrollY=0 in a 390×844 viewport |
| Text enlargement and preferences | 200% root text size reflows; reduced-motion and forced-colors modes checked |

All five revision findings reproduced and were fixed: the phone feed begins sooner, source links sit in the author row, Skip to content preserves the selected task, page changes reset scroll/focus, the redundant sidebar slogans are removed, and text uses three weights. [Before measurements](docs/revision-before.json), per-finding responses in `.imd-responses.json`, and the validation report record the evidence.

The supplied browser connector returned `Transport closed`; local Playwright Chromium provided the rendered checks instead. These are worker-run results, not independent certification. Native browser zoom, screen-reader sessions, physical devices, Safari/Firefox, and live X sign-in/availability were not tested. The original-post keyboard test intercepts only the external destination to verify its exact new-tab URL; application links remain ordinary external anchors. Full coverage, measured contrast, fixes, and remaining limitations are in **[docs/VALIDATION.md](docs/VALIDATION.md)** and **[docs/browser-results.json](docs/browser-results.json)**.

## What the feed represents

This is an editorial collection of **8 original posts from 3 authors**, published 10 August–2 October 2026. Public metadata was captured through FxTwitter on **11 October 2026 at 17:03 UTC**. “Top tweets” ranks only these selected posts by recorded likes; it is not a live or exhaustive X ranking. “Latest” sorts their publication timestamps; “Discussion” sorts their reply counts. The UI repeats the snapshot date and explains the method.

Each card contains an editorial title/summary and, where present, a short attributed excerpt. No fabricated posts, engagement counts, or verification badges are included. Original links and metadata URLs are in the about dialog, [web/src/posts.json](web/src/posts.json), and [docs/source-capture.json](docs/source-capture.json). Author statements and historical project descriptions are not independently verified protocol facts. FxTwitter is a third-party metadata source, not an authenticated X API.

Bookmarks use `localStorage` in this browser and synchronize between open tabs on the same origin. They do not follow a user between devices or gateways. When storage is blocked, session bookmarks still work with an inline explanation. When clipboard access fails, a selectable original URL is offered.

To update the collection, edit `web/src/posts.json` with supported original-post IDs, current capture time, accurate metrics, and brief editorial summaries; update the date/collection description in `App.tsx`, then run the checks and rebuild. Topic and author counts are computed from the dataset. There is no polling service, backend, login, or credential configuration.

## Publish

Upload the **contents of `dist/` together**, preserving its directories, to any static HTTP host or an IPFS directory. In the IdentityMD workflow the network publishes this committed export after review; no publishing/deployment command was run here. Do not publish source, `node_modules/`, or package caches as runtime assets.

The HTML includes a title, description, favicon, `og:title`, `og:image`, and a Twitter large-image card. The social image URL is relative so the package works at an unknown gateway subpath. Some social crawlers require an absolute image URL; once the final public address is known, a publisher can replace `og:image` with that real URL and rebuild. No hostname has been invented.

The final source and required runtime assets are complete. No ignore file was changed and no submodule was introduced. See [docs/bundle-manifest.json](docs/bundle-manifest.json) for the delivered file budget and integrity hashes.

## Design and attribution

The implemented system is documented in **[DESIGN.md](DESIGN.md)**. [Desktop](docs/screenshots/desktop.jpg), [390px mobile](docs/screenshots/mobile.jpg), and [keyboard focus](docs/screenshots/keyboard-focus.jpg) screenshots show the production export.

Design review used the task’s pinned Better Interface guide (Jakub Krehel, MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`) and its adapted documentation method from Paul Bakaus’s Impeccable (Apache-2.0, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`). See [third-party notices](docs/THIRD_PARTY.md) and the retained [guidance licenses](docs/design-guidance-LICENSE.txt).

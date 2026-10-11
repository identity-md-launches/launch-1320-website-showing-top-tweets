# Revision validation and Better Interface review

**Completion: Complete for the stated revision scope.** Worker-run checks, not independent certification. Reviewed on 11 October 2026.

## Scope

This revises the accepted React + TypeScript + Vite site in `web/` and rebuilds root `dist/`. All five reports reproduced against the incoming export before source edits. The eight-post snapshot, green palette, AI-equipped Pepe artwork, source URLs, sorting, search, bookmarks, and other established behavior are retained. This is still a curated snapshot, not a live or exhaustive X ranking.

The pinned Better Interface workflow, all six domains’ core principles, focus/skip guidance, and documentation method were read and applied to the affected surfaces. No unrelated redesign was undertaken. The guidance notices and licenses remain in [design-guidance-LICENSE.txt](design-guidance-LICENSE.txt) and [THIRD_PARTY.md](THIRD_PARTY.md). Final implemented values and behavior are documented in root [DESIGN.md](../DESIGN.md).

## Reproduction, findings, and fixes

Before measurements are recorded in [revision-before.json](revision-before.json). Final measurements and assertions are in [browser-results.json](browser-results.json). Exact finding IDs and verdicts are also supplied in root `.imd-responses.json` for the review workflow.

| Finding / severity | Final source | Reproduced behavior | Correction and recheck |
| --- | --- | --- | --- |
| `72f3fcce…` · High · Mobile fidelity/layout | `web/src/styles.css:364`, `web/src/App.tsx:47` | At 390×844 and scrollY=0, hero y=131–409; first article y=729; quotation y=874–950.78; Read on X y=1181.28–1225.28. Neither reading content nor its source action fit the first screen. | At ≤520px, hide the hero kicker/jump button, use content-sized height, 12px × 20px padding, and remove the specified heading/paragraph margins. Move the existing source link into the wrapping author row, replacing the decorative X glyph. Final first quotation y=747.72–824.50; Read on X y=653.72–697.72. Both are entirely within the 844px viewport. Its 44px-high link opens the exact original URL by keyboard. |
| `7ffebf89…` · Medium · Accessibility | `web/src/App.tsx:152`, `web/src/App.tsx:159` | On both `#saved` and `#topics`, Enter on Skip to content changed the hash to `#main` and rendered five feed articles. Saved search `agents` and topic `AI agents` reset. | Prevent the skip anchor’s default navigation, scroll the existing main into view and focus it without another scroll. Keyboard tests preserve the saved/topics route and headings; additional tests preserve query, topic and article IDs on feed/saved. Initial Tab still reaches the skip link. |
| `18a01ca4…` · Medium · Navigation | `web/src/App.tsx:104` | At 1440×900, selecting Topics from feed scrollY=1500 left scrollY=582 and h1 top=-412. | A layout effect reacts to page changes after rendering, scrolls to 0 and focuses main with `preventScroll`. Desktop link, hash-driven Bookmarks, Back and Forward all finish at scrollY=0 with main focused. Topics h1 top=170. Topic selection still deliberately scrolls/focuses the filtered feed, with feed section top=22. Initial loading does not steal focus. |
| `920cfed3…` · Medium · Writing/taste | `web/src/App.tsx:172`, `web/src/App.tsx:214`, `web/src/App.tsx:217` | Rendered feed contained the five reported two-part slogans around its articles. | Remove the community-note paragraph, sidebar credit, collection intro paragraph and decorative rail note, plus their unused CSS. Retain the hero slogan/art, discovery link, collection numbers/date, topics and authors. Final desktop and keyboard-focus screenshots show the simplified rails and the footer directly after the authors with its existing 20px margin. No claim that the reviewer’s unavailable `taste.mjs` was run. |
| `a9148719…` · Medium · Typography/taste | `web/src/styles.css:87`, `:96`, `:128`, `:181`, `:199` | Computed styles at both requested widths confirmed 400, 500, 600, 650, 700 and 800. | Consolidate prose/label to 400, section headings to 600 and wordmark to 700. Existing sizes, family and palette remain. Browser checks of rendered text confirm exactly 400/600/700 at 390 and 1440px. |
| Revision recheck · Medium · Color contrast | `web/src/styles.css:371` | The shortened hero placed the illustration behind its description. The old transparent gradient produced a measured 2.42:1 minimum at 390px. | Strengthen the existing green gradient to an 80%-opaque trailing stop. Pixel-sampled final description contrast is 6.72:1 at 390px, 6.19:1 at 320px, and 8.14:1 at 1440px, exceeding the 4.5:1 threshold. Hero size and excerpt position are unchanged by this fix. |

All reported findings are fixed. The new external-tab test initially observed the popup’s empty initial URL; the test now waits for the destination URL before asserting it. No application change was needed for that synchronization issue.

## Six-domain coverage

| Domain | Status | Evidence and checks | Limits / not applicable |
| --- | --- | --- | --- |
| Accessibility | Checked | Keyboard skip on all routes; state preservation; route focus; topic focus; Read on X keyboard activation; native control labels, pressed/current states; about-dialog focus, Escape and return; five axe scans; visible search and forced-colors source-link focus screenshots | No screen-reader speech session or exhaustive focus-ring inspection. A native modal may let Tab reach browser chrome but never background controls. |
| Layout | Checked | Production export at 320, 390, 520, 521, 760, 900, 1100, 1280 and 1440px; no horizontal document overflow. Exact 390×844 fold assertions; scrolled navigation at 1440×900; wrapping author row; 200% root text enlargement at 390px; screenshots inspected | Root text enlargement is not native browser zoom. No physical device, RTL, pseudolocalization or separate 1500px+ rendering. English/LTR remains the supported content. |
| Writing | Checked | Removed the reported slogan stack; retained descriptive source links, method/snapshot labels, discovery and source context, clear search/storage/clipboard recovery | The editorial selection and historical author claims are not independently certified. External content was not refreshed in this revision. |
| Typography | Checked | One loaded local variable font; six existing size tokens; exactly three rendered weights; mobile 16px input; selectable quotations; real text wrapping at mobile/tablet/desktop and enlarged text | Font rendering outside Chromium and localization unverified. Variable font file still supports 200–800; the UI uses only 400/600/700. |
| Colors | Checked | Existing role tokens retained; seven computed foreground/background or boundary pairs; rendered hero glyph/background sampling at 320/390/1440px; compact-hero contrast regression repaired; non-color selected-state cues retained | Axe leaves manual-review items on layered backgrounds. Explicit measurements below do not certify every pixel, decoration or overlay state. No second branded theme exists. |
| UI details | Checked | Native external anchor moved intact; 44px mobile source action; saved/copy states; empty/end states and recovery; hover gating; forced-colors focus; reduced-motion transition is 0s; local loading avoids runtime resource dependence | No asynchronous content-loading UI, theme switch, drag, autoplay or complex animation to test. Animation-panel 10% replay unperformed. |

## Commands and actual results

Dependencies and execution were isolated under `/tmp/imd-pond-revision/web`; repository `node_modules/` and the protected `.git/`, `.github/` and `.env` paths were not modified. Source/config/tests and the export were compared byte-for-byte with that workspace. No ignore file changed. No submodule, npm archive, generated dependency directory or cache is included in the submission.

| Command | Result |
| --- | --- |
| `npm --prefix /tmp/imd-pond-revision/web ci --cache /tmp/imd-pond-revision-cache --no-audit --no-fund` | Exit 0; 75 packages installed from the existing lockfile. |
| `npm --prefix /tmp/imd-pond-revision/web ci --offline --cache /tmp/imd-pond-revision-cache --no-audit --no-fund` | Exit 0; installation also succeeds from the populated temporary cache. Fresh machines need registry access once. |
| `npm --prefix /tmp/imd-pond-revision/web run typecheck` | Exit 0; no TypeScript errors. |
| `npm --prefix /tmp/imd-pond-revision/web test` | Exit 0; all 8 existing tests pass (ranking, combined filters, bookmark normalization, dates/counts, provenance). |
| `npm --prefix /tmp/imd-pond-revision/web run build` | Exit 0 after the final CSS change. HTML 1.65 kB, JS 230.88 kB (71.45 kB gzip), CSS 27.78 kB (6.01 kB gzip), WOFF2 24.84 kB; local public assets included. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/imd-tools/ms-playwright/chromium_headless_shell-1246/chrome-headless-shell-linux64/chrome-headless-shell npm --prefix /tmp/imd-pond-revision/web run test:browser` | Exit 0; **46 checks pass** in Chromium **154.0.8037.0**, Playwright 1.56.1 and axe 4.11.0. **Zero console/page errors, failed resources or HTTP error responses.** |
| Package/source/export integrity check | Delivered source matches the checked workspace; delivered `dist/` matches the tested export. Relative asset URLs and metadata resolve; package/lockfile versions agree. Exact bytes/hashes and the 8 MiB budget are recorded in [bundle-manifest.json](bundle-manifest.json). |

The supplied browser connector first reported a refused preview connection and then `Transport closed`; local Playwright supplied all rendered evidence. The older temporary cache was inaccessible, so a fresh task-specific cache was used. A browser download was stopped once the preinstalled Chromium proved usable. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` is an optional test-runner override; normal installations can still use `npx playwright install chromium`.

Baseline reproduction used a local HTTP preview of the incoming `dist/`, stopped after inspection. The final browser script owns and closes its HTTP server/browser in one foreground run. It serves the actual production export at `/preview/`, without a route-rewrite server. No production publication was attempted.

The extended browser suite exercises the reported failures plus pagination, latest/discussion sorting, combined topic/search filters, empty-state recovery, save/reload/removal, direct hash loading, corrupt/denied storage, clipboard success/failure, the about dialog, and external-link attributes. A real source anchor is activated by keyboard; **only its external destination is intercepted by the test** to verify its exact new-tab URL without relying on X. Live X availability/authentication is unverified. Runtime application links are not intercepted.

## Contrast evidence

Opaque pairs use Chromium computed colors and WCAG relative luminance. For the hero, lossless images with normal and transparent text identify glyph pixels and sample the actual illustrated/gradient background. The specified text foreground is evaluated against each sampled background. Hidden phone kickers are omitted from the pixel test.

| Pair | Final ratio |
| --- | --- |
| Post title / post surface | 14.79:1 |
| Secondary metadata / post surface | 7.45:1 |
| Editorial summary / post surface | 9.58:1 |
| Desktop jump action text / lime fill | 13.96:1 |
| Search border / inner surface | 3.59:1 |
| Search border / page | 3.83:1 |
| Collection statistic labels / raised panel | 7.14:1 |
| Hero introduction / sampled background (desktop only) | minimum 10.73:1 |
| Hero title / sampled background (all three widths) | minimum 12.44:1 |
| Lime hero title / sampled background (all three widths) | minimum 11.03:1 |
| Hero description / sampled background (1440 / 390 / 320px) | minimum 8.14 / 6.72 / 6.19:1 |

Axe reported zero violations in desktop feed, search empty state, about dialog, 390px feed and 320px feed scans. Its remaining manual color-contrast items number 5, 5, 6, 4 and 4 respectively. These are documented limits, not a claim of full accessibility compliance.

## Rendered evidence and remaining limits

All ten final screenshots below are genuine captures of the tested production export and were opened for visual inspection:

- [Desktop, 1440×1080](screenshots/desktop.jpg)
- [Topics after scrolled navigation, 1440×900](screenshots/topics-navigation.jpg)
- [Mobile opening screen, 390×844](screenshots/mobile.jpg)
- [320px reflow](screenshots/mobile-320.jpg)
- [Tablet, 900px](screenshots/tablet.jpg)
- [Bookmarks](screenshots/bookmarks.jpg)
- [About dialog](screenshots/about.jpg)
- [Keyboard search focus](screenshots/keyboard-focus.jpg)
- [200% root text size](screenshots/text-enlargement.jpg)
- [Emulated forced colors and source-link focus](screenshots/forced-colors.jpg)

Native devices, screen-reader output, native browser zoom, Firefox/Safari, social-crawler unfurling and production hosting remain unperformed. The original social card and content snapshot are retained. No independent network certification is claimed.

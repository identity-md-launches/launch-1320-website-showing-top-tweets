# The Pond design system

## Overview

The Pond is an independent reading room for the identity.md community. The visual direction follows the brief: dark forest green, pale lime, and Pepe-inspired frogs equipped with AI chips, headsets, and computers. The custom, code-native illustration lives in `web/public/art/pepe-squad.svg`; it is decorative brand artwork rather than post media.

The feed is the primary surface. Desktop uses a navigation sidebar, a reading column, and a supporting collection rail. A short four-word hero introduces the product and offers “Explore the feed.” On phones, the navigation becomes a compact top row and the supporting rail is removed. The artwork is placed below mobile hero text so it does not reduce reading contrast.

Source of truth: `web/src/styles.css`, `web/src/App.tsx`, `web/src/feed.ts`, and the local assets. This document describes the shipped implementation, not a proposed system. Rendered evidence is linked from `docs/VALIDATION.md`.

## Colors

The interface uses hexadecimal primitives and role-based custom properties in `styles.css:9`. It has one deliberately dark theme. Forced-colors mode follows system colors; it is not a second branded theme.

| Role token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#0b1711` | Page and sidebar |
| `--color-surface` | `#101e16` | Feed cards, search, dialog |
| `--color-raised` | `#142219` | Collection panel and copy fallback |
| `--color-hover` | `#1b2d20` | Selection, hover, topic tags |
| `--color-border` | `#263b2a` | Quiet structural dividers/card boundaries |
| `--color-control-border` | `#60795a` | Search/input edges and selected-control borders |
| `--color-text` | `#eaf0df` | Main copy and headings |
| `--color-muted` | `#a0af98` | Secondary labels and metadata |
| `--color-accent` | `#c5ef77` | Primary button, selected navigation, active sort, bookmarks |
| `--color-accent-hover` / `--color-focus` | `#d8ffa0` | Hover fill / keyboard outline, distinct semantic roles |
| `--color-on-accent` | `#0b1711` | Text on filled lime actions |
| `--color-hero-bg` / `--color-hero-border` | `#192e1c` / `#385034` | Hero surface and edge |
| `--color-hero-text` / `--color-hero-label` | `#b8c7aa` / `#d1e4be` | Hero description / introductory line |
| `--color-summary` | `#b9c5b1` | Editorial summaries and dialog copy |
| `--color-feature-border` / `--color-feature-bg` | `#506a39` / `#20331f` | Top-post card border/ribbon |
| `--color-feature-text` / `--color-feature-muted` | `#c4dc9e` / `#acbd9f` | Ribbon label / explanation |
| `--color-tag-text` / `--color-link` | `#b8cda3` / `#c5d6b4` | Topic-tag text / post source link |

The secondary illustrated rail note intentionally uses a compact olive treatment (`.pepe-note`: background `#22331e`, border `#394a2d`, title `#d3e3b5`, paragraph `#aabd91`, footer `#b0c197`). These decorative values and the SVG’s colors are local to the illustration; do not reuse them as control text tokens. Avatars have a translucent white outline. There is no unused warning or danger palette.

The measured opaque text pairs range from 7.14:1 to 14.79:1 in the recorded set. Primary button text is 13.96:1. The search border is 3.59:1 against its inner surface and 3.83:1 against the page. The final hero description measures at least 8.14:1 at the three sampled widths. Full foreground/background values and methodology are in `docs/browser-results.json`; these measurements are not a certification of every possible pixel/state.

## Typography

One family: **Manrope**, then Arial and sans-serif. `web/src/fonts/manrope-latin.woff2` is a locally bundled variable WOFF2 covering weights 200–800; the interface uses 400, 500, 600, 650, 700, and 800. Only normal style is used. `font-display: swap` is set, and font synthesis is disabled. Chromium confirmed the font loaded. The OFL license is adjacent to the font.

Exactly six size tokens:

| Token | Size | Role |
| --- | --- | --- |
| `--text-caption` | 0.75rem / 12px | Timestamps, counts, compact tags |
| `--text-small` | 0.875rem / 14px | Navigation, summaries, supporting copy |
| `--text-body` | 1rem / 16px | Card titles, mobile inputs, mobile quotations |
| `--text-section` | 1.25rem / 20px | Feed headings, desktop quotations |
| `--text-title` | 1.75rem / 28px | Logo, mobile hero, dialog title |
| `--text-display` | 3rem / 48px | Desktop hero and page titles |

Compact feed summaries use 14px intentionally, with 1.75 line height and a 75ch maximum measure. Base line height is 1.5. Hero headings use 1.12; mobile headings use 1.16. Heading letter spacing is negative (−0.055em for display, −0.04em on mobile). Captions are normal case and have no tracking. Headings balance wrapping; descriptions use pretty wrapping. Counts use tabular numerals. Inputs become 16px at the mobile breakpoint; viewport metadata permits zoom. Post text is selectable and never line-clamped.

## Layout

Spacing tokens are 4, 8, 12, 16, 24, 32, and 48px. Nearby labels/icons use small gaps; distinct sections use 24–32px. Component-specific insets (for example 22px inside cards) are intentional optical adjustments. Logical inline/block properties are used throughout the layout; the shipped language is English/LTR.

The app shell has a 1600px maximum width and a 232px sidebar. Main content has 36px inline padding. The feed/rail grid uses `minmax(0, 1fr) 280px` with a 28px gap. At 1500px and above, the rail becomes 302px and the gap 32px. The sidebar is sticky at the top on desktop; the document, not the feed, scrolls.

| Breakpoint | Behavior |
| --- | --- |
| ≤1300px | Sidebar 210px; main inset 26px; rail 244px; less important view metric/date-range text hidden |
| ≤1100px | Sidebar 192px; supporting rail removed; feed uses the available width |
| ≤760px | Sidebar becomes horizontal top navigation; topic links and sidebar note removed; icon navigation retains accessible names; larger touch targets and 16px inputs |
| ≤520px | 16px main inset; 28px hero title; 278px minimum hero height; cropped artwork at the lower trailing edge; wrapping topic filters; metrics/actions split into separate rows |
| ≤360px | 12px main inset; compact navigation; heading can wrap; artwork moves farther toward the trailing edge |

Filter controls wrap rather than hiding in an unmarked scroller. The hero uses minimum height, so enlarged text can grow its container. Images have declared dimensions. Feed and app grid children use `min-width: 0`; summaries and query text can wrap long input. At 390×844 the main action ends at y=381px. Browser checks found no horizontal document overflow at 320, 390, 760, 900, 1100, 1280, or 1440px, or at 390px with 200% root text size. Browser-native zoom was not tested.

## Elevation & Depth

Most surfaces are flat, separated by tone and subtle structural borders. The hero adds a restrained dot pattern and radial artwork halo. The top-post ribbon identifies the ranking with words and an icon. Navigation selection uses an inset lime line plus a changed surface.

Only temporary overlays use substantial shadows: `.toast` has `0 8px 30px #0005`, `.copy-fallback` has `0 15px 50px #0007`, and `.about-dialog` has `0 24px 100px #0009`. The native dialog uses the browser top layer and a dark, 4px-blurred backdrop. Toast and copy fallback use z-index 20 and 30. The decorative dot overlay ignores pointer interaction.

## Shapes

Radius tokens: 8px controls, 12px cards, and 18px hero/dialog. Mobile hero uses 14px. Topic/filter tags use 5–6px. Avatars are circular. The favicon uses a rounded-square silhouette, echoed by the AI chips in the illustration. The outer card clips its top ribbon, avoiding mismatched nested corners.

## Components

All UI patterns are in `web/src/App.tsx`, with classes in `styles.css`; this is a small application, not a published component library.

- **`PostCard`**: accepts `post`, `rank`, `saved`, callbacks for save/copy/topic, and `copied`/`featured` states. Shows attributed short quotations, an explicitly labeled editorial summary, fixed snapshot counts, and native source links. Save is a button with `aria-pressed`; metrics are static, not fake engagement actions.
- **`Avatar`**: local author image or a neutral leaf fallback; small and regular variants. The adjacent author text supplies identity, so the image alt is empty.
- **`ExternalLink`**: real anchors support ordinary browser link behavior, use `noopener noreferrer`, and announce opening a new tab. Original source links are not intercepted.
- **Navigation**: hash anchors with `aria-current`. Desktop labels become accessible icon links on mobile. Topic buttons open the feed with that topic selected and move focus to the feed section.
- **Sort and topic groups**: native pressed buttons. Active sort has an underline; active topics have a changed border and surface. Color is not the sole state indicator.
- **Search**: an actual labeled `type="search"` field with a persistent magnifier affordance and a named clear control. The wrapper gets a visible focus ring. Search combines terms, author handles, topic, and bookmarks; result count is a polite live region.
- **Primary/secondary actions**: `.primary-button` is reserved for “Explore the feed.” `.secondary-button` provides contextual recovery from empty states. Hover effects are enabled only for hover-capable devices.
- **Empty and failure states**: empty bookmarks offer the feed; no matches names the query and offers clearing filters. Blocked storage shows an inline explanation and keeps session state. Failed copying exposes a labeled, selectable URL.
- **About dialog**: native `<dialog>` opened with `showModal()`. Initial focus goes to close; Escape and close restore focus. The page becomes inert. A native details/summary exposes per-post original and metadata sources.
- **Toast**: stable `role="status"` region for nonessential save/copy confirmations. It has no action and expires after four seconds; persistent failures stay visible beside their recovery control.

The shared focus indicator is a 2px lime outline, offset 4px; search uses a 3px offset on the enclosing field. Forced-colors mode uses system `Highlight`. State transitions name their properties, last 150ms, and use `cubic-bezier(.2, 0, 0, 1)`. Press scaling is 0.96 on relevant buttons. Motion is only enabled with `prefers-reduced-motion: no-preference`; there are no autoplay or entrance animations.

## Do’s and Don’ts

- Start a related view inside the existing shell, use one descriptive h1, and reuse the feed/section spacing.
- Keep one filled primary action in a view. Use quiet links and outlined or tonal secondary actions elsewhere.
- Use semantic color tokens for interface roles. Keep illustrated colors inside artwork and decorative notes.
- Add records to `posts.json`, keeping original URLs, capture provenance, and honest short summaries. Reuse `filterPosts`; do not add a second sorting implementation.
- Preserve local asset URLs, hash routes, and local bookmark behavior. Do not introduce runtime font/CDN dependencies or imply a live X connection.
- Keep the small-screen artwork below the hero description; the previous overlap failed measured contrast at 320px.
- Preserve accessible names, live updates, native controls, and reduced-motion behavior when extending components. Do not replace links with clickable containers.

For another collection view: add a route in `App`, reuse `.page-intro` and `.content-grid`, render existing `PostCard` instances, add a native hash navigation link, and update tests and documentation for the new behavior.

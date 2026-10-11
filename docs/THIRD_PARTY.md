# Attribution and provenance

## Design guidance

This assignment applied the pinned adaptation of **Better Interface** by Jakub Krehel, copyright 2026, MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`. Original: <https://github.com/jakubkrehel/skills/tree/267330e1adfc66a718fb65fa6918c1f06d0a689e/skills/better-interface>.

The design-documentation method was adapted from **Impeccable** by Paul Bakaus, copyright 2025, Apache-2.0, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`. Original: <https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md>.

The task’s combined license notices are retained in [design-guidance-LICENSE.txt](design-guidance-LICENSE.txt). The guide itself is not redistributed. This website and its documentation are a new implementation informed by those principles; they do not claim endorsement by the guide authors.

## Font and icons

Manrope variable Latin WOFF2 is bundled under the SIL Open Font License, retained at `web/src/fonts/OFL.txt`. Font source: <https://github.com/google/fonts/tree/main/ofl/manrope>. The delivered WOFF2 was obtained from the Fontsource CDN (`https://cdn.jsdelivr.net/fontsource/fonts/manrope:vf@latest/latin-wght-normal.woff2`); its bytes are committed, so builds do not query that URL.

Interface icons use `lucide-react` 0.468.0 (ISC). React, React DOM, Vite, and their build dependencies retain their package licenses through ordinary package installation. Source artwork, favicon, and social-preview composition were created locally as SVG/HTML for this assignment. The frog character treatment is Pepe-inspired, as requested; it is not an official brand asset or an endorsement.

## Posts and avatars

Public posts remain the words and views of their named authors. The site supplies short attributed excerpts and new editorial summaries; the original text is not reproduced in full. Metadata was retrieved using public FxTwitter status endpoints on 11 October 2026. Original X URLs, captured counts, and timestamps are recorded in [source-capture.json](source-capture.json) and shown in the site’s sources disclosure.

Two author avatars are bundled for attribution in the feed, sourced from their public profile metadata:

- Adam / `surfcoderepeat`: <https://pbs.twimg.com/profile_images/1707558009776242688/Mu8g3JM2_200x200.jpg>
- LastToSign: <https://pbs.twimg.com/profile_images/2099278929085284354/PHY2pKZY_200x200.jpg>

The pegzeus avatar request was unavailable (HTTP 403); the interface intentionally uses a generic leaf icon instead. No third-party post media is bundled. The Pond is independent of X and is not an official identity.md channel.

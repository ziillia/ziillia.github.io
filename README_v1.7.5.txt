Drive DJ Finder v1.7.5 trusted multi trace
Build: 2026-08-22

DEPLOY
1. This directory must replace the repository root on the Cloudflare Pages production branch.
2. Confirm that the production deployment contains the commit with Drive DJ Finder v1.7.5.
3. Open /drive-dj-finder?v=175 in Safari, not the old home-screen process.
4. The header must show: v1.7.5 TRUSTED MULTI TRACE
5. A downloaded diagnostic filename must contain: 1.7.5-trusted-multi-trace

CACHE FIX
- index.html and manifest now point to v1.7.5 URLs.
- service-worker page interception and offline cache were retired after Safari rejected redirected navigation responses.
- HTML and service-worker responses are marked no-store/no-cache via _headers.
- The cleanup worker removes old Drive DJ Finder caches and unregisters itself.

SAFETY
- OCR/canonical resolver conditions are unchanged by this deploy-only patch.
- version-title resolver remains frozen.
- Keep diagArtistGuardBypassed, diagMbFailedThenFallback and diagMergeCanonicalConflict at zero before adoption.

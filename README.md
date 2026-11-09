# Lokota Web

Czech static website for **KK Lokomotiva Tábor**. Astro, TypeScript, Git-managed Markdown and public ČKA data. Static HTML with an optional narrowly scoped Pages Function for sports refresh; no browser framework.

The owner approved the requirements, architecture and task plan. The implementation, supplied club logo, team accents and one labelled sample article are committed and pushed. Offline CI and a Pages deployment of commit 1b1c807 are verified. That deployment had an opponent-logo defect; its T-15 snapshot correction was subsequently committed and pushed, with separate deployed-feature verification still pending. Final appearance review, real editorial/tournament/contact content, daily refresh and operational checks remain pending; the temporary deployment is not a completed final launch. The owner-requested general working-version banner is removed; offline fixture previews retain their explicit test-data warning, and indexing remains disabled. Reports through commit ea1167a are committed and pushed. The owner-requested T-19 visual modernization and T-20 four-story homepage refinement, compact match cards and grouped club overview are locally implemented and verified. On 2026-11-03 the owner explicitly authorized their commit/push, completed as beae943 on origin/main. T-21 adds the locally verified warm near-white/red palette, supplied homepage photograph and club gallery. The owner explicitly authorized committing and pushing these changes with “commit and push”; Git history records publication, while CI/Pages results and live verification remain separate. Successful CI/Pages deployment, live verification and final appearance acceptance are separate milestones; see docs/tasks.md and Git history for the handoff.

## Develop and verify

Use **Node 24.22.2** (both .nvmrc and .node-version), bundled npm **11.19.1**, and the lockfile. For nvm users:

```sh
nvm install
nvm use
npm ci
npm run dev
```

The development server prints its actual address (normally http://localhost:4321). It prepares the static fallback once at startup. Astro dev/preview does not execute Pages Functions; use the runtime preview below to exercise request-time refresh. Core visitor pages remain readable without JavaScript. A small progressive enhancement shows table-scrolling guidance only when a table actually overflows; the semantic table and native horizontal scrolling remain usable without it.

```sh
npm run verify          # Astro/TypeScript, all content/references, offline behavior tests
npm run build           # verify, fresh live ČKA dataset, static build, output checks
npm run preview         # serve static dist only (no Pages Function)
npm run preview:runtime # serve dist + real local Pages/workerd runtime on port 4321
npm run dev:offline     # explicit synthetic sports data; large TEST warning
npm run build:offline   # synthetic output only in .cache/offline-dist, never dist
npm run test:editorial  # temporary synthetic articles/editions/images/download, build assertions, cleanup
```

Only `npm run build` is the release path. Calling Astro directly bypasses preparation/output checks. Tests and `verify` do not contact ČKA. Editorial smoke examples use isolated sdd-test directories and refuse to overwrite an existing test area. `node scripts/content-smoke.ts --keep` retains them for deliberate local review; `node scripts/content-smoke.ts --clean` removes that test area afterward. Do not commit these generated examples. Two small PNG graphics under tests are synthetic image-processing fixtures, not club photographs.

Astro preview runs in the background in this version. Stop with `npx astro preview stop`; inspect it with `npx astro preview status`. A preview serves build output, so later source edits need another build or the development server.

## Sports refresh (T-37)

After a successful npm run build, stop any Astro server on port 4321 and run npm run preview:runtime. This uses pinned development-only Wrangler and the actual local workerd runtime, without login, remote deployment or storage setup. npm run verify also bundles the Pages Function offline. wrangler.jsonc pins the compatibility date; public/_routes.json invokes Functions only for /api/sports. The owner authorized Git publication on 2026-11-09. A Git-integrated Pages deployment includes the Function; verify actual Cloudflare-to-ČKA access and Workers Free CPU/request usage there before declaring operational completion.

Homepage sports, matches, tables and paginated mixed news request /api/sports once per page load. It fetches/validates complete latest-season club data and caches rendered fragments for five minutes per origin/deployment/data center. Browser responses use no-store; refreshing does not reset the saved data timestamp. Related sections switch together; no background polling, credentials or runtime image downloads. Published article metadata/local optimized covers and emblems come from sports-manifest.json. Manual article text and tournament archives stay unchanged. Existing pagination routes remain; newly needed pages beyond static output use /novinky/?strana=N. Without JavaScript that query displays the static first-page fallback.

On endpoint/upstream/schema failure the existing HTML remains with its original timestamp and a short Czech notice. Without JavaScript or on non-sports pages, the footer identifies build-time data. Cache is disposable and is not durable last-good storage; repeated failures/no-JavaScript data can remain as old as the deployment. The existing build still requires fresh upstream data. Daily refresh activation/verification is a separate T-13 task. Do not call this live scoring or guaranteed real-time updates.

Inspect local logs or, after deployment approval, Pages/Workers logs. Only controlled integration diagnostics are emitted; raw upstream payloads and secrets are not logged. GET /api/sports returns X-Sports-Cache: MISS/HIT and X-Sports-Fetched-At for diagnostics, with a generic non-cacheable 503 on failure. Upstream retrieval has a 12-second deadline, four-second request timeouts and at most 40 attempts; there is no user-selectable upstream URL or club filter. Cache issues do not prevent returning an otherwise valid fresh result. No KV, account credentials, scheduled job or daily repository writes are added.

## Author content

The owner-supplied club emblem is maintained at src/assets/club-logo.jpg, relocated from the initial downloads area without changing its bytes. Replace this source to update the shared-header logo and browser favicon; Astro generates the small responsive WebP variants during builds. Keep the supplied artwork and proportions intact. The downloads directory is for tournament attachments.

News lives under src/content/news, tournament editions under src/content/tournaments, and the four club pages under src/content/club. Use ordinary Markdown. Put local photographs beside their entries; about 20 photographs/year is expected. Crop/resize excessive source images before committing. Astro generates responsive web images; gallery links open larger optimized files without a lightbox.

Example article frontmatter (replace all example values and provide a real local photograph):

```yaml
---
slug: zprava-z-klubu
title: Zpráva z klubu
publicationDate: "2026-11-01"
summary: Krátké shrnutí skutečné klubové zprávy.
author: Jméno autora
cover:
  src: ./fotografie.jpg
  alt: Popis skutečného dění na fotografii.
gallery:
  - src: ./dalsi-fotografie.jpg
    alt: Popis druhé fotografie.
    caption: Volitelný popisek.
draft: true
---
```

Add the Markdown body after frontmatter. Dates must be quoted real YYYY-MM-DD calendar dates; a published article cannot be future-dated. Optional author/gallery may be omitted. Cover is optional: omit the whole cover block for a typographic entry in the full news listing; the homepage uses a navy lane-motif preview instead. Neither view repeats a large emblem placeholder. If supplied, cover requires a local image and meaningful alt; a missing referenced file remains an error. The article detail omits a large cover when absent. Slugs stay stable and unique; archiv/strana are reserved. Published is the default (`draft: false`). Drafts are validated but excluded from routes, feeds, sitemap and Astro's public image store. Git itself and public PR previews are not private editorial storage. Files in public are public even when attached to a draft.

The homepage curates the four latest published articles, then three upcoming matches and three recent results across all club teams, followed by the A-team table. Upcoming cards reuse the existing next-match policy; recent cards follow the existing generated-feed eligibility/order. The complete /novinky/ listing combines published articles and dated FINISHED/FORFEIT matches with official scores, newest first. Manual articles come first on same-day ties. Match corrections keep the same ID and anchor; reopened matches leave the news feed. Manual yearly archives survive sports season changes.

Example tournament frontmatter (illustrative year only; do not publish it as a real edition):

```yaml
---
year: 2000
description: Ověřený popis konkrétního ročníku.
draft: true
isCurrent: false
downloads:
  - label: Výsledková listina (PDF)
    path: /downloads/2000/vysledky.pdf
---
```

The name defaults to Žižkova 200. Add optional startDate/endDate when known; endDate requires startDate and cannot precede it. Set qualifiesForMcr true/false only when confirmed, otherwise omit it. Optional galleries use the same structure as articles. At most one published isCurrent edition is allowed; otherwise the greatest published non-archived year is current. Use archived: true for historical-only entries; these cannot also be isCurrent and do not replace the next-edition announcement. Years must be unique, including drafts.

Historical result sheets may also use validated results frontmatter: an array of groups with id, label and ordered pairs. Each pair has the source position, exactly two players with name/club/full/spares/errors/total, the same four aggregate figures, and optional category (label/position) or source-anomaly note. Follow the real 2021/2023/2025 entries as examples. Keep source order, repeated starts, printed ranks and spelling; never calculate a replacement ranking. Group IDs must be unique, and full/spare and pair totals must agree. The page renders responsive pair cards and local per-year name/club search ignoring Czech diacritics; all results remain visible without JavaScript. Do not also duplicate the same results in a Markdown table. Long source notes remain available in a native expandable section; PDF downloads are linked near the top.

The supplied PDF named 2022 actually describes 2021; the 2021 entry explains this and the duplicated printed rank 40. In 2025 the main sheet and women’s ranking disagree on one player's errors; retain the documented main-sheet values and the explanatory note. Keep the original PDFs unchanged. No run-time importer or external search index is involved.

Write announcements/propositions and unstructured results in the Markdown body. Use `## Výsledky` above an ordinary Markdown results table, preserving supplied row order and values. If results are pending, omit that section and the page displays the pending state. No ranking calculation or CSV/PDF importer exists. Files for download belong under public/downloads and must be existing local PDF/CSV files within 25 MiB; there is no upload UI. An older article or tournament edition can be added through content alone.

Club Markdown uses page: klub, historie, kontakt or herna, plus title, summary and body. Missing factual inputs stay explicitly pending. Never infer contact details, logos, colors or history from sample content.

## Sports data and failures

Club 279, API base, locale and Prague timezone convention are centralized in src/site.ts. Build preparation selects the season by its chronological start, including a newly published future season. It discovers teams/competitions from club matches and their official tables; a team without matches in a wholly undiscovered competition is a known discovery limitation. There are no fixed seasonal competition IDs or player-detail requests.

Each release fetches one fresh normalized dataset into ignored .cache storage. Pages render that snapshot with its update time; they never fetch from the browser. API requests have bounded retries/timeouts, complete pagination and boundary validation. Team points, pins and set points remain distinct; missing values are not zero. Tables preserve official ranks and points.

Required API/schema failures stop the new build and remove its old temporary dataset. Retry after recovery, or inspect the safe endpoint/status/schema diagnostics and compare the current public OpenAPI contract with the integration. Do not replace a failed live build with fixtures or an empty season. A first publication needs a successful live build. On Pages, the intended policy is that the last successful deployment remains served; **new editorial changes wait too**. Temporary build caches are not a durable last-good data store. Account-level retention/failure behavior still needs deployed verification.

## Hosting handoff (deployment unverified)

T-13 in docs/tasks.md is in progress for the owner-requested setup handoff; T-14 final content/domain launch remains deferred. The implementation is on GitHub main (7f44401). No Pages project URL, Git integration result, deployment hook, schedule, account settings or DNS changes have been verified by the agent. The offline GitHub checks workflow is pushed, but its remote outcome has not been checked; it needs no deployment secrets or live API.

In Workers & Pages > Create application, use the Pages entry point (the owner's current screenshot labels it “Continue to Pages”), then import vojtechkrakora/lokota-web from GitHub. Use main for Production, leave root at the repository root, and set:

| Setting | Value |
| --- | --- |
| Build command | npm ci && npm run build |
| Build output directory | dist |
| NODE_VERSION, Production and Preview | 24.22.2 |
| SKIP_DEPENDENCY_INSTALL, Production and Preview | 1 |

The framework preset is optional when these values are provided manually. Disabling the automatic dependency install ensures the build performs one explicit lockfile install. See the official [Pages Git setup](https://developers.cloudflare.com/pages/get-started/git-integration/) and [build environment settings](https://developers.cloudflare.com/pages/configuration/build-image/).

After the stable project pages.dev address is assigned, set SITE_ORIGIN for Production to that actual HTTPS origin and rebuild; previews use CF_PAGES_URL. Do not substitute a guessed available hostname or a per-deployment hash URL for the stable production origin. Locally the origin may be absent (no fabricated canonical). Temporary sites remain noindex via HTML, robots.txt and response headers until an authorized launch change. Successful instructions or a push do not establish a successful Pages build: T-13 still requires deployed verification.

The approved future refresh target is daily at 04:17 UTC via a secret Pages deploy hook, plus manual dispatch. An accepted hook only requests a build; verify the actual Pages build/deployment result. Confirm account quotas, failure notifications and GitHub scheduled-workflow inactivity/re-enable behavior before enabling automation. Final domain/DNS, HTTPS, existing email records, redirects and real content require their own launch review.

See AGENTS.md and docs/requirements.md, docs/architecture.md and docs/tasks.md for the approved specification and recorded validation limits.

Team UI accents are centralized in src/lib/team-colors.ts and the shared CSS: A red, B blue, C green, D purple, E orange. They identify teams in the website, not official uniform colors. Match feed tiles show validated home/away points; derbies retain both teams' colors. Use the confirmed club name in public copy, without the unused project nickname.

The shared page head generates a small PNG favicon from the supplied club logo. On the matches page, both sides also show their club emblem: the public API's optional club.logo reference supplies opponent images, while all Tábor teams use the owner-supplied asset. The normal dev/build preparation clears and downloads one emblem per opponent club into ignored .cache/club-logos, then uses Astro's existing image tooling to emit small same-origin WebP files. No extra package, remote image service or browser API fetch is required. If downloading fails, preparation reuses a validated repository snapshot from src/assets/opponent-logos only when the club ID and normalized current API source URL match. Missing/changed-source/corrupt snapshots produce a neutral placeholder without preventing publication of valid sports data; build diagnostics use club IDs, source counts, HTTP status or bounded network error codes and processing stages, without logging arbitrary upstream messages or bodies. Offline fixtures clear prepared logos and never download them. Restart the normal dev command to refresh these assets together with sports data. T-15 records the requirements/design and validation.

Run npm run logos:update locally to refresh the small opponent-logo snapshots and sources.json from live API data, review the changed assets, then include them in an authorized commit. The command requires valid prepared images for every allowed current source before saving snapshots; it refuses fixture data. Ordinary dev/build commands never modify these tracked snapshots. There are currently 16 optimized WebP snapshots (about 57 kB total). New clubs or changed API logo URLs need a snapshot refresh if the deployment environment cannot download their images.

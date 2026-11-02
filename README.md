# Lokota Web

Czech static website for **KK Lokomotiva Tábor**. Astro, TypeScript, Git-managed Markdown and public ČKA data. No backend or browser framework.

The owner approved the requirements, architecture and task plan. The implementation, supplied club logo, team accents and one labelled sample article are committed and pushed. Final appearance review, real editorial/tournament/contact content and verified deployment remain pending. The owner is being guided through Cloudflare Pages setup; this is not a verified public launch. The light design is labelled as a working version, and indexing is disabled.

## Develop and verify

Use **Node 24.22.2** (both .nvmrc and .node-version), bundled npm **11.19.1**, and the lockfile. For nvm users:

```sh
nvm install
nvm use
npm ci
npm run dev
```

The development server prints its actual address (normally http://localhost:4321). It fetches sports data once at startup; restart it to refresh. Core visitor pages require no JavaScript.

```sh
npm run verify          # Astro/TypeScript, all content/references, offline behavior tests
npm run build           # verify, fresh live ČKA dataset, static build, output checks
npm run preview         # serve the successful dist build
npm run dev:offline     # explicit synthetic sports data; large TEST warning
npm run build:offline   # synthetic output only in .cache/offline-dist, never dist
npm run test:editorial  # temporary synthetic articles/editions/images/download, build assertions, cleanup
```

Only `npm run build` is the release path. Calling Astro directly bypasses preparation/output checks. Tests and `verify` do not contact ČKA. Editorial smoke examples use isolated sdd-test directories and refuse to overwrite an existing test area. `node scripts/content-smoke.ts --keep` retains them for deliberate local review; `node scripts/content-smoke.ts --clean` removes that test area afterward. Do not commit these generated examples. Two small PNG graphics under tests are synthetic image-processing fixtures, not club photographs.

Astro preview runs in the background in this version. Stop with `npx astro preview stop`; inspect it with `npx astro preview status`. A preview serves build output, so later source edits need another build or the development server.

## Author content

The owner-supplied club emblem is maintained at src/assets/club-logo.jpg, relocated from the initial downloads area without changing its bytes. Replace this source to update the shared-header logo and default news thumbnail; Astro generates the small responsive WebP variants during builds. Keep the supplied artwork and proportions intact. The downloads directory is for tournament attachments.

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

Add the Markdown body after frontmatter. Dates must be quoted real YYYY-MM-DD calendar dates; a published article cannot be future-dated. Optional author/gallery may be omitted. Cover is optional: omit the whole cover block to use the supplied club emblem in feed thumbnails. If supplied, cover requires a local image and meaningful alt; a missing referenced file remains an error. The article detail omits a large cover when absent. Slugs stay stable and unique; archiv/strana are reserved. Published is the default (`draft: false`). Drafts are validated but excluded from routes, feeds, sitemap and Astro's public image store. Git itself and public PR previews are not private editorial storage. Files in public are public even when attached to a draft.

The homepage and /novinky/ combine published articles and dated FINISHED/FORFEIT matches with official scores, newest first. Manual articles come first on same-day ties. Match corrections keep the same ID and anchor; reopened matches leave the news feed. Manual yearly archives survive sports season changes.

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

The name defaults to Žižkova 200. Add optional startDate/endDate when known; endDate requires startDate and cannot precede it. Set qualifiesForMcr true/false only when confirmed, otherwise omit it. Optional galleries use the same structure as articles. At most one published isCurrent edition is allowed; otherwise the greatest published year is current. Years must be unique, including drafts.

Write announcements/propositions and results in the Markdown body. Use `## Výsledky` above an ordinary Markdown results table, preserving supplied row order and values. If results are pending, omit that section and the page displays the pending state. No ranking calculation or CSV/PDF importer exists. Files for download belong under public/downloads and must be existing local PDF/CSV files within 25 MiB; there is no upload UI. An older article or tournament edition can be added through content alone.

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

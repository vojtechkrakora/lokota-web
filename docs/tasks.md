# Lokota Web — implementation tasks

Status: **task plan approved by the owner on 2026-11-02; functional implementation accepted; visual revision locally verified and awaiting owner review; T-13/T-14 deferred**.
Date: 2026-11-02.
Baseline: approved [requirements.md](requirements.md), approved [architecture.md](architecture.md), and [AGENTS.md](../AGENTS.md).

The owner approved the architecture with "approved" on 2026-11-02. This breakdown follows that approval. It does not change the approved design or authorize a push, deployment, account configuration, or DNS change. The owner subsequently approved this plan with "approved" on 2026-11-02, authorizing T-01–T-12; do not request another plan/design approval.

## Status and completion rules

- **todo:** not started; dependencies must be complete before work begins.
- **in_progress:** actively being implemented.
- **done:** the outcome and its relevant verification are complete; record evidence here.
- **deferred:** awaiting external inputs or a later explicitly authorized phase; the reason is listed below.

Keep these task IDs stable. Update status and evidence in this file as work proceeds. Tests belong with the behavior they verify, rather than waiting until the end. No task is complete just because files were created. Temporary, clearly labelled development placeholders are allowed; they do not establish real club facts or launch readiness.

## Task overview

| ID | Task | Depends on | Status |
| --- | --- | --- | --- |
| T-01 | Minimal static Astro foundation | Approved plan | done |
| T-02 | Validated manual content and local references | T-01 | done |
| T-03 | Typed public ČKA HTTP boundary | T-01 | done |
| T-04 | Latest-season sports build dataset | T-03 | done |
| T-05 | Feed, dates, and next-match selection | T-02, T-04 | done |
| T-06 | Responsive layout and image components | T-01 | in_progress |
| T-07 | Homepage, news details, and archives | T-02, T-05, T-06 | done |
| T-08 | Matches and official standings pages | T-04, T-06 | done |
| T-09 | Žižkova 200 and club-information pages | T-02, T-06 | done |
| T-10 | Metadata and generated-output validation | T-07, T-08, T-09 | done |
| T-11 | Integrated local verification and corrections | T-10 | in_progress |
| T-12 | Offline CI and concise maintainer guidance | T-02–T-05, T-10 | done |
| T-13 | Pages preview/production setup and daily refresh | T-11, T-12, Q-10 account details, setup authorization | deferred |
| T-14 | Real content readiness and eventual domain launch | T-11, T-13, missing content/assets/domain details, launch authorization | deferred |

The local application and its checks can be completed without account access, final branding, old-content imports, or domain changes. T-13 and T-14 must not be reported as complete by a successful local build.

## T-01 — Minimal static Astro foundation

**Traceability:** D-01, D-04, D-07; CON-01–CON-03, CON-06; NFR-03, NFR-05, NFR-06.

Create the minimal Astro static project with TypeScript and plain CSS. Use the approved Astro baseline, npm lockfile, and a supported pinned Node 24 patch shared by local development, CI, and Pages. Add only the required type/check tooling. Centralize API base URL, club id 279, locale, timezone convention, and site-origin handling. Ignore temporary build data and generated output. Do not install an SDD CLI, runtime adapter, frontend framework, Worker, or production server tooling.

**Verification/completion:** dependency installation from the lockfile is reproducible; type checking and a minimal static build work with the selected toolchain. Record exact versions and any necessary compatibility adjustment. Do not claim API integration or Pages compatibility is demonstrated by an empty scaffold alone.

## T-02 — Validated manual content and local references

**Traceability:** D-03, D-09, D-10; FR-02, FR-07–FR-09; NFR-05, NFR-06; Q-06–Q-08.

Define news, tournament, and fixed club-page Markdown collections with the approved fields and defaults. Validate real calendar dates, stable/non-conflicting slugs, unique tournament years, optional current-edition selection, edition date ranges, image/alt references, and download paths/existence/size. Keep article publication dates non-future unless draft. Apply one reusable public-content filter so drafts cannot enter routes, feeds, or metadata. Accept empty collections and missing real content with explicit development/empty states.

**Verification/completion:** meaningful invalid-content cases fail with useful errors; optional fields work; draft isolation and duplicate/reserved identifiers are checked. Demonstrate adding a news entry and an older tournament edition without component changes using clearly identified development/test content, not invented official history/results. Real editorial content remains a T-14 input.

## T-03 — Typed public ČKA HTTP boundary

**Traceability:** D-01, D-04, D-09; CON-04; FR-03, FR-04, FR-06, FR-10; NFR-06, NFR-07; R-02, R-04.

Recheck the approved public endpoint/parameter contracts against current official documentation. Implement bounded GET requests with injected fetch/clock dependencies, small Astro-exported Zod schemas, and normalization that discards unused/private contact fields. Handle wrapped collections versus bare round arrays, stable-id pagination, missing includes, legitimate nulls, known statuses, and result sides. Use the approved timeout/retry/whole-collection bounds and safe diagnostics. Do not add authentication, scraping, a generated SDK, or player endpoints.

**Verification/completion:** offline tests cover complete/multiple pages, duplicates/no progress/changing totals, wrong field types, ignored/missing required includes, null optional values, reversed result order/duplicate sides, unknown statuses, network errors, retry limits, and non-retryable failures. Record one proportionate live read-only smoke check during integration; routine unit tests do not depend on network availability.

## T-04 — Latest-season sports build dataset

**Traceability:** D-04–D-07, D-09; FR-03–FR-06, FR-10; NFR-06, NFR-07; R-01–R-04.

Select the latest published season by the approved chronological date policy, including a newer future/empty season. Discover club teams and competitions from selected-season matches and official tables. Query the highest configured competition round's ALL table and preserve official rankings/scoring. Prepare one normalized temporary dataset per build; write atomically only after required retrieval/validation succeeds. Pages read this coherent build input without per-page HTTP calls. Integrate live preparation into the release build command and prevent old temporary files or fixture provenance from being used as a production fallback.

**Verification/completion:** tests cover season boundaries/ambiguous dates, empty latest seasons, multiple teams/derby, bare rounds, empty tables, wrong-season records, and scores preserved as supplied. A fresh live dataset covers the club's currently published teams/competitions without fixed seasonal IDs. Simulated required API failure exits the build unsuccessfully without producing a fresh publishable dataset; first-build failure is explicit. Actual preservation of an already deployed site is verified in T-13.

## T-05 — Feed, dates, and next-match selection

**Traceability:** D-02, D-05, D-09; FR-01–FR-03, FR-06, FR-10; NFR-06, NFR-09; Q-02, Q-03.

Create pure helpers merging manual news and eligible FINISHED/FORFEIT match summaries by date, using manual-first same-day ties and stable source keys. Use factual Czech templates, not generative AI. Deduplicate each official match, including a club derby, and update corrected results by the same match id. Preserve date-only values and supplied wall-clock times; use one Prague build clock for next-match/future-date checks. Omit dated generated news when date/official team points are unavailable, while retaining the match's supported missing-data state elsewhere.

**Verification/completion:** tests demonstrate newest-first chronology, equal-date stability, rebuilds not moving old items, corrections/reopened matches, valid zeros/half-points, no fabricated scores, missing/future dates, unknown times, and Prague midnight/DST display behavior. No generated Markdown or routine repository writes occur.

## T-06 — Responsive layout and image components

**Traceability:** D-01, D-03, D-08; FR-01, FR-09; NFR-01–NFR-03; R-06, R-07.

Build the common Czech layout/navigation, spacing/type tokens, accessible card/table states, and restrained sports-club presentation using Astro and ordinary CSS. Use verified branding when available; otherwise label neutral development placeholders. Add local Astro-processed responsive images and a simple gallery with captions and links to larger optimized images. Do not introduce a carousel, lightbox dependency, remote image hosting, or guessed official branding.

**Verification/completion:** inspect responsive navigation, keyboard focus, semantic structure, contained table overflow, intrinsic image sizing, responsive output, and lazy loading. Use supplied or clearly labelled development image material. Full page-level phone/PC review occurs in T-11; no markup snapshot suite is needed.

## T-07 — Homepage, news details, and archives

**Traceability:** D-02, D-03, D-08; FR-01, FR-02, FR-09; NFR-01, NFR-04.

Implement the approved homepage hierarchy, mixed feed, 10-item feed pagination, manual article details, and yearly manual article archives. Add next-match/standing support and a visible Žižkova 200 entry point. Generated match entries link to stable anchors on the matches page. Include cover images/galleries where supplied and useful empty states when no manual news exists. Keep historical manual articles independent of latest-season sports refreshes.

Owner-directed refinement, 2026-11-02: add the A-team's full official table directly to the homepage with that team highlighted, compact phone/PC columns and a complete-table link. Verify selection by club/name rather than seasonal IDs, empty/missing data and preserved official ordering/points. T-06/T-11 remain open for visual review; the shared-header logo is pending the owner's asset under T-14.

**Verification/completion:** representative content appears in the right order and routes/pagination; adding content does not require component edits. Draft pages and metadata are absent; generated entries have no fabricated article/cover requirement. Final internal-link/anchor checks run in T-10.

## T-08 — Matches and official standings pages

**Traceability:** D-02, D-04–D-06, D-08; FR-03–FR-06, FR-10; NFR-01, NFR-02, NFR-07.

Render latest-season matches grouped by competition with club-team labels, opponents, dates/times, venues, status, official results, and unique match anchors. Render ALL tables with official positions/points and identify every club team. Label source and successful dataset-update time; do not imply the highest configured round was already played. Present missing venues/times/results/tables without exposing internal errors. Do not add individual player pages or player-statistics requests.

**Verification/completion:** inspect real available club data and fixture-driven edge cases, multiple club teams and a derby, official score-column distinctions, pending/in-progress/forfeit labels, and narrow-screen table reading. Invalid required API contracts fail preparation rather than become empty lists.

## T-09 — Žižkova 200 and club-information pages

**Traceability:** D-02, D-03, D-08, D-10; FR-07–FR-09, FR-11; NFR-01, NFR-05; Q-07, Q-08.

Implement current tournament selection, edition pages, and archive. Display doubles/200 hs wording, per-edition MČR qualification when known, Markdown results tables, optional gallery, and validated downloads. Render the four club-information pages from Markdown. Unknown dates/results/history/contact details remain explicit missing/development states; no actual edition/year, facts, or tournament rankings are fabricated. No upload UI, import parser, historical migration, or member directory is built.

**Verification/completion:** demonstrate content-only addition of another edition and historical article, optional downloads/photos, qualification true/false/unknown, and pending results. On-page results and optional file downloads both work with representative supplied/test material. Real content approval remains separate in T-14.

## T-10 — Metadata and generated-output validation

**Traceability:** D-03, D-07–D-09; FR-02, FR-07, FR-09, FR-11; NFR-02, NFR-04, NFR-06, NFR-07.

Generate Czech language/title/description metadata, context-appropriate canonical origin, sitemap, preview/development noindex policy, and a static Czech 404. Complete the release build pipeline with public-route, internal-link/anchor, asset/download, draft-output, and fixture-provenance checks. Use the verified deployment origin when available, without inventing the final club domain. Keep the temporary public development site unindexed until launch approval.

**Verification/completion:** a production-style build has valid expected static routes/assets and metadata; missing references or public drafts fail checks. Context tests distinguish local development, PR preview, and pages.dev production; no localhost production canonical is emitted. Verify empty collections do not create links to nonexistent edition/archive pages. No production-ready claim is made with unresolved source content.

## T-11 — Integrated local verification and corrections

**Traceability:** D-01–D-06, D-08, D-09; FR-01–FR-10; NFR-01–NFR-09; R-01–R-08.

Run the relevant unit/content/type checks and a live production-style static build. Review representative homepage, article/gallery, match, standings, tournament, and club pages at 360, 390, 768, and 1440 pixels, plus reflow at 320 pixels/200% zoom. Check keyboard access/focus, table containment, text alternatives, JavaScript-independent core content, and loading behavior. Record diagnostic mobile/PC performance measurements and correct material issues without imposing an unapproved score target.

**Verification/completion:** record actual commands/results and browser observations, with any remaining placeholder/content limitations. Exercise API timeout/schema-error/first-build paths through injected fixtures, draft isolation, corrections, and season transitions. A fixture-assisted local UI review is labelled as such; the release smoke build requires live data. Do not repeatedly broaden tests after relevant checks pass without a new failure/change to justify it.

## T-12 — Offline CI and concise maintainer guidance

**Traceability:** D-01, D-03, D-07, D-09; FR-02, FR-07, FR-09, FR-10; NFR-05–NFR-09.

Add a minimal GitHub workflow for lockfile installation, type/content validation, and offline behavior tests on changes. It does not require live ČKA access or deployment secrets; Pages builds exercise the live release path. Document exact development/check/build commands and brief content-authoring examples, draft behavior, local image/download conventions, version pinning, failure diagnosis, and recovery in the existing project documentation or one necessary maintainer README. Avoid duplicate process documents.

**Verification/completion:** run the same offline commands locally and confirm they do not fetch live sports data. Workflow permissions are proportionate; pull-request code cannot access a deployment hook. Guidance uses real commands/tool versions and explains that an accepted hook is not proof of a successful deployment. Repository workflow creation does not authorize pushing it or changing account settings.

## T-13 — Pages setup and daily refresh

**Status reason:** deferred until Q-10 account/repository visibility/allowances are available and external setup is authorized. This does not block T-01–T-12.

**Traceability:** D-04–D-07, D-09; FR-10, FR-11; CON-05, CON-06; NFR-07, NFR-08; Q-10; R-04, R-05, R-08.

Prepare/review concrete settings first, then connect the repository to Pages when authorized: pinned Node, one lockfile install, full validated static build, dist output, PR previews, and main production builds. Confirm actual limits/account usage. Create the main-branch deploy hook and store its URL as a secret without exposing it. Add/enable the bounded scheduled/manual workflow using the approved 04:17 UTC daily schedule, without write permissions, daily commits, Workers, or API tokens. Record the repository-specific inactivity/schedule-reenable procedure and existing notification behavior.

**Verification/completion:** demonstrate a PR preview and main publication on pages.dev, correct noindex behavior, a manual and scheduled hook request, and the actual resulting Pages build status. Verify a forced failed build leaves the previous successful deployment available, and recovery publishes correctly. Confirm secret redaction, notification delivery where supported, build duration/output limits, and budget headroom. A workflow file or hook HTTP success alone is insufficient evidence. Keep final-domain changes outside this task.

## T-14 — Real content readiness and eventual domain launch

**Status reason:** deferred for verified branding, photographs/articles, club/venue/contact material, actual tournament edition/results/files, domain/DNS/email details, and explicit launch authorization. Content can be gathered earlier without fabricating missing information.

**Traceability:** D-03, D-07–D-10; FR-07–FR-09, FR-11; CON-07; NFR-01–NFR-04, NFR-08; Q-06–Q-10; R-06, R-07.

Replace development placeholders with approved real content and verify representative assets/results. Prepare a concrete final-domain cutover and revert plan, inventory relevant legacy URLs and DNS/email records, and propose only needed redirects. After launch authorization, perform the approved cutover, verify HTTPS/canonical/indexing/sitemap consistency and email-record preservation, and confirm no placeholder/private draft content is public. No old-content migration or import tooling is required; additional historical content can be added later through normal authoring.

Logo input clarified on 2026-11-02: the owner will provide the asset. Integrate it in the shared header on every page, including mobile and 404, with preserved proportions, dimensions and an accessible homepage link. The owner supplied the logo later on 2026-11-02; its integration and verification are recorded below. The owner subsequently authorized the neutral base with red A-team and blue other-team accents; exact screen shades remain implementation choices rather than official brand codes.

**Verification/completion:** real content/assets are approved and all relevant local/deployed checks pass; domain/redirect/email configuration matches the reviewed plan. Record any deliberately deferred old data. Distinguish a ready pages.dev preview from a launched final-domain website.

## Current handoff

The functional implementation is complete with the evidence below and was accepted by the owner. T-06/T-11 have been reopened for the owner’s requested visual revision; the revised appearance is locally verified and awaits owner review. T-13/T-14 remain deferred: account setup, daily refresh activation, actual preview/production publication, real content and eventual domain launch need their listed inputs and authorization. No new commit, push, deployment, account or DNS change was performed. The local preview serves the successful live build on port 4321; it is not a public deployment.

Plan approval/implementation authorization: explicitly approved by the owner with "approved", 2026-11-02. Architecture approval is recorded in [architecture.md](architecture.md); it does not need to be requested again.

## Local verification record — 2026-11-02

| Tasks | Outcome and actual evidence |
| --- | --- |
| T-01 | Astro 7.4.4, Node 24.22.2, bundled npm 11.19.1, TypeScript 6.0.3, @astrojs/check 0.9.12, @types/node 24.19.2. Clean npm ci installed the lockfile successfully; npm run build passed. TypeScript 6 satisfies the check tool's peer range; current TypeScript 7 does not. Node type definitions are the only additional development dependency, required for typed scripts/tests and Node built-ins. |
| T-02, T-07, T-09 | node scripts/content-smoke.ts --keep (the script behind npm run test:editorial, retained temporarily for browser review) generated 12 clearly labelled synthetic articles, a future draft with its own distinct image, three illustrative old editions, gallery and CSV download. The 29-page offline build passed output checks, yearly pagination, current-edition override, MČR true/false/unknown and pending-results assertions. Draft route/text/image were absent. Temporary source content/downloads were removed afterward; two synthetic PNG test fixtures remain outside website content. Final live content is zero articles/editions and four honest pending-information club pages. |
| T-03–T-05 | 15 Node tests passed, covering many cases per test: missing/invalid required fields/includes, nullable data, reversed/duplicate result sides, pagination races/restart, bounded HTTP retries/timeouts, non-retryable errors, first-build/old-input failure, future/ambiguous/empty seasons, multiple teams/derby, official table preservation, stable mixed-feed chronology/corrections/reopened matches, missing/future dates/scores and Prague midnight/DST. Routine tests inject responses and clocks; they do not call ČKA. |
| T-03, T-04, T-08 | Re-fetched the official public OpenAPI specification and used the actual live integration. Latest season 2026/2027: 74 club matches, five dynamically discovered teams A–E, three competitions; official table rows 12/12/7. No seasonal IDs are configured. Fresh live preparation/build succeeded, with the API boundary discarding private/unneeded fields. Highest configured rounds and official ranks/points were preserved. |
| T-06, T-08, T-11 | Browser review of homepage, synthetic article/gallery, matches, official standings, synthetic tournament and club pages at 320/360/390/768/1440 CSS pixels: no page-wide horizontal overflow; images had responsive sources, dimensions and alt text; below-fold gallery loading was lazy. Narrow standings scrolled inside focusable labelled table regions. Skip link received visible 3px focus and Enter moved focus to main. Core static pages contain zero script elements. Desktop/phone presentation was also visually inspected using local Chromium captures. |
| T-10 | Fresh live output passed checks for 12 HTML pages / 17 files, required routes, internal links/anchors, responsive assets/downloads, Czech metadata, context-correct canonical origins, noindex, sitemap and draft/fixture exclusion. Context tests cover local/no-origin, PR preview and stable main Pages origin. 404 intentionally has no canonical. An initial draft-image leak through Astro's asset store was caught and fixed at the loader boundary; public-page filtering alone was insufficient. |
| T-11 | 200% text enlargement checks on live homepage, matches, tables, tournament and club layouts. Corrected small-screen footer/team-name overflow and rechecked all 74 live matches at 320/360/390 pixels after enlargement: no page overflow. These are practical browser geometry/keyboard checks, not a certified accessibility audit or a full physical-device matrix. |
| T-11 | Local unthrottled browser Navigation Timing diagnostics: homepage DOM-ready roughly 13–29 ms and load 15–32 ms across sampled widths; no browser scripts. Live output about 109 kB total; homepage about 9.9 kB HTML (2.5 kB gzip), matches about 42.1 kB (4.3 kB gzip), standings about 10.3 kB (2.4 kB gzip). These local measurements are not Internet/phone performance guarantees. Lighthouse is not installed; no Lighthouse score is claimed. Representative real photographs and Linux Pages builds remain deployment/content-phase checks. |
| T-12 | Offline GitHub workflow uses read-only contents permission, Node version file, lockfile install and npm run verify. Official checkout/setup-node v6 manifests use Node 24. Same verify commands passed locally: Astro check reported 0 errors/warnings/hints; all content/references and 15 tests passed. README documents actual commands, authoring, drafts, fixtures, failures, version pins and deferred deployment/refresh recovery. Remote Actions execution remains unverified because nothing was pushed. |

Known non-blocking diagnostics: Astro logs warnings for intentionally empty news/tournament collections until real published content is added. The npm install reports an optional macOS fsevents install-script review notice; installation and all relevant checks succeeded without changing global npm settings. Public Pages outage retention, notifications, quotas, schedules and previews are not claimed verified locally. API wall-time semantics and teams without published matches in an undiscovered competition retain their documented limitations.

## Visual review — 2026-11-02

Current direction: the owner's latest feedback rejects the overall black-heavy appearance. T-06/T-11 now cover a light revision: white shared header/footer, pale page/tournament surfaces, softer headings and light outlines, retaining red/blue team accents and the accepted functionality. This supersedes the dark surfaces described in earlier records below. Logo input is now supplied; final visual acceptance and other launch inputs remain pending.

The owner rejected the initial visual design ("design is tragic, but everythink else is OK") and accepted the remaining functionality. T-06/T-11 visual presentation is reopened; previous functional verification remains valid. Pending a reference/preference response, the working revision removes the oversized slogan/illustration and uses a compact news-first layout with neutral grayscale styling, clearer typography and match/club supporting panels. This is a proposed visual direction, not owner approval of its appearance. No sports/content behavior or infrastructure change is intended.

Visual revision delivered for review: removed the large slogan, decorative pin/ball illustration and placeholder monogram; replaced olive styling with neutral grayscale, a compact homepage heading, denser news rows, a simpler wordmark/header, clearer match/standings panels and a smaller tournament promotion. Shared styles apply across the existing pages. This does not change ČKA integration, schemas, chronology, routes, drafts, downloads, dependencies or infrastructure.

Revision checks: npm run build passed (Astro 0 errors/warnings/hints, 15/15 tests, fresh live data and checked 12-page static output). Reviewed live homepage/matches/tables/tournament/club at 320/360/390/768/1440 pixels and 200% text enlargement with no page-wide overflow; visually inspected desktop 1440 and phone 390 captures. The first news row begins around 381px on desktop and 463px at 390px width, with no large decorative hero preceding it. Preview responds HTTP 200 on port 4321. The optional direction question timed out without an answer; compact news-first is explicitly a working assumption, not an approved aesthetic choice. No new commit/push/deployment was performed.

Homepage/branding refinement, 2026-11-02 (T-06/T-07/T-11/T-14; FR-01/FR-04/FR-09; D-02/D-08): the owner requested the A-team league table on the homepage with that team selected/highlighted, and a forthcoming logo visible on every page. Updated the specification/design before implementation. The homepage now shows all official A-team competition rows with rank, team, matches played and points, a labelled/weighted selected row and a detailed-table anchor. Current-club/name membership selects the competition without fixed seasonal IDs, with explicit missing/empty states. Other teams and mixed-feed chronology remain available. The shared-header logo is pending its supplied asset; confirmed team colors are recorded without treating the suggested whole-site palette as approved.

Refinement verification: npm run build passed with the pinned Node version, Astro 0 errors/warnings/hints, 16/16 tests, fresh live preparation and valid 12-page/17-file static output. The additional behavior test covers club/name selection, away-match membership, empty/missing tables, foreign-club name collisions and preservation of official rows/points. Browser checks at 320/360/390/768/1440 CSS pixels and 200% text enlargement found no page-wide overflow. The live homepage shows 12 table rows and exactly one selected A-team row; all displayed ranks, names, played-match counts and points match the complete standings page. Its detail anchor exists, the table region is keyboard-focusable, and the homepage still has zero scripts. git diff --check passed. Appearance review and the logo asset remain pending; no commit/push/deployment was performed.

Color direction authorized and implemented, 2026-11-02 (T-06/T-07/T-08/T-11; FR-01/FR-03/FR-04/FR-09; D-02/D-08): the owner requested "Let's do the colors whing", accepting the proposed white/charcoal base with red A-team and blue other-team accents. The shared CSS uses readable screen shades #b42332 and #2059a8 with pale red/blue backgrounds; these are implementation choices rather than official brand codes. Applied accents to generated-result cards/tags, match cards and club-team names, the homepage A-team panel/selected row, the team-position summary and full official table rows. General club news stays neutral. A shared helper checks club identity and published names without seasonal IDs; mixed A/other-team matches retain both accents. Updated the temporary banner to reflect the pending logo. No dependencies, browser scripts, scoring or feed-order changes were introduced.

Color verification: final npm run build passed with Astro 0 errors/warnings/hints, 17/17 tests, fresh live data and valid 12-page/17-file output. The added behavior test covers A/other-team colors, changed IDs, future teams, same-name foreign clubs, away matches and both derby directions, including a single generated feed entry retaining both team identities. Browser review of homepage, news, matches and standings at 320/360/390/768/1440 CSS pixels with normal and 200% text found no page-wide overflow. Computed colored-text contrast was 5.88:1–6.87:1 on the rendered backgrounds; opponent names remained neutral, the homepage A-team selection was red, and core pages retained zero scripts. Visually inspected 1440px desktop and 390px phone captures. git diff --check passed. The local preview serves this live build on port 4321; final appearance review and the logo asset remain pending. No commit, push, deployment or infrastructure change was performed.

Light presentation revision, 2026-11-02 (T-06/T-11; FR-01/FR-09; NFR-01–NFR-03; D-08): following the owner's explicit rejection of the black-heavy design, changed shared styles to a white header/footer, a pale cool page background, blue-gray text/headings and a pale blue tournament panel. Removed the heavy black feed rule, softened corners/heading weights and changed dark buttons to blue or light outlines. Red/blue team accents and A-team selection remain intact. Updated requirements/design/guidance to reflect the correction before editing styles; this does not imply final appearance approval.

Light revision checks: npm run build passed with the pinned toolchain, Astro 0 errors/warnings/hints, 17/17 existing tests and fresh live data; output validation passed for 12 HTML pages / 18 files. Browser checks covered homepage, news, matches, standings, tournament and club at 320/360/390/768/1440 CSS pixels with normal and 200% text enlargement, without page-wide overflow. Verified white header/footer, light tournament surface and retained red A-team highlight. Sampled heading, navigation, link and supporting-text contrast was at least 4.53:1 on rendered backgrounds. Visually inspected 1440px desktop and 390px phone captures. Core pages still have zero scripts; git diff --check passed. Preview serves the revised live build on port 4321. No application behavior, dependencies, commit, deployment or infrastructure changes were introduced. Logo and final visual review remain pending.

Supplied logo integration, 2026-11-02 (T-06/T-11, logo input of T-14; FR-09; D-08): the owner supplied public/downloads/kkLokomotivaTabor.jpg. Relocated the unchanged 900×900 JPEG to src/assets/club-logo.jpg and imported it through Astro Image in the shared header. Five WebP widths (64/80/128/160/240px, about 1.9–11kB each) support 64px mobile / 80px desktop display with intrinsic dimensions, eager loading, meaningful alternative text and an accessible home link. Original black/white artwork is retained. Header wrapping accommodates enlarged text; removed the obsolete pending-logo banner message. README identifies the source for future updates. This resolves the logo input, while other T-14 inputs and final visual acceptance remain pending.

Logo verification: npm run build passed with Astro 0 errors/warnings/hints, 17/17 existing tests, fresh live data and checked 12-page/22-file output. On all 12 generated HTML routes, including pagination and 404, browser checks confirmed the logo loads, has five responsive variants, correct alternative text/dimensions and a home link, and the old banner message is absent. At 320/360/390/768/1440px with normal and 200% text, no page overflow or logo distortion was found. Visually inspected 1440px desktop and 390px phone captures. Core pages retain zero scripts; git diff --check passed. The local preview serves this successful live build. No new dependencies, commit, push, deployment or infrastructure changes were introduced.

Owner-authorized feed refinement, 2026-11-02 (T-02/T-05–T-08/T-10/T-11; FR-01–FR-04/FR-09; D-02/D-03/D-08): implement distinct A–E accents (red/blue/green/purple/orange), actual paired derby accents, a photo/default-emblem tile for news and a numeric score tile for results. Make cover optional in both content validators and article rendering. Remove the unused club nickname from all public copy/metadata. Verify optional-cover authoring, score side/zero/fractional handling, colors/derbies, drafts, generated references and mobile/PC presentation. Specifications/design were updated before implementation; no new approval is required for this explicit request.

Delivered: A red, B blue, C green, D purple and E orange across feed entries, score/team badges, match cards and standings. A shared mapping uses confirmed club identity/published suffixes; derby stripes and score values use the actual two colors. Every feed row has a visual tile: supplied photo or optimized club-emblem default for articles, validated home/away points for results. Cover frontmatter is optional, but supplied image references/alts remain validated; article details omit a missing cover figure. Replaced the unused nickname with the confirmed club name or neutral wording in header/footer, headings, copy, accessible names and page/social metadata. Internal repository/environment identifiers remain unchanged. Updated authoring guidance; no CMS, dependencies or browser scripts added.

Verification: final npm run build passed with Astro 0 errors/warnings/hints, 18/18 Node tests, fresh live ČKA data and valid 12-page/22-file output. Tests cover all five distinct accents, foreign/unknown names, changed IDs, actual C/E derby colors in either order, corrected home/away scores, zero/fractional points and optional/invalid covers. npm run test:editorial passed with alternating photo/default-cover articles, 29-page fixture output, article details with/without a cover, archives, galleries, downloads and draft isolation; temporary source examples were removed. The nickname output check caught its old synthetic fixture label, which was corrected before the passing run. All 12 final live HTML pages are free of the nickname, including metadata.

Browser checks: live homepage/news/pagination/matches/standings/tournament/club/404, and synthetic photo/default article/list/archive views at 320/360/390/768/1440px and normal/200% text showed no page-wide overflow. All 10 homepage entries have score tiles; the C/E derby uses green/orange and C/D uses green/purple. New accent/score/label text contrast sampled at 4.51:1 or higher on rendered backgrounds. Visually inspected desktop live/editorial and phone captures. Core pages retain zero scripts; git diff --check passed. The temporary editorial server was stopped, and the normal preview serves the final live build on port 4321. Final appearance review and other T-13/T-14 inputs remain pending; no commit, push, deployment or infrastructure changes were performed.

Owner-requested news example, 2026-11-02 (T-07; FR-01/FR-02): added one locally visible Czech article, “Připravujeme nový klubový web”, describing the developing website and planned content. The body explicitly identifies it as a working example. No cover is supplied, demonstrating the default club-emblem tile. This retained example replaces the previous zero-article state; it does not authorize a public launch. No application code changed.

Verification: npm run build passed with 0 Astro errors/warnings/hints, 18/18 tests, fresh live sports data and checked 14-page/24-file output, including the article and yearly archive. Browser checks confirmed the article appears first on the homepage, the default emblem loads, and its detail renders the expected title, text and metadata without a cover figure or horizontal overflow at the current desktop viewport. The local preview serves the rebuilt site; no commit, push or deployment was performed.

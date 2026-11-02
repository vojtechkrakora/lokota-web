# Lokota Web — initial requirements

Status: **requirements baseline approved on 2026-11-01; clarifications and owner-requested presentation refinements incorporated; technical design/task plan approved on 2026-11-02; functionality accepted; final visual acceptance pending; implementation committed/pushed; T-13 Pages handoff in progress; T-14 final launch deferred**.
Baseline and investigation date: 2026-11-01.
Source of product requirements: the owner's complete Lokota Web project brief and subsequent Q-01–Q-10 answers supplied in this conversation. The clarification answers supersede the original brief where scope changes. External documentation verifies feasibility and API facts; it does not add product scope.

## 1. Purpose, scope, and workflow

Replace the existing Lokota website with a modern, professional, fast, accessible, responsive Czech-language website for a Czech nine-pin bowling club. Primary audiences are members, players, supporters, and visitors seeking club activities, match information, and results. One experienced developer, assisted by AI coding tools, should be able to maintain it with minimal operational work.

The constitution is [AGENTS.md](../AGENTS.md). This specification is the requirements baseline. Following clarification and requirements approval, the technical design in [architecture.md](architecture.md) was approved, and [tasks.md](tasks.md) now records the approved implementation breakdown. Design decisions and tasks reference the IDs below. Implementation requires approved specifications/tasks and authorization for that phase.

The initial documentation phase created only the constitution and this specification. The owner authorized continuing with technical design on 2026-11-02, then approved it; task planning followed. These documentation phases do not scaffold Astro, install tooling, implement a client or website, create deployment workflows, provision Cloudflare resources, or alter DNS. No SDD framework or CLI will be installed.

## 2. Repository investigation

- At the initial investigation, the local repository was empty: no tracked project files, application, documentation, content, branding assets, package manifest, or test configuration were found.
- At initialization, Git reported an unborn local main branch with no commits. The initial documentation was subsequently committed as 818a9e8. The configured origin is the supplied vojtechkrakora/lokota-web GitHub SSH remote; its remote main tracking reference was reported as gone. This does not verify GitHub visibility, permissions, or deployment integration.
- Subsequent release evidence, 2026-11-02: the owner authorized the implementation commit and explicitly requested a push and Cloudflare setup instructions. Commit 7f44401 was pushed to origin/main, verified against the remote main reference. The earlier missing-remote observation is historical. This proves the push, not successful GitHub checks, repository visibility, or a Pages deployment; see T-13 in [tasks.md](tasks.md).
- No repository Spec Kit/SDD files or existing agent instructions were found, including ancestor AGENTS.md files. Neither a specify nor spec-kit executable was detected on PATH.
- Adopt the lightweight Markdown structure above, consistent with the user's explicit instruction. The architecture is now approved, and the task breakdown is approved for local implementation.

## 3. Confirmed constraints

| ID | Constraint |
| --- | --- |
| CON-01 | Astro, TypeScript, SSG, Markdown/Astro Content Collections, GitHub, and Cloudflare Pages Free are the confirmed stack. Prefer built-in Astro image handling and simple reusable Astro components. |
| CON-02 | No database, traditional backend, initial CMS, custom admin UI, user authentication, microservices, or production Docker requirement. No frontend framework without a concrete requirement. Minimize external dependencies and browser JavaScript. |
| CON-03 | Store all manually maintained content and photographs in Git. Initial editing uses Git and AI assistants, without a publishing service. |
| CON-04 | Use official public read-only ČKA data without authenticated endpoints. Verify actual contracts and records; do not invent endpoints/fields or scrape HTML where an API exists. Centralize API/club configuration and avoid fixed competition IDs that must change each season. |
| CON-05 | Prefer build-time sports data retrieval. A schedule or Worker requires specific justification; additional infrastructure must have an explained need. No real-time infrastructure is required. |
| CON-06 | Target 0 CZK/month recurring hosting within free-tier limits, excluding existing domain registration. No regular server administration. |
| CON-07 | Preserve the existing domain and email configuration during eventual migration. Do not make DNS or production infrastructure changes in initial SDD phases. |
| CON-08 | Requirements precede design; design precedes implementation tasks; implementation follows approved specifications. Stop after this initial phase for review. |

## 4. Functional requirements and acceptance criteria

The following are confirmed baseline requirements. Acceptance criteria describe observable outcomes for later verification; they do not imply that implementation exists.

### FR-01 — Homepage and navigation

Make a news feed the primary homepage content. Combine manually authored club news with automatically generated information about completed club matches, ordered by date with the newest item first. Present club identity/branding, annual tournament information, and clear navigation. Show the A-team's current official league table directly on the homepage with the A-team row highlighted. Keep next-match and other teams' standings accessible as supporting content; the feed continues to cover all club teams.

Acceptance: manual articles and generated match summaries appear together in descending date order. A rebuild alone does not move an old match above newer news or duplicate its summary. Generated entries identify the team, opponent, competition, and available official result; their text is factual and derived from verified data without requiring a generative-AI service. Use article publication dates and match dates as the editorial chronology; exact time/tie handling belongs in design. Corrected results update the same match entry. A visitor can reach news, matches/results, standings, tournament information, and club information through Czech navigation. Missing matches or tables produce understandable empty states.

### FR-02 — News and articles

Articles support title, publication date, optional author, summary, main content, optional cover image, optional gallery, and optional draft/published status. Provide reverse chronological listing, detail pages, and an archive.

Acceptance: adding a valid article and its assets produces the listing entry, detail page, and archive entry without application code changes. Optional author/cover/gallery omissions work. With no cover, use the supplied club emblem in the feed thumbnail; a supplied cover still requires a local image and meaningful alternative text. Every feed entry has a visual tile: a photo or club emblem for news, official home/away points for results. Preserve zero and fractional points and identify teams without relying on color alone. Under the editorial defaults chosen using the owner's Q-06 delegation, articles are published unless explicitly marked as drafts; drafts are excluded from production listings, detail routes, and public metadata. A special draft-preview mode is deferred. Publishing is still controlled by committing and deploying content; no CMS or upload interface is needed.

### FR-03 — Matches, results, and teams

Automatically display upcoming matches and recent official results for KK Lokomotiva Tábor, supporting multiple club teams and their competitions. Show who plays, when and where, the result when available, and relevant competition information. Default scope is the club's teams discovered in the latest season; a manually selected subset is not required.

Acceptance: data for the confirmed club includes both home and away matches and clearly distinguishes teams/competitions. Available dates, times, venue information, status, and official results are shown accurately. Unscheduled dates, unavailable venues, incomplete results, and no upcoming matches do not create fabricated values or broken layouts. Results distinguish completed matches from scheduled or in-progress matches.

Owner-requested addition, 2026-11-02: show the home and away club emblems beside the teams on the matches page, using logo references supplied by the public ČKA API. The verified public contract provides club logos, not separate team logos; teams of the same club share its emblem. Download available opponent emblems during the static build, without visitor requests to the API/image host or a new service. Use the owner-supplied emblem for KK Lokomotiva Tábor. Keep readable team names and a neutral placeholder when a logo is absent, invalid or unavailable; an optional logo failure must not block otherwise valid match data. Do not invent official artwork. Reliability correction after the deployed failure, 2026-11-02: if build-time downloading fails, reuse a repository-stored validated copy only when its club identity and API source URL match the current data. Use a neutral placeholder if no matching valid copy exists. Refreshing these small derived assets is an explicit maintenance action; ordinary builds do not modify tracked sources.

### FR-04 — League standings

Display the official standings relevant to club teams; do not recalculate them when provided by ČKA. Make the tables usable on mobile.

Homepage acceptance (owner clarification, 2026-11-02): show all rows of the A-team's latest-season league table in a compact form, including official rank, team, matches played and points. Highlight the A-team row with text/weight as well as background, and link to the complete standings. Resolve the team through the confirmed club identity and its published name, without a fixed seasonal team/competition ID. Missing A-team or table data produces an honest empty state without substituting another team or an older season.

Acceptance: displayed ranks and points match the selected official competition, season, round, and table type. Club teams are identifiable, column meaning remains clear on small screens, and absent standings have a clear empty state. Define selection of the current usable round before implementation (Q-03).

### FR-05 — Individual player features deferred

The owner does not want player details for now. Defer individual player pages, biographies/member directory, and a player-statistics section from the initial release. The existence of public player endpoints does not bring those features into scope.

Acceptance: initial-release navigation and page generation do not introduce individual player features or require player-detail/statistics API requests. Team-level matches, results, and standings still satisfy FR-03 and FR-04. Any future player feature requires a specification change.

### FR-06 — Seasons and association of records

Associate the website with KK Lokomotiva Tábor (verified API club id 279), its teams, and competitions using actual API data. Always use the latest season as the public default. Support automatic season transition where practical and avoid editing scattered annual competition identifiers.

Acceptance: configuration identifies the owner-confirmed club centrally. With representative old/new-season data, the documented selection policy resolves the latest season and its competitions without component edits or fixed seasonal IDs. No-active-season, overlapping/ambiguous seasons, and the latest season having no matches have defined behavior. Do not silently substitute an older season for the latest season; retained outage data must remain identifiable as older data. A calendar year or numeric ID alone must not determine the sporting season. Technical ordering and timezone semantics remain design investigations under Q-03.

### FR-07 — Annual tournament

The annual tournament is **Žižkova 200**, a doubles tournament played as **200 hodů sdružených (200 hs)**. An edition may or may not be a qualifier for MČR; record this per edition and never imply qualification universally. Each edition supports year, name, date/date range, description, optional announcements, results displayed on the website, optional photos, and optional downloadable files. Provide an archive and make the current edition easy to find.

Acceptance: adding a valid structured edition and assets creates its presentation and archive entry without changing components. Older editions remain accessible. Visitors can read results directly on the page and download an attached file when supplied; a download alone does not satisfy the on-page results requirement. Files are added to Git and referenced from edition content; the owner's wording about uploading files does not require a browser upload interface. A simple Markdown results table is the initial authoring default, with a small structured table format only if representative results justify it during design. No complex importer, parsing of PDF results, invented ranking/tie rules, or qualification logic is required. Edition dates and actual result samples remain content inputs.

### FR-08 — Club information

Support about the club, history, contact details, playing venue, and optional team information. Individual member/player features are deferred under FR-05.

Acceptance: supplied verified information is available through Czech navigation; the venue is understandable to visitors. Missing source material is flagged for the maintainer and uses clearly temporary neutral placeholders during development. Do not invent historical facts, official branding, or contacts. No historical-content migration is needed for the initial release. Future old articles, tournament editions, and assets can be added through normal content authoring without rebuilding the content system or adding migration tooling now.

### FR-09 — Content and photographs

Keep manual content structured, human-readable, validated, and versioned in Git. Prefer Markdown/frontmatter and Astro Content Collections. Support cover images and simple galleries for approximately 20 photographs per year; store photographs locally in the repository and optimize delivery with responsive sizes where practical.

Owner-requested addition, 2026-11-02: use the supplied club emblem as the browser-tab icon (favicon) through the shared page head, including article pages and the static 404. Generate a small local image preserving the original artwork; no external favicon service. The generated icon reference must resolve in the static output. API-sourced opponent emblems under FR-03 are derived build assets, not manually maintained photographs.

Branding clarification, 2026-11-02: the owner supplied the club logo as kkLokomotivaTabor.jpg on 2026-11-02. Display it in the shared header on every page on phones and PCs, with an accessible home link and preserved aspect ratio. Its original black/white artwork remains unchanged. The source is maintained as src/assets/club-logo.jpg for built-in Astro optimization; the temporary text wordmark may accompany the actual emblem. The owner confirmed red/black for the A team and blue/white for other teams, then authorized team accents with "Let's do the colors whing". Subsequent feedback explicitly rejected the overall use of black. Use a light overall presentation with a white header, light backgrounds and no dominant black panels or heavy black rules; retain red A-team and blue other-team accents and neutral general club news. Preserve readable team names and non-color selection cues. Mixed-team matches must represent both team colors. Exact screen shades are implementation choices for readability, not a claim of official brand color codes. Later owner instructions on 2026-11-02 supersede the shared blue accent for B–E: assign a distinct web color to every current team, with A red. Chosen presentation palette: A red, B blue, C green, D purple, E orange; these are UI distinctions, not uniform/brand claims. Derbies retain both actual team colors. Remove the nickname Lokota and its inflections from all visitor-facing copy, accessible names and metadata; use KK Lokomotiva Tábor or ordinary club wording. Keep repository identifiers unchanged. Final appearance acceptance remains pending.

Acceptance: the maintainer can add an article or tournament edition using content/assets alone. Invalid required fields and broken local image/file references are reported before publishing. Informative images have meaningful alternative text. Cover images and galleries work at mobile and desktop widths without external image hosting or processing services. Keep future AI/MCP publishing possible through clear content conventions, without implementing integration now.

### FR-10 — Automatic refresh and graceful degradation

Keep sports data current without routine manual intervention, preferably through static builds, with a target of **one automatic refresh per day**. This is a daily scheduling target, not guaranteed real-time or exactly-24-hour delivery. Evaluate a scheduled GitHub Actions/deployment approach within free-tier limits. Handle unavailable, incomplete, or invalid API data gracefully; prefer retaining the last successfully published data to breaking the public site. Do not expose internal errors to visitors.

Acceptance: later verification demonstrates a once-daily schedule and covers successful refresh, upstream timeout/error, invalid response, partial data, empty data, and recovery. An upstream failure cannot replace correct published results with invented or corrupt values. The design must distinguish preserving the current production deployment from reusing a validated snapshot in a new build, and specify first-build behavior when no prior data exists. A simple last-successful-update label is the proposed freshness indication; fallback publication policy, exact run time, and stale threshold remain technical design items rather than unanswered refresh-frequency requirements.

### FR-11 — Deployment and domain migration

Use the GitHub repository with Cloudflare Pages: pull requests can create preview deployments, merging to main triggers a Cloudflare build and production publication, and development uses a temporary pages.dev domain. Connect the existing club domain after readiness review.

Acceptance: a later authorized setup demonstrates a PR preview and a successful main-branch production build. No import of old content or creation of a legacy redirect inventory is required now. Keep later addition of historical content possible under FR-08. Before a future custom-domain cutover, inventory relevant old URLs and DNS/email records, define required redirects, preserve the domain and email records, provide HTTPS, and address minimal downtime and recovery. Existing-domain details and account access can wait until deployment planning; initial SDD performs no infrastructure changes.

Owner-directed staging clarification, 2026-11-02: begin with the temporary provider-assigned pages.dev address; attach the club's own domain later. The owner requested the push and dashboard instructions, and supplied a screenshot while navigating setup. This starts the T-13 handoff, not proof of publication or approval of final appearance, search indexing, DNS/email changes, or final-domain launch. Keep the working-version/noindex policy until the separate launch decision. Daily refresh remains a requirement with incomplete operational verification, not a delivered feature.

## 5. Non-functional requirements and acceptance criteria

| ID | Confirmed requirement | Acceptance evidence for later phases |
| --- | --- | --- |
| NFR-01 | Czech-language, mobile-first, fully responsive sports-club design with clear navigation, strong typography, and consistent spacing. The owner explicitly requires usability on phones and PCs. | Review representative homepage, article/gallery, match, table, and tournament views at phone and desktop widths, including narrow phones; no unintended page overflow, unusable controls, or unreadable tables. Confirm actual branding when supplied. |
| NFR-02 | Good accessibility, including meaningful image alternative text. | Verify semantic headings/landmarks, keyboard navigation, visible focus, readable contrast, labelled controls and table headers, and text alternatives on phone and PC layouts. Formal certification is not requested; WCAG 2.2 AA remains a proposed engineering reference, not a confirmed certification requirement. |
| NFR-03 | Excellent loading performance and minimal client JavaScript. | Verify production output is statically generated, images are optimized, and core news/sports content and navigation work without browser JavaScript. Record representative phone/PC measurements. No numerical score, budget, or named device was specified; choose proportionate checks in design. |
| NFR-04 | Appropriate SEO metadata. | Verify Czech document language and meaningful page titles/descriptions for public pages. Canonical-domain and indexing/preview policy must be defined in design before launch. |
| NFR-05 | Maintainability by one experienced developer; no unnecessary services, dependencies, or abstractions. | Explain each selected dependency/service and operational responsibility in the later design; demonstrate content-only publishing and documented development/verification steps. |
| NFR-06 | Strong typing and validated content/external data boundaries. | Type checks and content validation pass; meaningful malformed/partial API cases and missing asset references are checked. Page components consume validated data through a separate integration boundary. |
| NFR-07 | Reliable public delivery and useful maintainer diagnostics. | Exercise failed deployments/API refreshes and recovery without exposing stack traces to visitors or damaging the last good publication. Address API schema changes and dependency updates with lightweight checks. |
| NFR-08 | Zero recurring hosting cost within free-tier limits, excluding the domain. | Estimate monthly builds including scheduled runs, previews, commits, and retries, plus workflow usage, image output count, and attachment sizes. Confirm account/repository allowances before enabling automation. |
| NFR-09 | Meaningful testing without overengineering. | Prioritize external-data transformations, date/time/season logic, content validation, and important behavior; avoid tests duplicating static markup. Use a production build and proportionate manual accessibility/responsive checks. |

Technical design inputs: verify Europe/Prague semantics against the API and choose practical accessibility/performance checks for phones and PCs. WCAG 2.2 AA and numerical budgets have not been explicitly approved. The owner's Q-09 answer establishes device usability, not a certification or score target.

## 6. Verified external investigation

### ČKA public API

Sources: [Partner API introduction](https://kuzelky.cz/api/docs/), [Swagger UI](https://kuzelky.cz/api/docs/swagger), and the [public OpenAPI specification](https://kuzelky.cz/api/v1/public/openapi?variant=public). The introduction primarily describes authenticated scoring integrations; the public schema explicitly describes unauthenticated read-only access. Use the public variant for this website.

Direct read-only HTTP requests inspected all three sources successfully after initial HTTP 403 responses. The inspected schema identifies itself as OpenAPI 3.0.3, ČKA Public API version 1.0.0, with base URL https://kuzelky.cz/api/v1/public and no security requirement. Temporary 403s are an observed access risk, not evidence that authentication is needed.

Endpoint paths below are relative to that base. They are verified investigation evidence, not the approved integration design.

| Public GET endpoint | Verified parameters / response facts | Verification level |
| --- | --- | --- |
| /clubs | name supports partial matching; limit/offset pagination. Response has items, total, limit, offset. | Schema and live club searches. |
| /clubs/{id} | include=venues returns the relation; club fields include id, name, nullable slug, web, and logo. | Schema and candidate detail request. |
| /seasons | active, yearFrom, yearTo; response has items and total. Seasons have id, name, active and q1/q3 start/end dates. | Schema and active=true live request. active=1 returned HTTP 400 despite the parameter description mentioning 1/0. |
| /matches | clubId, teamId, seasonId, competitionId, dateFrom/dateTo, status/statuses, limit/offset; include explicitly expands relations. | Schema and live candidate-club requests with homeTeam.club, awayTeam.club, competition, venue, and results. |
| /competitions | seasonId and competition filters; include=season adds season metadata. | Schema inspected; list endpoint not live-tested. |
| /competitions/{slug}/rounds | Competition slug; live response is an array of round numbers. | Schema and live candidate-competition request. |
| /competitions/{slug}/rounds/{round}/table | type filter; include=team. Rows include type, position, matches, tablePoints, and scoring totals. Response has items and total. | Schema and live candidate round-2 table. Unfiltered rows include ALL, HOME, and AWAY types. |
| /teams/{id} | Team detail includes competitionMemberships, whose object shape is unspecified in the public schema; include=club is available. | Schema inspected; match-expanded teams had empty memberships. |
| /teams/{id}/player-stats | competitionId and type; include=player. Response has items and total; statistics include matches and averagePerformance. | Schema and live candidate-team statistics. |

Important contract findings:

- Paginated collections use limit (maximum 100) and offset, but several list endpoints use only items/total, and rounds are a bare array. Do not assume one universal response shape.
- Relations are omitted by default. The public schema has team detail routes but no GET /teams collection route; discover associations only through verified contracts/data.
- Match records use separate nullable date (date format) and time fields. This differs from the generic introduction's datetime convention. Timezone semantics require confirmation before combining them.
- Match status values in the inspected schema are SCHEDULED, PREPARATION, IN_PROGRESS, FINISHED, and FORFEIT. Do not infer completion solely from a date or invent postponed/cancelled enum values.
- Results include isHome, nullable teamPoints, totalPerformance, and totalSetPoints; live results were not always in home-first order. Associate by isHome, not array position, and preserve different scoring measures.
- ETag/If-None-Match support is documented; club search returned an ETag. Conditional requests, caching, rate limits, and retries still need design validation.

### Club identity: owner-confirmed

[Exact-brand search](https://kuzelky.cz/api/v1/public/clubs?name=Lokota&limit=100) returned total=0. A [Lokomotiva search](https://kuzelky.cz/api/v1/public/clubs?name=Lokomotiva&limit=100) returned ten clubs, including **KK Lokomotiva Tábor**, id 279, slug kk-lokomotiva-tabor. The owner subsequently confirmed in Q-01 that this is Lokota. Club 279 is therefore the confirmed identity for centralized configuration in a later implementation. Its [public detail](https://kuzelky.cz/api/v1/public/clubs/279?include=venues) reports web=https://ikuzelky.cz and an empty venues list. That URL does not establish the existing Lokota domain. The record includes a logo URL, but its suitability as official website branding has not been confirmed and no asset was imported.

The [active-season request](https://kuzelky.cz/api/v1/public/seasons?active=true) returned season id 20, name 2026/2027, active=true. Its q3 period is 2026-09-01 through 2027-02-28 and q1 period is 2027-03-01 through 2027-06-30. These are observations, not permanent configuration values.

During the initial investigation, a [season-20 match request](https://kuzelky.cz/api/v1/public/matches?clubId=279&seasonId=20&limit=100&include=homeTeam.club,awayTeam.club,competition) returned all 74 reported matches. Matching expanded team.club.id=279 identified these associations:

| Observed club team | Observed team ID | Observed competition and ID |
| --- | --- | --- |
| KK Lokomotiva Tábor A | 53 | 2. KLM A — 16 |
| KK Lokomotiva Tábor B | 579 | Krajský přebor JČK 2 — 63 |
| KK Lokomotiva Tábor C | 640 | OP Tábor — 68 |
| KK Lokomotiva Tábor D | 641 | OP Tábor — 68 |
| KK Lokomotiva Tábor E | 642 | OP Tábor — 68 |

These records prove actual public associations for the owner-confirmed club, but not an exhaustive roster of teams without matches. Club 279 may anchor configuration; team/competition IDs remain dated evidence and must not become fixed season-specific configuration. No Kuzelkátor source or configuration was available in this repository. Player-statistics endpoints above remain investigation evidence only; the owner deferred individual player features under Q-05.

### Hosting feasibility and constraints

Astro can [generate static files for deployment](https://docs.astro.build/en/guides/deploy/), and Cloudflare documents [Astro builds on Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/) plus [Git integration and PR previews](https://developers.cloudflare.com/pages/configuration/git-integration/). Static delivery is compatible with the confirmed stack; runtime rendering is not required by the brief. The choice of Astro/Node versions and image build compatibility remains for design.

The [current Astro Cloudflare guide](https://docs.astro.build/en/guides/deploy/cloudflare/) notes Cloudflare's recommendation of Workers for new projects. This does not override the confirmed Pages requirement; record any concrete compatibility issue before proposing a platform change. No runtime adapter, Functions, Worker, or Wrangler requirement follows from serving static build output.

[Pages Free limits](https://developers.cloudflare.com/pages/platform/limits/) at the investigation date include 500 builds/month, one concurrent build, a 20-minute build timeout, 20,000 files/site, and 25 MiB per asset. The owner's once-daily refresh target represents up to 31 scheduled builds in a 31-day month before previews, commits, and retries. Recheck account allowances before enabling automation; no schedule is configured by this specification.

[Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/) can trigger branch builds via HTTP POST and must be protected as secrets. A scheduled GitHub Action invoking a hook is a candidate to assess in design, not a configured workflow. A hook alone does not persist a last-good sports snapshot or prove that an unchanged-data build can be skipped.

[GitHub schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) warns that runs may be delayed/dropped and public-repository schedules can be disabled after 60 days without activity. A claim of maintenance-free continuous refresh would be premature. Repository visibility and Actions allowances are unverified. No inherent conflict between static hosting and the brief was found, but freshness, failure recovery, and free-tier limits must be reconciled in the design.

## 7. Assumptions and delegated defaults

- **A-01:** club identity is resolved as KK Lokomotiva Tábor. Include its latest-season teams discovered through the API by default. The owner-supplied logo and requested UI colors are resolved under FR-09. Publication-ready contacts, venue information, history, any remaining branding material, and the eventual custom domain still need verified sources; these content/launch inputs do not block drafting the design.
- **A-02:** resolved by the owner: static data refreshed once daily is the target. No live scoring or guaranteed minute-level update is requested.
- **A-03:** Europe/Prague is a likely display timezone, but the API's separate match-time semantics must still be verified during design.
- **A-04:** resolved in scope: Žižkova 200 results must be readable on-page, with optional downloadable files. A plain Markdown results table and repository attachments are the simplest initial authoring defaults; actual result structure and tie rules must not be invented.
- **A-05:** approximately 20 photos/year is the expected volume; original file sizes, attachment sizes, and archive growth remain unknown.
- **A-06:** editorial defaults selected under the owner's Q-06 instruction to use best judgment: publish articles unless explicitly marked draft; exclude drafts from all public production output; defer special draft previews; use neutral development placeholders until verified assets arrive. These are delegated defaults, not claims that assets were supplied.
- **A-07:** generated match summaries use stable match identity and match dates rather than rebuild dates; render factual official data through simple templates. No external AI generation service is needed. The approved D-02 design orders equal dates manual-first, then by stable source key.

## 8. Clarification answers and remaining questions

The owner supplied Q-01–Q-10 answers after reviewing the initial baseline. The main product direction is now clear enough for technical design. Remaining API behavior should be investigated by the developer; unavailable content and account inputs may be deferred until their relevant phase. Do not treat them as supplied, and do not repeat resolved questions.

| ID | Owner answer / resulting scope | Status and remaining work |
| --- | --- | --- |
| Q-01 | Yes: Lokota is KK Lokomotiva Tábor, matching inspected club 279. | Identity resolved. Custom domain, official assets, and venue/contact source material remain later content/launch inputs. |
| Q-02 | Homepage is news: manually authored news and automatically generated last-match information together, newest by date first. | Resolved in D-02: discovered club teams, deterministic date/key ordering, deduplication, and 10-item pagination. |
| Q-03 | Always use the latest season. | D-05 defines chronological season selection, including future/empty seasons, and the highest configured round's official ALL table. Prague wall-time display remains a documented convention pending stronger API timezone evidence. |
| Q-04 | Ideally refresh once per day. | D-06/D-07 define the daily schedule, timestamp label, first-build failure, and preservation of the previous deployment on required API failure. Actual account quotas remain Q-10. |
| Q-05 | Player details are not wanted for now. | Defer individual player pages, member biographies/directory, and the player-statistics section from the initial release. Public player endpoints are not needed for initial team summaries. |
| Q-06 | The owner delegated the unclear editorial choices: use best judgment. | Defaults recorded in A-06. No further editorial-preference question blocks design. Real branding, articles, and other source content are still to be supplied or verified. |
| Q-07 | Žižkova 200: doubles, 200 hs sdružených; may or may not qualify for MČR. Results on-page with optional downloadable files. | D-03 selects Markdown results, optional repository downloads, and an explicit current marker with greatest-published-year fallback. Actual edition/year/dates, results/columns, qualification statement, and files remain content inputs. |
| Q-08 | No migration now; allow old data to be added later when needed. | Initial migration scope resolved. Support ordinary historical-content additions; defer import tools, redirect inventory, and DNS/email details until relevant. |
| Q-09 | Must work well on phones and PCs. | D-08/D-09 define representative viewports, reflow/zoom, keyboard/accessibility checks, and diagnostic performance measurements. No certification or numerical score target is claimed. |
| Q-10 | The owner cannot answer account/allowance questions now. | Explicitly deferred until deployment planning. Design can use documented limits provisionally; verify actual account access, repository visibility, and allowances before configuration or enabling automation. |

## 9. Technical risks and required design evidence

| ID | Risk | Required evidence or mitigation to evaluate | Traceability |
| --- | --- | --- | --- |
| R-01 | Omitted teams due to absent team collection, empty memberships, or teams with no matches; stale association data. | Identity is confirmed as club 279. Demonstrate latest-season team/competition discovery coverage and explicitly document gaps. | FR-03, FR-06, Q-01, Q-02 |
| R-02 | Schema/live differences, omitted relations, pagination gaps, nullable fields, or changed API contracts. | Validate external boundaries and relevant live samples; test transformations, pagination, and partial data without requiring live API calls in every test. | CON-04, NFR-06, FR-03–FR-06 |
| R-03 | Season/round/date errors, missing schedule data, wrong standings type, or scores associated by array order. | Verify season transitions/time semantics and usable official round/type; test result association by isHome and preserve official scoring. | FR-03, FR-04, FR-06, Q-03 |
| R-04 | API outage, transient 403, rate limit, or poisoned/incomplete data replaces valid published information. | Define bounded requests, validation, publication behavior, first-build policy, and recovery; compare retaining deployment with reusable validated snapshot options. Rate limits/access stability remain unverified. | FR-10, NFR-07, Q-04 |
| R-05 | Refresh automation exceeds actual account quotas, silently stops, or conflicts with minimal maintenance. | Budget a once-daily target plus other builds/workflow usage; address missed/disabled schedules and maintainer diagnostics using existing provider facilities where sufficient. Account allowances are deferred; no automation service is configured yet. | CON-05, CON-06, NFR-08, FR-10 |
| R-06 | Invalid content, missing images, large files, or repository/image-output growth. | Content/reference checks; responsive image generation; confirm file/build limits with representative assets and clear authoring guidance. | FR-02, FR-07, FR-09, NFR-06 |
| R-07 | Missing official assets/content or later historical-content/domain work delays launch or causes broken links/email. | No migration is needed initially. Confirm sources and branding, preserve the ability to add older content, and inventory relevant URLs/DNS before a future domain cutover. | FR-08, FR-11, CON-07 |
| R-08 | Version/platform changes encourage unnecessary runtime infrastructure or break builds. | Recheck supported Astro/Node/image tooling and Pages output; pin a compatible implementation toolchain in design and keep updates proportionate. | CON-01, CON-02, NFR-05, NFR-07 |

## 10. Review gate and next step

Initial-phase completion criteria: only AGENTS.md and this specification are created; confirmed scope and acceptance criteria are traceable; assumptions/questions/risks remain distinct from facts; public API investigation and hosting feasibility are recorded with their limits; no application or infrastructure changes occur. The owner has reviewed and approved this initial baseline.

Technical design was authorized and approved on 2026-11-02 in [architecture.md](architecture.md), with D-01–D-10 tracing these requirements to content models, routes/feed, verified ČKA contracts, season/table/date policies, refresh/outage handling, images, deployment/future domain cutover, and verification. The approved outage behavior retains the previous deployment while delaying new content publication. The subsequent [tasks.md](tasks.md) was approved for local implementation. Missing source content and Q-10 account details remain explicit prerequisites for completing external setup/launch. T-13 setup handoff is now in progress; T-14 remains deferred. Design approval alone does not authorize implementation or final launch.

Approval record: on 2026-11-01, the owner confirmed in this conversation, "i made a review and is ok", approving the initial constitution and requirements baseline. The owner then supplied the Q-01–Q-10 answers recorded above, confirming club identity and updating homepage, season, refresh, player-feature, tournament, migration, and device scope, with editorial choices delegated and account details deferred. On 2026-11-02, "you can continue" authorized technical design and the subsequent "approved" accepted that design. The task breakdown was explicitly approved with "approved" on 2026-11-02, authorizing local implementation T-01–T-12. Later explicit UI/content requests authorize their stated refinements, and the owner separately authorized commit/push and requested the Pages handoff. They do not complete T-13/T-14 or establish final visual/launch acceptance.

Implementation evidence: local tasks T-01–T-12 and their checks are recorded in [tasks.md](tasks.md). This does not establish launch readiness or complete account/deployment/content/domain inputs. Subsequent owner-requested refinements updated the existing FR-01/FR-02/FR-04/FR-09 acceptance criteria; they were not a new independently approved baseline. The retrospective SDD consistency review in tasks.md maps each refinement and records the limits of approval/order evidence without asserting a new approval.

Visual review update, 2026-11-02: the owner stated "design is tragic, but everythink else is OK". This accepts the functional work and reopens visual acceptance under FR-01/FR-09 and NFR-01–NFR-03. The revised presentation is ready for review; the technical baseline and product scope are unchanged.

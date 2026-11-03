# Lokota Web — project constitution and agent guidance

Status: constitution approved by the owner, 2026-11-01.
Approval record: the owner confirmed in this conversation, "i made a review and is ok", then supplied answers to Q-01–Q-10. The requirements document records the resulting scope updates and remaining uncertainties.
Source: the owner's Lokota Web project brief and explicit request for a lightweight documentation-first workflow without an SDD framework or CLI.

## Purpose

Build a modern Czech-language website for the Lokota nine-pin bowling club, serving members, players, supporters, and visitors. Keep the entire project understandable and maintainable by one experienced developer assisted by AI agents.

## Specification workflow

1. Constitution: this document defines engineering principles and agent rules.
2. Specification: [requirements.md](docs/requirements.md) records requirements, acceptance criteria, investigation evidence, assumptions, risks, and open questions.
3. Clarification: resolve decisions that affect scope or feasibility and record the owner's answers in the specification.
4. Technical design: after requirements approval, create docs/architecture.md with design decisions, alternatives where useful, and references to requirement IDs.
5. Task breakdown: after design approval, create docs/tasks.md with actionable tasks, requirement/design references, validation, and status.
6. Implementation: implement only approved specifications and tasks within the authorized phase.
7. Verification: record meaningful checks against acceptance criteria and any remaining limitations.

Do not install Spec Kit or another SDD framework/CLI. These Markdown documents are the complete initial workflow; do not create duplicate specifications, empty future documents, or process infrastructure.

The requirements and [architecture.md](docs/architecture.md) are approved; the owner approved the design on 2026-11-02. The implementation breakdown is [tasks.md](docs/tasks.md), approved by the owner on 2026-11-02, authorizing local implementation tasks T-01–T-12. Do not ask for design approval again. Keep unavailable launch inputs explicitly pending; account setup, deployment, and domain changes require their relevant inputs and authorization. The owner accepted the functional implementation but rejected its initial appearance. The requested visual revision is locally verified and awaiting owner review (T-06/T-11). The owner subsequently authorized the local commit and explicitly requested the push and Cloudflare setup instructions: commits through 1b1c807 are on origin/main. Offline CI and a Pages deployment of 1b1c807 are verified; that deployment has an opponent-logo defect whose T-15 correction is locally verified and awaits deployment verification. T-13 remains in progress for operational verification and daily refresh. T-14 remains deferred. Preserve the accepted functionality while addressing presentation feedback.

Record approval in the relevant document when the owner explicitly approves it; never infer approval from file creation, a commit, silence, or the existence of the project brief. Approval of requirements permits the next authorized design phase, not automatic implementation. Do not ask again for actions already authorized in the conversation.

For incremental changes, update the affected requirements, design decisions, and task scope in that order before editing application code; retain the existing IDs and documents. An explicit implementation request authorizes that specific refinement, not final acceptance of the resulting appearance. Ordinary content authoring within the approved model only needs a task/evidence record. Record commit, push, setup handoff, verified deployment, and final-domain launch separately. If a record was missed, label its correction as retrospective rather than inventing an earlier approval or verification.

The owner requested a club favicon and API-sourced match emblems on 2026-11-02. This addition was locally verified as T-15 and is now reopened for the deployed opponent-logo defect (local correction verified; deployment pending) (FR-03/FR-09; D-08): reuse the supplied logo for the favicon and own teams, retrieve optional opponent club.logo artwork only during preparation, emit local optimized files, and on download failure reuse a validated repository snapshot only for a matching club ID and exact current API source URL before falling back neutrally. Explicit npm run logos:update refreshes tracked snapshots; ordinary builds do not modify them. Keep valid sports data independent of optional images. It does not authorize commit/push/deployment or close the overall appearance review.

## Engineering principles

The owner's later approval “udelej to tak” authorizes T-20's local homepage refinement: four latest manual article previews (one prominent, three compact), optional photographs or the navy lane motif, links to all existing news, a few upcoming/recent matches and the A-team table below them. This supersedes only T-19's separate slogan and ten-item mixed homepage feed. Keep the full mixed news listing and its pagination unchanged; reuse existing next-match/feed selection rules and preserve all data/integrations/URLs. The owner's 2026-11-03 refinement makes homepage “Na drahách” cards compact, without venue/address text or visible home/away captions, with larger emblems; retain accessible side labels and complete match-page details. The grouped A-team table/team/tournament overview is also locally verified. On 2026-11-03 the owner explicitly requested “commitni to a pushni”, authorizing Git publication of the current T-19/T-20 changes. This supersedes their earlier local-only commit/push restrictions; successful CI/Pages publication, live verification, final appearance acceptance and domain launch remain separate.

The owner's detailed visual-modernization request on 2026-11-02 authorizes local T-19 implementation and supersedes earlier presentation instructions for repeated large news-logo tiles and next-match placement below the A-team standings. Follow the updated requirements/design: short navy/blue club introduction, next match before the feed, prominent first entry, compact typography for news without a photo, light overall surfaces and preserved A–E accents. All data processing, routes/anchors, content, results, metadata and no-JavaScript availability remain regression boundaries. A tiny progressive enhancement for actual table-overflow guidance is permitted. Record before/after screenshots and responsive, keyboard, contrast and same-input verification. This request does not authorize commit, push or production deployment.

- **Simplicity first:** choose the simplest solution satisfying approved requirements. Explain the concrete need for each new dependency, service, or abstraction.
- **Static by default:** use Astro SSG and TypeScript. Keep browser JavaScript minimal and use reusable Astro components.
- **Confirmed delivery platform:** use GitHub and Cloudflare Pages Free. Provider recommendations for other products do not override the approved platform.
- **No unnecessary infrastructure:** no database, traditional backend, CMS, custom administration interface, authentication, microservices, or production Docker requirement. Do not add React, Vue, or another frontend framework without a concrete approved requirement.
- **Justified automation only:** scheduled GitHub Actions or a Cloudflare Worker may be proposed for a specific unmet requirement. Explain necessity, free-tier impact, failure handling, and maintenance before including it in the design. Do not introduce a Worker merely to serve static pages.
- **Strong boundaries:** use TypeScript and validate manually maintained content and external API data. Keep ČKA fetching, validation, and transformations separate from page rendering without inventing generic repository layers or service hierarchies.
- **Single-maintainer clarity:** prefer direct code, descriptive names, small cohesive modules, and short explanations of non-obvious decisions.

## Content and presentation rules

- Store manually maintained content in Git in structured, human-readable form; prefer Markdown with validated Astro Content Collections frontmatter.
- Adding articles or annual tournament editions must not require changing application components. Keep content suitable for future AI/MCP publishing without building that tooling now.
- Store photographs in the repository, use Astro's built-in image handling where practical, and provide responsive images and meaningful alternative text.
- Build a Czech-language, mobile-first, accessible sports-club presentation with clear navigation, strong typography, consistent spacing, fast loading, and SEO metadata.
- Use verified club branding, assets, history, and contact information. Label temporary neutral placeholders. Never invent official colors, logos, history, or results.
- The owner supplied the club logo on 2026-11-02; maintain the unchanged original at src/assets/club-logo.jpg and display optimized variants in the shared header on every page. The A team uses red/black and other teams blue/white. The owner subsequently requested distinct web accents: A red, B blue, C green, D purple, E orange (UI choices, not claims about uniforms). Retain these team distinctions, but follow the owner's later rejection of black-heavy presentation: use a light overall design with white header/footer and light panels, without dominant black surfaces or heavy black rules. Screen shades are readability choices, not verified official color codes. General news stays neutral and derbies show both actual team accents. Under the later T-19 brief, news in the full listing has an optional photograph and otherwise uses a compact category label/typography; T-20 homepage previews use the navy lane motif when no photograph exists; result entries retain the official home/away score tile. News covers are optional; validate any supplied cover normally. Do not use Lokota or its inflections in visitor-facing text/metadata; use the confirmed club name or neutral club wording. Show the A-team's official league table on the homepage with its row highlighted, while retaining the all-team news feed.
- Follow the clarified scope: KK Lokomotiva Tábor; a homepage feed combining manually authored news and automatically generated match summaries, newest first; the latest season by default; a daily sports refresh target; no individual player detail pages or player-statistics section in the initial scope.
- The owner authorized a first real A-team match-report draft on 2026-11-02 (FR-05; T-16). Names and performances may be researched from documented public API data for ordinary editorial authoring, outside the site build. The owner subsequently approved this article for publication, commit and push with “udelej z toho regulerni clanek a commitni a pushni”; publish through the existing news model. Profiles, public player pages and generation tooling remain separate future scope. Never invent nicknames, historical form, quotes or match atmosphere.
- The annual doubles tournament is Žižkova 200, played as 200 hodů sdružených (200 hs). Qualification for MČR varies by edition. Show results on the website and support optional downloadable files maintained through Git; do not build a browser upload interface.
- No historical-content migration is required initially. Keep future addition of old articles, tournament editions, and assets possible through ordinary content authoring.

## ČKA data rules

- Inspect the official documentation and current public OpenAPI schema before relying on endpoints, query parameters, fields, enumerations, or relation expansion.
- Use public read-only endpoints without ČKA authentication. Do not scrape HTML for information the official API supplies.
- The owner confirmed Lokota is KK Lokomotiva Tábor; the inspected public API identifies it as club 279. Keep this club identity centralized. Team/competition IDs in the investigation remain dated observations to discover dynamically, rather than permanent seasonal configuration.
- Centralize club identity and API configuration. Discover seasons and competitions from verified data where practical; do not scatter season-specific IDs or infer seasons from a calendar-year label alone.
- Prefer build-time retrieval. Document the chosen freshness policy and behavior for incomplete responses, pagination, timeouts, invalid data, schema changes, and unavailable upstream services.
- Preserve official results, scoring distinctions, and standings. Do not recalculate official tables or present absent data as zero.
- Prefer retaining the last successfully published data during outages. Distinguish preserving an existing deployment from having a reusable data snapshot for a new build; do not assume build caches are durable storage.
- Show understandable Czech empty/unavailable states; keep internal errors in maintainer diagnostics. Protect any later deployment hook URLs or credentials from Git and public output.

## Working conventions and verification

- Read applicable guidance and the current specifications before editing. Inspect repository state, preserve unrelated changes, and keep changes within the authorized scope.
- Keep stable requirement IDs (FR, NFR, CON); reference them from future design decisions and tasks. Preserve IDs when revising requirements and record material changes and approvals in the existing documents.
- Separate confirmed requirements, assumptions, unanswered questions, investigation findings, and proposed technical decisions. Never promote an assumption into a requirement silently.
- Research repository facts and official sources before asking the owner. Ask only for missing product information, scope choices, or decisions that evidence cannot resolve.
- Run checks appropriate to the change. Once application tooling exists, prioritize content/reference validation, type checking, a production build, and meaningful tests for API transformations, date/season logic, and important business behavior.
- Cover API outages and malformed/partial data in relevant tests. Do not write tests merely reproducing static markup or impose a large test stack without need.
- Application checks now exist: npm run verify (offline type/content/tests), npm run build (fresh live preparation and checked static output), and npm run test:editorial (temporary synthetic editorial smoke check). Use the pinned Node version. Do not invent passing checks; record material verification evidence in docs/tasks.md.
- Explain what changed, how it was verified, and unresolved risks. Do not commit, push, deploy, or change production infrastructure unless authorized.

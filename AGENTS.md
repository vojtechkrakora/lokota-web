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

The initial documentation phase is complete and approved, and the owner's clarification answers are recorded in the requirements. The main product direction is sufficiently clear for technical design; resolve technical uncertainties there and keep unavailable launch inputs explicitly pending. Technical design and implementation remain future phases; do not scaffold Astro, install dependencies, implement application code or API clients, configure deployment, or change DNS as part of recording these clarifications.

Record approval in the relevant document when the owner explicitly approves it; never infer approval from file creation, a commit, silence, or the existence of the project brief. Approval of requirements permits the next authorized design phase, not automatic implementation. Do not ask again for actions already authorized in the conversation.

## Engineering principles

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
- Follow the clarified scope: KK Lokomotiva Tábor; a homepage feed combining manually authored news and automatically generated match summaries, newest first; the latest season by default; a daily sports refresh target; no individual player detail pages or player-statistics section in the initial scope.
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
- No application tooling or test commands exist at initialization. Do not invent passing checks or install tools to validate documentation.
- Explain what changed, how it was verified, and unresolved risks. Do not commit, push, deploy, or change production infrastructure unless authorized.

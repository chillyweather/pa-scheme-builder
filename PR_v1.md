# Product Requirements Document
## Design System Documentation & Knowledge-Sharing Platform

**Client:** Design department, [Cybersecurity Company]
**Version:** 1.0 — Initial scope
**Last updated:** 2026-03-19
**Author:** Dmitri Dmitriev

---

## 1. Problem statement

The design department lacks a centralized, up-to-date, searchable source of truth for its design system components. Documentation is currently scattered, manually maintained, and quickly becomes stale. Designers waste time looking up component specs, asking colleagues about usage patterns, and making inconsistent decisions due to missing or outdated guidance.

## 2. Product vision

An automated documentation platform that extracts component data directly from Figma, enriches it with AI-generated usage guidance, and publishes it as a browsable, searchable static site — with minimal manual effort required to keep it current.

The architecture is designed so an LLM-powered conversational assistant can be layered on top in a future phase, consuming the same underlying data.

## 3. Users and personas

**Primary: Product designers**
Day-to-day consumers of the documentation. Need to quickly look up component specs, usage guidelines, variant options, and accessibility requirements. Typical questions: "What props does Button support?", "When should I use a Dialog vs. a Drawer?", "What are the accessibility requirements for this input?"

**Secondary: Design system maintainers**
Responsible for keeping documentation accurate. Need an efficient authoring and review workflow. Should spend time on editorial quality, not on manual formatting or copy-pasting specs.

**Tertiary: Front-end developers**
Reference the docs to understand component intent, expected behavior, and design constraints when implementing or consuming design system components.

## 4. Goals and success metrics

| Goal                                           | Metric                                                | Target                                  |
| ---------------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| Reduce time spent searching for component info | Self-reported designer survey                         | 50% reduction within 3 months of launch |
| Keep docs in sync with Figma source            | Staleness (time between Figma change and docs update) | < 24 hours for automated fields         |
| Minimize manual documentation effort           | Human time per new component doc                      | < 30 min (review and polish AI draft)   |
| High adoption across design team               | Weekly active users / total designers                 | > 80% within 2 months                   |

## 5. System architecture overview

### 5.1 Pipeline stages

```
Figma components
        │
        ▼
┌─────────────────────┐
│  pa-scheme-builder   │  Figma plugin — extracts props, variants,
│  (extraction)        │  states, structure, descriptions
└────────┬────────────┘
         │ ComponentSpec JSON
         ▼
┌─────────────────────┐
│  Gemini enrichment   │  AI fills in usage docs, accessibility,
│  (content generation)│  content guidelines, dos/donts
└────────┬────────────┘
         │ Enriched ComponentSpec JSON
         ▼
┌─────────────────────┐
│  Content repo (git)  │  One JSON + optional MDX per component
│  (canonical data)    │  Version-controlled, PR-reviewable
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Phase 1   Phase 2
 Static    LLM assistant
 docs site (future)
```

### 5.2 Data flow principles

- **Single source of truth**: the content repo (JSON + MDX files) is the canonical store. Both the static site and any future LLM layer consume it.
- **Factual data always wins**: when merging AI-generated content with Figma-extracted data, factual data from Figma takes precedence on conflict.
- **Automation by default, human review for quality**: structural/prop changes flow automatically; prose content goes through PR review.

## 6. Component data schema

The schema is defined in `pa-scheme-builder/src/schema.ts` as the `ComponentSpec` interface. Each component produces one JSON file containing:

| Section             | Contents                                                                                                            | Source                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `meta`              | Name, category, status, version, links (Figma, Storybook Angular/React, playground, docs), related components       | Figma (name, links) + Gemini (category, related)       |
| `overview`          | Description, use cases, when not to use, alternatives                                                               | Figma (description) + Gemini                           |
| `formatting`        | Anatomy (parts with roles, slots), variants (names, types, values, defaults), alignment, placement                  | Figma (variants) + Gemini (anatomy, alignment)         |
| `behavior`          | Interaction model, states (with triggers and responses), keyboard/mouse/touch support, empty/error/loading handling | Figma (state values) + Gemini                          |
| `properties`        | Full property list with types, defaults, descriptions, constraints, examples                                        | Figma (names, types, defaults) + Gemini (descriptions) |
| `dependencies`      | Conditional property rules                                                                                          | Gemini                                                 |
| `layoutConstraints` | Responsive rules, min/max width, height/width/wrapping/truncation/spacing rules                                     | Gemini                                                 |
| `contentGuidelines` | Label, helper text, placeholder, error message rules, tone notes                                                    | Gemini                                                 |
| `accessibility`     | ARIA role, aria attributes, keyboard support, focus visible, contrast notes, non-color signal notes                 | Gemini                                                 |
| `dosDonts`          | Dos and donts lists                                                                                                 | Gemini                                                 |

## 7. Functional requirements

### 7.1 Extraction (pa-scheme-builder plugin)

| ID     | Requirement                                                                                                 | Priority  |
| ------ | ----------------------------------------------------------------------------------------------------------- | --------- |
| EXT-01 | Extract component properties, variants, and states from a selected COMPONENT_SET node                       | P0 — Done |
| EXT-02 | Map Figma property types to semantic types (VARIANT→enum, BOOLEAN→boolean, TEXT→string, INSTANCE_SWAP→slot) | P0 — Done |
| EXT-03 | Auto-detect component states from a variant property named "state" (case-insensitive)                       | P0 — Done |
| EXT-04 | Extract component description from Figma node                                                               | P0 — Done |
| EXT-05 | Build trimmed node summary (children names, types, property keys) for LLM context                           | P0 — Done |
| EXT-06 | Support multiple Gemini models (Flash, Pro, Lite, Stable, Balanced) selectable in plugin UI                 | P0 — Done |
| EXT-07 | Export generated JSON to clipboard for manual commit to content repo                                        | P0 — Done |
| EXT-08 | Add webhook/API export option to push JSON directly to content repo                                         | P1        |
| EXT-09 | Support batch processing of multiple component sets in one run                                              | P2        |

### 7.2 AI enrichment

| ID     | Requirement                                                                                                   | Priority  |
| ------ | ------------------------------------------------------------------------------------------------------------- | --------- |
| ENR-01 | Send factual data + node summary to Gemini API with structured JSON output                                    | P0 — Done |
| ENR-02 | Gemini fills empty fields: use cases, accessibility, content guidelines, anatomy, dos/donts, behavior details | P0 — Done |
| ENR-03 | Factual data from Figma always takes precedence over AI-generated content (deep merge strategy)               | P0 — Done |
| ENR-04 | Temperature set to 0.3 for consistent, professional output                                                    | P0 — Done |
| ENR-05 | Support prompt customization per client/project (swap system prompt)                                          | P2        |

### 7.3 Content repository

| ID     | Requirement                                                                                                              | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| REP-01 | Git repository with one JSON file per component following ComponentSpec schema                                           | P0       |
| REP-02 | Optional co-located MDX file per component for supplementary prose content (design principles, cross-component patterns) | P1       |
| REP-03 | PR-based review workflow for all content changes                                                                         | P0       |
| REP-04 | Automated validation of JSON against ComponentSpec schema on PR                                                          | P1       |
| REP-05 | Changelog generation on merge (diff of what changed per component)                                                       | P2       |

### 7.4 Static documentation site

| ID      | Requirement                                                                                                                                                  | Priority |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| SITE-01 | One page per component, auto-generated from ComponentSpec JSON                                                                                               | P0       |
| SITE-02 | Component page sections: overview, props table, variants display, anatomy breakdown, behavior/states, accessibility checklist, content guidelines, dos/donts | P0       |
| SITE-03 | Full-text search across all components (client-side, no server infrastructure)                                                                               | P0       |
| SITE-04 | Component index/catalog page with filtering by category and status                                                                                           | P0       |
| SITE-05 | Render co-located MDX content alongside JSON-driven sections                                                                                                 | P1       |
| SITE-06 | Display component status badges (draft, stable, deprecated)                                                                                                  | P1       |
| SITE-07 | Related components linking (from `meta.relatedComponents`)                                                                                                   | P1       |
| SITE-08 | Deep-linkable sections (anchor links for sharing specific sections in Slack)                                                                                 | P0       |
| SITE-09 | Mobile-responsive layout                                                                                                                                     | P1       |
| SITE-10 | Dark mode support                                                                                                                                            | P2       |

### 7.5 CI/CD and deployment

| ID    | Requirement                                                                         | Priority |
| ----- | ----------------------------------------------------------------------------------- | -------- |
| CI-01 | GitHub Actions workflow: on push to component data directory → build site → deploy  | P0       |
| CI-02 | Preview deployments on pull requests for content review                             | P0       |
| CI-03 | Automated build triggered by webhook from Figma plugin (when EXT-08 is implemented) | P1       |
| CI-04 | Build failure notifications to maintainers                                          | P1       |

## 8. Tech stack

| Layer          | Technology                           | Rationale                                                       |
| -------------- | ------------------------------------ | --------------------------------------------------------------- |
| Extraction     | TypeScript, Figma Plugin API, Preact | Existing — `pa-scheme-builder`                                  |
| AI enrichment  | Google Gemini API (Flash/Pro)        | Client requirement — Gemini only                                |
| Content store  | Git repository (GitHub)              | Version control, PR review, diffable, free                      |
| Site generator | Astro                                | Content-oriented, fast, MDX-native, static output, lightweight  |
| Search         | Pagefind                             | Build-time indexing, client-side search, zero infrastructure    |
| CI/CD          | GitHub Actions                       | Standard, free for public repos, integrates with content repo   |
| Hosting        | Cloudflare Pages                     | Static hosting, preview deploys, global CDN, generous free tier |

## 9. Phase 2 — LLM assistant layer (future scope)

Not in v1 scope, but the architecture explicitly supports this. When implemented:

- The same ComponentSpec JSON files serve as the knowledge base
- For smaller design systems: entire corpus fits in Gemini's context window (direct API call)
- For larger systems: lightweight RAG setup with embeddings via Vertex AI
- The assistant can answer fuzzy, cross-cutting questions ("Which component supports inline validation and works in dark mode?")
- Responses link back to canonical docs pages for trust and verification
- Interface: embedded chat widget on the docs site, or standalone internal tool

## 10. Non-functional requirements

| Requirement                             | Target                                            |
| --------------------------------------- | ------------------------------------------------- |
| Site build time                         | < 60 seconds for up to 200 components             |
| Page load time (first contentful paint) | < 1.5 seconds                                     |
| Search latency                          | < 200ms (client-side)                             |
| Uptime                                  | 99.5% (static hosting SLA)                        |
| Accessibility                           | WCAG 2.1 AA for the docs site itself              |
| Browser support                         | Chrome, Firefox, Safari, Edge (latest 2 versions) |

## 11. Risks and mitigations

| Risk                                                                | Impact                                           | Likelihood | Mitigation                                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| AI-generated content contains inaccuracies                          | Designers make wrong decisions based on bad docs | Medium     | PR review for all AI-generated content; factual data override; clear "AI-generated" labeling on enriched fields    |
| Gemini API changes or rate limits                                   | Pipeline breaks                                  | Low        | Abstract API call behind interface; model selection already configurable; rate limiting with retries               |
| Low adoption — designers don't use the site                         | Wasted effort                                    | Medium     | Involve designers early in site design; integrate links into existing Figma workflows; Slack bot for quick lookups |
| Schema drift — ComponentSpec evolves but old JSON files don't match | Build failures or incomplete pages               | Medium     | Schema validation in CI; migration scripts when schema changes; backward-compatible field additions                |
| Content staleness for non-Figma fields                              | Docs become untrustworthy                        | Medium     | `meta.lastUpdated` timestamp visible on pages; periodic review reminders; staleness dashboard                      |

## 12. Open questions

- [ ] What is the expected component count at launch? (Affects build time and search strategy decisions)
- [ ] Does the client have an existing Storybook instance? (Impacts `meta.links` population)
- [ ] Are there existing design principles or writing guidelines that should inform the Gemini system prompt?
- [ ] Is Cloudflare Pages acceptable for hosting, or does the client require on-premise/internal deployment?
- [ ] Should the docs site require authentication (SSO), or is it accessible to anyone on the corporate network?
- [ ] What is the review/approval process — does a single maintainer approve, or is there a rotation?

## 13. Milestones

| Milestone                 | Description                                                                                    | Target   |
| ------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| M1 — Content repo setup   | Repository structure, schema validation, first 3 components exported from plugin and committed | Week 1–2 |
| M2 — Astro site prototype | Working site rendering one component page from JSON, with search                               | Week 2–3 |
| M3 — Full page template   | All ComponentSpec sections rendering correctly, component index page                           | Week 3–4 |
| M4 — CI/CD pipeline       | Automated build and deploy on push, preview deploys on PRs                                     | Week 4   |
| M5 — Content population   | All priority components exported, AI-enriched, reviewed, and live                              | Week 4–6 |
| M6 — Launch               | Site deployed, team onboarded, feedback collection started                                     | Week 6   |
| M7 — Phase 2 scoping      | Evaluate LLM assistant feasibility based on usage data and feedback                            | Week 10+ |
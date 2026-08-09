# First-draft dashboard implementation plan

## Purpose and authority

This plan segments the first working draft into reviewable implementation
steps. The project will advance one step at a time, and each step ends with a
focused verification and Git handoff.

The governing documents are, in precedence order:

1. [`CODEX_FIRST_DRAFT_BUILD_SPEC.md`](CODEX_FIRST_DRAFT_BUILD_SPEC.md), which
   defines the release gates, required routes, product contract, and acceptance
   criteria.
2. [`DASHBOARD_STORYBOARD.md`](DASHBOARD_STORYBOARD.md), which defines the
   narrative, evidence, figure, recommendation, and model intent for all 14
   story chapters.
3. [`RESEARCH_PROTOCOL.md`](RESEARCH_PROTOCOL.md), which defines the claim and
   source publication gate.
4. [`INFORMATION_ARCHITECTURE.md`](INFORMATION_ARCHITECTURE.md), which records
   the earlier provisional route concept and the NHA-derived presentation
   pattern. Where its ten-route concept conflicts with the later 16-route build
   specification, the build specification controls.

The National Health Assurance dashboard is an implementation reference, not a
source of climate, energy, food, water, or materials claims. The useful pattern
to inherit is a statically generated Astro application with typed navigation,
shared layouts and components, pure TypeScript data and model modules, small
route-specific client scripts, semantic CSS tokens, chapter navigation, and a
Vitest-backed integrity summary. This project adds the stricter registry,
provenance, geography, scenario, open-gap, and confidence controls required by
the build specification.

## Fixed technical direction

- Build with Astro 5, strict TypeScript, semantic HTML, CSS, and small vanilla
  TypeScript client modules.
- Generate static narrative HTML and initial chart states. Do not require a
  client framework, CDN, database, account system, or live service.
- Use one typed route registry for all 16 routes, supersections, labels, story
  order, local tabs, Back and Next links, and mechanism cross-links.
- Complete canonical registries and their integrity harness before a public
  route consumes a claim, metric, parameter, scenario, chart, or model.
- Keep research files immutable during application builds. Read them through
  build-time adapters and publish only purpose-built subsets with provenance
  and checksums.
- Preserve nulls, conflicts, evidence classes, units, periods, geographies,
  denominators, accounting boundaries, and model-family seams.
- Implement every chapter as a vertical slice: narrative, evidence, figure or
  evidence-gap module, recommendation, model contract or authorized working
  view, delivery content, accessibility, responsive behavior, and tests.
- Configure the production base path as
  `/US-Climate-Health-and-Water/` and deploy static output through GitHub Pages
  only after the full quality gate passes.

## Required narrative order

1. Overview: `/`
2. Energy System: `/energy/system`
3. Demand & Electrification: `/energy/demand`
4. Generation Choices: `/energy/generation`
5. Grid & Delivery: `/energy/grid`
6. Energy Plan: `/energy/plan`
7. Cause & Trajectory: `/climate/cause`
8. Impacts & Risk: `/climate/risks`
9. Coasts & Communities: `/climate/coasts`
10. Climate Plan: `/climate/plan`
11. Freshwater Security: `/food-water/freshwater`
12. Food & Agriculture: `/food-water/food`
13. Water for Energy & Industry: `/food-water/industry`
14. Plastics & Materials: `/food-water/plastics`
15. Food & Water Plan: `/food-water/plan`
16. Evidence & Methods: `/methods`

## Segmented implementation sequence

### Step 1: reproducible repository baseline

**Objective:** Put the planning and research corpus under version control and
record the exact build starting point.

**Actions:**

- Inspect the climate repository, current branch, remote, worktree, planning
  documents, research indexes, validators, and ignored files.
- Inspect the current NHA Astro application structure, component boundaries,
  typed navigation, testing approach, and GitHub Pages workflow.
- Confirm the Node, pnpm, Python, and Git runtime strategy.
- Run all existing research validators named by the build specification.
- Inventory file counts, formats, domain sizes, and the largest assets.
- Record readiness findings, constraints, and unresolved foundation work.
- Publish the existing project documentation and evidence corpus without
  changing research values.

**Verification:** Every existing validator passes; the status and inventory
are recorded in [`BUILD_READINESS.md`](BUILD_READINESS.md) and
[`build-readiness.json`](build-readiness.json); only project-scope files are
staged.

**Commit outcome:** A reproducible, public baseline for all later work.

### Step 2: toolchain and canonical registry foundation

**Objective:** Create the application toolchain and the identity system that
all later code must consume.

**Actions:**

- Add `package.json`, lockfile, Astro configuration, strict TypeScript
  configuration, Vitest configuration, and build/check/test scripts.
- Add the static GitHub Pages base configuration, without enabling deployment
  yet.
- Define namespace ownership and stable ID formats for sources, claims,
  datasets, metrics, parameters, scenarios, charts, transformations, models,
  routes, controlled vocabularies, denominators, and open items.
- Implement typed canonical registry schemas, deprecation fields, semantic
  fingerprints, and foreign-key contracts.
- Seed the authoritative route registry, evidence-state vocabulary, shared
  viewpoint vocabulary, unit families, use classes, geography types, source
  types, scenario types, status values, and confidence values.
- Create the single integrity test registry and reconciled result contract for
  registered, executed, passed, failed, skipped, pending, and unloaded checks.

**Verification:** Type checking passes; registry schema tests reject duplicate
IDs, malformed namespaces, unknown vocabulary values, invalid deprecations, and
unreconciled integrity counts; all 16 routes exist in the canonical route
registry in the required order.

**Commit outcome:** A tested identity and quality foundation with no public
chapter pages yet.

### Step 3: corpus ingestion, provenance, and gap foundation

**Objective:** Make the existing domain evidence safely consumable through one
canonical evidence layer.

**Actions:**

- Build read-only adapters for the existing energy, transmission, consumption,
  climate, coastal-city, water, and plastics registries and chart contracts.
- Populate canonical source, claim, dataset, metric, chart, transformation,
  denominator, scenario-crosswalk, parameter, model, and open-item records.
- Generate collision, orphan, duplicate, controlled-vocabulary, semantic-drift,
  source-coverage, and unresolved-reference reports.
- Add source-fidelity checks for value, unit, period, geography, denominator,
  accounting boundary, status, locator, and vintage.
- Add confidence propagation, natural/base/stress bound, null-preservation,
  use-class, currency, overlap, and geographic-cardinality validators.
- Turn unresolved or unauthorized values into canonical open items linked to
  affected outputs. Do not replace them with estimates.
- Generate a checksummed evidence and model manifest for the application build.

**Verification:** All source and claim references resolve exactly once; every
known collision and orphan is either fixed or a published open item; the full
domain validator set remains green; the generated manifest reproduces.

**Commit outcome:** One inspectable evidence layer and noisy gap register ready
for presentation code.

### Step 4: application shell and navigation

**Objective:** Establish the public site frame before chapter-specific content.

**Actions:**

- Build the base layout, metadata, skip link, header, primary navigation,
  supersection and local tab navigation, chapter introduction, story rail,
  Back and Next navigation, theme control, and integrity footer shell.
- Derive all labels, active states, supersection landing behavior, route order,
  and mechanism links from the canonical route registry.
- Establish the climate-energy-food-water visual identity with semantic light
  and dark tokens, readable content widths, chart breakout regions, focus
  states, reduced-motion behavior, and mobile navigation.
- Render static contract-complete route skeletons only for shell verification;
  they must not be represented as completed public chapters.

**Verification:** Route and navigation tests cover all paths, active states,
Back and Next order, local tabs, keyboard behavior, narrow-screen overflow,
theme persistence, heading rules, and no-JavaScript navigation.

**Commit outcome:** A coherent, responsive, accessible 16-route shell.

### Step 5: evidence, chart, and working-view components

**Objective:** Build the shared disclosure and visualization language used by
every vertical slice.

**Actions:**

- Add ChapterIntro, MetricCard, ViewpointGrid, OptionComparison,
  RecommendationPanel, EvidenceBadge, SourceDrawer, CaveatPanel, EvidenceGap,
  ChartFrame, accessible data table, ScenarioWorkbench, and IntegrityFooter
  components.
- Implement accessible SVG primitives for line, area/range, bar, dot/range,
  heatmap, matrix, flow, Sankey-like, causal-path, and map-context views only as
  needed by approved figures.
- Add keyboard and pointer tooltips, source access, legends, annotations,
  status patterns, reset behavior, URL state, loading/empty/error states, and
  text/table alternatives.
- Enforce finite geometry, explicit units and periods, missing-versus-zero,
  evidence-state distinctions, scenario seams, and forbidden comparisons.

**Verification:** Component, chart-contract, geometry, keyboard, focus,
accessible-name, null, source-link, light/dark contrast, and mobile reflow tests
pass.

**Commit outcome:** A tested visual and evidence system ready for route data.

### Step 6: Energy System and Demand & Electrification

**Objective:** Deliver the first two high-readiness Energy chapters as complete
vertical slices.

**Actions:**

- Implement the seven-act page contract for both chapters.
- Add verified generation, production/consumption, sector demand, AEO case,
  data-center, EV, and EIA-930 profile adapters.
- Build the authorized observed and source-scenario figures, accounting
  explainers, evidence disclosures, option comparisons, recommendations, and
  model boundaries.
- Provide accounting and indexed scenario working views without claiming an
  hourly reliability forecast or fabricating future hourly profiles.

**Verification:** Data identities, source-family seams, unit separation,
contained-load warnings, null handling, page contracts, charts, responsive
layouts, and representative keyboard flows pass.

**Commit outcome:** Two publication-quality chapters that establish the Energy
story and shared time-series patterns.

### Step 7: Cause & Trajectory and Impacts & Risk

**Objective:** Deliver the two high-readiness explanatory Climate chapters.

**Actions:**

- Implement causation, observations, attribution, cumulative emissions, TCRE,
  assessed pathway, temperature-risk, heat, cyclone, biodiversity, crop,
  freshwater, and displacement views.
- Preserve native baselines and distinct source scenario families; document
  any rebasing transformation.
- Separate hazard, exposure, vulnerability, adaptation, observation, estimate,
  and conditional scenario states.
- Include the scoped recommendations and prohibit annual-temperature
  prediction and universal impact-per-degree claims.

**Verification:** Baseline, period, evidence-state, confidence, scenario,
  monotonicity/domain, source-link, chart, page-contract, and accessibility
  tests pass.

**Commit outcome:** Two complete Climate chapters with no causal or certainty
overreach.

### Step 8: Freshwater Security and Plastics & Materials

**Objective:** Deliver the two high-readiness Food & Water chapters.

**Actions:**

- Implement withdrawals, consumptive use, household service, place-source,
  risk-horizon, saltwater-intrusion, desalination, atmospheric-water,
  material-flow, resin, water-range, health-evidence, policy, replacement, and
  functional-unit views.
- Preserve withdrawal/consumption/source/capacity boundaries and distinguish
  gross avoided resin water from net replacement-system effects.
- Present typed planning horizons without converting them into run-out dates.
- Carry explicit gaps for unavailable net terms and unsupported coefficients.

**Verification:** Water accounting, risk typing, material balance, policy
scope, health-evidence class, null/gap publication, page, chart, mobile, and
keyboard tests pass.

**Commit outcome:** Two complete chapters that establish basin and
service-level decision framing.

### Step 9: Generation Choices and Grid & Delivery

**Objective:** Add Energy infrastructure and portfolio-choice chapters without
overstating system capability.

**Actions:**

- Implement technology roles, capacity-versus-generation, lifecycle ranges,
  health pathways, nuclear evidence, qualitative portfolio comparison, hourly
  load, calendar heatmap, corridor context, capacity semantics, development
  process, and equipment-chain views.
- Release spatial layers only after exact cardinality and fit-for-purpose tests.
- Keep corridor ratings non-additive and label context geometry, approximate
  geometry, status, missing data, and operational limitations.
- Render the missing compatible coefficient ledger and reliability model as
  evidence gaps and model contracts.

**Verification:** Technology vocabulary, coefficient compatibility,
  geographic completeness/uniqueness, map-table equivalence, hourly nulls,
  non-additivity, geometry, page, responsive, and accessibility tests pass.

**Commit outcome:** Two complete Energy delivery chapters with bounded spatial
and portfolio claims.

### Step 10: Coasts & Communities and Water for Energy & Industry

**Objective:** Add the remaining place- and facility-dependent explanatory
chapters.

**Actions:**

- Implement local relative sea-level observations and scenarios, flood-day,
  habitability, exposure, migration stress, receiving-city, adaptive-pathway,
  national-to-local water scale, direct/indirect data-center water,
  thermoelectric boundary, facility-system, and siting scorecard views.
- Bind every city selector to its gauge, baseline, source, and planning
  context.
- Keep unverified facility maps unavailable and explain the exact data needed
  to enable them.
- Distinguish threshold exceedance from area flooded, scenario from forecast,
  national context from local effect, and direct from indirect water.

**Verification:** City/gauge joins, scenario baselines, geography cardinality,
  facility-boundary rules, unavailable-state behavior, map alternatives, page,
  chart, responsive, and keyboard tests pass.

**Commit outcome:** Two place-specific chapters that make local limits visible.

### Step 11: Food & Agriculture and the three capstone plans

**Objective:** Complete the four lower-readiness chapters honestly and usefully.

**Actions:**

- Implement Food & Agriculture with the authorized crop, water, and groundwater
  evidence plus a comprehensive readiness matrix and food-system model
  contract.
- Implement Energy Plan, Climate Plan, and Food & Water Plan with fair option
  comparisons, separate source-scenario families, stress matrices, delivery
  roadmaps, gap-linked requirements, and versioned integrated-model contracts.
- Use authorized accounting and source-response calculations only.
- Do not publish optimized national portfolios, reliability proofs, damage
  totals, household costs, diet optima, facility effects, or nationalized basin
  results without the missing validated models and data.

**Verification:** All four page contracts pass; every unavailable quantitative
  result links to a canonical gap; model authorization and prohibited-
  interpretation tests pass; no placeholder, fabricated value, or unsupported
  certainty appears.

**Commit outcome:** All 14 story chapters are real, useful, and explicit about
what remains unproved.

### Step 12: Overview, Evidence & Methods, and system reconciliation

**Objective:** Complete the front door and the full inspection surface after
underlying chapters stabilize.

**Actions:**

- Build the connected-system story, current evidence scorecard, dependency
  map, recommended portfolio, readiness-aware outcome matrix, chapter guide,
  and implementation/research roadmap.
- Build searchable source and claim ledgers, dataset catalog, definitions,
  scenario crosswalk, transformations, model registry, source conflicts, gap
  register, integrity details, downloads, update history, and evidence vintage.
- Reconcile every Overview metric and status to its single canonical owner in
  an underlying chapter.
- Add all required Continue the mechanism links while preserving the normal
  story order.
- Generate checksummed public data and data/model manifests.

**Verification:** Overview-to-chapter reconciliation, source and claim search,
  manifest checksums, download provenance, gap publication, mechanism links,
  all 16 page contracts, navigation, and integrity-summary reconciliation pass.

**Commit outcome:** A complete, inspectable first-draft argument across all 16
routes.

### Step 13: hardening, deployment, and public verification

**Objective:** Clear every release gate and publish the verified static site.

**Actions:**

- Complete WCAG 2.2 AA-oriented keyboard, focus, contrast, dialog, tooltip,
  reduced-motion, reading-order, touch-target, and chart-alternative reviews.
- Test 320-pixel phones, common mobile widths, tablets, desktops, large
  screens, light/dark themes, print, and client-JavaScript failure.
- Enforce JavaScript/data/performance budgets and inspect representative routes
  for layout shift, overflow, and unreadable charts.
- Run research validators, unit tests, page-contract tests, chart tests,
  accessibility automation, type checking, and the production build.
- Resolve every failure; retain skipped or pending checks only when the
  affected feature is visibly unavailable and the gap register reports it.
- Add the GitHub Pages workflow, push the verified source, observe the Pages
  build, and verify the public URL and representative assets/routes.
- Update the README and implementation report with setup, build, test,
  completed views, known gaps, deferred models, evidence vintage, and update
  procedure.

**Verification:** The full suite and production build pass; integrity counts
reconcile; the deployed site works at the repository base path; representative
desktop/mobile and light/dark routes are publicly reachable and match the
committed build.

**Commit outcome:** The first working draft is live at the repository's
GitHub Pages URL with a reproducible deployment and explicit residual gaps.

## Step discipline

At the start of each step, recheck the worktree and the preceding step's
artifacts. During the step, preserve unrelated work and keep canonical owners
centralized. At the end, run the listed verification, inspect the intended
diff, stage only that step's scope, commit tersely, push only after checks pass,
and report the commit, validation, known gaps, and the next step.

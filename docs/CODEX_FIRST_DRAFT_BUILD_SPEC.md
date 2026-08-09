# Codex build specification: first draft dashboard

## Document purpose

This document is the implementation brief for Codex to create the first working draft of the U.S. Climate, Energy, Food, and Water Dashboard.

It translates the narrative architecture in [`DASHBOARD_STORYBOARD.md`](DASHBOARD_STORYBOARD.md) into a concrete product, content, data, engineering, visualization, and verification specification. It should be sufficient for a new Codex session to understand what to build, what evidence to use, what not to claim, and how to determine whether the first draft is complete.

This is a build specification, not dashboard code. Codex should not begin implementation until the user explicitly asks it to build the dashboard.

## Document control

| Field | Value |
|---|---|
| Product | U.S. Climate, Energy, Food, and Water Dashboard |
| Deliverable | First complete working draft |
| Intended builder | Codex |
| Application type | Static, evidence-linked, interactive public dashboard |
| Preferred stack | Astro, TypeScript, semantic HTML, CSS, and small vanilla TypeScript client modules |
| Primary evidence | The verified and provisional files under `research/` |
| Narrative source | `docs/DASHBOARD_STORYBOARD.md` |
| Research rules | `docs/RESEARCH_PROTOCOL.md` and domain README files |
| Current status | Specification only |

## Product mandate

Build a public-facing dashboard that explains how energy, climate, food, freshwater, industry, and material use interact. It must begin with current conditions, show the problems from several legitimate viewpoints, compare possible solutions, recommend a particular portfolio, and justify that recommendation using transparent evidence and model-supported analysis.

The dashboard is not a neutral database and is not a single-model prediction. It is an evidence-linked policy communication system. It may advocate a solution, but it must expose assumptions, alternatives, uncertainty, implementation burden, and residual risk.

The recommended system-level position is:

- deliver abundant and reliable essential services;
- reduce avoidable demand through efficiency without confusing efficiency with deprivation;
- electrify appropriate end uses;
- build a diversified low-carbon electricity portfolio;
- expand and modernize electricity transmission and grid operations;
- reduce cumulative greenhouse-gas emissions rapidly;
- plan essential systems against locally credible climate stress cases;
- manage freshwater at basin, source, utility, and seasonal scales;
- secure affordable nutrition through resilient production and supply chains;
- require large facilities to fit within verified energy, water, infrastructure, and community constraints;
- eliminate unnecessary and high-exposure plastic uses first, expand reuse and high capture, control hazardous chemistry, and validate substitutes by the services they provide.

The dashboard should show why this portfolio is preferred to single-technology or single-sector strategies.

## Definition of the first working draft

The first draft is complete when a reader can navigate the entire story, understand the recommended portfolio, inspect real sourced evidence on every tab, see which analyses are historical versus modeled, and identify where research or model development remains incomplete.

The first draft must include:

- a responsive site shell and complete navigation;
- an Overview route;
- all 14 supersection story routes;
- an Evidence & Methods route;
- real content on every route, with no “coming soon” page used as a substitute for a chapter;
- selected high-value figures built from the existing research corpus;
- consistent source, confidence, geography, unit, period, and status affordances;
- fair option comparisons and explicit recommendation panels;
- working lightweight scenario or accounting views where the current evidence supports them;
- clearly designed model-development states where integrated models are not yet authorized;
- chapter-to-chapter navigation and cross-section mechanism links;
- responsive behavior, keyboard access, readable charts, and light and dark themes;
- evidence, data, model, chart, route, and accessibility checks summarized in an integrity footer;
- a successful production build and test run.

The first draft is not required to include:

- a complete national capacity-expansion or production-cost model;
- an operational transmission power-flow model;
- plant-level or facility-level claims not supported by the corpus;
- a complete food-system optimization model;
- a national climate-damage estimate;
- a completed fiscal or financing model;
- fabricated data used to make unfinished pages appear complete;
- live data feeds whose freshness and failure behavior have not been designed;
- authentication, accounts, a server database, or user-submitted data;
- publication or deployment unless separately requested.

Low-readiness tabs must still be useful. They should present the verified evidence that exists, explain the decision the eventual model must support, show the proposed model boundary, and render missing evidence as a visible research result rather than an empty placeholder.

## Non-negotiable evidence rules

1. Every numeric claim must be traceable to a source record or a documented dashboard transformation.
2. Every figure must display or expose geography, period, unit, accounting boundary, source, release vintage, and evidence status.
3. Observations, estimates, source scenarios, dashboard transformations, and dashboard strategy-model outputs must have visibly different states.
4. Scenarios are conditional results, not predictions or probabilities unless the source explicitly defines probabilities.
5. Missing values remain missing. They must never be silently converted to zero.
6. Conflicting authoritative values must be shown side by side or reconciled through a documented rule. Codex must not manufacture a consensus number.
7. Capacity, generation, primary energy, final consumption, power, and energy must not share an unlabeled denominator or axis.
8. Withdrawal, consumptive use, delivery, capacity, indirect footprint, and water quality are different measures.
9. Queued generation or transmission is not operating capacity.
10. Annual TWh is not peak GW, resource adequacy, or transmission need.
11. Global climate values are not local forecasts.
12. Hazard, exposure, vulnerability, and realized loss are distinct.
13. Association, hazard classification, exposure, and causal health effects are distinct.
14. Gross avoided resin-production water is not net water saved by a replacement product-service system.
15. No composite “best technology” score may be shown unless the weights, normalization, missing-data treatment, and sensitivity are visible.

## NHA audit-derived release gates

The NHA dashboard audit documented recurring failures that this project must prevent structurally. The relevant source is `CLAUDE_CODE_INSTRUCTIONS.md` from the NHA audit work. The rules below generalize those findings for this dashboard without importing NHA-specific parameters or policy assumptions.

These are release gates, not recommendations. A violation blocks completion of the first draft. A test may be marked pending only when the affected feature is visibly unavailable in the product and the pending condition appears in the published gap register. A pending test must never be counted as passing.

### Gate 1: canonical registries must exist before models or pages depend on them

The NHA audit found that an authoritative parameter dictionary existed only inside a Word document. Downstream files recreated and renumbered the identifiers, allowing the same ID to mean different things in different parts of the project. The new dashboard must never allow that architecture.

Rules:

1. Claims, sources, datasets, metrics, parameters, scenarios, charts, transformations, models, routes, controlled vocabularies, and open items must each have a machine-readable canonical registry.
2. A registry that participates in a join must live in version-controlled text or structured data. A PDF, Word document, prose page, chart label, or source-code comment cannot be the authoritative registry.
3. Human-readable documents and tables are rendered views of canonical registries, not independent copies.
4. Every canonical ID must be globally unique within its registry and semantically stable for the life of the project.
5. An existing ID must never be reused for a different concept, even if the original record is removed from the active dashboard.
6. New IDs must be allocated through the relevant registry and follow its declared namespace. Ad hoc letter suffixes, local counters, and page-specific numbering are forbidden unless the namespace specification explicitly permits them.
7. Every foreign-key reference must resolve to exactly one canonical record. Zero matches and multiple matches are hard failures.
8. IDs alone are not sufficient validation. Build checks must compare expected record type, unit family, and semantic description so a valid-looking but wrong ID cannot bind silently.
9. Deprecated records retain their canonical ID, status, replacement ID, and migration note. They are not deleted in a way that makes old outputs untraceable.
10. Registry migrations must update definitions, scenarios, transforms, model code, charts, narrative references, tests, and published data in one atomic implementation change.
11. Generated data must retain the canonical IDs of its source records. It must not invent a second identity scheme during export.
12. Prefix ownership and ID formats must be declared and tested. A record that does not conform must be marked explicitly as a proposed new record and must not be used in published calculations until accepted into the registry.

Required registry integrity tests:

- all IDs are unique;
- all references resolve exactly once;
- referenced record types match the consuming field;
- metric units match their canonical metric definition;
- descriptions or semantic fingerprints have not drifted unexpectedly;
- no active record points to a superseded record when a replacement is required;
- no hard-coded ID in code, page content, or equations is absent from its registry;
- generated manifests contain the same canonical IDs as their source records.

### Gate 2: one fact, parameter, control, and definition must have one owner

The NHA audit repeatedly found the same quantity hard-coded in multiple modules, sometimes with different values and sometimes with independent sliders. This dashboard must use a single-owner architecture.

Rules:

1. Every model input has one canonical parameter definition.
2. Every displayed headline metric has one canonical derivation or data adapter.
3. Every user-adjustable concept has one state key and one control contract. Two tabs must not expose independent controls for the same underlying quantity.
4. Modules consume shared values by reference. They must not restate a value as a local numeric constant.
5. A model result used on several tabs is computed once through a shared model or selector and then presented in several views.
6. A shared total, denominator, rate, or baseline must not be recomputed differently in separate page scripts.
7. If two values share a label but have legitimately different scopes, their labels must include the distinguishing scope and their canonical metric IDs must differ.
8. Page copy, cards, charts, downloads, and methodology must read the same current value and metadata.
9. Duplicated values discovered during implementation must be consolidated before the affected page is considered complete.
10. Cross-module reconciliation tests must cover every shared result and control.

Examples for this dashboard:

- AEO total electricity demand used on the Demand and Energy Plan tabs must come from the same adapter and scenario selection.
- A climate warming value used on the Cause, Risk, and Climate Plan tabs must retain the same source scenario, assessment period, and baseline.
- A freshwater withdrawal total used on the Freshwater and Industry tabs must retain the same year and accounting boundary.
- A plastic material-flow total used on the Plastics and Food & Water Plan tabs must come from the same 2019 material-flow record rather than a copied number.

### Gate 3: no load-bearing number may exist only as a code literal

The NHA audit found model constants that had no parameter record, source, uncertainty, or Monte Carlo variation. Their uncertainty was silently treated as zero. This is prohibited.

Rules:

1. Every numeric literal that affects a public result must resolve to a canonical parameter, observed record, transformation setting, or declared mathematical constant.
2. Mathematical constants and harmless display constants must be placed on a small reviewed allowlist.
3. Thresholds, shares, rates, efficiencies, lags, elasticities, weights, costs, lifetimes, and scenario multipliers are parameters, not anonymous numbers.
4. Every load-bearing parameter must expose unit, geography, period, source or assumption status, confidence, use class, natural domain, and model participation.
5. A low-confidence assumption may be used only if it is visible, adjustable where appropriate, included in sensitivity analysis, and not described as observed evidence.
6. An unsourced parameter must not be enabled in the recommended default merely because it produces a desirable result. If it is essential, its assumption status and influence must be prominent.
7. A research range must not be collapsed to a point or midpoint in code unless the transformation is documented and the original uncertainty remains available to the model.
8. A parameter that research identifies as primary, load-bearing, highest-value, or decision-critical must exist in the canonical parameter registry even if its value remains null and its status is pending.

Minimum parameter schema:

```ts
export interface ParameterDefinition {
  id: string;
  label: string;
  description: string;
  valueType: 'point' | 'range' | 'triangular' | 'categorical' | 'time_series';
  low?: number;
  mode?: number;
  high?: number;
  baseMin?: number;
  baseMax?: number;
  stressMin?: number;
  stressMax?: number;
  unit: string;
  geography: string;
  period: string;
  currencyYear?: number;
  sourceIds: string[];
  confidence: 'high' | 'medium' | 'low' | 'not_assessed';
  useAs: 'calibration' | 'trend' | 'benchmark' | 'constraint' | 'display_only';
  participation: 'model_input' | 'validation_only' | 'display_only';
  adjustable: boolean;
  naturalMin?: number;
  naturalMax?: number;
  proxyFor?: string;
  assumptionNote?: string;
  divergenceNote?: string;
  status: 'active' | 'provisional' | 'pending' | 'superseded';
}
```

The implemented schema may be extended, but it must retain these distinctions.

### Gate 4: source fidelity is checked at the value and claim level

The existence of a citation is not enough. The NHA audit found citations that were real but did not support the displayed quantity, denominator, scope, or interpretation.

Rules:

1. A source attached to a number must contain or directly support that number or its documented derivation.
2. Aggregate spending cannot source a per-unit price. A national average cannot source a facility effect. A scenario milestone cannot source an observed trend.
3. Search-engine snippets, summaries, and secondary reporting cannot substitute for an available primary table or official dataset.
4. Derived values must identify the published inputs, formula, transformation, and confidence treatment.
5. A source record must identify the specific table, series, figure, page, cell, or locator where practical.
6. Confidence must be based on the full derivation, not the strongest input. A calculation using high-confidence wages and a low-confidence staffing mix remains limited by the staffing mix.
7. Proxies must identify both the observed entity and the entity for which it is used. Proxy uncertainty remains visible in downstream results.
8. When sources with different biases are triangulated, the method and reason for the resulting range must be documented.
9. A source URL must not be attached to an assumption merely to make the record look complete.
10. No record graded medium or high may have an empty source unless its confidence comes from a fully documented internal identity or proof. Such exceptions require an explicit reason and a testable transformation.
11. Superseded data must be replaced or visibly labeled. A newer referenced vintage cannot coexist with an older active value without an explicit reason.
12. Legal, regulatory, market, and operational facts require an as-of date and release-time verification.
13. Every public comparison line or benchmark must declare its accounting basis. An undefined external claim may be discussed, but not plotted as a comparable quantity.

Required source-fidelity checks:

- every numeric claim resolves to its input records;
- every active medium- or high-confidence record has supporting sources;
- derived metrics list all inputs and the transform version;
- source year, data year, access date, and model vintage are not conflated;
- active records do not cite a superseded vintage without a documented exception;
- the figure’s unit, denominator, and geography match the supporting source record.

### Gate 5: confidence propagates through the weakest load-bearing link

The NHA audit showed how a table of precise official inputs can make an unsourced derived model appear more certain than it is. Confidence laundering is prohibited.

Rules:

1. The confidence of a derived output cannot exceed the weakest load-bearing input, structural assumption, proxy, or transformation without a written and reviewed rationale.
2. Confidence is assigned to components as well as totals. A blended output with a medium component and a low component must expose the split.
3. A wide or contested evidence range must be modeled as a distribution or bounded sensitivity, not hidden in a prose footnote beside a point estimate.
4. If the implemented range excludes the range recommended by its research file, the parameter must carry a divergence note stating direction, rationale, and effect.
5. Increasing source precision does not automatically raise model confidence when the model structure remains uncertain.
6. Dashboard formatting must not make low-confidence strategy results appear visually equivalent to observations.
7. Default recommendations must report sensitivity to the lowest-confidence high-influence assumptions.

### Gate 6: vintages, denominators, currencies, and scopes are controlled data

The NHA audit found pages using different population and household denominators, mixed source vintages, nominal values in real-dollar models, and placeholder years such as “recent.”

Rules:

1. Every record has a real period or explicit undated status. Placeholder years such as “recent,” “current,” or “study year varies” are forbidden in computational records.
2. Every dataset declares whether it is calibration, trend, benchmark, constraint, or display-only.
3. Calibration values must share the declared base period or use an explicit, sourced transformation to that base.
4. No sum may mix calibration, trend, benchmark, and display-only records.
5. Population, household, customer, worker, facility, watershed, and geographic denominators must come from a canonical denominator registry.
6. Per-capita and per-household outputs must show the denominator vintage and definition.
7. Two legitimate denominators may coexist only when their series and use cases are distinct and visible.
8. Currency records must identify nominal or real status and currency year. Nominal values must not enter a real-dollar calculation without a documented conversion.
9. Model-family accounting boundaries and geographic domains must remain distinct.
10. A historical series definition change must be stored as a break, not smoothed away.
11. Every headline statistic must reproduce from declared canonical inputs.
12. Page copy must not describe the start of a phase as the date an outcome is fully achieved.

### Gate 7: overlapping mechanisms are non-additive by construction

The NHA audit found both good and bad implementations of overlap. The reliable implementations computed residuals or differences between worlds; the faulty implementation summed overlapping instruments and overstated the result.

Rules:

1. Every modeled benefit, cost, demand reduction, emissions reduction, capacity contribution, revenue, water saving, and material saving has exactly one declared home.
2. Components shown as a decomposition must be pairwise disjoint or have an explicit overlap treatment.
3. Known overlap must be handled through residual attribution, mutual exclusion, an overlap-deduction term, or a causal model that makes double counting impossible.
4. A narrative warning about overlap is not a substitute for enforcing the rule in the calculation.
5. Source scenarios that contain totals and components must use one level of the hierarchy at a time.
6. EV, data-center, and other contained loads remain overlays unless a verified mutually exclusive decomposition is used.
7. Gross and net effects must never be presented as interchangeable.
8. The model must assert exact decomposition identities where they are claimed.
9. Reconciliation should compare independently derived quantities. Comparing two totals produced by the same flawed sum is not a valid reconciliation test.
10. Every clamp, floor, cap, residual, and overlap deduction must report when it binds and its effect on the output.

### Gate 8: scenarios must be declared, bounded, executable, and fully tested

The NHA audit found scenario keys that could fail silently, stress overrides outside undocumented ranges, deprecated parameters still referenced by scenarios, and most scenarios never executed by tests.

Rules:

1. Every scenario has a canonical ID, description, model family, purpose, evidence status, and explicit override set.
2. Base uncertainty bounds and stress bounds are different concepts and must be stored separately.
3. Every override key must resolve to an active parameter or declared structural control. Unknown keys throw an error.
4. Every override must fall within declared stress bounds and the parameter’s natural domain.
5. Shares, probabilities, fractions, and efficiencies must remain within their natural domains after every transformation and multiplier.
6. Every scenario in the catalog must execute in automated tests, not just the default.
7. All scenario outputs used by the UI must be finite or use an explicit sentinel. `NaN`, positive infinity, and negative infinity are hard failures.
8. Outputs that cannot be negative must remain non-negative across all scenarios, horizons, and tested parameter corners.
9. Scenario-sensitive dates, labels, promises, and metrics must update with the scenario or state clearly that they are fixed reference information.
10. Deprecating or renaming a parameter requires migrating every scenario override in the same change.
11. Scenario counts must be asserted against the canonical registry so untested additions cannot appear silently.
12. Stress scenarios must be described as stress cases, not as probability statements.

### Gate 9: the interface must never promise more than the model state delivers

The NHA audit found cards that promised a completed outcome in the year a rollout merely began. It also found hard-coded dates that did not change when a scenario delayed implementation.

Rules:

1. Dates, milestone labels, and outcome claims are derived from the same canonical state or ramp that drives the model.
2. The start of a build phase, first partial coverage, majority coverage, and full target achievement are distinct milestones.
3. A card that says “from YEAR” must use the first year the promised condition is actually satisfied, not the year activity begins.
4. If a result is phased, the interface must show the phase range or the attainment curve.
5. Scenario delays and build constraints must propagate to cards, charts, narrative summaries, downloads, and methodology.
6. Static contextual dates must be labeled as fixed context and must not appear to respond to scenario controls.
7. A displayed value and its source, confidence, and caveat must come from the same record or result object.
8. “Not covered,” “not applicable,” “not available,” “zero,” and “unchanged” require distinct visual states.
9. A model change that moves a headline result must publish the delta and reason. Codex must not absorb the difference through retuning.
10. Model limitations and contested interpretations that affect a visible claim must appear next to the figure or result, not only on the Methods page.

### Gate 10: geography and maps require completeness, uniqueness, and fit-for-purpose evidence

The NHA audit found geographic records silently skipped, duplicates silently overwritten, map claims not enforced, and a state abbreviation interpreted as a professional acronym.

Rules:

1. Every geographic join must declare expected cardinality and fail on missing or duplicate matches.
2. A map claiming complete coverage must test the exact expected geography set.
3. Duplicate assignments may not overwrite silently.
4. Missing records may not be silently skipped. The map must fail, display a visible unavailable state, or show an explicit missing geography.
5. Geometry resolution must match the claim. State data cannot support county shading; national averages cannot support facility symbols.
6. Approximate geometry, centroids, corridors, and service areas require visible labels.
7. A geographic allocation model must distinguish observed location, derived allocation, planning classification, and scenario siting.
8. Map colors must be assigned with adjacency and perceptual separation in mind. Adjacent regions may not be visually indistinguishable when color is used to show membership.
9. Acronym-decoration utilities must not run indiscriminately over geographic codes, units, identifiers, or generated labels.
10. State, province, balancing-authority, watershed, chemical, and unit abbreviations require scoped vocabularies.
11. A partial data-load failure must update the map, controls, linked charts, and status message together. Silent empty controls are forbidden.
12. Every map needs a non-map table or text alternative.

### Gate 11: controlled vocabularies must fail closed

The NHA audit found misspelled tags silently disappearing from filters and IDs that did not conform to a declared convention.

Rules:

1. Status, confidence, evidence state, unit family, use class, scenario type, technology, sector, geography type, risk type, source type, and chart type must use declared controlled vocabularies.
2. Unknown vocabulary values fail validation. They must not fall through to “other” unless “other” is an explicit canonical value.
3. Every filterable record must contain at least one valid classification for each required filter dimension.
4. Renaming a vocabulary term requires a migration, not a silent string replacement in only one module.
5. UI labels are derived from the vocabulary registry, not independently typed in each page.
6. Acronyms and abbreviations use a shared, escaped, longest-match-first utility scoped to prose containers.

### Gate 12: tests must be unified, meaningful, and independently capable of failure

The NHA audit found two incompatible test harnesses, advertised counts that did not equal executed tests, and reconciliation tests that compared two quantities produced by the same faulty calculation.

Rules:

1. The project has one test registry and one runner for dashboard integrity tests.
2. Unit-test frameworks may have separate files and groups, but the integrity summary must enumerate all registered groups and their executed, passed, failed, skipped, and pending counts.
3. The advertised count must equal the number actually registered and executed or explicitly skipped.
4. No test group may be omitted from the integrity footer because it failed to load.
5. Reconciliation tests must use independently derived quantities or independent source totals.
6. Snapshot tests may guard accidental change, but they must not be described as source reconciliation.
7. A test that only verifies arithmetic against a hard-coded result from the same formula is insufficient for a sourced model.
8. Property tests must cover natural domains, monotonic relationships, decomposition identities, bounds, and finite outputs where those properties are claimed.
9. Every scenario, route, chart contract, model, transformation, and controlled-vocabulary registry must be covered by at least one execution or integrity test.
10. Parameter-corner and stress tests must include extreme combinations likely to expose negative values, double counting, domain overflow, or unattainable promises.
11. When an expected value changes because the model changes, Codex must review and update the test deliberately. It must not weaken the assertion merely to make the suite pass.
12. A pending audit backlog must be noisy on every test run and visible in the product until it reaches zero.

### Gate 13: open gaps and audit status are product data

The NHA audit found consequential open items buried in prose and stale blocker notes that caused later work to repeat completed research.

Rules:

1. Every unresolved research, source, parameter, model, legal, geographic, and implementation gap has a canonical open-item record.
2. Each open item records status, severity, affected outputs, owner or workstream, blocking condition, next action, created date, last reviewed date, and closure evidence.
3. Any gap referenced in methodology or code must appear in the published gap register.
4. A parameter or chart blocked by a gap must link to that gap.
5. Closed gaps must be marked closed and stale blocker prose removed or updated in the same change.
6. Deferred work remains queryable. It must not be represented only by comments, memory, or a conversation transcript.
7. The integrity footer reports the count of active release-blocking and non-blocking gaps.
8. A gap may justify an unavailable module. It may not justify a fabricated value.

Minimum open-item schema:

```ts
export interface OpenItem {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'blocked' | 'closed';
  severity: 'release_blocking' | 'high' | 'medium' | 'low';
  affectedIds: string[];
  owner: string;
  blockingCondition?: string;
  nextAction: string;
  created: string;
  lastReviewed: string;
  closedByEvidenceIds?: string[];
}
```

### Gate 14: model code may not make a stronger normative or causal claim than the evidence and narrative

The NHA audit included an example where a load-bearing ethical boundary needed to be enforced in code because an unconstrained formula could make a philosophical claim the written framework declined to make. This generalizes to scientific and policy claims throughout this dashboard.

Rules:

1. Every model output must have a declared interpretation and prohibited interpretations.
2. Physical, ethical, legal, and policy guardrails that define the meaning of an output must be encoded as model constraints or tests where possible.
3. A model must not imply zero risk, perfect reliability, complete elimination, universal causation, or an inevitable outcome unless the evidence and design explicitly support that claim.
4. Interventions must affect only the mechanisms the evidence supports. A water-supply intervention cannot automatically reduce water-quality risk; generation capacity cannot automatically count as accredited capacity; adaptation cannot automatically erase exposure.
5. Claimed directional relationships require monotonicity or sign tests where the model structure asserts them.
6. Residual risk must remain visible.
7. Contested normative questions require adjacent explanation of the chosen model boundary.

### Gate 15: failures must be loud, local, and complete

Rules:

1. Unknown IDs, unknown override keys, invalid vocabulary values, unit mismatches, and missing required joins throw build or test errors.
2. Client-side data failures show a useful error state in every dependent view.
3. Partial results must identify which inputs or modules failed.
4. The application must not render `NaN`, `Infinity`, undefined, blank axes, silently empty selectors, or misleading zeros.
5. A fallback dataset or value may be used only if it is explicitly declared, versioned, and shown to the reader.
6. Build logs and integrity summaries must identify skipped and pending checks.
7. Errors should name the canonical IDs and contracts involved so the defect can be traced.

### Gate 16: model changes are audited as changes to public claims

Rules:

1. Any change to a load-bearing parameter, source, transformation, denominator, range, scenario, or model equation requires an impact report.
2. The impact report identifies which public metrics, charts, tabs, recommendations, and downloads changed.
3. Old and new headline results are compared using the same scope and scenario.
4. Changes are not tuned away to preserve a previous answer.
5. Conservative and optimistic divergences from research are both disclosed. Opposing biases do not excuse leaving both hidden.
6. A migration that changes IDs or model structure must include backward traceability through superseded IDs or model versions.
7. Data-only, display-only, validation-only, and computational records must be distinguished so a later join cannot accidentally promote display context into a model input.

## Audit-prevention test matrix

The following checks are mandatory additions to the general testing requirements later in this specification.

| Test group | Required assertion |
|---|---|
| Registry identity | Every canonical ID is unique and every reference resolves exactly once. |
| Semantic binding | Referenced type, unit family, and description correspond to the consuming contract. |
| Source coverage | Every active medium- or high-confidence numeric record has supporting source records. |
| Source fidelity | The cited source supports the value, denominator, geography, period, and interpretation displayed. |
| Vintage | Every computational record has an explicit period and satisfies its base-year rule. |
| Use class | No calculation mixes calibration, trend, benchmark, constraint, or display-only records improperly. |
| Denominators | Per-capita and per-household results use canonical declared denominators. |
| Currency | Nominal and real values do not mix without an explicit conversion. |
| Headline reproduction | Every public headline metric reproduces from canonical data or model results. |
| Magic numbers | No load-bearing model literal exists outside the parameter registry and reviewed constant allowlist. |
| Single owner | Shared values and controls have one canonical state and match across tabs. |
| Parameter ranges | Implemented base ranges include the research range or carry a divergence note. |
| Stress bounds | Every scenario override is within declared stress and natural bounds. |
| Override keys | Every override key resolves; unknown keys fail loudly. |
| Scenario execution | Every scenario runs and returns finite, domain-valid results. |
| Scenario UI parity | Scenario-sensitive dates, cards, charts, and downloads reflect the same state. |
| Non-overlap | Declared components are pairwise disjoint or have an enforced overlap treatment. |
| Decomposition | Components sum exactly to their declared total where required. |
| Independent reconciliation | At least one independent total or source benchmark checks every major model module. |
| Clamp disclosure | A binding cap, floor, clamp, or residual is recorded and visible. |
| Confidence propagation | Derived confidence does not exceed its weakest load-bearing component without a rationale. |
| Controlled vocabulary | Every classified value is in its canonical vocabulary. |
| Geographic completeness | Expected geographies appear exactly once in complete-coverage views. |
| Geographic join | Missing and duplicate joins fail instead of skipping or overwriting. |
| Map encoding | Adjacent membership regions remain visually distinguishable. |
| Chart geometry | Coordinates and scale domains are finite; missing is not rendered as zero. |
| Model properties | Claimed monotonicity, natural domains, and residual-risk constraints hold at parameter corners. |
| Route promises | A displayed attainment year matches the year its driving state reaches the promised threshold. |
| Gap publication | Every referenced open item appears in the canonical and published gap registers. |
| Stale blockers | No open blocker remains active after its required evidence is present. |
| Harness integrity | Registered, executed, passed, failed, skipped, and pending test totals reconcile. |
| Change impact | Load-bearing changes produce a scoped old-versus-new impact report. |

## Required pre-build sequence derived from the audit

Before Codex builds the first public route, it must complete these foundations:

1. Define namespace ownership and create or validate canonical registries for sources, claims, datasets, metrics, parameters, charts, transformations, scenarios, models, vocabularies, routes, and open items.
2. Generate a collision and orphan report across the existing research corpus.
3. Define the canonical denominator, vintage, currency, and use-class registries.
4. Define the shared parameter and scenario schemas, including natural, base, and stress bounds.
5. Create the single test registry and reconciled integrity-summary contract.
6. Build source-fidelity and semantic-binding validators.
7. Resolve release-blocking collisions and unmatched references before a model or page consumes them.
8. Record unresolved values as open items with null values and visible unavailable states.

This sequence is intentionally earlier than visual implementation. The NHA audit shows that retrofitting canonical identity, provenance, and reconciliation after pages and models exist is much more expensive and leaves public values vulnerable to silent corruption.

## Repository and implementation assumptions

The current repository is in the research and documentation phase. Codex should treat existing files as user work and preserve them.

The intended top-level structure is:

```text
docs/                       planning, research, and design documentation
research/                   evidence corpus and source-linked datasets
src/
  components/               shared Astro components
  content/                  narrative copy and structured chapter content
  layouts/                  shared page layouts
  lib/
    charts/                  chart primitives and geometry
    data/                    build-time data adapters
    evidence/                claims, sources, badges, and provenance
    models/                  authorized accounting and scenario calculations
    navigation/              route and chapter definitions
  pages/                     Astro routes
  scripts/                   small per-route client modules
  styles/                    tokens, global rules, and component styles
public/
  data/                      intentionally published machine-readable data
  assets/                    static media and icons
tests/
  data/                      schema, identity, and transformation tests
  evidence/                  claim and source tests
  models/                    accounting and invariant tests
  pages/                     route and content-contract tests
  charts/                    geometry and accessibility tests
```

Codex should use one typed configuration as the single source of truth for supersections, tabs, paths, labels, story order, and chapter navigation.

## Required routes and narrative order

| Order | Route | Supersection | Label | Role |
|---:|---|---|---|---|
| 0 | `/` | Sitewide | Overview | Connect the system and introduce the recommended portfolio. |
| 1 | `/energy/system` | Energy | Energy System | Explain services, flows, accounting, and electrification. |
| 2 | `/energy/demand` | Energy | Demand & Electrification | Explain demand growth, end uses, peaks, efficiency, and flexibility. |
| 3 | `/energy/generation` | Energy | Generation Choices | Compare generation, storage, impacts, and portfolio roles. |
| 4 | `/energy/grid` | Energy | Grid & Delivery | Explain hourly demand, queues, transmission, process, and supply chains. |
| 5 | `/energy/plan` | Energy | Energy Plan | Synthesize and stress-test the advocated energy portfolio. |
| 6 | `/climate/cause` | Climate | Cause & Trajectory | Explain attribution, cumulative emissions, and warming pathways. |
| 7 | `/climate/risks` | Climate | Impacts & Risk | Explain the temperature-risk ladder and multivariate impacts. |
| 8 | `/climate/coasts` | Climate | Coasts & Communities | Explain local sea level, habitability, adaptation, and migration. |
| 9 | `/climate/plan` | Climate | Climate Plan | Combine mitigation and adaptation under uncertainty. |
| 10 | `/food-water/freshwater` | Food & Water | Freshwater Security | Explain use, consumption, sources, risk horizons, and portfolios. |
| 11 | `/food-water/food` | Food & Water | Food & Agriculture | Explain nutrition, production, water, climate, waste, and resilience. |
| 12 | `/food-water/industry` | Food & Water | Water for Energy & Industry | Explain facility demand, siting, reuse, and watershed constraints. |
| 13 | `/food-water/plastics` | Food & Water | Plastics & Materials | Explain flows, health, water, alternatives, and circular strategies. |
| 14 | `/food-water/plan` | Food & Water | Food & Water Plan | Combine basin, food, industrial, and material portfolios. |
| 15 | `/methods` | Sitewide | Evidence & Methods | Expose sources, definitions, transformations, models, gaps, and checks. |

Back and Next navigation should follow this order. Supersection landing behavior should open the first tab in the selected supersection. The interface may provide a supersection summary menu, but it should not add empty landing routes.

## Shared page contract

Every story route must contain the following elements in this order:

1. **Chapter introduction**
   - supersection eyebrow;
   - tab title;
   - one-sentence decision question;
   - evidence-vintage and scope badges;
   - a concise statement of what the reader will know by the end.
2. **Current system**
   - three to five headline metrics;
   - one system-level figure;
   - short definitions for the measures most likely to be confused.
3. **Why this is a problem**
   - five to seven viewpoint cards selected from the shared viewpoint set;
   - evidence-linked burdens and constraints;
   - no moral caricatures of opposing stakeholders.
4. **Choices**
   - at least three plausible strategies;
   - common comparison dimensions;
   - benefits, costs, lead time, dependencies, residual risk, and evidence maturity.
5. **Recommended design**
   - a prominent, unambiguous recommendation;
   - the reasoning chain from evidence to recommendation;
   - what the recommendation does not claim or solve.
6. **Model-supported case**
   - reference assumptions;
   - advocated assumptions;
   - at least one stress case;
   - inputs, outputs, invariants, uncertainty, and model boundary;
   - a visible unavailable state if the model is not authorized.
7. **Delivery**
   - sequence and major dependencies;
   - governance and authority questions;
   - workforce, manufacturing, community, and financing needs where relevant;
   - measurable progress indicators and review gates.
8. **Limits, sources, and navigation**
   - known gaps and prohibited interpretations;
   - source and methodology links;
   - previous and next chapter links;
   - relevant cross-supersection continuation links.

## Shared viewpoint set

Use the same vocabulary across the dashboard, selecting only the viewpoints relevant to each tab:

- People and households
- Workers and operators
- Businesses and producers
- Utilities and infrastructure owners
- Host communities and Tribes
- Public health
- Ecosystems and nonhuman life
- Government and taxpayers
- National security and supply chains
- Future generations

Each viewpoint card must answer:

1. What burden or risk exists in the current system?
2. What does the recommended solution improve for this viewpoint?
3. What burden, tradeoff, or residual risk remains?

## Evidence-state vocabulary

Use one consistent typed vocabulary:

```ts
export type EvidenceState =
  | 'observed'
  | 'reported_estimate'
  | 'preliminary'
  | 'source_scenario'
  | 'dashboard_transformation'
  | 'dashboard_strategy_model'
  | 'qualitative_evidence'
  | 'data_gap';
```

Suggested visual encoding:

| State | Encoding |
|---|---|
| Observed | Solid line or fill |
| Reported estimate | Solid with estimate badge |
| Preliminary | Solid with provisional marker |
| Source scenario | Dashed line and scenario badge |
| Dashboard transformation | Distinct calculation badge and formula access |
| Dashboard strategy model | Accent line with model-version badge |
| Qualitative evidence | Matrix, pathway, or text evidence card |
| Data gap | Hatched or neutral unavailable state, never zero |

Color alone must not communicate evidence state.

## Data and evidence contracts

### Metric record

All chart adapters should emit a common record or an equivalent strongly typed structure:

```ts
export interface MetricRecord {
  id: string;
  metric: string;
  value: number | null;
  unit: string;
  geography: string;
  geographyCode?: string;
  period: string;
  status: EvidenceState;
  sourceId: string;
  claimId?: string;
  datasetId?: string;
  accountingBoundary: string;
  numeratorBoundary?: string;
  denominator?: string;
  scenario?: string;
  model?: string;
  sourceVintage?: string;
  confidence?: 'high' | 'medium' | 'low' | 'not_assessed';
  caveat?: string;
}
```

### Source affordance

Every visible metric or mark must allow the user to reach:

- source ID and publisher;
- source title and URL;
- locator, table, figure, page, or series where available;
- access date and publication or release date;
- claim ID where applicable;
- geography and period;
- unit and boundary;
- observed, estimated, scenario, or transformed status;
- confidence and caveat;
- transformation or model version when applicable.

### Chart contract

Each chart should be defined in a typed contract containing:

- chart ID and title;
- decision question;
- data file or adapter;
- permitted filters;
- x, y, series, and unit definitions;
- default view;
- mandatory annotations;
- forbidden comparisons;
- empty and error states;
- source and methodology links;
- accessibility summary;
- test expectations.

The existing domain `chart-contracts.json` files should be adapted, not rewritten by hand into disconnected chart logic.

### Build-time data handling

- Read research JSON and CSV at build time when possible.
- Do not mutate files under `research/` during normal builds.
- Put transformations in testable TypeScript adapters.
- Publish only the data needed for client-side interaction.
- Retain provenance fields in published subsets.
- Record checksums or a generated manifest for copied public data.
- Use compressed files only when the client can load and parse them reliably without a large dependency.
- Large hourly datasets should be pre-aggregated for common views. Do not ship more than the interaction requires.

## Navigation and shared-state behavior

### Header

The header should contain:

- product title;
- concise purpose line;
- primary navigation for Overview, Energy, Climate, Food & Water, and Evidence & Methods;
- evidence-vintage indicator;
- light/dark theme control;
- mobile navigation control.

### Local tab navigation

When a supersection is active, show its local tabs in order. The active tab must be identifiable without color. The control should support keyboard navigation and horizontal scrolling on narrow screens.

### Story rail

Each story page should have anchors for:

- Current system
- Problems
- Choices
- Recommendation
- Model
- Delivery

The rail may become a compact menu on small screens. It should not obscure content or create a second competing route system.

### Scenario tray

The first draft should provide a reusable scenario tray, but only activate controls supported by the current page. Potential fields include:

- geography;
- period or horizon;
- scenario family;
- source model;
- reference, recommended, or stress view;
- technology, sector, or risk filter;
- unit or normalization;
- distributional lens.

Rules:

- URL query parameters should preserve meaningful page state.
- Defaults must be explicit and restorable.
- Incompatible state must not carry silently between pages.
- A disabled field must explain why it is unavailable.
- Model-family changes must update labels, source information, and caveats.

### Source drawer

Selecting a source badge or chart mark should open an accessible source panel. The panel must be dismissible by keyboard, restore focus correctly, and provide a normal link fallback.

## Shared components

Create components with clear, limited responsibilities:

| Component | Responsibility |
|---|---|
| `SiteHeader` | Product identity, primary navigation, vintage, and theme. |
| `SupersectionNav` | Energy, Climate, and Food & Water navigation. |
| `TabNav` | Local tabs generated from one route definition. |
| `ChapterIntro` | Decision question, scope, vintage, and page promise. |
| `StoryRail` | In-page narrative anchors. |
| `MetricCard` | One value with unit, period, geography, source, and caveat. |
| `ViewpointGrid` | Consistent stakeholder/problem cards. |
| `OptionComparison` | Fair alternatives with common dimensions. |
| `RecommendationPanel` | The advocated design and its reasoning. |
| `ScenarioWorkbench` | Inputs, scenario comparison, outputs, and reset. |
| `EvidenceBadge` | Observed, estimate, scenario, transformation, model, or gap state. |
| `SourceDrawer` | Claim and source details. |
| `CaveatPanel` | Limits and prohibited interpretations. |
| `ChartFrame` | Title, question, legend, plot, annotations, sources, and text summary. |
| `EvidenceGap` | Useful unavailable state with missing inputs and next research action. |
| `ChapterNav` | Previous, next, and cross-mechanism links. |
| `IntegrityFooter` | Reconciled evidence, data, model, chart, route, and accessibility checks. |

Do not make one giant configurable component that contains the whole page. Content should remain readable in Astro templates or structured chapter modules.

## Visualization system

### General rules

- Prefer the smallest figure that makes the relationship clear.
- Use semantic HTML and accessible SVG.
- Generate static SVG at build time where interaction is unnecessary.
- Use small vanilla TypeScript modules for filters, tooltips, scenario controls, and linked highlighting.
- Do not require a client-side framework or CDN.
- Provide a visible title, question, legend, unit, geography, period, source, and caveat.
- Provide a text summary or accessible table for every chart.
- Keep tooltip precision at or below source precision.
- Make missing data visually distinct from zero.
- Guard all geometry against `NaN`, infinity, negative dimensions, and empty domains.
- Use separate panels when measures have incompatible units or accounting boundaries.
- Use logarithmic scales only when justified and clearly labeled.
- Never hide a scenario seam, source-method change, or series-definition break.

### Cross-dashboard color semantics

Create semantic tokens rather than hard-coded colors. The exact palette should be selected for contrast and color-vision accessibility.

Suggested roles:

- Energy observed history: deep blue
- Electricity and electrification: cyan or electric blue
- Fossil sources: charcoal, brown, and muted amber by fuel
- Renewable generation: differentiated greens and golds
- Nuclear and other firm low-carbon: violet
- Storage and flexibility: teal
- Climate forcing and warming: red-orange scale
- Adaptation and resilience: indigo
- Freshwater: blue
- Food and agriculture: green and earth tones
- Plastics and materials: magenta or coral
- Uncertainty: neutral gray bands or hatching
- Missing evidence: neutral outline or hatch

Do not encode “good” and “bad” solely through green and red. Supersection identity colors should not override technology or evidence semantics inside charts.

### Chart interaction

All interactive charts should support:

- keyboard-reachable controls;
- pointer and focus tooltips;
- stable focus after updates;
- a reset to the published default;
- direct access to source and methodology;
- a table or downloadable-data alternative;
- clear loading, empty, and error states.

## Page specifications

The following requirements define the minimum credible first draft. The longer figure inventory and policy rationale remain in `DASHBOARD_STORYBOARD.md`.

### Overview: `/`

**Purpose:** Establish that energy, climate, food, water, and material use are one connected system and introduce the advocated integrated resilience portfolio.

**Required narrative:**

1. The service objective: reliable energy, a stable climate, secure food and water, and safer material use.
2. The current system and its feedbacks.
3. The problem from people, producers, operators, communities, ecosystems, government, and future generations.
4. The three major strategic choices: continue and adapt incrementally; pursue disconnected sector solutions; build an integrated portfolio.
5. The recommended integrated resilience portfolio.
6. What the dashboard can currently quantify and what remains under development.
7. A chapter guide.

**Minimum first-draft figures:**

- connected-system flow diagram;
- current-system evidence scorecard using separate metric cards;
- three-supersection problem and dependency map;
- recommended portfolio architecture;
- readiness-aware outcome matrix comparing reference, recommended, and stress logic without inventing missing values;
- implementation and research roadmap.

**Required conclusion:** Essential services can be expanded and made more resilient only if energy, climate, water, food, and materials are planned together.

### E1. Energy System: `/energy/system`

**Purpose:** Explain energy services, primary resources, electricity, conversion, storage, and the growing importance of electrification.

**Data inputs:**

- `research/energy/observations-global-2025.json`
- `research/energy/observations-us-2025.json`
- `research/energy/timeseries/normalized/global-electricity-generation-history.csv`
- `research/energy/timeseries/normalized/us-electricity-generation-history.csv`
- `research/energy/technology-taxonomy.json`
- relevant scenario catalogs and accounting notes.

**Minimum first-draft figures:**

1. World electricity generation by source with coverage notes.
2. U.S. electricity generation by source, 1949–2025, with the preliminary 2025 state.
3. U.S. primary energy production versus consumption.
4. Resource, carrier, conversion, and storage ontology.
5. Historical-to-scenario seam comparing selected source families without splicing them.

**Working view:** Geography and metric selectors that never put incompatible measures on one unlabeled chart.

**Required recommendation:** Use less primary energy per unit of service, electrify suitable end uses, and decarbonize electricity. Do not frame reduced service as the primary solution.

**Principal caveat:** The first-draft energy accounting view is not an hourly reliability model.

### E2. Demand & Electrification: `/energy/demand`

**Purpose:** Explain how much electricity may be needed, what drives the range, and how efficiency and flexibility change system needs.

**Data inputs:**

- U.S. electricity-consumption history;
- AEO2026 supply-demand and end-use series;
- data-center and EV milestone records;
- NREL electrification stress-test endpoints;
- EIA-930 average hourly load profiles and summaries.

**Minimum first-draft figures:**

1. U.S. electricity sales and use by sector.
2. Eleven AEO2026 demand cases with emphasized reference assumptions and a 2050 endpoint comparison.
3. Residential, commercial, industrial, and transportation decomposition.
4. Data-center total-facility evidence and server-only scenarios in separate panels.
5. EV demand panels with the accounting warning that charging is contained in total demand.
6. Average hourly load profile by selected region and season.
7. Annual-energy-versus-peak explainer.

**Working view:** Select end use, scenario family, and horizon. Show both native values and indexed demand drivers.

**Required recommendation:** Efficient and flexible electrification, including efficiency, managed charging, technically feasible flexible computing and industrial loads, and transparent large-load connection rules.

**Principal caveat:** Do not fabricate future hourly profiles from annual scenario data.

### E3. Generation Choices: `/energy/generation`

**Purpose:** Compare how generation, storage, and flexibility contribute to a reliable low-carbon system and what burdens remain.

**Data inputs:**

- generation history and source scenarios;
- technology taxonomy;
- technology impact matrix;
- lifecycle benchmarks;
- health, regulatory, water, material, waste, and nuclear evidence;
- `research/energy/impacts/dashboard-guidance.json`.

**Minimum first-draft figures:**

1. Technology-by-system-role matrix.
2. Capacity and generation shown in separate panels.
3. Lifecycle greenhouse-gas median and range plot.
4. Technology problem cards covering technical, health, regulatory, and sustainability dimensions.
5. Health causal-pathway diagram.
6. Nuclear deep-dive summary with official-count conflict, utilization, fuel, cooling, health, and waste qualifications.
7. Portfolio comparison table with unavailable quantitative dimensions shown as gaps.

**Working view:** Filter technologies and evidence dimensions. Do not reduce the result to one “clean” score.

**Required recommendation:** Rapid renewables, preservation of safe and economical existing firm low-carbon assets, storage and flexibility, development of additional firm low-carbon options, and an orderly reduction of unabated fossil generation.

**Principal caveat:** The compatible coefficient ledger required for a quantitative all-impact comparison does not yet exist.

### E4. Grid & Delivery: `/energy/grid`

**Purpose:** Explain why hourly demand, interconnection, planning, siting, equipment, construction, and operation determine whether energy can be delivered.

**Data inputs:**

- EIA-930 normalized hourly data and summaries;
- HIFLD 230 kV-plus context layer;
- major-corridor catalog and map;
- needs and expectations;
- process graph;
- transformer and supply-chain evidence;
- bottleneck and gap registers.

**Minimum first-draft figures:**

1. Hourly demand line chart.
2. Selected-balancing-authority calendar heatmap.
3. Major-corridor map with explicit operating and development states.
4. Transmission-capacity semantics chart.
5. Transmission-development swimlane.
6. Demand-growth and transmission-need indexed comparison.
7. Transformer chain and shared supply-chain network.

**Working view:** Region, date, corridor status, capacity type, and process-stage controls. Missing hourly observations must remain missing.

**Required recommendation:** Combine grid-enhancing technologies and reconductoring with new interregional corridors, queue reform, regional planning, community participation, and equipment-capacity expansion.

**Principal caveat:** The public corridor map is context geometry, not an operational power-flow model. Visible corridor MW values must not be summed.

### E5. Energy Plan: `/energy/plan`

**Purpose:** State the recommended energy portfolio and define how it will eventually be stress-tested.

**Data inputs:** All Energy evidence plus future regional hourly profiles, costs, capacity contribution, outages, weather years, transmission constraints, project lead times, workforce, manufacturing, financing, and distributional inputs.

**Minimum first-draft figures:**

1. Recommended energy architecture.
2. Evidence-linked pathway comparison using existing AEO, NREL, and NGFS source scenarios as separate families.
3. Demand, supply, grid, water, land, material, and delivery requirement matrix.
4. Robustness matrix for high demand, delayed transmission, constrained firm capacity, supply-chain delay, drought, and extreme weather.
5. Phased roadmap with evidence and model gates.
6. Model-development panel showing required inputs, equations, outputs, and validation tests.

**Working view:** A scenario-comparison interface may switch among published source scenarios, but it must not claim to be the finished integrated Energy model.

**Required recommendation:** A diversified low-carbon portfolio paired with efficient flexible demand and accelerated grid delivery.

**Principal caveat:** Do not present a least-cost optimum, reliability proof, household bill impact, or final 2050 build mix until the integrated model is validated.

### C1. Cause & Trajectory: `/climate/cause`

**Purpose:** Explain physical causation, observed change, cumulative emissions, and conditional warming pathways.

**Data inputs:**

- normalized observed greenhouse-gas, forcing, and temperature series;
- attribution files;
- cumulative CO2 and TCRE evidence;
- global emissions history;
- assessed warming scenarios;
- clean-room En-ROADS model map and reproduction assessment.

**Minimum first-draft figures:**

1. Emissions-to-warming causal chain.
2. Greenhouse gases, forcing, and temperature small multiples.
3. Correlation-versus-attribution diagnostic.
4. Attribution waterfall with likelihood ranges.
5. Cumulative CO2 with TCRE response range.
6. Future warming across assessed emissions pathways.

**Working view:** Select observed series, scenario, and warming period. Native baselines must remain visible or be rebased only through a documented transformation.

**Required recommendation:** Reduce cumulative CO2 rapidly, reduce potent non-CO2 pollutants, and reach net-zero CO2 to stabilize temperature.

**Principal caveat:** The current corpus supports a causal and scenario explanation, not a precise prediction of annual temperature.

### C2. Impacts & Risk: `/climate/risks`

**Purpose:** Show how risk changes with warming and why impacts require hazard, exposure, vulnerability, and adaptation context.

**Data inputs:**

- temperature-risk ladder;
- extreme heat relationships;
- hurricane evidence;
- biodiversity risk;
- crop-yield sensitivities;
- freshwater, sea-level, food, and displacement evidence.

**Minimum first-draft figures:**

1. Temperature-risk ladder with separate units and confidence.
2. Extreme-heat frequency and intensity response.
3. Tropical-cyclone evidence matrix.
4. Biodiversity risk by warming paired with other direct drivers.
5. Crop-yield sensitivity with adaptation and CO2-fertilization assumptions.
6. Freshwater risk framework.
7. Displacement observations and internal-migration scenarios in separate panels.
8. Risk-priority matrix.

**Working view:** Filter by risk family, warming level, geography, and confidence. Keep unsupported universal coefficients unavailable.

**Required recommendation:** Pair aggressive mitigation with immediate heat protection, resilient essential infrastructure, ecosystem protection, and place-specific food and water adaptation.

**Principal caveat:** Do not publish global hurricane count, food loss, freshwater loss, or refugee totals per degree.

### C3. Coasts & Communities: `/climate/coasts`

**Purpose:** Explain local relative sea level, urban habitability, adaptation choices, displacement, and receiving-city preparation.

**Data inputs:**

- observed local relative sea-level trends;
- NOAA local scenario series;
- high-tide flooding;
- city risk profiles;
- Miami-Dade planning ranges;
- land-motion exposure;
- migration stress tests;
- receiving-city capacity and adaptation pathways.

**Minimum first-draft figures:**

1. Observed local trend dot and uncertainty plot.
2. Local relative sea-level scenario fan.
3. High-tide flood days.
4. Habitability cascade.
5. Exposure comparison with land motion.
6. Origin-destination migration stress test.
7. Receiving-city capacity framework.
8. Adaptive-pathways timeline.

**Working view:** Select city, scenario, and horizon. The selected city must show its source gauge, baseline, and planning context.

**Required recommendation:** Local adaptive pathways combining protection, accommodation, restoration, exposure avoidance, and funded voluntary relocation where durable protection is not equitable or feasible.

**Principal caveat:** A threshold flood day does not mean an entire city is flooded, and a high-end migration scenario is not a forecast.

### C4. Climate Plan: `/climate/plan`

**Purpose:** Combine mitigation and adaptation into a robust strategy under uncertainty.

**Data inputs:** Climate evidence linked transparently to Energy pathway outputs, plus future adaptation cost, asset exposure, health, insurance, infrastructure, and distributional inputs.

**Minimum first-draft figures:**

1. Mitigation-to-warming-to-risk map.
2. Separate source-scenario comparisons for emissions and warming.
3. Mitigation lever matrix.
4. Adaptation package by risk and responsible system.
5. Residual-risk matrix under lower, central, and severe stress cases.
6. “Mitigate low, adapt high” implementation and research roadmap.
7. Robust-decision model contract.

**Working view:** Compare source scenarios and adaptation strategies qualitatively and through authorized dose-response relationships. Do not manufacture integrated damage totals.

**Required recommendation:** Pursue the lowest feasible emissions pathway while stress-testing essential services and long-lived assets against more severe locally credible conditions.

**Principal caveat:** The first draft is a robust-decision framework, not a national cost-benefit solution.

### FW1. Freshwater Security: `/food-water/freshwater`

**Purpose:** Explain where, when, and why water becomes unavailable and how basin-specific portfolios protect essential service.

**Data inputs:**

- USGS historical water use;
- national water-use accounting;
- household, agriculture, and city-source records;
- risk horizons;
- coastal saltwater intrusion evidence;
- desalination and atmospheric-water-generation scenarios;
- cross-domain intervention findings.

**Minimum first-draft figures:**

1. U.S. withdrawals by category and source, 1950–2015.
2. Withdrawal versus consumptive use.
3. Household water-service ladder.
4. Selected-city source-dependency map and portfolio panel.
5. Typed freshwater-risk horizon timeline.
6. Coastal saltwater-intrusion causal diagram.
7. Desalination and atmospheric-water-generation scale comparison.
8. Intervention decision matrix.

**Working view:** Select sector, source, city, risk type, or technology scale. Metric labels must remain explicit.

**Required recommendation:** Basin and utility portfolios that begin with efficiency, leak repair, reuse, watershed and aquifer protection, and operating improvements, then add targeted new supply where justified.

**Principal caveat:** Do not convert planning counterfactuals, drought conditions, or regulatory deadlines into “run-out” dates.

### FW2. Food & Agriculture: `/food-water/food`

**Purpose:** Establish the food-system decision framework and use the verified climate and water evidence that is currently available without pretending the missing national food baseline exists.

**Data inputs currently authorized:**

- climate crop-yield relationships;
- agriculture water evidence;
- groundwater transition cases;
- relevant climate and water scenarios.

**Minimum first-draft figures:**

1. Food-system boundary diagram from inputs through nutrition, waste, and environmental outputs.
2. Crop-yield climate sensitivity figure.
3. Groundwater-dependent agriculture transition case.
4. Evidence-readiness matrix for production, nutrition, affordability, land, water, energy, emissions, waste, trade, and labor.
5. Proposed food-water-land model diagram.
6. Options comparison: yield-only, demand-only, technology-only, and resilient portfolio.

**Working view:** Filter the existing evidence by crop, geography, warming level, and evidence status. Missing modules must describe required data and the next research action.

**Required recommendation:** Climate-resilient productivity, regionally appropriate crops and irrigation, soil and ecosystem protection, reduced loss and waste, supply-chain diversity, and affordable healthy diets.

**Principal caveat:** Do not estimate a national optimized diet, food-security result, or land-water tradeoff until the food baseline is built.

### FW3. Water for Energy & Industry: `/food-water/industry`

**Purpose:** Explain how power plants, data centers, manufacturing, and large facilities should fit within local water and infrastructure limits.

**Data inputs:**

- thermoelectric water context;
- data-center direct-water estimates and projection ranges;
- relevant energy-demand data;
- manufacturing and plastics-water gaps;
- water-energy cross-domain findings.

**Minimum first-draft figures:**

1. National-to-local industrial water scale comparison.
2. Data-center direct water, current estimate and scenario range.
3. Direct versus indirect data-center water boundary.
4. Thermoelectric withdrawal and consumption explainer.
5. Facility-to-utility-to-watershed system diagram.
6. Siting and drought-operating scorecard.
7. Facility-level evidence-gap map.

**Working view:** Compare facility types and water-accounting boundaries. A future site map must remain disabled until verified facility, source, seasonal, and utility data are present.

**Required recommendation:** Watershed-budget siting and operation with disclosure, efficiency, reuse, drought triggers, community protection, and energy-system coordination.

**Principal caveat:** Nationally small demand does not establish locally small impact, and national averages must not be assigned to facilities.

### FW4. Plastics & Materials: `/food-water/plastics`

**Purpose:** Determine which plastic uses should be eliminated, reused, captured, redesigned, substituted, or retained.

**Data inputs:**

- U.S. material flows;
- resin catalog and manufacturing pathways;
- water-intensity evidence and gross-avoidance scenarios;
- health and environmental evidence;
- country cases;
- seaweed scenarios;
- replacement strategy and evidence gaps.

**Minimum first-draft figures:**

1. U.S. plastic material-flow Sankey.
2. Leading resins and applications.
3. Resin manufacturing and hazard-boundary explorer.
4. Cradle-to-resin water ranges.
5. Health evidence ladder and PFAS-vaccine correction.
6. Country policy-mechanism matrix.
7. Replacement decision tree.
8. Functional-unit water-balance framework with unavailable net terms clearly shown.
9. Seaweed scale funnel as a gated candidate pathway.

**Working view:** Filter by resin, application, exposure entity, health-evidence class, policy mechanism, or replacement pathway.

**Required recommendation:** Eliminate unnecessary and high-exposure uses first, scale reuse and high capture, control hazardous chemistry and emissions, and validate substitutes using functional service and lifecycle evidence.

**Principal caveat:** Do not claim every plastic is equally toxic, detected particles prove causation, another jurisdiction is plastic-free, or gross avoided resin water is net savings.

### FW5. Food & Water Plan: `/food-water/plan`

**Purpose:** State the integrated essential-service portfolio and define the basin-food-industry model needed to test it.

**Data inputs:** All Food & Water evidence plus future basin supply-demand, food-system, facility, infrastructure, ecological-flow, cost, and distributional data.

**Minimum first-draft figures:**

1. Basin-scale food-water-energy-material system map.
2. Essential outcomes and ecological constraints matrix.
3. Portfolio contribution stack for demand, repair, reuse, operating changes, ecosystems, storage, and new supply.
4. Normal, drought, growth, and infrastructure-failure stress matrix.
5. Tradeoff framework across reliability, cost, energy, emissions, ecosystems, and equity.
6. Regional governance and implementation map.
7. Integrated-model contract and release gates.

**Working view:** Compare fragmented planning, supply-only, demand-only, and integrated portfolio strategies using current qualitative and bounded quantitative evidence.

**Required recommendation:** Regionally tailored essential-service portfolios with national evidence, transparency, equity, and resilience standards.

**Principal caveat:** Do not aggregate incompatible basin results into a national average that hides the location of shortage, ecological loss, or household burden.

### Evidence & Methods: `/methods`

**Purpose:** Make the dashboard inspectable and reproducible.

**Required sections:**

1. Evidence classes and publication rules.
2. Source registry and searchable claim ledger.
3. Dataset catalog with geography, period, unit, status, and download.
4. Definitions and accounting boundaries.
5. Scenario registry and model-family crosswalk.
6. Dashboard transformations with formulas and tests.
7. Strategy-model registry with version, inputs, outputs, validation, and limitations.
8. Known source conflicts.
9. Research-gap register.
10. Integrity-test groups and results.
11. Update history and evidence vintage.

The methods page must not be the only place where caveats appear. Page-level claims still require adjacent context.

## Cross-supersection mechanism links

Implement explicit continuation links:

| Origin | Destination | Link label or purpose |
|---|---|---|
| Demand & Electrification | Grid & Delivery | See how annual demand becomes hourly and geographic infrastructure need. |
| Generation Choices | Freshwater Security | Continue into cooling, hydrology, and basin constraints. |
| Energy Plan | Cause & Trajectory | Continue from the energy portfolio to emissions and warming. |
| Cause & Trajectory | Impacts & Risk | Continue from warming to hazard and risk. |
| Impacts & Risk | Food & Agriculture | Continue into food-system exposure and resilience. |
| Coasts & Communities | Freshwater Security | Continue into aquifers, drainage, pumping, and saltwater intrusion. |
| Water for Energy & Industry | Energy Plan | Continue into large-load demand and generation constraints. |
| Plastics & Materials | Food & Water Plan | Continue into replacement-system water, energy, land, and logistics. |

Cross-links must not replace normal chapter order.

## Model architecture for the first draft

### Model classes

The first draft may contain three model classes:

1. **Accounting models:** identities and boundary-preserving calculations, such as generation-to-consumption balance or withdrawal-versus-consumption comparison.
2. **Source-response models:** direct application of a sourced relationship within its valid domain, such as TCRE ranges or a documented technology-scale scenario.
3. **Strategy models:** internally assembled policy scenarios. These require a versioned specification, parameter provenance, tests, and limitations before release.

### Authorized first-draft calculations

Codex may implement calculations already defined and validated in the corpus, including:

- documented electrical-system balance identities;
- source-defined aggregations of mutually exclusive sectors or technologies;
- index transformations with a visible base year;
- scenario endpoint and range comparisons that preserve model identity;
- cumulative CO2 response ranges within the documented TCRE domain;
- existing desalination, atmospheric-water-generation, and gross-resin-water scenario calculations;
- chart-ready summaries already produced by validation scripts.

### Calculations not authorized for the first draft

Do not invent or imply:

- an optimized national generation portfolio;
- a future regional hourly supply profile derived from annual data;
- a transmission power-flow or national transfer-capacity total;
- universal health deaths per MWh;
- universal land, water, material, waste, or cost coefficients across technologies;
- a national climate-damage function;
- climate migrants or refugees per degree;
- a national food-security or diet optimum;
- facility-level water effects from national averages;
- net water savings from plastic substitution without a replacement-system inventory;
- household bills or tax effects without a financing model.

### Strategy-workbench behavior

Where a complete strategy model is unavailable, render a designed “model contract” rather than a disabled blank:

- decision the model must support;
- required inputs;
- authorized equations or modules;
- outputs;
- accounting invariants;
- validation data;
- sensitivity and stress tests;
- unrepresented constraints;
- current readiness;
- next research action.

## Content and writing rules

- Lead with the decision and result, then explain the mechanism.
- Use plain language before technical terminology.
- Define every acronym on first use per page.
- Keep claims scoped by geography, year, metric, and evidence status.
- Say “scenario,” “pathway,” “planning case,” or “stress test” rather than “forecast” when appropriate.
- Present serious alternatives fairly before recommending one.
- State the recommendation directly.
- Do not hide costs, infrastructure, land use, behavior change, opposition, or residual risk.
- Do not use promotional language, catastrophe language, or false certainty.
- Do not describe a model result as what “will” happen.
- Do not repeat caveat-heavy source prose in the main narrative when a clear scoped sentence will do.
- Use compact disclosures and source drawers without making the evidence invisible.
- Keep each page understandable without requiring the reader to have visited earlier pages.

## Visual and interaction design

### Overall character

Use the general NHA pattern of a serious public-policy dashboard: restrained cards, strong typography, compact charts, evidence badges, clearly separated working views, and a continuous chapter narrative. The climate-energy-water dashboard should have its own identity and should not be a visual clone.

The visual tone should convey:

- scientific seriousness;
- practical problem solving;
- abundance and resilience rather than austerity;
- confidence without certainty theater;
- visible complexity managed through hierarchy.

### Layout

- Use a centered content frame with a readable prose width and wider chart breakout regions.
- Keep headline metrics compact and avoid walls of cards.
- Use alternating narrative and figure blocks.
- Give the recommendation panel a distinct but not promotional treatment.
- Keep methodology available near the relevant figure.
- Avoid persistent sidebars that leave too little chart width.
- On wide screens, the story rail may be sticky; on small screens it should collapse.

### Responsive behavior

Required breakpoints should support:

- narrow phones around 320 CSS pixels;
- common mobile widths;
- tablets;
- laptop and desktop views;
- large screens without excessively long line lengths.

Tables should become cards, scroll within labeled containers, or offer a simplified mobile view. Charts should reflow, not merely shrink unreadably.

### Themes

Provide light and dark themes using semantic CSS variables. Respect `prefers-color-scheme`, persist an explicit user selection, and avoid flashing the wrong theme during navigation.

## Accessibility requirements

The first draft should target WCAG 2.2 AA behavior.

At minimum:

- semantic landmarks and heading order;
- one clear page `h1` supplied by the site or chapter contract;
- keyboard access to navigation, controls, dialogs, drawers, and tooltips;
- visible focus indicators;
- sufficient text and non-text contrast;
- no essential information conveyed by color alone;
- touch targets of practical size;
- reduced-motion support;
- descriptive link text;
- chart summaries and accessible data tables;
- labels and instructions for all controls;
- announced updates for scenario results where appropriate;
- correct dialog focus management;
- logical reading order at every breakpoint;
- no horizontal page overflow at narrow widths.

## Performance and resilience requirements

- Produce static HTML for narrative content and initial chart states.
- Keep client JavaScript limited to actual interaction.
- Split route-specific scripts.
- Pre-aggregate large datasets.
- Avoid blocking external fonts, CDNs, analytics, or runtime services.
- Provide readable content if client JavaScript fails.
- Provide loading, empty, stale, and error states for any fetched asset.
- Do not add a live-data view without a visible fetch time and stale-data rule.
- Set performance budgets after the initial scaffold, then enforce them in tests or build reporting.

Recommended initial targets:

- no single route-specific JavaScript bundle above 150 KB compressed without documented justification;
- no uncompressed multi-megabyte dataset loaded by default;
- initial content and primary figure visible without waiting for a large client-side parse;
- no cumulative layout shift caused by charts or theme initialization.

## Testing and verification

### Research validators

Run the existing domain validators before using transformed data:

- energy time-series and impact validators;
- transmission and consumption validators;
- climate and coastal-city validators;
- water validator;
- plastics validator.

The exact commands should be documented in the repository once the runtime is configured. A validator failure blocks publication of affected content.

### Unit tests

Test:

- route configuration and story order;
- data-schema adapters;
- null preservation;
- unit and boundary preservation;
- aggregation rules;
- accounting identities;
- index transforms;
- scenario seams and labels;
- source and claim referential integrity;
- model invariants and reset defaults;
- chart scale domains and geometry guards.

### Page-contract tests

Every story route should be checked for:

- title and decision question;
- Current system, Problems, Choices, Recommendation, Model, and Delivery sections;
- source and methodology access;
- at least one evidence-backed figure or evidence-gap module;
- previous and next navigation;
- active supersection and tab state;
- no prohibited placeholder language;
- no unsupported certainty language in configured headline copy.

### Accessibility checks

Automate what can be automated, then perform keyboard and responsive checks manually. Test source drawers, scenario controls, tooltips, tables, nav, theme, and focus restoration.

### Chart checks

Test:

- no `NaN` or infinite coordinates;
- legends for multiple series;
- units and periods present;
- observed/scenario distinction;
- missing-data treatment;
- series-definition breaks;
- source access;
- accessible summary or table;
- light and dark contrast.

### Integrity footer

The footer should report reconciled groups such as:

- evidence checks;
- source and claim checks;
- data-schema checks;
- accounting and model checks;
- chart checks;
- route and navigation checks;
- accessibility checks.

It must not report a passing total that excludes a failed, skipped, or unloaded group. Skipped checks require an explicit state.

## First-draft delivery phases

### Phase 0: repository discovery and baseline

- Inspect the full repository and all applicable local instructions.
- Record the existing worktree state and preserve unrelated changes.
- Confirm runtime and dependency strategy.
- Run existing research validators.
- Create a build-readiness and data-size inventory.
- Do not change research values to make implementation easier.

### Phase 1: application foundation

- Create the Astro and TypeScript scaffold.
- Add typed route and supersection definitions.
- Build the base layout, header, primary navigation, local tabs, chapter navigation, theme, and footer.
- Establish design tokens and responsive layout.
- Add route-presence and navigation tests.

### Phase 2: evidence and chart foundation

- Build typed source, claim, metric, and chart contracts.
- Add build-time research adapters.
- Build evidence badges, source drawer, chart frame, caveat panel, evidence-gap state, and data-table fallback.
- Create accessible SVG chart primitives.
- Add data, evidence, and chart tests.

### Phase 3: high-readiness explanatory routes

Implement, verify, and visually inspect:

- Energy System;
- Demand & Electrification;
- Cause & Trajectory;
- Impacts & Risk;
- Freshwater Security;
- Plastics & Materials.

These establish most shared chart types and evidence semantics.

### Phase 4: infrastructure and place routes

Implement:

- Generation Choices;
- Grid & Delivery;
- Coasts & Communities;
- Water for Energy & Industry.

Release only the spatial views whose geography and boundaries can be verified.

### Phase 5: lower-readiness and capstone routes

Implement:

- Food & Agriculture;
- Energy Plan;
- Climate Plan;
- Food & Water Plan.

Use evidence-readiness matrices and model contracts where integrated results are not authorized.

### Phase 6: Overview and Methods

- Build the Overview after underlying routes provide stable headline evidence.
- Build the complete Evidence & Methods route.
- Reconcile every Overview metric with its source tab.
- Add cross-supersection mechanism links.

### Phase 7: hardening

- Complete responsive, keyboard, contrast, reduced-motion, print, and no-JavaScript checks.
- Verify all source affordances.
- Run the full validation, test, type-check, and production-build suite.
- Inspect representative routes in light and dark themes at mobile and desktop widths.
- Resolve or document every failed and skipped integrity group.

## Codex execution protocol

When the user asks Codex to implement this specification, Codex should:

1. Read all applicable repository instructions and the three planning documents completely.
2. Inspect the worktree and preserve existing user changes.
3. Complete the audit-derived pre-build registry, namespace, provenance, denominator, scenario, and test-harness foundations before implementing public routes.
4. Create a concrete working plan with verification steps.
5. Implement vertical slices that include content, data, visualization, tests, and responsive behavior.
6. Use existing research adapters and chart contracts rather than embedding unexplained constants in page templates.
7. Keep the user informed during long-running work.
8. Never use fabricated data to unblock a view.
9. Replace an unsupported chart with a designed evidence-gap module and record the release gate.
10. Run proportionate tests after every meaningful slice and the full suite before handoff.
11. Do not commit, push, deploy, or alter external systems unless the user separately authorizes those actions.

## Required deliverables from the implementation run

Codex should hand off:

- the complete source tree;
- data adapters and intentionally published data subsets;
- all 16 routes;
- shared components and design tokens;
- chart and model modules;
- tests and integrity summary;
- updated repository README with local development and build instructions;
- a generated data/model manifest;
- a short implementation report listing completed views, known gaps, deferred models, test results, and recommended next work.

## Acceptance criteria

### Audit-prevention release gates

- [ ] Canonical machine-readable registries exist for every identity-bearing object used by the build.
- [ ] All registry IDs are unique, semantically stable, and resolve exactly once at every reference.
- [ ] No authoritative registry exists only in a rendered document or prose file.
- [ ] Every load-bearing number is a registered parameter, evidence record, or documented transformation rather than an anonymous model literal.
- [ ] Shared facts, parameters, denominators, totals, and controls have one canonical owner and reconcile across tabs.
- [ ] Every active medium- or high-confidence numeric record has a source that supports its exact value, unit, geography, period, denominator, and interpretation.
- [ ] Derived confidence is no higher than its weakest load-bearing evidence, proxy, structure, or assumption unless a reviewed rationale is recorded.
- [ ] Every computational record has an explicit period, use class, accounting boundary, and computational-participation state.
- [ ] Population, household, facility, geography, and other denominators come from canonical declared records.
- [ ] Nominal and real currency values do not mix without an explicit transformation.
- [ ] Known overlaps are prevented or deducted in code, not merely disclosed in prose.
- [ ] Every decomposition has a declared scope and a testable reconciliation.
- [ ] Reconciliation tests compare independently derived values and are capable of detecting shared-calculation faults.
- [ ] Every scenario override key resolves, stays within declared stress and natural bounds, and fails loudly otherwise.
- [ ] Every scenario in the canonical catalog executes in tests and returns finite, domain-valid results.
- [ ] Scenario-sensitive UI promises, dates, charts, cards, and downloads all derive from the same active state.
- [ ] Geographic joins fail on missing or duplicate assignments, and every complete-coverage map proves its expected geography set.
- [ ] Controlled-vocabulary errors fail validation rather than disappearing silently from filters.
- [ ] One integrity harness reconciles registered, executed, passed, failed, skipped, and pending checks.
- [ ] Every open gap is queryable, published, linked to affected outputs, and noisy until closed.
- [ ] Every model output has prohibited interpretations and property tests for any claimed bounds, direction, or residual risk.
- [ ] A load-bearing model change produces an old-versus-new impact report and is not tuned to preserve the previous answer.

### Product completeness

- [ ] All 16 required routes build and navigate correctly.
- [ ] All 14 story tabs contain the complete narrative anatomy.
- [ ] No tab is only a generic placeholder.
- [ ] The Overview accurately reflects underlying tabs.
- [ ] The Methods route exposes evidence and model provenance.
- [ ] Previous, Next, supersection, local tab, and cross-mechanism links work.

### Evidence integrity

- [ ] Every numeric claim has a source or documented transformation.
- [ ] Every chart exposes unit, geography, period, boundary, status, source, and vintage.
- [ ] Observed, estimated, preliminary, source-scenario, transformed, and strategy-model states are distinct.
- [ ] Nulls remain null.
- [ ] Source conflicts remain visible.
- [ ] No prohibited cross-boundary aggregation is present.
- [ ] Every evidence-gap state identifies the missing input and next action.

### Narrative integrity

- [ ] Every tab moves from current system to problems, choices, recommendation, model support, and delivery.
- [ ] Each tab includes multiple relevant viewpoints.
- [ ] Serious alternatives are presented fairly.
- [ ] The recommendation is clear.
- [ ] Tradeoffs and residual risks remain visible.
- [ ] Scenario and prediction language is correct.

### Model integrity

- [ ] Every calculation is authorized by a documented contract.
- [ ] Inputs, outputs, units, boundaries, and versions are visible.
- [ ] Accounting invariants pass.
- [ ] Reset defaults restore the published case.
- [ ] Sensitivity or stress behavior is available where a strategy result is shown.
- [ ] Incomplete integrated models are represented as model contracts, not finished answers.

### Visual and interaction integrity

- [ ] Charts use accessible semantic encodings.
- [ ] Multi-series charts have legends.
- [ ] Tooltips work with pointer and keyboard focus.
- [ ] Every chart has a text or table alternative.
- [ ] Missing data is not confused with zero.
- [ ] Scenario seams and method breaks are visible.
- [ ] Light and dark themes remain legible.
- [ ] Mobile layouts do not overflow or make charts unreadable.

### Accessibility and quality

- [ ] Semantic structure and heading order pass review.
- [ ] All functionality is keyboard accessible.
- [ ] Focus is visible and correctly managed.
- [ ] Contrast meets the target.
- [ ] Reduced-motion preferences are respected.
- [ ] Client JavaScript failure leaves readable core content.
- [ ] Tests, type checks, and production build pass.
- [ ] The integrity footer includes failed, skipped, and unloaded groups rather than hiding them.

## Final design principle

The first draft should already feel like a coherent public argument, not a collection of research charts. A reader should be able to move from the services society needs, through the physical and institutional reasons the current system fails, to a specific integrated solution and a transparent account of what the evidence can and cannot yet prove.

Where the corpus is strong, the dashboard should be numerically specific. Where the corpus is incomplete, it should be structurally specific about the missing data, model, and decision. That distinction is central to the dashboard’s credibility.

# U.S. Climate, Health, and Water Dashboard

An evidence-linked public dashboard about the connected U.S. energy, climate,
food, water, health, and materials systems.

**Live dashboard:** <https://mikehalvorson.github.io/US-Climate-Health-and-Water/>

## First working draft

The first draft contains an Overview, fourteen evidence-linked story chapters,
and an Evidence & Methods workspace. It is a static Astro site with a guided
narrative, accessible figures and data tables, explicit source and caveat
disclosures, small client-side working views, and checksummed public registries.
The evidence vintage is **2026-08-01**.

The 16 public routes are grouped into:

- Overview: the connected-system argument and chapter guide.
- Energy: system, demand, generation, grid, and plan.
- Climate: cause, risks, coasts, and plan.
- Food & Water: freshwater, food, industry, plastics, and plan.
- Evidence & Methods: searchable ledgers, definitions, model boundaries, open
  items, integrity results, and downloads.

## Run and verify locally

Requirements: Node.js 22–24 and pnpm 11.16.

```shell
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm check
pnpm build
pnpm preview
```

`pnpm test` runs the registry, evidence, model, page-contract, chart, and
accessibility-oriented unit tests. `pnpm check` verifies generated artifacts,
Astro, and strict TypeScript. `pnpm build` creates `dist/` and runs every
chapter, sitewide, provenance, accessibility-contract, and release-budget
validator.

## Evidence and public data

Research inputs are under [`research/`](research/). Canonical application
registries are generated from those inputs; builds do not mutate research
files. The Methods route publishes checksummed subsets from
[`public/data/`](public/data/) together with record counts, SHA-256 hashes, and
a data/model manifest.

The current inspection surface covers 215 tracked research inputs, 336 sources,
157 claims, 130 datasets, 117 metrics, 12 parameters, 128 scenarios, 129 chart
contracts, 5 transformations, 17 model contracts, 14 denominators, and 102 open
items. No factual claim or numeric parameter is published as established unless
it clears [`docs/RESEARCH_PROTOCOL.md`](docs/RESEARCH_PROTOCOL.md).

## Known gaps and deferred models

The dashboard deliberately publishes unavailable states rather than filling
them with invented values. The 102-item public gap register includes 12 pending
parameters. The 17 model records describe authorization boundaries; they do not
authorize unsupported optimized portfolios, reliability proofs, national
damage or household-cost totals, diet optima, facility-level effects, or the
nationalization of basin results. Integrated optimization, hourly reliability,
damage, food-system, and facility-water models remain deferred until their
required data, coefficients, validation, and governance gates are complete.

## Update and deployment procedure

1. Add or revise source material under `research/` without changing established
   values silently.
2. Run `pnpm generate:registries` and `pnpm generate:public` intentionally, then
   inspect all generated diffs and open-item changes.
3. Run `pnpm test`, `pnpm check`, and `pnpm build`.
4. Commit and push verified source to `main`.
5. The GitHub Pages workflow repeats the locked install and full quality gate,
   uploads only `dist/`, and deploys the verified artifact.
6. Verify the public base path, representative chapter routes, assets, and
   downloads after deployment.

Architecture and release details are documented in
[`docs/CODEX_FIRST_DRAFT_BUILD_SPEC.md`](docs/CODEX_FIRST_DRAFT_BUILD_SPEC.md),
[`docs/FIRST_DRAFT_IMPLEMENTATION_PLAN.md`](docs/FIRST_DRAFT_IMPLEMENTATION_PLAN.md),
and [`docs/FIRST_DRAFT_IMPLEMENTATION_REPORT.md`](docs/FIRST_DRAFT_IMPLEMENTATION_REPORT.md).

## Evidence rule

Hallucinated facts, invented citations, citation laundering, and sources that
do not support the attached claim are release-blocking defects. When evidence
cannot be verified, the affected output remains explicitly unavailable and the
gap stays visible.

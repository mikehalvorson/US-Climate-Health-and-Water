# First-draft build readiness baseline

Baseline date: 2026-08-09

## Outcome

The repository is ready to begin the registry and toolchain foundation in Step
2. All nine existing research validators pass. No application toolchain,
canonical cross-domain registry layer, public routes, tests, or deployment
workflow exists yet, so route implementation must not begin until the Step 2
and Step 3 identity and provenance gates are complete.

This audit did not change any value under `research/`.

## Repository state before Step 1 changes

| Field | Baseline |
|---|---|
| Branch | `main`, aligned with `origin/main` |
| HEAD | `8d1d3de` (`Initial commit`) |
| Remote | `https://github.com/mikehalvorson/US-Climate-Health-and-Water.git` |
| Tracked files | 1 (`README.md`) |
| Pre-existing tracked modification | Expanded `README.md` |
| Pre-existing untracked files | 214: `.gitignore` (1), `docs/` (4), `research/` (209) |
| Ignored files | `.firecrawl/` working data and 60 files under `research/energy/timeseries/raw/` |
| Application source | Not present |
| Package manifest and lockfile | Not present |
| Tests and CI workflow | Not present |

The pre-existing README, documentation, ignore rules, and research corpus are
all within the dashboard scope. Step 1 publishes that corpus as the
reproducible starting point. Local Firecrawl state and intentionally ignored
raw energy time-series files remain excluded.

## NHA structure assessment

The current National Health Assurance dashboard confirms the following useful
implementation pattern:

- Astro 5 with static output and strict TypeScript;
- one route per chapter under `src/pages/`;
- a base layout that owns global metadata, header, navigation, footer, and
  shared styles;
- one typed tab registry as the navigation and story-order owner;
- small focused Astro components for header, tabs, chapter navigation, and
  footer;
- pure TypeScript modules for facts, parameters, model logic, chart geometry,
  and formatting;
- route-specific vanilla TypeScript modules for interaction;
- one semantic global palette with light and dark themes;
- Vitest suites for model invariants, data contracts, page rendering, and
  regression rules;
- an Astro GitHub Pages workflow that builds from source on the deployment
  branch.

This project must adapt, not clone, that structure. Its two-level supersection
navigation, 16 routes, claim-level source affordances, evidence-state
vocabulary, cross-domain registries, geographic checks, gap register, source
fidelity, and confidence propagation are materially stricter than the NHA
presentation layer.

## Runtime and dependency strategy

| Tool | Available baseline | Intended use |
|---|---:|---|
| Node.js | 24.14.0 bundled locally | Local Astro/TypeScript execution; CI will use a declared supported Node version. |
| pnpm | 11.16.0 bundled locally | Dependency installation and script runner; the repository will pin its package-manager version. |
| Python | 3.12.13 bundled locally | Existing research validators and normalization tools only. |
| Git | 2.53.0.windows.3 | Version-control and direct push workflow. |
| GitHub CLI | Not installed | Not required for direct commit/push; PR automation is unavailable until installed. |

Step 2 will reuse the proven NHA dependency shape: Astro 5, strict TypeScript,
Vitest, and `@astrojs/check`, with exact compatible versions captured in the
lockfile. The app will have no client runtime framework or CDN dependency.
GitHub Pages CI will use Node 22 or another version explicitly supported by the
selected Astro release, independently of the bundled local Node 24 runtime.

## Research corpus inventory

The publishable planning and research scope contains 213 files and 228,529,116
bytes (217.94 MiB).

| Area | Files | Bytes | MiB |
|---|---:|---:|---:|
| `docs/` | 4 | 150,963 | 0.14 |
| `research/` | 209 | 228,378,153 | 217.80 |
| Energy | 93 | 222,492,148 | 212.19 |
| Climate | 69 | 5,546,284 | 5.29 |
| Water | 25 | 170,798 | 0.16 |
| Plastics | 20 | 165,369 | 0.16 |
| Research root files | 2 | 3,554 | less than 0.01 |

### File formats

| Extension | Files | Bytes | MiB |
|---|---:|---:|---:|
| JSON | 126 | 1,330,557 | 1.27 |
| CSV | 45 | 181,067,146 | 172.68 |
| Markdown | 18 | 183,964 | 0.18 |
| Python | 16 | 193,341 | 0.18 |
| Gzip CSV/data | 3 | 18,583,309 | 17.72 |
| GeoJSON | 2 | 26,250,199 | 25.03 |
| XLSX | 1 | 433,031 | 0.41 |
| ASC | 1 | 11,505 | 0.01 |
| ZIP | 1 | 476,064 | 0.45 |

### Largest publishable files

| File | MiB | Build implication |
|---|---:|---|
| `research/energy/transmission/load-shape/timeseries/raw/EIA930_BALANCE_2024_Jul_Dec.csv` | 45.71 | Research input only; never load directly in a route. |
| `research/energy/transmission/load-shape/timeseries/raw/EIA930_BALANCE_2024_Jan_Jun.csv` | 39.81 | Research input only; pre-aggregate. |
| `research/energy/transmission/load-shape/timeseries/raw/EIA930_SUBREGION_2024_Jul_Dec.csv` | 25.19 | Research input only; pre-aggregate. |
| `research/energy/transmission/corridors/base-layers/hifld-transmission-lines-230kv-plus.geojson` | 25.02 | Produce a fit-for-purpose public geometry subset. |
| `research/energy/transmission/load-shape/timeseries/raw/EIA930_SUBREGION_2024_Jan_Jun.csv` | 24.89 | Research input only; pre-aggregate. |
| `research/energy/transmission/load-shape/timeseries/normalized/us-balancing-authority-hourly-demand-2024.csv.gz` | 10.25 | Publish only filtered/aggregated interaction data. |
| `research/energy/timeseries/normalized/us-electricity-projections-nrel-standard-scenarios-2024.csv` | 8.32 | Build-time adapter and route-specific subset. |
| `research/energy/transmission/load-shape/timeseries/normalized/us-subregion-hourly-demand-2024.csv.gz` | 6.80 | Publish only filtered/aggregated interaction data. |
| `research/energy/transmission/load-shape/timeseries/normalized/average-hourly-load-profiles-2024.csv` | 6.27 | Build-time pre-aggregation candidate. |

The largest individual file is below GitHub's 100 MiB per-file limit, but the
corpus is too large for indiscriminate browser delivery. Route bundles must use
precomputed, provenance-retaining subsets and declare performance budgets.

## Research validation baseline

All validators were executed from the repository root with Python 3.12.13.

| Validator | Result | Reconciled output |
|---|---|---|
| `research/energy/timeseries/scripts/validate_timeseries.py` | Pass | 49 JSON files, 7 normalized files, 55,001 rows, 165 sources, 32 datasets, 91 claims; history through 2025, U.S. scenarios through 2050, global scenarios through 2100. |
| `research/energy/impacts/scripts/validate_impacts.py` | Pass | 6 impact JSON files, 16 technologies, 14 regulatory records, 114 sources, 91 claims, 70 load-bearing claims; NRC/EIA reactor-count conflict preserved. |
| `research/energy/consumption/timeseries/scripts/validate_consumption.py` | Pass | 20,997 rows and 9 normalized files; accounting identities and source spot checks verified. |
| `research/energy/transmission/scripts/validate_transmission.py` | Pass | 57 verified/referenced sources, 20 corridors, 10,031 HIFLD features, 25 process nodes, 34 process edges, 44 supply-chain nodes, 53 supply-chain edges, 30 information gaps. |
| `research/energy/transmission/load-shape/timeseries/scripts/validate_eia930.py` | Pass | 535,824 balancing-authority rows, 729,072 subregion rows, 122,980 aggregate rows, 150 summary rows, 68,400 profile rows, 8,756 complete national UTC hours. |
| `research/climate/scripts/validate_climate.py` | Pass | 60 sources, 15 claims, 40 JSON files. |
| `research/climate/coastal-cities/scripts/validate_coastal_cities.py` | Pass | 10 claims, 60 registered sources, 11 JSON files. |
| `research/water/scripts/validate_water.py` | Pass | 63 sources, 20 claims, 14 risks, 18 place profiles, 20 JSON files. |
| `research/plastics/scripts/validate_plastics.py` | Pass | 48 sources, 21 claims, 21 triple-check audits, 9 water scenarios, 17 JSON files. |

These passes validate each existing domain package according to its own rules.
They do not satisfy the build specification's future cross-domain collision,
orphan, semantic-binding, source-fidelity, confidence-propagation, scenario,
denominator, geographic, or unified integrity-harness gates.

## Build readiness by layer

| Layer | Status | Next required action |
|---|---|---|
| Planning and narrative | Ready | Use the 16-route build specification as authoritative. |
| Domain evidence packages | Validator-clean | Ingest through read-only canonical adapters. |
| Cross-domain canonical identity | Missing, release blocking | Define namespaces, schemas, stable IDs, vocabularies, and exact-reference validation. |
| Denominator/vintage/currency/use-class control | Missing, release blocking | Create canonical registries and migration rules. |
| Scenario and parameter contracts | Missing, release blocking | Define base, stress, natural domains, overrides, model family, and execution tests. |
| Open-item and audit product data | Domain gaps exist, no unified owner | Create a canonical public gap register and link affected outputs. |
| Unified test and integrity harness | Missing, release blocking | Add one registry and reconciled summary contract. |
| Astro application | Missing | Scaffold only after registry contracts exist in Step 2. |
| Public routes | Missing | Start vertical slices after Steps 2 through 5. |
| GitHub Pages deployment | Missing | Configure and enable only after full hardening. |

## Principal constraints to carry forward

1. The build specification's 16-route architecture supersedes the earlier
   provisional ten-route table in `INFORMATION_ARCHITECTURE.md`.
2. A domain validator pass is necessary but not sufficient for publication.
   Every public claim still needs canonical identity and source fidelity.
3. The 218 MiB corpus must remain a build input, not a default client payload.
4. Food & Agriculture and all three capstone plans require useful model
   contracts and evidence-readiness views instead of fabricated integrated
   results.
5. Spatial views require exact geography sets, unique joins, fit-for-purpose
   resolution, explicit approximation labels, and non-map alternatives.
6. Observations, reported estimates, preliminary values, source scenarios,
   dashboard transformations, strategy-model outputs, qualitative evidence,
   and gaps require distinct states.
7. NHA's component and static-build pattern is reusable, but its health-policy
   models, parameters, claims, visual identity, and local knowledge base are
   not inputs to this dashboard.

## Step 1 acceptance record

- [x] Full repository and applicable local structure inspected.
- [x] Existing worktree state recorded and unrelated/ignored files preserved.
- [x] Runtime and dependency direction confirmed.
- [x] All existing research validators executed successfully.
- [x] Build-readiness and data-size inventories created.
- [x] No research value changed.
- [x] Full segmented implementation plan recorded.

# Plastics evidence module

Machine-oriented research for the dashboard. The normative content is JSON and CSV; this file defines interpretation rules.

## Scope

- U.S. plastics consumption and waste flows, with an explicit 2019 material-flow baseline.
- Manufacturing pathways for major commodity and engineering polymers.
- Water withdrawal and consumption evidence, including incompatible boundaries.
- Product-service alternatives and country policy examples.
- Seaweed-derived film pathways and U.S. scale scenarios.
- Human-health and environmental evidence with hazard/risk and association/causation separated.
- A correction record for the PFAS-vaccine claim.
- Replacement and gross/net water-accounting rules.

## Non-negotiable semantics

- A polymer, its monomer, its additives, and a degraded particle are different exposure entities.
- Hazard classification is not a consumer-risk estimate; route, dose, duration, life stage, and exposure control matter.
- Association is not causation.
- Bio-based does not mean biodegradable, compostable, non-toxic, or low-water.
- Water withdrawal is not water consumption.
- Resin production is not a finished product life cycle.
- Gross avoided virgin-resin water is not net water saved by a replacement system.
- A country policy restricting selected single-use products is not evidence that the country operates without plastic.
- U.S. material-flow totals from different studies are not merged unless their scopes and years match.

## Publication rule

Every registered source has an identity/existence check and a claim-fidelity check in `sources.json`. Every headline claim has a separate three-check audit in `source-verification.json`. Values that cannot pass those checks remain explicit unresolved records in `gaps.json`.

Run `python research/plastics/scripts/validate_plastics.py` from the repository root before publishing or transforming the package.

Current validated inventory: 48 sources, 21 headline claims, 21 three-check
claim audits, nine gross-water scenarios, and 17 JSON files. Retrieval used
official agency, federal laboratory, publisher, and peer-reviewed records
directly; figure-only water values were visually checked from the source PDF
and are labeled approximate rather than exact.

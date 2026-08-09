# U.S. freshwater evidence package

Machine-oriented research for dashboard ingestion. The package separates physical quantities that are commonly—but incorrectly—combined.

## Required semantic distinctions

- `withdrawal`: water removed from a source; it may be returned.
- `consumptive_use`: withdrawn water evaporated, transpired, incorporated into products/crops, or otherwise not immediately returned to the local system.
- `delivery`: water conveyed by a public supplier to an end user; adding it to the supplier withdrawal double counts the same water.
- `direct_use`: water used at the facility or household.
- `indirect_use`: upstream water attributable to electricity, fuels, materials, or other inputs; it must be reallocated, not added to national withdrawal totals.
- `capacity`: maximum production rate; not annual production or a reliable yield.
- `planning_shortage`: modeled demand minus existing supply under a specified planning condition; not a prediction that customers will receive no water.
- `scenario_horizon`: an assessed year under explicit assumptions; not an expiration date for a river, aquifer, or city.

## Data priority

1. `sources.json` identifies and scopes every source.
2. `claims.json` contains dashboard-safe claims and prohibited interpretations.
3. `source-verification.json` records three checks for every headline claim.
4. `source-link-check.json` records the live-link audit, automation exceptions, and a corrected broken link.
5. Domain files retain numerator, denominator, unit, geography, year, and accounting boundary.
6. `chart-contracts.json` specifies permissible comparisons and mandatory caveats.
7. CSV files provide chart-ready historical, risk-horizon, and technology-scaling records.
8. `gaps.json` prevents unsupported values—especially a national plastics-water coefficient—from entering the dashboard.

The dedicated companion package at [`../plastics/`](../plastics/) now supplies
resin pathways, bounded water-intensity evidence, gross-avoidance calculations,
replacement-system accounting, seaweed scenarios, and health/environmental
evidence. It does not convert those ranges into a national net saving.

Run `python research/water/scripts/validate_water.py` from the repository root. The validator is network-independent and checks referential integrity, three-check audits, accounting identities, scenario calculations, risk labels, and prohibited wording.

## Non-negotiable display rules

- Never label withdrawals as consumption.
- Never add end-use deliveries to public-supply withdrawals.
- Never add data-center indirect electricity water to power-sector water in a national total.
- Never turn a basin model, planning counterfactual, or regulatory deadline into a “city runs out of water” date.
- Never estimate plastics savings with a universal gallons-per-kilogram coefficient.
- Never present atmospheric water generation as source-free: its source is atmospheric moisture and its limiting inputs are humidity, temperature, energy, treatment, and maintenance.

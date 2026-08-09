# Power-generation impacts corpus

Machine-readable context for technical, health, regulatory, and sustainability problems associated with power generation. The corpus preserves benefits, burdens, mitigation, residual risk, uncertainty, and source boundaries as separate fields.

## Files

- `problem-framework.json`: dimension definitions, attribution rules, comparison policy, and cross-dimension examples.
- `technology-impact-matrix.json`: technology-by-technology problem and mitigation register, including fossil, nuclear, solar, wind, hydro, geothermal, bioenergy, waste, marine, CCS, hydrogen, and storage context.
- `nuclear-generation.json`: observed nuclear metrics, official-source conflict, reactor pathways, project status gates, health evidence, licensing, fuel, water, waste, and dashboard requirements.
- `regulatory-status.json`: U.S. federal status registry with as-of dates and reverification intervals.
- `lifecycle-benchmarks.json`: carefully bounded IPCC lifecycle greenhouse-gas medians and ranges with independent corroborating source registries.
- `dashboard-guidance.json`: chart contracts, visual status encoding, impact-linkage schema, and prohibited display patterns.
- `scripts/validate_impacts.py`: identifier, evidence-policy, manifest, technology-coverage, regulatory-freshness, and nuclear-conflict validation.

## Evidence contract

Every `SRC-*` identifier resolves through `../sources.json`; every `CLM-*` identifier resolves through `../claims.json`. Source records contain identity checks. Claim records contain locators, support notes, fidelity checks, confidence, and explicit caveats. Exact official-source conflicts remain unresolved rather than being averaged.

The qualitative matrix identifies pathways to evaluate; it does not assert that every facility has the same impact. Quantitative impact calculations remain disabled until a compatible coefficient ledger records system boundary, denominator, site/configuration, period, source, and uncertainty.

## High-risk update areas

Reverify regulations, operating-reactor counts, licensing status, project stages, and federal program status before each dashboard release. The regulatory registry specifies 14-, 30-, or 90-day review intervals.

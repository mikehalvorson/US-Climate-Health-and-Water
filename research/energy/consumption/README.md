# Electricity consumption and future demand

Purpose: verified, machine-consumable research for comparing global and U.S. electricity generation with consumption expectations through 2050, with global scenario context through 2070-2100.

Normative files:

- `source-verification.json`: source identity, claim-fidelity checks, exact locators, second checks, and rejected/deferred material.
- `demand-drivers.json`: causal inventory for activity, cooling, data centers/AI, EVs, building electrification, industry, hydrogen, efficiency, and load shape.
- `accounting-boundaries.json`: supply-demand equations, overlapping loads, incompatible scopes, and hierarchy rules.
- `findings.json`: atomic research findings linked to the central claim and source ledgers.
- `scenario-statistics.json`: compact observed values, AEO2050 ranges, NGFS 2030/2050/2070 ranges, and sparse official milestones.
- `chart-contracts.json`: thirteen dashboard chart specifications with filters, transformations, and release gates.
- `timeseries/`: schema, acquisition manifest, deterministic normalizer, validator, coverage ledger, and nine normalized CSV files.

Coverage:

- U.S. observed sector sales/use: 1949-2025.
- World historical system demand: 2000-2025 on Ember's gross-generation-plus-net-imports definition.
- U.S. experimental EV electricity overlay: 2018-2025, with a methodology break at 2023.
- U.S. AEO2026 annual scenario series: 11 cases, 2025-2050.
- U.S. sector/end-use projections: residential, commercial, industrial components, EV charging by location, and data-center servers.
- U.S. macro/activity drivers: GDP, population, income, households, floorspace, housing starts, vehicle sales, and travel.
- World final-electricity scenarios: three NGFS models, seven scenarios, 2020-2100 at five-year intervals.
- Matched World scenario generation-to-final-consumption bridge for the same models, scenarios, and years.
- Sparse official milestones: IEA world total demand, data centers, EVs; LBNL U.S. data centers; NREL U.S. electrification endpoints.

Publication gates:

1. Scenario output is never labeled prediction or observed history.
2. Generation and consumption are compared only through the recorded accounting bridge.
3. EV and data-center loads are never added to totals that already contain them.
4. Server-only and whole-facility data-center measures are never spliced.
5. Aggregate and child sectors are never stacked together.
6. Annual TWh is never used to infer hourly peak, reliability, or transmission need.
7. Sparse milestones remain points/ranges; no hidden interpolation.
8. Any current regulatory, data-center, EV, or forecast value is reverified at release time.

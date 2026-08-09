# Dashboard information architecture

## Design inheritance from the NHA dashboard

The new dashboard will reuse the NHA dashboard's general presentation model,
adapted to climate, energy, transmission, and water evidence:

- one clear site header that states purpose, evidence vintage, and limitations;
- a balanced top navigation that reads as one story;
- a short chapter introduction before detailed cards and interactive views;
- progressive disclosure from headline result to mechanism to methodology;
- shared light and dark themes, restrained cards, compact charts, and a
  consistent data-visualization palette;
- source, confidence, unit, geography, and vintage cues beside the claims they
  qualify;
- Back and Next chapter navigation derived from one ordered route definition;
- an integrity footer reporting evidence, data, and model checks.

Astro routes and typed modules will replace the legacy single-page global
namespace. Shared presentation belongs in components; calculations and data
transformations belong in testable TypeScript modules; interactive behavior is
added only where a static explanation is insufficient.

## Proposed story

The chapter names are provisional until the initial research pass shows where
the evidence and datasets support meaningful working views.

| Order | Route | Chapter role |
|---:|---|---|
| 0 | `/` | Overview: the connected climate, energy, grid, and water picture |
| 1 | `/climate` | Climate: observed change, drivers, indicators, and uncertainty |
| 2 | `/global-energy` | Global energy: production, transformation, and consumption |
| 3 | `/us-energy` | U.S. energy: supply, demand, sector flows, prices, and emissions |
| 4 | `/grid` | Electricity and transmission: generation, load, capacity, reliability, and interconnection |
| 5 | `/water` | Water today: withdrawals, consumption, sources, sectors, and geography |
| 6 | `/water-futures` | Future water: demand, supply, climate exposure, and scenario ranges |
| 7 | `/nexus` | Climate-energy-water nexus: dependencies, tradeoffs, and constraints |
| 8 | `/outlook` | Outlook: clearly labeled projections and alternative scenarios |
| 9 | `/methodology` | Methods: definitions, sources, transformations, confidence, and known gaps |

## Evidence-linked page anatomy

Each chapter should use the same sequence when the subject permits:

1. **Question:** what the chapter helps a reader understand.
2. **Headline evidence:** a small number of verified, properly scoped metrics.
3. **System view:** flows, stocks, geography, or time series that reveal the
   mechanism behind the headline.
4. **Working view:** filters, comparisons, or scenarios with visible defaults.
5. **Limits:** uncertainty, missing coverage, revisions, and non-comparable
   measures.
6. **Sources and methodology:** claim-level links into the public evidence
   record.
7. **Story navigation:** the preceding and following chapters.

## Planned Astro structure

```text
src/
  components/
    SiteHeader.astro
    TabNav.astro
    ChapterIntro.astro
    ChapterNav.astro
    SourceBadge.astro
    ConfidenceBadge.astro
    MetricCard.astro
    SiteFooter.astro
  content/
    claims/
    sources/
    methodology/
  layouts/
    BaseLayout.astro
  lib/
    evidence/
    data/
    models/
    charts/
  pages/
    index.astro
    climate.astro
    global-energy.astro
    us-energy.astro
    grid.astro
    water.astro
    water-futures.astro
    nexus.astro
    outlook.astro
    methodology.astro
  styles/
    global.css
```

## Validation model

The NHA dashboard's self-test discipline will be extended to the evidence
layer. The new integrity footer should distinguish:

- claim and citation checks;
- data-schema and provenance checks;
- model and transformation invariants;
- chart geometry and accessibility checks;
- route and navigation checks.

The footer must never present a passing total that silently excludes a failed
or unloaded test group.

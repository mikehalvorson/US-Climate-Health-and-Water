# First-draft implementation report

## Release identity

- Public URL: <https://mikehalvorson.github.io/US-Climate-Health-and-Water/>
- Repository: <https://github.com/mikehalvorson/US-Climate-Health-and-Water>
- Release scope: first working draft across all 16 required routes
- Evidence vintage: 2026-08-01
- Publication review date: 2026-08-10
- Runtime: Astro 5 static output, strict TypeScript, vanilla client scripts

## Completed views

| Area | Public views |
| --- | --- |
| Overview | `/` |
| Energy | `/energy/system`, `/energy/demand`, `/energy/generation`, `/energy/grid`, `/energy/plan` |
| Climate | `/climate/cause`, `/climate/risks`, `/climate/coasts`, `/climate/plan` |
| Food & Water | `/food-water/freshwater`, `/food-water/food`, `/food-water/industry`, `/food-water/plastics`, `/food-water/plan` |
| Inspection | `/methods` |

All fourteen story chapters implement the common seven-act page contract and
publish a decision question, evidence, a figure or explicit unavailable state,
comparison, recommendation, model boundary, delivery content, caveats, source
access, accessible alternatives, and chapter navigation. Overview reconciles
its indicators to canonical chapter owners. Methods exposes the ledgers,
definitions, crosswalks, conflicts, gaps, integrity results, and downloads.

## Evidence and integrity surface

The generated registry tracks 215 research inputs and publishes the following
canonical inspection counts:

| Registry | Count | Registry | Count |
| --- | ---: | --- | ---: |
| Sources | 336 | Claims | 157 |
| Datasets | 130 | Metrics | 117 |
| Parameters | 12 | Scenarios | 128 |
| Chart contracts | 129 | Transformations | 5 |
| Model contracts | 17 | Denominators | 14 |
| Open items | 102 | Integrity checks | 12 |

The public data/model manifest records SHA-256 hashes, byte counts, record
counts, and the evidence vintage. The final integrity feed reconciles all 12
registered checks as passed, with no failed, skipped, pending, or unloaded
result hidden from the footer or Methods page.

## Release verification

The final gate runs from a locked install both locally and in GitHub Actions.
The Step 13 local release produced 91 passing tests across 22 test files, zero
Astro/TypeScript diagnostics, 16 validated routes, and reconciled public-data
checks:

1. `pnpm test` — registry, evidence, data/model, chart, route, component,
   interaction, and page-contract tests.
2. `pnpm check` — generated registry/public-data drift, Astro diagnostics, and
   strict TypeScript.
3. `pnpm build` — all 16 static routes plus shell, component, chapter,
   sitewide, manifest, accessibility-contract, and release-budget validators.
4. Browser review — 320-pixel phone, common mobile, tablet, desktop, and large
   desktop widths; representative routes; light and dark themes; keyboard,
   focus restoration, dialog, tooltip, search/filter, reset, and overflow
   checks.
5. Publication review — the deployed base path, representative routes, hashed
   assets, and public JSON downloads are fetched from GitHub Pages.

Release budgets are enforced at build time: total CSS at most 90 KB, total
client JavaScript at most 75 KB, each JavaScript chunk at most 15 KB, public
data at most 1.2 MB, each public data file at most 400 KB, story HTML at most
2 MB, and Methods HTML at most 3 MB. The first draft is comfortably below those
limits: the reviewed artifact contains about 60.8 KB CSS, 12.6 KB total client
JavaScript, and 837.9 KB public data.

## Accessibility and resilient delivery

- Every page has one main landmark, one `h1`, a skip link, semantic navigation,
  visible focus, and a no-JavaScript disclosure.
- Chart marks have keyboard access and names; every chart has a text summary
  and expandable data table.
- Source dialogs use native dialog semantics, labelled content, Escape/close
  behavior, backdrop close, and focus restoration. Source links remain usable
  as ordinary links if dialog support or client JavaScript is absent.
- Pointer and keyboard tooltips share content and dismiss with Escape.
- Core text/evidence tokens pass automated WCAG AA contrast calculations in
  light and dark themes. Reduced-motion preferences remove nonessential motion.
- Primary controls and source triggers use touch-sized targets. Responsive SVG,
  narrow-screen reflow, print table expansion, and static narrative fallbacks
  are part of the release contract.

The in-app browser review loaded every route at a 320-pixel viewport and found
no document-level overflow or broken images after the release fixes. Additional
checks covered 390 × 844, 768 × 1024, 1440 × 900, and 1920 × 1080 viewports.
Light/dark theme persistence, source-dialog open/close and focus restoration,
scenario selection/reset and reset focus, Methods filtering/reset and input
focus, chart alternatives, and an empty browser-console log were verified on
the built artifact.

## Known gaps and deferred models

The 102 open items are part of the product, not omitted release failures.
Twelve parameters remain pending and affected quantitative outputs stay visibly
unavailable. The 17 model contracts document inputs, outputs, validation needs,
and prohibited interpretations without authorizing missing calculations.

Deferred work includes integrated portfolio optimization, hourly reliability
proof, universal damage and cost totals, comprehensive food-system optimization,
verified facility-level siting/effect models, and cross-basin nationalization.
These can be enabled only after compatible coefficients, complete data,
validation, uncertainty treatment, and governance approval are recorded.

## Reproduce, update, and deploy

Use Node.js 22–24 and pnpm 11.16:

```shell
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
pnpm preview
```

Evidence updates begin in `research/`, then intentionally regenerate canonical
and public artifacts with `pnpm generate:registries` and
`pnpm generate:public`. Review generated and gap-register diffs before the full
quality gate. A push to `main` runs `.github/workflows/deploy-pages.yml`; the
workflow deploys only the verified `dist/` artifact under the repository base
path `/US-Climate-Health-and-Water/`.

The design and acceptance authority remains
[`CODEX_FIRST_DRAFT_BUILD_SPEC.md`](CODEX_FIRST_DRAFT_BUILD_SPEC.md), with the
sequence and per-step handoffs recorded in
[`FIRST_DRAFT_IMPLEMENTATION_PLAN.md`](FIRST_DRAFT_IMPLEMENTATION_PLAN.md).

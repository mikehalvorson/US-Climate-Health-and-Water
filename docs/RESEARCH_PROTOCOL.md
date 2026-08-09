# Research and citation protocol

## Purpose

This protocol is the publication gate for every factual statement, number,
dataset, chart, model parameter, and scenario assumption in the dashboard.
The goal is not to accumulate links. The goal is to preserve a reviewable
chain from each displayed claim to the exact source material that supports it.

## Non-negotiable rule

A citation is not verified merely because its URL exists. A claim may be
published only after both of these checks pass:

1. **Source identity check:** the canonical source resolves and its publisher,
   title, date or version, and stable identifier match the source-register
   entry.
2. **Claim fidelity check:** the reviewer opens the source, locates the exact
   table, figure, series, page, section, or passage, and confirms that it
   supports the claim with the same scope, units, geography, time period, and
   uncertainty.

For a load-bearing headline, model parameter, disputed claim, or value likely
to change a reader's conclusion, a third gate applies: corroboration by an
independent source or an explicit explanation of why no truly independent
source exists.

## Source hierarchy

Use the highest available tier that directly supports the claim.

1. **Primary official evidence:** laws, regulations, agency datasets, official
   statistical releases, technical reports, and documented data APIs.
2. **Primary scientific evidence:** peer-reviewed research, assessment reports
   with traceable underlying literature, and national-laboratory studies.
3. **High-quality synthesis:** transparent research organizations and expert
   syntheses that disclose methods and link to underlying evidence.
4. **Context only:** journalism, trade publications, company materials, and
   advocacy publications. These may explain a debate or document a party's
   position, but do not replace an available primary source.

Search-result snippets, AI summaries, unsourced charts, copied data tables,
and pages that merely repeat another publication are not evidence.

## Claim workflow

1. Assign a stable claim ID and state the proposed claim precisely.
2. Record its geography, period, units, population or system boundary, and
   whether it is observed, estimated, projected, or assumed.
3. Find the canonical source and record complete identity metadata in the
   domain source registry or flat source-register export.
4. Open the source and save an exact locator. A bare homepage or report URL is
   insufficient when the supporting material is deeper in the source.
5. Write a short support note explaining what the source establishes. A brief
   excerpt may be retained when helpful, but the locator and scope carry the
   proof.
6. Recompute any derived value from recorded inputs and formula. Never cite a
   source as though it directly published a value that this project derived.
7. Perform the source identity and claim fidelity checks separately.
8. Add independent corroboration when the claim is load-bearing.
9. Grade confidence and record caveats, conflicts, revisions, and update risk.
10. Mark the claim `verified`, `provisional`, `rejected`, or `superseded`.

Only `verified` claims may feed public content or production data.

## Scope controls

Every number must preserve:

- unit and unit multiplier;
- nominal versus real values and the price base year;
- calendar, fiscal, water, or model year;
- geography and spatial resolution;
- gross versus net production, generation, consumption, withdrawals, or use;
- observed, estimated, projected, modeled, or scenario status;
- uncertainty interval and scenario when the source supplies them;
- release date, revision status, and source vintage.

Values from different vintages, boundaries, or scenarios are not combined
without an explicit transformation and reconciliation note.

## Confidence grades

- **High:** direct primary source, exact locator, clear scope, current version,
  and no material conflict. Load-bearing claims are independently corroborated.
- **Medium:** credible evidence with a documented limitation, derivation,
  older vintage, scope mismatch, or unresolved but bounded conflict.
- **Low:** informative but insufficient for a headline or model constant.
  Low-confidence material remains visibly qualified and normally stays out of
  summary metrics.

Confidence is not a substitute for verification. An unverified claim has no
confidence grade.

## Conflicts and corrections

Conflicting authoritative values are preserved, not averaged away. The
research note must explain differences in definition, vintage, method, or
scenario and state which value the dashboard uses. If a published claim later
fails verification, it is removed or corrected before any other feature work.

## Release checks

Before a dashboard release:

- every displayed fact and number maps to a verified claim ID;
- every source link resolves to the recorded publisher and work;
- every locator has been rechecked against the displayed wording;
- derived values reproduce from recorded inputs;
- units, vintages, boundaries, and scenario labels are visible;
- superseded sources are not active inputs;
- research gaps are shown as gaps, not silently filled;
- source and data validation tests pass.

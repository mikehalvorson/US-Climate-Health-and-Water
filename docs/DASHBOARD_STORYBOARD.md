# Dashboard architecture and storyboard

## Executive recommendation

The dashboard should tell one connected story across three supersections:

1. **Energy:** society needs more useful energy and electricity, but the present system creates climate, health, reliability, water, land, material, and security burdens. The recommended response is efficient electrification supplied by a diversified low-carbon portfolio and delivered through a substantially stronger, more flexible grid.
2. **Climate:** accumulated emissions are changing the climate, and each additional increment of warming raises risk. The recommended response is to pursue the lowest feasible emissions pathway while planning essential systems against more severe, locally appropriate stress cases.
3. **Food & Water:** climate and energy pressures become tangible through food, freshwater, industrial siting, and material use. The recommended response is basin- and service-level portfolio planning: reduce avoidable demand first, protect natural and built systems, reuse resources, and add new supply where it passes energy, ecological, cost, and equity tests.

The site should advocate an **integrated resilience portfolio**, not a single technology. Its central claim should be that the United States can provide abundant essential services while reducing climate and environmental risk, but only if energy, land, water, food, and materials are modeled together and implementation constraints are treated as part of the solution.

The proposed information architecture has 14 story tabs, similar in scale to the NHA dashboard:

| Supersection | Tabs |
|---|---|
| Energy | Energy System; Demand & Electrification; Generation Choices; Grid & Delivery; Energy Plan |
| Climate | Cause & Trajectory; Impacts & Risk; Coasts & Communities; Climate Plan |
| Food & Water | Freshwater Security; Food & Agriculture; Water for Energy & Industry; Plastics & Materials; Food & Water Plan |

Two sitewide routes sit outside the supersections:

- **Overview:** the connected story, headline evidence, recommended portfolio, and guide to the three supersections.
- **Evidence & Methods:** definitions, sources, model boundaries, confidence, data downloads, known conflicts, research gaps, and integrity checks.

## What to inherit from the NHA dashboard

The dashboard should inherit the NHA presentation model rather than its exact visual layout:

- a guided overview that explains the current system before introducing the proposal;
- chapters that each answer one implementation question;
- a consistent progression from evidence to mechanism to choices to a recommended design;
- interactive working views that allow a reader to inspect assumptions and distributional effects;
- explicit sources, confidence, geography, unit, vintage, and observed/estimated/scenario status beside the claims they qualify;
- a clear distinction between the proposed system and the model used to test it;
- implementation, governance, risk, and rollout treated as part of the policy case;
- Back and Next navigation that allows all 14 tabs to read as one continuous story;
- an integrity footer that reports claim, data, model, chart, and navigation checks without hiding failures.

The NHA dashboard often succeeds by moving from “what is wrong?” to “what changes?” and then to “does the arithmetic hold?” This dashboard should make that same movement inside every tab.

## Common anatomy for every story tab

Every tab should use the same seven-act structure. The proportions may vary, but the order should not.

1. **The question:** one sentence stating what decision the tab helps the reader make.
2. **The current system:** a visual baseline and three to five carefully scoped headline metrics.
3. **Why it is a problem:** several viewpoint cards, normally including households, workers and operators, businesses or producers, communities, public health, ecosystems, and future generations.
4. **The available choices:** a fair comparison of plausible interventions, including benefits, constraints, time, cost, and failure modes.
5. **The recommended design:** the particular solution advocated by the dashboard, stated plainly.
6. **The model-supported case:** a reference case, the recommended case, and at least one stress case, with visible inputs, outputs, uncertainty, and accounting checks.
7. **Delivery and limits:** authority, infrastructure, workforce, sequence, acceptance tests, residual risk, data gaps, sources, and a link to the next tab.

The order matters. Readers should see the range of choices before the dashboard makes its recommendation, and they should see the recommendation before being invited to manipulate the model. This keeps the model from feeling like an unexplained answer generator.

## Sitewide navigation and interaction

The header should have two levels:

- **Primary navigation:** Overview, Energy, Climate, Food & Water, Evidence & Methods.
- **Local tab strip:** the tabs within the selected supersection, with the current tab and narrative progress clearly indicated.

Each story tab should also have a compact story rail with anchors for Current system, Problems, Choices, Recommendation, Model, and Delivery. On small screens this becomes a progress menu.

A persistent scenario tray may carry compatible state between tabs:

- geography: World, United States, region, basin, or selected locality where supported;
- time: observed period, 2030, 2050, and 2100 only where source coverage permits;
- evidence state: observed, estimate, source scenario, or dashboard strategy scenario;
- strategy: reference assumptions, recommended portfolio, and stress test;
- distributional lens: national total, household or customer, producer or utility, community, and ecological system;
- units and accounting boundary.

State should carry across tabs only where definitions are genuinely compatible. A global NGFS scenario, an AEO U.S. case, and a local NOAA sea-level scenario must never be silently treated as one continuous model run.

## Overview route: one system, three decisions

The Overview is the front door, not a fourth supersection.

### Storyboard

1. Open with the service objective: reliable energy, a stable climate, secure food and water, and safer material use.
2. Show the connected system: energy services drive generation and fuel use; emissions change climate; climate changes water and food risk; water and materials constrain energy and industry; policy and infrastructure feed back into every part.
3. Establish the current baseline with a small number of global and U.S. measures.
4. Present the problem from human, economic, operational, community, national-security, and ecological viewpoints.
5. Introduce the integrated resilience portfolio in one diagram.
6. Compare reference, recommended, and stress cases across a short outcome scorecard.
7. Explain that the rest of the dashboard tests each part of this proposition.

### Core figures

1. **Connected-system flow:** energy, emissions, climate hazards, water, food, materials, infrastructure, and people.
2. **Current-system scorecard:** demand, generation mix, cumulative emissions and warming, water use and stress, and plastic material flow, with mixed units kept in separate cards.
3. **Three-supersection problem map:** the principal constraints and cross-links.
4. **Recommended portfolio architecture:** efficiency and flexible demand; low-carbon supply; grid expansion; emissions reduction; adaptation; water and food portfolios; targeted material transition.
5. **Outcome comparison:** reference versus recommended versus stress case for reliability, emissions, climate risk, water stress, affordability, and implementation burden. Metrics that are not yet parameterized remain visibly unavailable.
6. **Roadmap:** research, enabling authority, near-term no-regret actions, infrastructure buildout, scaling, and review gates.

## Supersection I: Energy

The Energy story should move from the physical system to demand, generation choices, delivery, and finally a modeled national portfolio.

### E1. Energy System

**Question:** What services does the energy system provide, where does energy come from, and why is electricity becoming more important?

**Viewpoints:** households and affordability; businesses and productivity; producers and operators; public health; national security; climate and ecosystems.

**Storyboard:** Begin with useful services rather than fuels. Trace global and U.S. energy from primary resources through conversion to electricity and end use. Show rising electricity demand alongside continuing fossil dependence. Explain the accounting distinctions among primary energy, electricity, carriers, conversion, and storage. Compare three broad responses: constrain services, expand the current fuel mix, or deliver more services with less primary energy and lower-carbon electricity. Advocate efficient electrification coupled to power-sector decarbonization.

**Data:** global and U.S. observed energy and electricity series through 2025; EIA U.S. production and consumption; world and U.S. generation by source; source-method conflicts; NGFS, AEO2026, and NREL scenario families; the technology taxonomy and accounting boundaries.

**Core figures:**

1. Global energy-to-service Sankey with primary resources, carriers, conversions, losses, and end uses.
2. World electricity generation by source, with an observed/scenario seam.
3. U.S. primary energy production versus consumption, with captured-energy accounting explained.
4. U.S. electricity generation by source, 1949–2025.
5. “Do not add these” accounting explainer for capacity, generation, final consumption, primary energy, and storage.
6. Global and U.S. electrification pathways shown as separate source-scenario families.

**Recommended solution and model proof:** Recommend a service-first energy strategy: reduce avoidable energy requirements, electrify suitable end uses, and decarbonize the electricity supply. The working view should compare useful-service demand, primary-energy input, electricity demand, generation mix, imports, and emissions under reference, recommended, and stress assumptions. The initial model may be an accounting bridge; it should not claim hourly reliability.

### E2. Demand & Electrification

**Question:** How much electricity will be needed, what drives the range, and which loads can be reduced or shifted without reducing service?

**Viewpoints:** households; building owners; industry; data-center and fleet operators; utilities; grid planners; host communities.

**Storyboard:** Show the long period of U.S. sectoral demand development, then the new growth range driven by buildings, cooling, computing, transport, and industrial electrification. Explain why annual TWh is not peak GW. Compare unmanaged growth, efficiency-only, electrification-only, and efficient flexible electrification. Advocate the last option, with strong efficiency standards and time- and location-aware management of flexible loads.

**Data:** U.S. electricity sales and use by sector, 1949–2025; all eleven AEO2026 demand cases; residential, commercial, and industrial end uses; data-center observed estimates and scenario ranges; EV charging; macro drivers; NREL electrification stress tests; 2024 EIA-930 hourly load shapes.

**Core figures:**

1. U.S. sector electricity sales and use history.
2. AEO2026 demand-case lines with a 2050 endpoint comparison, explicitly not a probability band.
3. Residential, commercial, industrial, and transportation demand decomposition.
4. Data-center total-facility estimates and server-only scenarios in separate panels.
5. EV electricity demand with the accounting warning that charging is already contained in total sales.
6. Average daily and seasonal load shapes from EIA-930.
7. Equal annual energy, different peak and ramp requirements explainer.
8. Before-and-after flexible-demand dispatch for a representative day, initially illustrative until compatible future hourly data are available.

**Recommended solution and model proof:** Recommend an “efficient and flexible electrification” package: appliance and building efficiency; beneficial electrification; managed charging; flexible data-center and industrial loads where technically feasible; demand response; and transparent large-load interconnection rules. The model should calculate annual demand by end use, apply explicit efficiency and electrification assumptions, then test hourly shapes only with validated hourly profiles. Outputs should include annual energy, coincident peak, ramp, customer service delivered, and avoided generation and grid needs.

### E3. Generation Choices

**Question:** Which combination of generation, storage, and firm capacity can deliver reliable low-carbon electricity with acceptable health, water, land, material, waste, and cost burdens?

**Viewpoints:** grid operators; ratepayers; workers and producing regions; public health; host and Tribal communities; water managers; ecosystems; future generations.

**Storyboard:** Start with the attributes the power system actually needs, not a ranking of favored technologies. Explain the roles and limitations of coal, gas, oil, nuclear, hydro, wind, solar, geothermal, bioenergy, marine energy, storage, hydrogen, and CCS. Show why no single score is adequate. Compare single-technology strategies with diversified portfolios. Advocate rapid renewable deployment, preservation of safe and economical existing firm low-carbon assets, storage and demand flexibility, development of additional firm low-carbon options, and an orderly reduction of unabated fossil generation. CCS should be treated as a bounded option with added energy, transport, monitoring, and storage requirements.

**Data:** observed and scenario generation; technology impact matrix; system-role framework; lifecycle greenhouse-gas ranges; health pathways; water context; regulatory status; nuclear deep-dive evidence; material and circularity evidence; current gaps in compatible cost and impact coefficients.

**Core figures:**

1. Technology-by-system-service matrix: energy, capacity, ramp, frequency, voltage, grid forming, black start, fuel security, and duration.
2. Observed capacity and generation in separate panels.
3. Lifecycle greenhouse-gas median and range plot with source vintage.
4. Water withdrawal and consumptive-use panels by technology and cooling configuration once compatible coefficients are ready.
5. Health causal-pathway explorer separating routine, upstream, accident, and displacement effects.
6. Materials, waste, land, and ecological obligation matrix, with unknown shown as unknown.
7. Nuclear evidence panel covering utilization, fleet age, project stages, fuel, cooling, routine health, accidents, and waste.
8. Portfolio comparison showing how different mixes meet demand, capacity, emissions, water, land, material, and waste constraints.

**Recommended solution and model proof:** Recommend a diversified low-carbon portfolio rather than a technology mandate. A capacity-expansion and production-cost model should test portfolios against hourly load, weather years, outages, fuel constraints, transmission, and policy assumptions. Until regional hourly supply and harmonized coefficients exist, the dashboard must label its result as a planning framework rather than a reliability proof or least-cost optimum.

### E4. Grid & Delivery

**Question:** What prevents generation and flexible demand from connecting and delivering power where and when it is needed?

**Viewpoints:** system operators; utilities; generation and large-load developers; landowners and communities; regulators; equipment manufacturers; construction workers; customers exposed to reliability failures.

**Storyboard:** Begin with actual hourly and geographic demand. Show connection queues, long development sequences, corridor constraints, and shared equipment bottlenecks. Explain that a selected project, permit, line rating, transfer capability, and operating capacity are different things. Compare an incremental grid, a new-lines-only approach, and a sequenced portfolio of operations improvements, grid-enhancing technologies, reconductoring, interregional planning, new corridors, queue reform, and supply-chain development. Advocate the portfolio approach.

**Data:** 2024 EIA-930 hourly demand; HIFLD 230 kV-plus context geometry; typed major-corridor records; interconnection evidence; transmission needs; process graph; transformer and cross-sector supply chains; project and information-gap registers.

**Core figures:**

1. Hourly demand chart and calendar heatmap by balancing authority or region.
2. Peak-demand geography, released only after a compatible public geometry adapter is available.
3. High-voltage context map with typed major-corridor overlays and explicit status.
4. “What capacity means” comparison for project rating, transfer capability, service right, directional permit limit, and accreditation.
5. Interconnection queue funnel: requested, studied, withdrawn, built, and time to operation.
6. Transmission need versus demand growth as indexed, separate study families.
7. Planning, engagement, review, procurement, construction, and operation swimlane.
8. Transformer and grid-equipment dependency network.

**Recommended solution and model proof:** Recommend a national grid-delivery program that uses near-term operational improvements, grid-enhancing technologies, and reconductoring while developing new interregional corridors, reforming queues, sharing planning across regions, and expanding critical equipment capacity. The model should compare build sequences on delivered clean energy, congestion or curtailment proxy, reliability contribution, time, cost, land burden, and equipment demand. The present corridor map is not a power-flow model and must not be presented as one.

### E5. Energy Plan

**Question:** What national energy portfolio should be built, in what order, and how does it perform when demand, weather, delivery, water, cost, and deployment assumptions change?

**Viewpoints:** households and ratepayers; businesses; utilities and regulators; workers and regions in transition; communities hosting infrastructure; federal and state decision-makers; future generations.

**Storyboard:** Reassemble the prior four tabs. Define the outcomes the plan must meet. Present the reference case and the major strategic alternatives fairly. State the recommended portfolio. Let readers change the most consequential assumptions. Show not just the 2050 endpoint but the annual build sequence, dependencies, and failure triggers. End with authorities, financing, workforce, community benefits, review gates, and scorecard metrics.

**Data:** all Energy supersection datasets plus future regional costs, capacity credit, hourly renewable profiles, outage and weather years, transmission constraints, project pipelines, workforce, manufacturing, financing, and distributional inputs.

**Core figures:**

1. Recommended energy architecture and flow diagram.
2. Annual supply-demand balance and generation mix through 2050.
3. Emissions and unabated-fossil retirement wedges.
4. Firm capacity, storage duration, flexibility, and transmission build requirements.
5. Cost and household/industry incidence, unavailable until a compatible financing model exists.
6. Water, land, material, waste, and community-hosting dashboard.
7. Reliability stress-test results across weather, outage, demand, and build-delay cases.
8. Phased implementation roadmap with measurable gates rather than fixed promises.

**Recommended solution and model proof:** Advocate the integrated Energy portfolio defined in E1–E4. The working model should support transparent comparison with renewables-dominant, firm-low-carbon-dominant, fossil-with-CCS, slow-build, high-demand, and constrained-transmission alternatives. The advocated case should be justified by robust performance across assumptions, not by tuning one input set to win.

## Supersection II: Climate

The Climate story should move from physical causation to risk, then to local adaptation, and finally to a combined mitigation and resilience plan.

### C1. Cause & Trajectory

**Question:** What is causing contemporary warming, what determines future temperature, and which emissions cuts change the trajectory?

**Viewpoints:** physical science; households and public trust; energy and industrial producers; policymakers; countries with different historical contributions; future generations.

**Storyboard:** Start with the causal chain, then show observations. Explain why correlation is not the attribution test. Move from annual emissions to cumulative CO2 and temperature response. Compare emissions pathways without calling them forecasts. Present the major mitigation levers. Advocate rapid reduction of cumulative CO2, near-term reduction of potent non-CO2 climate pollutants, and eventual net-zero CO2 to stabilize temperature.

**Data:** observed greenhouse gases, radiative forcing, and temperature; attribution ranges; cumulative CO2; TCRE; PRIMAP-Hist emissions; IPCC scenario warming; En-ROADS architecture mapping and the future clean-room model.

**Core figures:**

1. Human-emissions-to-warming causal chain.
2. Greenhouse gases, forcing, and temperature small multiples.
3. Correlation versus attribution diagnostic.
4. Attribution waterfall with human warming and offsetting human cooling.
5. Cumulative CO2 and the assessed temperature-response range.
6. Future warming under five assessed pathways, shown by 20-year periods.
7. Lever-to-emissions decomposition from the scenario model.

**Recommended solution and model proof:** Recommend a cumulative-emissions strategy rather than a distant temperature pledge alone. The model should show how energy, land, methane, and other levers change annual emissions, cumulative CO2, and assessed warming ranges. Outputs are conditional scenarios, not predictions.

### C2. Impacts & Risk

**Question:** What becomes more dangerous with additional warming, who is exposed, and which risks deserve priority?

**Viewpoints:** public health; emergency management; agriculture; water managers; insurers and infrastructure owners; ecosystems; vulnerable communities; national and global equity.

**Storyboard:** Use the temperature-risk ladder to show that impacts do not share one universal coefficient. Examine extreme heat, tropical cyclones, biodiversity, food productivity, freshwater, sea level, and displacement. Separate hazards from exposure and vulnerability. Compare broad adaptation approaches. Advocate a risk-budget approach that prioritizes high-confidence, high-consequence risks while maintaining surveillance and flexible plans for uncertain ones.

**Data:** temperature-risk ladder; heat frequency and intensity relationships; hurricane evidence matrix; biodiversity risk; crop-yield sensitivities; freshwater findings; sea-level scenarios; displacement observations and scenarios.

**Core figures:**

1. Risk ladder aligned by warming level, with separate units and confidence.
2. Extreme-heat frequency and intensity response.
3. Tropical-cyclone evidence matrix for intensity, rainfall, and frequency.
4. Biodiversity risk range by warming, paired with other direct drivers.
5. Crop-yield sensitivities with adaptation and CO2-fertilization assumptions.
6. Freshwater risk framework: availability, timing, quality, reliability, and extremes.
7. Observed displacement and modeled migration in separate panels.
8. Risk-priority matrix using consequence, confidence, reversibility, distribution, and lead time.

**Recommended solution and model proof:** Recommend immediate heat protection, resilient infrastructure and essential services, ecosystem protection, and place-specific food and water adaptation, all nested within aggressive mitigation. The decision model should convert warming scenarios into risk ranges, then test adaptation packages. It must not invent global deaths, food loss, freshwater loss, or refugees per degree.

### C3. Coasts & Communities

**Question:** How does sea-level rise erode habitability, when should communities protect or relocate assets, and how should receiving places prepare?

**Viewpoints:** residents and renters; property owners; local governments and utilities; insurers and lenders; ports and businesses; environmental-justice communities; receiving cities; coastal ecosystems.

**Storyboard:** Begin with observed local relative sea-level trends and local scenario ranges. Trace the cascade from higher water to frequent flooding, drainage and groundwater problems, infrastructure failure, insurance and credit effects, and displacement. Compare protect, accommodate, avoid, restore, and relocate pathways. Advocate adaptive pathways with local triggers, protection of critical assets, limits on new exposure, and funded voluntary relocation where protection is not durable or equitable.

**Data:** NOAA observed local trends and scenarios; high-tide flooding; Miami-Dade planning ranges; selected city risk profiles; land-motion exposure; migration scenarios; receiving-city capacity indicators; adaptation pathways.

**Core figures:**

1. Observed local relative sea-level trend comparison.
2. Local scenario fan for selected coastal places.
3. High-tide flood days by local threshold.
4. Habitability cascade from water level to household displacement.
5. Exposure change when land motion is included.
6. Origin-destination migration stress test, clearly labeled as a high-end scenario.
7. Receiving-city capacity scorecard.
8. Adaptive-pathways map with decision triggers and irreversible commitments.

**Recommended solution and model proof:** Recommend local adaptive-pathway plans rather than one national protection or retreat rule. The model should compare lifecycle protection, accommodation, restoration, avoidance, and relocation packages under multiple local sea-level scenarios, land motion, asset life, social vulnerability, and funding assumptions.

### C4. Climate Plan

**Question:** Which combined mitigation and adaptation strategy performs acceptably across uncertain climate and implementation futures?

**Viewpoints:** households; businesses and finance; infrastructure operators; state, local, Tribal, and federal governments; vulnerable communities; global partners; future generations.

**Storyboard:** Reassemble cause, risk, and place. Compare mitigation-only, adaptation-only, delayed-action, and combined strategies. State the recommended approach: pursue the lowest feasible emissions pathway while adapting essential systems against higher stress cases. Show residual risk, distributional outcomes, costs, timing, and triggers. End with governance, review cycles, and outcome metrics.

**Data:** Climate supersection datasets linked to Energy plan outputs; future adaptation costs, asset exposure, health, infrastructure, insurance, and distributional data; crosswalks among source scenarios rather than silent model splicing.

**Core figures:**

1. Mitigation-to-warming-to-risk causal map.
2. Reference and recommended emissions and warming ranges.
3. Mitigation wedge by lever and sector.
4. Adaptation package by hazard and place.
5. Residual-risk comparison under low, central, and severe climate stress.
6. Distributional map of exposure, benefits, and unresolved risk.
7. Cost-of-action and avoided-damage ranges, released only with compatible boundaries.
8. Trigger-based rollout and review timeline.

**Recommended solution and model proof:** Advocate “mitigate low, adapt high”: reduce emissions in line with the lowest feasible pathway while stress-testing long-lived assets and essential services against more severe, locally credible conditions. Robust-decision analysis should show which actions succeed across many futures and which depend on one contested forecast.

## Supersection III: Food & Water

This supersection should show where national averages fail, then move from freshwater to food, industrial siting, materials, and an integrated portfolio.

### FW1. Freshwater Security

**Question:** Where, when, and why does water become unavailable, and which portfolio best protects essential service?

**Viewpoints:** households; farmers; utilities; industries; Tribes and water-rights holders; ecosystems; drought planners; coastal communities.

**Storyboard:** Begin with withdrawal versus consumptive use and the long historical record. Show that the national issue is distribution, timing, quality, infrastructure, and governance as much as gross volume. Map source dependence and typed risk horizons without “run-out” dates. Compare conservation, leak reduction, efficiency, pricing and assistance, reuse, watershed and aquifer management, transfers, storage, desalination, and atmospheric water generation. Advocate basin-specific portfolios that reduce avoidable demand and protect existing sources before adding energy-intensive supply.

**Data:** USGS withdrawals, 1950–2015; modeled 2010–2020 withdrawal and consumption; city source dependencies; risk horizons; coastal saltwater intrusion; household service ladder; desalination and atmospheric-water-generation scenarios; intervention-fit matrix.

**Core figures:**

1. U.S. freshwater withdrawals by category and source, 1950–2015.
2. Withdrawal versus consumptive use for irrigation, public supply, and thermoelectric power.
3. Household water-service ladder from drinking needs to full service.
4. Selected-city source portfolio and dependency map.
5. Typed freshwater-risk horizon timeline.
6. Coastal saltwater-intrusion causal model.
7. Desalination and atmospheric-water-generation scale and energy comparisons.
8. Intervention decision matrix and a selected-basin portfolio stack.

**Recommended solution and model proof:** Recommend basin and utility portfolios: efficiency, leak repair, reuse, watershed and aquifer protection, operating changes, and targeted new supply. The model should balance demand, reliable yield, storage, drought, water quality, energy, ecological flow, cost, and equity by season. National averages must not be used as facility or watershed impacts.

### FW2. Food & Agriculture

**Question:** How can the food system provide affordable nutrition while reducing water, climate, soil, ecosystem, and supply-chain risk?

**Viewpoints:** consumers; farmers and ranchers; farmworkers; food processors and retailers; rural communities; water managers; public health; ecosystems.

**Storyboard:** Start with food service delivered: nutrition, affordability, cultural fit, and reliability. Trace production through processing, transport, retail, consumption, and waste. Show regional dependence on water, climate, soil, inputs, labor, and logistics. Compare yield maximization, demand change alone, technology substitution, and a whole-system resilience portfolio. Advocate climate-resilient productivity, regionally appropriate crops and irrigation, soil and ecosystem protection, lower loss and waste, supply-chain diversity, and affordable healthy diets.

**Existing data:** climate crop-yield relationships; freshwater agriculture evidence; irrigation and groundwater cases; broader water and climate scenarios.

**Research required before release:** crop and livestock production and value; irrigated and rain-fed area; blue and green water use; groundwater depletion; fertilizer and energy inputs; soil and erosion indicators; processing and cold-chain energy; food loss and waste; imports and exports; diet, nutrition, price, affordability, labor, and regional supply-chain concentration. Every series needs compatible commodity, geography, year, and functional units.

**Core figures:**

1. Food-system Sankey from farm inputs to nutrition, waste, and environmental outputs.
2. Regional crop, livestock, irrigation, and water-source map.
3. Crop-yield sensitivity to warming, separated from food-security outcomes.
4. Groundwater-dependent agriculture transition timeline.
5. Food loss and waste by stage and commodity.
6. Nutrition, affordability, emissions, land, and water comparison for representative food-service baskets.
7. Production and price stress under heat, drought, input, and logistics shocks.
8. Recommended food-system portfolio and regional outcomes.

**Recommended solution and model proof:** Recommend a resilient-food portfolio, not a single diet, crop, or technology. A food-water-land model should hold nutrition and affordability explicit, then test crop patterns, yields, irrigation, technology, trade, loss and waste, diets, and climate stress. This tab is architecturally important but not publication-ready with the current corpus.

### FW3. Water for Energy & Industry

**Question:** How should power plants, data centers, manufacturing, and other large facilities grow without exceeding local water and infrastructure limits?

**Viewpoints:** workers and customers; utilities; facility owners; water and power providers; host communities; competing users; regulators; ecosystems.

**Storyboard:** Contrast nationally modest shares with locally concentrated demand. Separate direct water, indirect electricity-related water, withdrawal, consumption, return flow, discharge quality, and seasonal peak. Examine thermoelectric power, data centers, manufacturing, and selected emerging loads. Compare disclosure-only, unrestricted siting, technology mandates, and watershed-budget permitting. Advocate transparent facility water accounting, siting within verified seasonal water budgets, reuse and lower-water cooling where suitable, and enforceable drought operating plans.

**Data:** thermoelectric national water context; data-center direct-water estimates and projections; future facility and utility source data; manufacturing gaps; water-energy cross-domain findings; energy load and grid data.

**Core figures:**

1. National-to-local scale comparison for industrial water demand.
2. Data-center direct water in 2023 and the 2028 range, with indirect water separate.
3. Thermoelectric withdrawal versus consumption and cooling-system explainer.
4. Facility, utility source, watershed stress, and seasonal-demand map, released only with verified site data.
5. Water demand and supply by month under normal and drought conditions.
6. Reuse, cooling, process, and discharge-quality options flow.
7. Facility siting and operating scorecard.
8. Growth allocation under alternative watershed budgets.

**Recommended solution and model proof:** Recommend watershed-budget siting and operating standards for large facilities, paired with disclosure, reuse, efficiency, drought triggers, community protection, and energy-system coordination. The model should test a facility’s incremental seasonal withdrawal, consumption, return flow, quality, and power demand against source reliability and competing needs. The current corpus supports the framework but lacks the facility-resolved inventory needed for a national result.

### FW4. Plastics & Materials

**Question:** Which plastic uses should be eliminated, reused, captured, redesigned, substituted, or retained, and what happens to health, water, energy, cost, and performance?

**Viewpoints:** consumers; workers; product manufacturers; healthcare and food-safety users; waste and recycling systems; fenceline communities; wildlife and ecosystems; water managers.

**Storyboard:** Begin with the U.S. material flow and low recovery. Separate polymers, monomers, additives, PFAS, particles, and finished products. Show health and environmental evidence without treating detection as causation or every plastic as equally hazardous. Compare blanket bans, recycling alone, substitution alone, and service-specific portfolios. Advocate eliminating unnecessary and high-exposure uses first, scaling reuse and high capture, controlling hazardous chemistry and emissions, and validating substitutes by the service they deliver.

**Data:** 2019 U.S. material flow; resin consumption; manufacturing pathways; water-intensity ranges; gross avoided-resin water scenarios; health and environmental evidence; country policy mechanisms; seaweed scenarios; replacement strategy; functional-unit water accounting; evidence gaps.

**Core figures:**

1. U.S. plastic material-flow Sankey.
2. Leading resins and application categories.
3. Resin manufacturing pathway and hazard-boundary explorer.
4. Cradle-to-resin water ranges and gross-avoidance scenarios, clearly not net savings.
5. Health evidence ladder plus the PFAS-vaccine claim correction.
6. Country policy mechanism matrix with scope and exceptions.
7. Replacement decision tree: eliminate, reuse, capture, substitute, or retain.
8. Functional-unit water, energy, emissions, performance, and cost balance; seaweed appears as a gated candidate, not a forecast solution.

**Recommended solution and model proof:** Recommend a targeted circular-materials strategy rather than a universal ban or unqualified bioplastic substitution. The model unit must be the delivered service, such as meals served, sterile procedures, or product shipments, not kilograms of resin alone. It should include replacement production, washing, logistics, loss, end of life, toxicity, and local water scarcity.

### FW5. Food & Water Plan

**Question:** What portfolio secures essential food and water services across regions while respecting climate, energy, ecosystem, infrastructure, and affordability constraints?

**Viewpoints:** households; producers; utilities; Tribes and regions; industries; public health; ecosystems; taxpayers; future generations.

**Storyboard:** Reassemble freshwater, food, industry, and materials at the basin and service level. Define essential outcomes and ecological constraints. Compare fragmented sector plans, supply expansion alone, demand reduction alone, and integrated portfolios. State the recommended plan. Test drought, warming, population, industrial growth, energy-price, crop-failure, and infrastructure-outage cases. End with regional sequencing, financing, governance, community participation, and monitoring.

**Data:** all Food & Water datasets; climate and energy scenario linkages; future basin supply-demand, food-system, facility, infrastructure, cost, distributional, and ecological-flow data.

**Core figures:**

1. Basin-scale food-water-energy-material system map.
2. Seasonal supply-demand and quality balance by source and use.
3. Portfolio contribution stack: efficiency, repair, reuse, operating changes, ecosystems, storage, and new supply.
4. Food production, nutrition, affordability, and water outcomes.
5. Industrial growth allocation and drought operating conditions.
6. Tradeoff frontier across reliability, cost, energy, emissions, ecosystems, and equity.
7. Stress-test matrix showing which portfolios fail under which conditions.
8. Regional implementation roadmap with review and stop/go gates.

**Recommended solution and model proof:** Advocate regionally tailored essential-service portfolios with national standards for evidence, transparency, equity, and resilience. The model should optimize or compare portfolios by basin and season, then aggregate only compatible results nationally. A national total must never erase the location of shortages, ecological damage, or household burden.

## How the three supersections connect

The dashboard should make cross-links explicit without duplicating whole chapters:

| From | To | Connection |
|---|---|---|
| Demand & Electrification | Grid & Delivery | Annual demand becomes hourly, geographic load and infrastructure need. |
| Generation Choices | Freshwater Security | Cooling type, hydrology, and basin conditions affect withdrawal, consumption, and reliability. |
| Energy Plan | Cause & Trajectory | Energy-pathway emissions become climate-model inputs. |
| Cause & Trajectory | Impacts & Risk | Emissions and cumulative CO2 become warming ranges and then hazard ranges. |
| Impacts & Risk | Food & Agriculture | Heat, drought, flooding, and ecosystem change affect production and food security. |
| Coasts & Communities | Freshwater Security | Sea level, pumping, recharge, canals, and geology jointly affect coastal aquifers and infrastructure. |
| Water for Energy & Industry | Energy Plan | Water availability and facility electricity demand constrain generation and industrial siting. |
| Plastics & Materials | Food & Water Plan | Replacement systems change water, energy, land, logistics, waste, and service performance. |

Each cross-link should offer a “Continue the mechanism” jump while preserving the normal Back and Next story order.

## Model and evidence architecture

Every numeric result should be visibly assigned to one of four classes:

1. **Observed or reported:** historical measurements or administrative totals.
2. **Source estimate or source scenario:** publisher-derived estimate or conditional model result.
3. **Dashboard transformation:** a reproducible calculation such as indexing, aggregation, or accounting balance.
4. **Dashboard strategy model:** an internally generated policy scenario.

The model interface should always show:

- fixed evidence inputs and their sources;
- user-changeable policy and behavior assumptions;
- scenario family and model vintage;
- geographic and time boundary;
- outputs, accounting identities, and residuals;
- uncertainty and sensitivity;
- constraints not represented;
- a direct comparison to the advocated defaults;
- a reset action that restores the published recommended case.

The dashboard should never silently splice AEO, NREL, NGFS, IPCC, NOAA, USGS, or local planning series into a single “forecast.” Where one model’s outputs become another model’s inputs, show the adapter and the loss of detail.

## Viewpoint system

To satisfy the requirement that each problem be seen from multiple perspectives, use a consistent set of viewpoint chips. Each tab should select the relevant five to seven, not display all of them mechanically.

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

Each viewpoint card should answer three questions: What is the present burden? What does the proposed solution improve? What cost or residual risk remains?

## Advocacy rules

The dashboard is intended to advocate, but its credibility depends on disciplined advocacy:

- Present serious alternatives before selecting the recommended one.
- State the recommendation in plain language and show its non-negotiable elements.
- Do not make every option look equivalent after the evidence has distinguished them.
- Do not hide costs, land use, new infrastructure, behavior change, local opposition, or residual risk.
- Do not let a user control change the scientific meaning of an input.
- Do not use single composite scores unless weights are published and sensitivity to the weights is shown.
- Treat missing coefficients as research findings, not zeros.
- Prefer strategies that perform reasonably across many futures over strategies that win only under one precise forecast.

## Research and modeling priorities implied by the architecture

### Priority 1: common scenario language

Create a scenario registry that defines the reference assumptions, recommended strategy, and stress cases across tabs. It should map, but not merge, AEO, NREL, NGFS, IPCC, NOAA, USGS, and future dashboard-model runs.

### Priority 2: integrated Energy model

Add regional hourly load and supply profiles, capacity contribution, outages, weather years, storage, demand flexibility, transmission constraints, costs, project lead times, and build rates. This is the main release gate for the Energy Plan.

### Priority 3: compatible impact and cost ledgers

Build configuration- and geography-specific ledgers for lifecycle emissions, health, water, land, materials, waste, reliability, capital and operating cost, and workforce. Preserve ranges and do not force universal per-MWh coefficients.

### Priority 4: food-system baseline

Develop a coherent U.S. food-flow, nutrition, affordability, production, land, water, energy, emissions, waste, trade, labor, and regional-risk dataset. The Food & Agriculture tab is the largest current evidence gap.

### Priority 5: facility and watershed resolution

Collect verified facility locations, water sources, withdrawals, consumption, return flows, seasonal profiles, discharge quality, utility context, and drought conditions for data centers, thermal generation, and priority manufacturing sectors.

### Priority 6: economics and distribution

Add household, ratepayer, producer, taxpayer, regional-employment, public-finance, and community-hosting effects. Like the NHA dashboard, the final argument must show who pays, who benefits, when, and under what assumptions.

### Priority 7: implementation and governance

For each capstone plan, research the governing authorities, federal-state-Tribal-local roles, permitting, financing, workforce, procurement, supply chains, community participation, legal risks, review gates, and measurable acceptance tests.

## Readiness assessment

| Tab | Current readiness | Principal release gate |
|---|---|---|
| Energy System | High | Complete energy-flow accounting and selected primary-energy series. |
| Demand & Electrification | High for annual and historical hourly views | Validated future regional hourly profiles for flexibility and peak claims. |
| Generation Choices | Medium-high for qualitative comparison | Harmonized regional cost, reliability, water, land, material, and health coefficients. |
| Grid & Delivery | High for history, process, and context maps | Public geometry adapters, power-flow or transfer analysis, and project milestone history. |
| Energy Plan | Medium-low | Integrated capacity, dispatch, transmission, cost, and rollout model. |
| Cause & Trajectory | High | Parameterized and validated clean-room scenario model. |
| Impacts & Risk | High for evidence relationships | Local exposure, vulnerability, cost, and adaptation-effect data. |
| Coasts & Communities | Medium-high | Broader city coverage, asset exposure, adaptation cost, and receiving-city data. |
| Climate Plan | Medium-low | Linked mitigation, adaptation, cost, distribution, and robust-decision model. |
| Freshwater Security | High | More current basin, utility, quality, and infrastructure data. |
| Food & Agriculture | Low | Coherent food-system baseline and scenario model. |
| Water for Energy & Industry | Medium | Facility- and watershed-resolved data. |
| Plastics & Materials | High for evidence and decision framework | Product-service replacement inventories and functional LCAs. |
| Food & Water Plan | Low-medium | Basin-food-industry integration, costs, and governance. |

## Recommended build order after research

The eventual implementation should not follow the visual tab order mechanically. A sensible delivery sequence is:

1. Build the shared evidence, source, scenario, chart, and model-result contracts.
2. Release high-readiness explanatory tabs: Energy System, Demand & Electrification, Cause & Trajectory, Impacts & Risk, Freshwater Security, and Plastics & Materials.
3. Add Grid & Delivery, Generation Choices, and Coasts & Communities once the key adapters and coefficient ledgers are ready.
4. Add Food & Agriculture and Water for Energy & Industry after the missing spatial and service-level data are acquired.
5. Release the three capstone plan tabs only after their models can pass accounting, sensitivity, stress, and reproducibility tests.
6. Complete the Overview last so every headline claim and modeled comparison is derived from a finished underlying tab.

This order allows the dashboard to publish useful evidence without presenting unfinished capstone models as settled answers.

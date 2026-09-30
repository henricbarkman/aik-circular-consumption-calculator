# Source-backed factors for the circular consumption calculator

Research date: 2026-09-30. Every value below was read in a page, PDF or open dataset opened during this session. Values marked **derived** are simple arithmetic on sourced numbers; the arithmetic is shown so it can be checked. Values marked **unverified** were seen only in a search-engine snippet because the full text was paywalled or bot-blocked. They are listed so nobody has to search again, but they should not go into v1.

Method reminder (fixed, from `PROMPT.md`):

```
avoided = LCA_new x N x r
        - N x (1-r) x car_share x trips x km x car_EF / items_per_trip
        - N x (1-r) x op_EF
```

A note on system boundaries that matters for v1: the second-hand item still goes through its use phase and end of life, so the avoided burden is mainly production (raw materials to distribution). ADEME's per-item values (Base Carbone / Impact CO2) are exactly that ("construction": raw materials, supply, forming, assembly and distribution). Manufacturer reports (Apple, Dell, Fairphone) and Sandin et al. 2019 are cradle-to-grave. Where a source gives a production share, it is noted.

ADEME note: Impact CO2 (impactco2.fr) and Base Carbone (data.ademe.fr) carry the **same** underlying ADEME/RDC Environment modelling (report "Modélisation et évaluation ACV de produits de consommation et biens d'équipement", J. Lhotellier, E. Less, E. Bossanne, S. Pesnel, March 2018, plus a December 2019 update for small appliances and mobility). Do not count them as two independent sources.

- Base Carbone dataset (Licence Ouverte): https://data.ademe.fr/datasets/base-carboner. Queried through `https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines?q=<term>`. Identifiers given as "BC 12345".
- Impact CO2 API: `https://impactco2.fr/api/v1/thematiques/ecv/<id>?detail=1` (1 = digital, 5 = clothing, 6 = appliances, 7 = furniture). The field `footprint` is manufacturing; `ecv` adds use and end of life. Stage ids come from `src/data/ecv.ts` in github.com/incubateur-ademe/impactco2: 1 raw materials, 2 supply, 3 forming, 4 assembly and distribution.

---

## 1. Life-cycle emissions per NEW item

### 1a. Clothes (generic, t-shirt, jeans, winter jacket)

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Garment, generic (6 garment types) | 1 | 20 | kg CO2e per garment life cycle | Sandin, Roos, Spak, Zamani, Peters, *Environmental assessment of Swedish clothing consumption: six garments, sustainable futures*, Mistra Future Fashion / RISE / Chalmers, 2019 | https://research.chalmers.se/publication/514322/file/514322_Fulltext.pdf | Cradle-to-grave, including Swedish laundry and the user's trip to the store. p. 59: "Climate impact per garment life cycle spans from about 1 kg CO2 eq. for the socks to about 20 kg CO2 eq. for the jacket". The report calls 1-20 "typical climate impact ... for most types of garments with average use patterns". |
| Garment, generic (Swedish charity-shop convention) | 9 | 9 | kg CO2e per garment | Myrorna, Hållbarhetsrapport 2025, p. 6 | https://www.myrorna.se/app/uploads/hallbarhetsrapport-2025.pdf | "Beräknad på 9 kg CO2e-utsläpp per plagg", "snittsiffror från Naturskyddsföreningen". Erikshjälpen uses the same basis: 10,250 t / 1,138,108 garments = 9.0 kg (**derived**; https://erikshjalpen.se/en/about-erikshjalpen-second-hand/our-commitments/vart-miljouppdrag/). The primary Naturskyddsföreningen document was not found. |
| Garment, generic (implied) | 6 | 6 | kg CO2e per replaced garment | Naturskyddsföreningen press release, Nationella klädbytardagen, 2026-04-15 | https://via.tt.se/pressmeddelande/4331751/nationella-kladbytardagen-pa-lordag?publisherId=3236031&lang=sv | 44,000 garments swapped, 50% assumed to replace new, 132 t CO2 saved. 132,000 / (44,000 x 0.5) = 6 kg (**derived**). |
| T-shirt | 5.2 | 5.5 | kg CO2e per item | ADEME Base Carbone BC 27044 (cotton), BC 27045 (polyester); ADEME 2018 | https://data.ademe.fr/datasets/base-carboner ; https://impactco2.fr/outils/habillement | Production to distribution. Uncertainty 25%. Including use and end of life, Impact CO2 gives 6.43 (cotton) and 6.21 (polyester). |
| Jeans | 23.2 | 23.2 | kg CO2e per item | Base Carbone BC 27043 (cotton jeans); ADEME 2018 | same | Uncertainty 30%. Impact CO2 total with use and EoL: 25.1. |
| Winter jacket / coat | 20 | 85.8 | kg CO2e per item | Low: Sandin et al. 2019 (jacket, cradle-to-grave, above). High: Base Carbone BC 27052 "Manteau, composition moyenne" | as above | Anorak "Veste imper-respirante" BC 27053 = 38.7; faux-leather jacket BC 27054 = 24.0. The ADEME coat has 60% uncertainty. |
| Other garments (reference) | 8.2 | 52.9 | kg CO2e per item | Base Carbone BC 27041-27057 | as above | Polo 8.2, cotton shirt 11.2, viscose shirt 10.2, acrylic jumper 25.5, cotton sweatshirt 27.4, wool jumper 52.9, dresses 44.9-51.9, recycled-PES fleece 23.8. |

### 1b. Shoes

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Pair of shoes | 13.4 | 18.7 | kg CO2e per pair | Base Carbone BC 27058 (leather 13.4), BC 27059 (textile 17.3), BC 27060 (sports 18.7); ADEME 2018 | https://data.ademe.fr/datasets/base-carboner ; https://impactco2.fr/outils/habillement | Uncertainty 15%. An archived older value (BC 20789, "Tout sport, paire de chaussures", 2.9) is superseded. |

### 1c. Children's clothes

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Children's clothes | not found | not found | | | | Base Carbone has no children's items. No per-item LCA was found for Reima or similar brands. See "Could not find / weak". |

### 1d. Furniture

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Chair (dining/visitor) | 18.6 | 34.4 | kg CO2e per item | Base Carbone BC 26958 (wood 18.6), BC 26960 (wood + textile 24.8), BC 26959 (plastic 34.4); ADEME 2018 | https://data.ademe.fr/datasets/base-carboner ; https://impactco2.fr/outils/mobilier | Uncertainty 10%. |
| Chair (public-sector models, RISE) | 5.1 | 27 | kg CO2e per chair | Bolin, Rex, Røyne (RISE), Norrblom (Swerea), *Hållbarhetsanalys av cirkulära möbelflöden*, SP-rapport 2017:32 | https://cirkularitet.se/wp-content/uploads/2019/02/H%C3%A5llbarhetsanalys-av-cirkul%C3%A4ra-m%C3%B6belfl%C3%B6den.pdf | **Derived** from the linear-model tables (functional unit = one person-year): upholstered wooden chair 0.34 kg/yr x 45 yr / 3 chairs = 5.1; upholstered chair with metal legs 1.8 x 45 / 3 = 27. Cradle-to-grave (incineration). |
| Office chair | 100 | 130 | kg CO2e per chair | RISE SP-rapport 2017:32 (above) | same | 100: summary, "45 000 ton ... motsvarar ungefär nytillverkning av 450 000 kontorsstolar (NEPD-467-327-EN, 2016)" (**derived**, 45,000 t / 450,000). 130: Table 2, 13 kg/yr x 20 yr / 2 chairs (**derived**). |
| Sofa | 179 | 198 | kg CO2e per item | Base Carbone BC 26964 (textile 179), BC 26965 (leather 182), BC 26966 (sofa bed 198); ADEME 2018 | https://impactco2.fr/outils/mobilier | Uncertainty 15%. |
| Table / desk | 60.1 | 120 | kg CO2e per item | Base Carbone BC 26962 (table "représentative" 60.1), BC 26961 (solid wood 80.2). RISE 2017:32, desk + chair set: 18 kg/yr x 20 yr / 3 sets = 120 (**derived**) | as above | The RISE value is a desk **and** chair. |
| Wardrobe | 907 | 907 | kg CO2e per item | Base Carbone BC 26963 "Armoire, représentative"; ADEME 2018 | https://impactco2.fr/outils/mobilier | **Treat with caution.** Stage split: raw materials 118, supply 70.7, forming 2.18, assembly and distribution 716. That last stage is out of pattern with every other ADEME furniture item. |
| Furniture per tonne (fallback for bookshelves etc.) | 1833 | 1833 | kg CO2e per tonne of furniture | Base Carbone BC 20907 "Mobilier, fabrication" (2014) | https://data.ademe.fr/datasets/base-carboner | Weight-based fallback (≈1.8 kg CO2e/kg). Uncertainty 50%. |
| Bed frame / mattress (reference) | 115 | 284 | kg CO2e per item | Base Carbone BC 26970 (bed frame 115), BC 26971 (spring mattress 232), BC 26969 (foam mattress 284) | as above | Also slatted base 44.2, box spring 103. |
| Bookshelf | not found | | | | | No item-level value. Use the per-tonne fallback. |

### 1e. Electronics

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Smartphone (ADEME) | 16.5 | 39.1 | kg CO2e per item | Base Carbone BC 27010-27013; ADEME 2018 | https://data.ademe.fr/datasets/base-carboner | By size: "classique" 16.5, <4.5" 27.6, 5" 32.8, >5.5" 39.1. Uncertainty 50%. |
| Smartphone (Impact CO2, newer) | 79.3 | 79.3 | kg CO2e per item (manufacturing) | Impact CO2 / ADEME, thematic 1 | https://impactco2.fr/api/v1/thematiques/ecv/1?detail=1 | `footprint` 79.27 (construction); `ecv` 80.2 including 2.5 yr use. Far above the 2018 values; the method notes say this category was updated. |
| Smartphone, Fairphone 5 | 32.7 | 42.1 | kg CO2e per item | Fraunhofer IZM, *Life Cycle Assessment of the Fairphone 5*, 2024 | https://www.fairphone.com/wp-content/uploads/2024/09/Fairphone5_LCA_Report_2024.pdf | p. 8: "42,1 kg CO2 eq., out of which 32,7 kg CO2 eq. are related to its production phase" (3-year baseline). |
| Smartphone, iPhone 16 | 44.8 | 60.8 | kg CO2e per item (production) | Apple, *Product Environmental Report iPhone 16 and iPhone 16 Plus*, Sept 2024 | https://www.apple.com/environment/pdf/products/iphone/iPhone_16_and_iPhone_16_Plus_PER_Sept2024.pdf | Total footprint 56 kg (16, 128 GB) to 77 kg (16 Plus, 512 GB); production 80% / 79%. **Derived**: 56 x 0.80 = 44.8; 77 x 0.79 = 60.8 (applies the 128 GB share to 512 GB, an approximation). |
| Laptop (ADEME) | 156 | 182 | kg CO2e per item | Base Carbone BC 27002 (156, ADEME 2018); Impact CO2 "Ordinateur portable" `footprint` 182.3 (`ecv` 192.6) | https://impactco2.fr/api/v1/thematiques/ecv/1?detail=1 | Manufacturing. |
| Laptop, MacBook Air M4 | 120 | 155 | kg CO2e per item (total life cycle) | Apple, *M4 MacBook Air Product Environmental Report*, March 2025 | https://www.apple.com/environment/pdf/products/notebooks/M4_MacBook_Air_PER_March2025.pdf | 13" 256 GB = 120, 13" 512 GB = 128, 15" 256 GB = 147, 15" 512 GB = 155. Production share 71% (15" 512 GB). About 85 kg production for the 13" (**derived**, approximate). Apple figures use its clean-electricity accounting. |
| Laptop, Dell Latitude 5450 | 195 | 299 | kg CO2e per item (total incl. 4 yr EU use) | Dell, product carbon footprint sheet, Latitude 5450 | https://i.dell.com/sites/csdocuments/CorpComm_Docs/en/carbon-footprint-latitude-5450.pdf | "247 kgCO2e +/- 52 kgCO2e" (PAIA). The stage split is only in a chart. The sheet header says "Report produced December, 2018", which cannot be right for a 2024 model; treat it as a cross-check only. |
| TV | 328 | 500 | kg CO2e per item | Base Carbone BC 26999 (30-40" 340), BC 27000 (40-49" 371), BC 27001 (49"+ 500); Impact CO2 "Télévision" `footprint` 328.3 | https://data.ademe.fr/datasets/base-carboner | Uncertainty 50%. |
| Tablet / desktop (reference) | 83.9 | 296 | kg CO2e per item | Impact CO2 tablet 83.9; Base Carbone desktop office 169 (BC 27003), high-performance 296 (BC 27004) | as above | |

### 1f. Power tools

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Cordless drill/driver | 23.5 | 23.5 | kg CO2e per item | Base Carbone BC 28317 "Perceuse-visseuse (sans fil)"; ADEME / RDC Environment, Dec 2019 | https://data.ademe.fr/datasets/base-carboner | Stages: raw materials 15, supply 0.327, forming 1.08, assembly 4.65, distribution 2.44. Uncertainty 50%. Only one source. |
| Robot lawnmower (reference) | 110 | 110 | kg CO2e per item | Base Carbone BC 28320 | same | Li-ion 3.2 Ah. |

### 1g. Toys

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Toy, per item | not found | | | | | Yamane & Kayo, *Sustainability* 17(6):2351, 2025 (Japan) reports only a relative result: "replacing plastic toy cars with wooden toy cars could reduce greenhouse gas emissions per toy car by 77%" (abstract via Crossref, doi 10.3390/su17062351). Absolute values are behind a blocked page. |
| Spend-based fallback | 231 | 270 | kg CO2e per k€ (excl. VAT) | Base Carbone "Autres produits manufacturés", 2019-2023 | https://data.ademe.fr/datasets/base-carboner | Monetary ratio (2023: 231; 2021: 270). Only usable if the item's new price is known. Weak. |

### 1h. Sports and outdoor

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Downhill skis, pair | 15 | 29 | kg CO2e per pair | Low: Base Carbone BC 20628 "Sport d'hiver, paire de skis" (2016, uncertainty 80%). High: Tekie, Røyne, Andersson, Crossler Ernström, *Utvärdering av fritidsbanker*, RISE Rapport 2020, footnote 1: "Ecoinvent v 3.3 ... uppger 29 kg Co2-ekv/par slalomskidor (för vuxen)" | https://www.fritidsbanken.se/wp-content/uploads/2020/01/Utvardering-av-fritidsbanker_RISE_rapport.pdf | Ski helmet: BC 20629 = 1.2. |
| Bicycle (non-electric) | 96 | 96 | kg CO2e per bicycle (production + maintenance) | European Cyclists' Federation, *Cycle more often 2 cool down the planet*, 2011, citing TNO 2010 | https://www.bizkaia.eus/fitxategiak/07/Mediateka/5_ECF_Quantifying%20CO2%20saving%20of%20cycling.pdf | "approximately 5 grams CO2e/km" for a 19.9 kg bike (14.6 kg aluminium) lasting 8 years x 2400 km/yr. **Derived**: 5 g x 19,200 km = 96 kg. |
| E-bike | 261 | 261 | kg CO2e per item | Base Carbone BC 28328; ADEME / RDC Dec 2019 | https://data.ademe.fr/datasets/base-carboner | Raw materials 213, supply 28.6, forming 4.88, assembly 2.99, distribution 11.9. |
| E-scooter (reference) | 92 | 92 | kg CO2e per item | Base Carbone BC 28326 | same | |
| Tent | not found | | | | | Only a non-LCA commercial estimate (Arbor, "10.00-50.00 kg CO2e", with a disclaimer that it is not a PCF or LCA): https://www.arbor.eco/carbon-footprint/tent |

### 1i. Books

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Book | 1.1 | 2.71 | kg CO2e per book | Low: Base Carbone BC 20587 "Livre de 300 g" (2014). High: Wells, Boucher, Laurent, Villeneuve, "Carbon Footprint Assessment of a Paperback Book", *J. Industrial Ecology* 2012, abstract: "2.71 kilograms (kg) CO2-eq per book" (cradle-to-gate, US/Canada) | https://data.ademe.fr/datasets/base-carboner ; https://doi.org/10.1111/j.1530-9290.2011.00414.x | A 2024 conference paper (Bolanča Mirković and Bolanča, GRID 2024) gives "3.6-7.5 kg CO2-eq" for a 1 kg book over its whole life cycle: https://www.grid.uns.ac.rs/symposium/download/2024/70.pdf. Weaker source. |

### 1j. Small kitchen appliances

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Kettle | 9.91 | 9.91 | kg CO2e per item | Base Carbone BC 28306; ADEME/RDC 2019 | https://impactco2.fr/api/v1/thematiques/ecv/6?detail=1 | Manufacturing. The Impact CO2 total (37.8) is mostly use-phase electricity at French grid intensity, so do not use it. |
| Coffee maker | 22.5 | 47.6 | kg CO2e per item (manufacturing) | Impact CO2 thematic 6: pod 22.5, filter 31.9, espresso 47.6 | same | The totals (191-238) are dominated by use phase and capsules; use `footprint`. |
| Food processor | 41.3 | 41.3 | kg CO2e per item | Base Carbone BC 26993 "Robot multifonction" | https://data.ademe.fr/datasets/base-carboner | Uncertainty 50%. |
| Vacuum cleaner | 47.3 | 52.4 | kg CO2e per item | Base Carbone BC 26990 (with bag), BC 26991 (bagless) | same | |
| Microwave oven | 98.3 | 98.3 | kg CO2e per item | Impact CO2 `footprint` 98.3 | https://impactco2.fr/api/v1/thematiques/ecv/6?detail=1 | Large white goods, same source: dishwasher 271, washing machine 341, fridge 257. |

### 1k. Pram / stroller

| Category | Low | High | Unit | Source | URL | Note |
|---|---|---|---|---|---|---|
| Stroller | (321) | (321) | kg CO2e per stroller incl. packaging | Ang & Yifan, "Carbon Footprint Analysis for Baby Strollers", *Chinese Journal of Population Resources and Environment*, 2012, doi 10.1080/10042857.2012.10685103 | https://doi.org/10.1080/10042857.2012.10685103 | **Unverified.** The figure (PAS 2050) was seen only in a search snippet. The publisher and ResearchGate returned 403, and Crossref has no abstract. Do not use in v1 until the text has been read. |

---

## 2. Emission factor, Swedish passenger car

| Factor | Value | Unit | Source | URL | Boundary / biofuel |
|---|---|---|---|---|---|
| Petrol car | 0.170 | kg CO2e per vehicle-km | Naturvårdsverket, *Klimatberäkningsverktyget* version 9 (file dated 2025-12-15), sheet "Väg körsträcka" | https://www.naturvardsverket.se/4b1060/contentassets/1224aae0cb7c48138c68f1b6c55e00d4/klimatberakningsverktyget-version-9-251215.xlsx | **Well-to-wheel** (fuel production + fuel use), CO2 + CH4 + N2O, GWP AR5 (CH4 28, N2O 264). **Derived** by the tool's own formula: CO2 0.02686 + 0.13911; CH4 (6.31e-5 + 5.14e-6) x 28; N2O (7.15e-6 + 7.84e-7) x 264. Includes the Swedish low-blend biofuel share (SMED 2024: FAME+HVO in diesel MK1 3.4%, biocomponents in petrol ≈5.0%). |
| Diesel car | 0.184 | kg CO2e per vehicle-km | same | same | WTW, same method. |
| Plug-in hybrid (petrol) | 0.091 | kg CO2e per vehicle-km | same | same | WTW. |
| Battery electric car | 0.0066 | kg CO2e per vehicle-km | same | same | Electricity production only. |
| Swedish car fleet average, 2025 | 0.138 | kg CO2e per vehicle-km | Trafikverket PM *Vägtrafikens utsläpp 2025* (2026-03-03, TRV 2026/7947), Table 1 (personbil 9.51 Mt CO2e) and Table 2 (personbil 69.06 billion vkm) | https://bransch.trafikverket.se/contentassets/bdc6eaecf796497dbf5720a71e607fd1/pm-vagtrafikens-utslapp-2025.pdf | **Derived**: 9.51 / 69.06. Whole fleet, EVs included. **Tank-to-wheel, inventory basis**: biofuels count as zero (the PM attributes the 2025 fall to the reduction obligation rising from 6 to 10% mid-year). 2024: 9.81 / 67.05 = 0.146. Preliminary data. |
| Passenger car, all fuels, 2019 (Basprognos 2024) | 0.173 (rural) / 0.187 (urban) | kg CO2 per vehicle-km | Trafikverket, *Emissionsfaktorer och beräkning av utsläpp* (väg, järnväg, sjö och luft), 2026-07-06, Table 1 | https://bransch.trafikverket.se/contentassets/6172806b6959485d895374173243047f/2026/emissionsfaktorer-vag-jarnvag-sjo-och-luft-260706.pdf | Tank-to-wheel, **fossil and biogenic CO2 both counted** (ASEK method), CO2 only. HBEFA 4.2. |
| European fleet-average car (non-Swedish reference) | 0.326 | kg CO2e per km | Sandin et al. 2019 (Mistra Future Fashion), p. 59, citing an Ecoinvent dataset | https://research.chalmers.se/publication/514322/file/514322_Fulltext.pdf | "well-to-wheel emissions of 326 g CO2 eq. per km". |

Policy sensitivity: SMED's 2024 description of the tool says diesel factors were "ca 40-50 % högre än 2023" because the reduction obligation was cut (SMED Rapport Nr 5 2024, https://www.naturvardsverket.se/4af849/contentassets/1224aae0cb7c48138c68f1b6c55e00d4/beskrivning-verktyg-berakning-av-resors-klimatutslapp-v8-smed-rapportnr5.pdf). The factor should carry a year stamp in the UI.

Transport-assumption cross-checks from the same sources (useful for defaults):

| Parameter | Value | Source | URL |
|---|---|---|---|
| Trip to clothing store | 8.5 km each way, 50% car / 50% bus, "most users purchase 2-3 garments each trip" | Sandin et al. 2019, section 3.6.1 (from the Granello et al. 2015 survey) | https://research.chalmers.se/publication/514322/file/514322_Fulltext.pdf |
| Trip to a lending service (Fritidsbanken) | 72% of borrowers used a car; 10 km modelled; 50% of each trip allocated to the loan; car trips cut the saving from >70% to 30% | RISE Rapport 2020, section 3.5.1.3 | https://www.fritidsbanken.se/wp-content/uploads/2020/01/Utvardering-av-fritidsbanker_RISE_rapport.pdf |
| Single-purpose trips for second-hand pickup | 52% of users overall, Sweden 52%, Norway 58%; Norway 62.5% car as main mode | Schibsted, *The Second-Hand Effect Report 2023* (June 2024), p. 17 | https://assets.ctfassets.net/9qowtvvo5be7/77HjGUIilek5wIlvIeGkhg/df89f84ef9549d595ca0521a01db97d2/Public_Schibsted-The-Second-Hand-Effect-Report-2023_14-june2024.pdf |

---

## 3. Replacement / displacement rate r

| Rate | Applies to | Source | URL | Note |
|---|---|---|---|---|
| 50% overall; Bags & luggage 54, Electronics 57, Fashion 49, Home 41, Leisure/sports/hobby 46, Personal care 54 | Blocket (Sweden) purchases, 2023 | Schibsted / Vaayu, *The Second-Hand Effect Report 2023* (June 2024), Blocket section | https://assets.ctfassets.net/9qowtvvo5be7/77HjGUIilek5wIlvIeGkhg/df89f84ef9549d595ca0521a01db97d2/Public_Schibsted-The-Second-Hand-Effect-Report-2023_14-june2024.pdf | Close to 2,800 Nordic respondents, minimum 100 responses per category per market. Question: "would you have bought this, or a similar item, brand new?" Professional resellers were excluded. DK 55, NO 54, SE 50, FI 47. Also at https://vend.com/news/half-of-second-hand-purchases-replace-new-ones-report-shows |
| 40% average; Vehicle equipment 52, Garden & renovation 47, Parents & children 44, Sports & outdoor 40, Animal equipment 40 (top five) | Blocket purchases, 2025 | Vend / Vaayu, *The Second-hand effect report 2025* (published 2026-09-29), Blocket section | https://via.tt.se/files/3235399/4570156/434939/sv (press release: https://via.tt.se/pressmeddelande/4570156/the-nordic-circular-economy-in-action-vend-marketplaces-facilitate-672000-tonnes-of-avoided-emissions?lang=sv) | 18,998 survey responses across Vend. Vend overall is "a little over four purchases in ten". The newest Swedish number, 10 points below 2023. |
| 40% | Vinted fashion purchases, 2023 (8 EU countries) | Vaayu x Vinted, *Climate Change Impact Report* 2023; Vinted newsroom 2024-06-18 | https://press-center-static.vinted.com/Vaayu_x_Vinted_Full_Climate_Impact_Report_2023_9a4b6352d1.pdf ; https://company.vinted.com/newsroom/impact-report | "Two-fifths (40%) of transactions on Vinted avoided the purchase of a new item". |
| 64.6% (resale); 82.2% (repair) | UK fashion resale and repair | WRAP press release, 2025-02-27 | https://www.wrap.ngo/media-centre/press-releases/fast-fashion-could-be-left-peg-preloved-and-repair-displace-new-sales | "for every 5 preloved items bought, 3 displace new purchase". Method details in WRAP's *Displacement Rates Untangled*. |
| 60-85 new garments per 100 second-hand | Clothes donated to charity for resale | Farrant, Olsen, Wangel, *Int J LCA* 15:726-736, 2010 | https://orbit.dtu.dk/en/publications/environmental-benefits-from-reusing-clothes/ | "the purchase of 100 second-hand garments would save between 60 and 85 new garments dependent of the place of reuse". |
| ≈29% | UK second-hand clothing | Stevenson & Gmitrowicz 2012 (WRAP), as cited by Klooster et al. 2024 | https://circulareconomyjournal.org/wp-content/uploads/2024/07/Klooster_et_al_Do-we-save-the-environment-by-buying-second-hand-clothes-The-environmental-impacts-of-second-hand-textile-fashion-and-the-influence-of-consumer-choices.pdf | Secondary citation. Schibsted 2023 cites the same WRAP study as "57% RR for online purchases ... 24-29% range for offline channels". |
| 47% | Italian reuse centre (clothes) | Castellani, Sala, Mirabella 2015, *IEAM*, as cited by Klooster et al. 2024 | same Klooster URL | Secondary; primary paywalled. |
| 35-63% (Africa); 25-75% (earlier European estimates) | Second-hand clothing | Nørup et al. 2019, *J Cleaner Production* 235, as summarised by Klooster 2024 and IVL B2497 (2025) | IVL: https://ivl.diva-portal.org/smash/get/diva2:1926690/FULLTEXT01.pdf | Secondary. |
| 50% base, 25-75% sensitivity | Reused T-shirt | Nellström et al., IVL Report B2497, Jan 2025 | https://ivl.diva-portal.org/smash/get/diva2:1926690/FULLTEXT01.pdf | Note: IVL defines replacement rate as **uses relative to a new garment** (quality), not purchase displacement. Different concept, same direction. |
| Per category: T-shirts 0.20, glasses 0.20, books/CDs/VHS 0.08, TVs & monitors 1, computers 1, bicycles 1, beds 0.75, clothing accessories 0.07, children & baby accessories 0.22, household appliances 0.57 | Customers of the Panta Rei reuse centre, Vimercate, Italy | Nichilo, Cavenago, Grosso, Rigamonti, "Quantification of the environmental benefits of the reuse of goods", *Env Sci Poll Res*, 2025, Table 3 | https://pmc.ncbi.nlm.nih.gov/articles/PMC12960352/ | Survey of 577 users, April 2023. The authors flag the short survey window. Physical reuse shop, so this is the closest analogue to a charity shop or sharing depot. |
| 0.5 per loan (sensitivity 0.25-0.75) | Fritidsbanken (Swedish free sports-gear lending), skis | RISE Rapport 2020 (above), sections 3.5.1-3.5.1.2 | https://www.fritidsbanken.se/wp-content/uploads/2020/01/Utvardering-av-fritidsbanker_RISE_rapport.pdf | Survey: 72% had considered buying but borrowed instead; 20% bought new gear after borrowing; 24% bought second-hand after borrowing. |
| 50% (assumption) | Clothes swapping | Naturskyddsföreningen, klädbytardagen 2026 | https://via.tt.se/pressmeddelande/4331751/nationella-kladbytardagen-pa-lordag?publisherId=3236031&lang=sv | Assumption, not measured. |
| 100% (assumption) | Schibsted marketplaces 2016 | Schibsted, *The Second Hand Effect* (2016 data), method by IVL | https://mb.cision.com/Main/9972/2249847/664614.pdf | "each sold used product replaces the production of a new equivalent product". Superseded by the survey-based rates above. |

---

## 4. Operational emissions per circulated item

| Value | Unit | What it covers | Source | URL | Note |
|---|---|---|---|---|---|
| ≈0.25 | kg CO2e per garment sold | Myrorna (Swedish charity chain), all operations 2025 | Myrorna Hållbarhetsrapport 2025, p. 40 | https://www.myrorna.se/app/uploads/hallbarhetsrapport-2025.pdf | **Derived**: total 437 t CO2e (scope 1: 302 t, scope 2: 0 with "100 % vattenkraft", scope 3: 135 t) / (15,736 t / 9 kg = 1.75 million garments). Upper-ish bound for garments, because the operations also sell furniture and household goods. Energy use 1,406,958 kWh. Scope 3 coverage not specified. |
| 0.5-0.7 | kg CO2e per item | UK online clothing re-commerce: electricity, heating, packaging, transport | Klooster, Bellostas, Henry, Shen, "Do We Save the Environment by Buying Second-Hand Clothes?", *Journal of Circular Economy* 2(3), 2024, section 3.2 | https://circulareconomyjournal.org/wp-content/uploads/2024/07/Klooster_et_al_Do-we-save-the-environment-by-buying-second-hand-clothes-The-environmental-impacts-of-second-hand-textile-fashion-and-the-influence-of-consumer-choices.pdf | "this step induces an emission of between 0.5-0.7 kg CO2-eq per item". Same paper cites Babel et al. 2019: 0.9 kg CO2e for a 180 g T-shirt. |
| 1.35 + 0.071 | kg CO2e per item (delivery + packaging) | Vinted peer-to-peer shipping, 2023 | Vaayu x Vinted Climate Impact Report 2023 | https://press-center-static.vinted.com/Vaayu_x_Vinted_Full_Climate_Impact_Report_2023_9a4b6352d1.pdf | Delivery per parcel 1.63, per item 1.35 (first leg 0.18, mid legs 1.25, end leg 0.20). Company operations 27,104 t total. Net avoided 1.25 kg per item. |
| ≈6.2 | kg CO2e per transaction | Vend marketplaces 2025: deliveries (including buyer journeys), packaging, operations | Vend SHE 2025 | https://via.tt.se/files/3235399/4570156/434939/sv | **Derived**: 105,205 t generated / 17 million transactions. Blocket alone: 18,920 t generated. Includes buyer transport, so it overlaps with the calculator's transport term. Mix is dominated by furniture and large items. |
| 5% of new-production impact per renovation, renovation at 25% of loans | share | Fritidsbanken maintenance of lent skis | RISE Rapport 2020, section 3.5.1.1 | https://www.fritidsbanken.se/wp-content/uploads/2020/01/Utvardering-av-fritidsbanker_RISE_rapport.pdf | Renovation came to "5-15 % av totala klimatpåverkan". A modelling rule, not a measured value. |
| 1.9 | kWh electricity per kg garment | Store energy, new-clothing retail (H&M 2012) | Sandin et al. 2019, as used by Klooster et al. 2024, section 2 | Klooster URL above | Proxy for shop energy per kg. Multiply by a Swedish electricity factor if used. |
| storage break-even 23-93 years; truck transport break-even 1,800-50,000 km | break-even | Storage (Stockholm, district heating, 100 kWh/m²) and truck transport for reused building products and furniture | IVL Rapport C696, *Klimateffekter av återbrukade byggprodukter och möbler*, Sept 2022, Tables 2-3 | https://carbonneutralcities.org/wp-content/uploads/2024/02/Stockholm_Calculation-methods_Climate-Effects_Material-Reuse_IVL.pdf | Shows that operations are small next to avoided production for durable goods. No per-item op factor. |
| (0.28) | kg CO2e per kg reused goods | Danish municipal reuse programmes | Bubinek, Knaack, Cimpan, "Reuse of consumer products: Climate account and rebound effects potential", *Sustainable Production and Consumption*, 2025, doi 10.1016/j.spc.2024.12.019 (CC BY) | https://doi.org/10.1016/j.spc.2024.12.019 | **Unverified**: seen only in a search snippet ("0.28 kg CO2e per kg ... average 3.9 kg CO2e per kg" saved; furniture rebound 82-167%). ScienceDirect and the SDU portal were bot-blocked. Worth reading by hand: it is the most directly relevant paper for item 4. |

---

## 5. Existing public calculators and reports (references and cross-checks)

| Name | URL | What it computes | Factors / method |
|---|---|---|---|
| Impact CO2 (ADEME) | https://impactco2.fr ; API `https://impactco2.fr/api/v1/thematiques/ecv/<id>?detail=1` | Footprint of a new item, with a stage breakdown, for clothing, furniture, appliances and digital devices. No reuse calculation. | ADEME Base Empreinte / the ADEME 2018 and 2019 modelling reports. Open. The API answers unauthenticated requests but says "La requete n'est pas authentifiée", with impactco2@ademe.fr as the contact for keys. |
| ADEME Base Carbone / Base Empreinte | https://data.ademe.fr/datasets/base-carboner | Emission factors, with a per-stage split and an uncertainty % per element. | Licence Ouverte. The best single machine-readable source for a v1 table. |
| Schibsted / Vend "Second Hand Effect" (Blocket, FINN, DBA, Tori) | 2016: https://mb.cision.com/Main/9972/2249847/664614.pdf ; 2023: Schibsted report URL in section 3 ; 2025: https://via.tt.se/files/3235399/4570156/434939/sv | Annual avoided emissions per marketplace and category. 2025: ≈672,007 t net for Vend, "nearly 40 kg" per trade. Blocket: ≈104,097 t net. | 2016: IVL method, material composition from ads, 100% replacement. 2023 onward: Vaayu consequential LCA (proprietary Kria database), survey-based replacement rate per category, deducts deliveries, packaging and operations. Per-item factors are not published. Blocket's consumer site begagnateffekten.se refused the connection during this session. |
| Vinted Climate Impact Report (Vaayu) | https://press-center-static.vinted.com/Vaayu_x_Vinted_Full_Climate_Impact_Report_2023_9a4b6352d1.pdf | Net avoided emissions per fashion item: 1.25 kg on average; men's suits and blazers 2.44; women's jeans 2.00. | RR 40%, cradle-to-consumer LCA, deducts delivery (1.35 kg/item), packaging (0.071 kg/item) and company operations. |
| Sellpy per-item CO2 estimate | https://intercom.help/sellpy/en/articles/6471558-how-does-sellpy-estimate-my-co-savings | CO2 and water saved per item sold. | Higg MSI plus H&M data, "representative items" per category, replacement rate from a customer survey (value not disclosed), deducts own warehouse, packaging, transport and office emissions "per item". |
| Myrorna / Erikshjälpen annual savings | Myrorna and Erikshjälpen URLs in section 1a | Total CO2 saved from garments sold. | Flat 9 kg CO2e per garment (Naturskyddsföreningen averages), **no replacement rate, operations explicitly not deducted**. A useful example of what not to do, and why r matters. |
| IVL CCBuild value analysis | Method in IVL C696 (URL in section 4) and IVL C562 (https://ccbuild.se/media/o1fgus3f/%C3%A5terbrukets-klimateffekter-vid-byggnation_-handledning.pdf, not opened) | Climate saving of reused building products and furniture (≈340 products with climate data). | Linear scenario (A1-A4, C2-C4) minus reuse processes (storage, transport, reconditioning). The closest thing to an "IVL återbruksberäknare" that was found. |
| RISE Fritidsbanken evaluation | https://www.fritidsbanken.se/wp-content/uploads/2020/01/Utvardering-av-fritidsbanker_RISE_rapport.pdf | A worked example for a lending service: skis, linear model ≈6 kg CO2e per year per pair vs ≈2 kg for the lending model. | 29 kg per pair (Ecoinvent), r = 0.5, lifetime +50%, renovation 5%, car share 72%, 10 km. Structurally the same as this calculator. |
| Smarta Kartan (Göteborg) | https://www.smartakartan.se/goteborg/ | Directory of sharing, rental, repair and second-hand initiatives. | **No climate calculator found.** It is a prospective user of this tool (see project CLAUDE.md), not a reference. |

---

## Could not find / weak

- **Children's clothes**: no per-item LCA found anywhere (ADEME, IVL, RISE, brands). Options: reuse adult garment factors scaled by mass (not sourced; would have to be labelled as an assumption), or leave the category out of v1.
- **Toys**: only a relative result (wooden toy car 77% lower than plastic) and a spend-based ADEME fallback (231-270 kg CO2e per k€). No per-item absolute value was read.
- **Tent**: only a commercial non-LCA estimate (Arbor, 10-50 kg). Not citable as LCA.
- **Pram/stroller**: one 2012 Chinese paper (321 kg incl. packaging), not opened. Unverified.
- **Bookshelf**: no item value. The ADEME wardrobe (907 kg) is an outlier driven by one stage (716 kg "assemblage et distribution"). Consider the per-tonne furniture fallback (1,833 kg CO2e/t) with an item weight instead.
- **Smartphone**: large spread between ADEME 2018 (16.5-39.1), manufacturer LCAs (33-61 production) and Impact CO2 (79.3). Needs a decision about which vintage to trust.
- **Operational emissions, physical shop per item**: only one Swedish derived value (Myrorna ≈0.25 kg/garment) plus UK online values (0.5-0.9 kg). Castellani et al. 2015 (Italian second-hand shop LCA) and Bubinek et al. 2025 (Danish municipal reuse, 0.28 kg/kg) were not readable here.
- **Primary sources behind secondary citations**: Stevenson & Gmitrowicz 2012 (WRAP), Castellani 2015 and Nørup 2019 rates are taken from Klooster 2024, IVL B2497 and Schibsted 2023, not from the originals.
- **Naturskyddsföreningen's "9 kg per garment"**: used by both Myrorna and Erikshjälpen, but the primary document was not found.
- **Vend 2025 per-category kg per item**: shown only as charts, not as text.
- **IVL C339** (office furniture reuse, per-item values): the download link returns an HTML page, not the PDF.
- **Lopez Londoño, André, Björklund 2026**, "Running, cycling, and carbon: climate impacts of gear..." (*Scand. J. Hospitality and Tourism*, doi 10.1080/15022250.2026.2625307): likely per-item sports gear factors, but the publisher blocked access.
- **Dell Latitude 5450 sheet**: dated "December, 2018" for a 2024 model; the stage split is only in an image.

---

## Conclusion

Clothing, shoes, furniture (chairs, sofas, tables), electronics and small kitchen appliances are well covered. ADEME Base Carbone gives item-level production values with uncertainty ranges and an open licence, and Swedish sources (Sandin/Mistra Future Fashion 2019, RISE 2017 furniture) confirm the orders of magnitude. The car factor is solid and Swedish: Naturvårdsverket's tool v9 gives 0.170 kg CO2e/vkm for petrol and 0.184 for diesel (well-to-wheel), and Trafikverket's 2025 inventory implies a fleet average of 0.138 (tank-to-wheel, biofuel and EVs counted as zero). The replacement rate is well evidenced and Swedish: Blocket 50% (2023) and 40% (2025), with category splits, which supports keeping 50% as the default and offering 40% as the newest measured value. The shaky parts are toys, tents, strollers, children's clothes and bookshelves (no citable item values), the operational-emissions term (one Swedish derived value, ≈0.25 kg per garment for Myrorna, plus UK online values of 0.5-1.4 kg per item), and smartphones, where the sources disagree by a factor of four. For a v1 factor table, the best single sources are ADEME Base Carbone (products), Naturvårdsverket's Klimatberäkningsverktyget v9 (car), Schibsted/Vend's Second-Hand Effect reports (r per category, Sweden) and the RISE Fritidsbanken report (a worked lending-service example with the same structure as this calculator).

---

## Corrections after the review, 2026-09-30

Two factor reviews and a method review re-read every source. The values in `app/factors.js` changed as follows; each was checked against the source in the same session.

- **System boundary.** New-item values now run from raw material to the shop wherever possible. Impact CO2's `footprint` field is that boundary; its `ecv` field adds use and end of life.
- **Clothes span:** 5.2 (cotton T-shirt) to 23.2 kg (jeans), Impact CO2 `footprint`. A coat is 85.8. Mistra's 1-20 kg covers the whole life, laundry and the shop trip included (pp. 59-60, 70), so it is kept as a cross-check only. The typical 9 kg stays; its boundary is unknown.
- **Phones:** typical 55 kg, IVL B 2372 (2020) p. 21, "Handheld: Smartphone", new production. Low 32.7 (Fairphone 5 production). High 79.3 (Impact CO2 `footprint`, ADEME and Arcep 2025).
- **Laptops:** typical 182.3 (Impact CO2 `footprint`, 2025). Low 89, **derived**: Apple's 120 kg for the 13-inch M4 MacBook Air × 74 % (production 71 % + transport 3 %, Apple's split for the 15-inch model, PER carbon section). High 280, IVL B 2372 p. 21, notebook average.
- **TV:** typical 328.3 (Impact CO2 `footprint`, 2025); Base Carbone 2018 gives 340-500 by screen size.
- **Skis:** typical 29 kg, RISE 2020 p. 21 (adult slalom skis). The Base Carbone 15 kg was created in 2014, 80 % uncertainty, no source.
- **Bikes** split in two. Plain bikes 96-150 kg (ECF 2011 p. 5, 5 g/km × 19,200 km, **derived**; Privett 2018 p. 52). E-bikes 134-261 kg (ECF p. 6, 7 g/km × 19,200 km, **derived**; Base Carbone 2019).
- **Kitchen appliances:** typical 36.6 kg, the median of six appliances (31.9 and 41.3 either side).
- **Tables:** high 80.2 kg, Base Carbone solid wood table. The RISE 120 kg was a desk plus a chair over its whole life.
- **Chairs:** typical 24.8 kg, the upholstered wooden chair.
- **Repair parts:** laptops 8 kg typical (battery), 0.2-60 (IVL B 2372 p. 21: battery 8, keyboard 3, adaptor 3, screen 60). TV 5.5 kg (Privett, power supply). Phone high 14 kg (IVL, phone screen).
- **Shares and notes:** Blocket's 2025 average is 40 % (Vend, The Second-hand Effect Report 2025, p. 16); RISE calls its 50 % for Fritidsbanken a best case, per item in the lending stock. WRAP's 82 % for clothing repair is on p. 27 and leaves remaining life out; Privett measured 88 % across repair-café products.
- **Rebound, for the page:** Makov and Font Vivanco 2018 (Frontiers in Energy Research 6:39) find 29 % on average for used smartphones, 27-46 % by model.

Still open, waiting for Henric: books (Bokbranschens klimatinitiativ 2025 p. 21 gives 0.53 kg per average Swedish book, against 1.9 today), and whether a loan should count as half a new purchase when RISE counts per item in the lending stock.

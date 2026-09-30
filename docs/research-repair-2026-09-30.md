# Repair as a method: research 2026-09-30

Background research for adding "lagats" (repaired) as a method. Every figure was read from the source in this session unless marked **unverified**; **derived** means arithmetic on sourced numbers. The model choice is Henric's to make (see the end).

## How published methods count a repair

Two ways to count a repair:

- **(a) Displacement:** the repair avoids a new purchase with some probability.
- **(b) Life extension:** the repair lengthens the item's life, which postpones a new purchase.

| Source | Model | Value | Strength |
|---|---|---|---|
| WRAP, *Displacement Rates Untangled*, Feb 2025, pp. 3, 7, 23, 26 ([pdf](https://www.wrap.ngo/sites/default/files/2025-02/WRAP-Textiles-2030-Displacement-rate-report-REV1.pdf)) | (a): net = E − P × D, service emissions E charged to every item | D = 82.2 % for clothing repair (721 customers of The Seam, Sojo, Finisterre, 2024). An earlier citizen survey (2022) gave 51 %. | Strong; industry standard; clothing only |
| Privett, MSc thesis, University of Surrey, 2018, pp. 37–38, 61–69 ([pdf](https://frc.cfsd.org.uk/wp-content/uploads/2019/11/Impact-of-UK-Repair-Cafe%CC%81s-on-GHG-emissions_v15_SP.pdf)) | (a) × (b): Df = Pb × Rl | Pb = 0.884 (n = 129). Rl = 1 for lack of data. Result −24 kg CO2e per completed repair, net; about −13 kg at Rl = 0.5 | Medium; 2,838 real repairs |
| IVL, Sandin et al., Report C10056, 2025, pp. 17–18, 31–35, 51–52 ([pdf](https://ivl.diva-portal.org/smash/get/diva2:1960643/FULLTEXT02.pdf)) | (a) × (b): use ratio × 70 % | 82 % on average (chosen to match WRAP); 61 % in a sensitivity run | Strong method, Swedish; fictional case |
| Restart Project / Fixometer ([FAQ](https://therestartproject.org/FAQ/)) | (b) described as displacement | 0.5: "lifespan extended by an average of 50 %" | Assumption; widely used in community repair |
| JRC116106, Cordella et al., 2020, p. 114, Tables 32–33 ([pdf](https://publications.jrc.ec.europa.eu/repository/bitstream/JRC116106/jrc116106_jrc_e4c_task2_smartphones_final_publ_id.pdf)) | (b) | Phone battery swap: 56–71 % of the 2-year-cycle emissions. Display: 60–77 % | Strong; assumes full postponement |
| WRAP, *Valuing our clothes*, 2012, p. 23 | (b) | Clothes 33 % longer life gives 27 % less carbon | Solid; fleet scenario |
| ADEME / RDC Environment, 2019, pp. 12–16 ([pdf](https://www.actu-environnement.com/media/pdf/news-35637-eval-eco-allongement-duree-equipement.pdf)) | (b) | Failure at half-life means life fraction 0.5 | Convention |

Not read:

- ADEME 2018 QuantiGES: the report is behind an email form. A search snippet says fridge repair saves 102 kg (**unverified**).
- Cordella et al. 2021 in the *Journal of Industrial Ecology*: returned 403.

## Repair success

Only completed repairs should count:

- Privett found 66.7 % overall: clothing 88.7 %, bikes 83.2 %, furniture 68.7 %, appliances 61.9 %, computing and mobiles 36.9 %.
- RepairMonitor 2024 found 62 % of more than 37,000 repairs ([factsheet](https://www.repaircafe.org/wp-content/uploads/2025/04/Factsheet_RepairMonitor_2024_EN.pdf)).

## Emissions of the repair itself

| Product | kg CO2e per repair | Source |
|---|---|---|
| Clothes | about 0.1 (materials are grams; 0.001–0.009 kWh) | IVL C10056 Table 7; Privett |
| Phone | battery 0.6, display 7.5 (3.2 derived from JRC), camera 1.65, main board 17.9 | Fairphone 5 LCA, Fraunhofer IZM 2024, Table 6-3; JRC Table 33 |
| Repair-café mix | average 0.2; 52 % of repairs used no parts | Privett Table 5.7 |
| Parts | power supply 5.5, motor 4.8, LCD 4.0, heating element 2.2, drive belt 0.5, zip 0.35, spoke 0.27 | Privett Table 5.7 |
| Laptops, shoes, furniture | none found | – |

## Travel

- **Repair café** (Privett, n = 222):
  - 69 % of visitors came by car.
  - The average car trip was 5.75 km one way (**derived**).
  - 1.4 items per visit.
  - That works out to about 1.2 kg per repair.
- **Repair shop:** no source. Drop off and pick up (4 one-way trips) is an assumption.

## Proposed implementation

- Keep the calculator's form (a) with its own replacement share for repair.
  - The sources that model a repair in full (Privett, IVL) multiply "avoids a purchase" by "fraction of a life", so a share below the survey values already includes life extension.
  - No age or remaining-life input is needed; users would not know those values anyway.
- **Repair emissions** are charged to every repaired item, because the parts are new material that the alternative (buying new) does not have.
- **Operations:** the existing assumption for other services.
- **Trips:** 4 one-way trips, the same as rent.
- **Rebound** stays out, as it does for second hand. Privett measured 4.4 kg per repair.

**Open for Henric:** 50 % for all repairs (Restart, WRAP 2022, ADEME's half-life convention; conservative), or 82 % for clothes (WRAP 2025, IVL) and 50 % for the rest.

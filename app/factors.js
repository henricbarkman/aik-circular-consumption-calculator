// Factor table for the calculator. Every value the user sees comes from here,
// and every value carries its provenance:
//   kind: 'source'      published figures, listed in `sources`, with `note` on how they were read
//   kind: 'assumption'  a default the method sets, with the reasoning in `why`
//   kind: 'example'     a placeholder until a source is added; shown as such in the UI
// Change a number here and the page, the copied text and the source table follow.
// Research behind every figure: docs/research-factors-2026-09-30.md.

// ADEME's product values, from Base Carbone. The year is the one the value was
// made, which differs between products; Impact CO2 shows the same values today.
const baseCarbone = (year) => ({
  title: 'Base Carbone',
  org: 'ADEME (franska miljömyndigheten)',
  year,
  url: 'https://data.ademe.fr/datasets/base-carboner',
});
const BC_2014 = baseCarbone(2014);
const BC_2018 = baseCarbone(2018);
const BC_2019 = baseCarbone(2019);
const IMPACT_CLOTHES = { title: 'Impact CO2, kläder', org: 'ADEME (franska miljömyndigheten)', year: 2018, url: 'https://impactco2.fr/outils/habillement' };
// Phones, laptops and TVs were recalculated by ADEME and Arcep in 2025.
const IMPACT_DIGITAL = { title: 'Impact CO2, digitala produkter', org: 'ADEME och Arcep', year: 2025, url: 'https://impactco2.fr/outils/numerique' };
const IVL_IT = { title: 'Klimatfördelar med återbruk av IT-produkter', org: 'IVL Svenska Miljöinstitutet', year: 2020, url: 'https://ivl.diva-portal.org/smash/get/diva2:1552248/FULLTEXT01.pdf' };
const MISTRA = { title: 'Environmental assessment of Swedish clothing consumption', org: 'Mistra Future Fashion, RISE och Chalmers', year: 2019, url: 'https://research.chalmers.se/publication/514322/file/514322_Fulltext.pdf' };
const ECF = { title: 'Cycle more often 2 cool down the planet', org: 'European Cyclists’ Federation', year: 2011, url: 'https://www.bizkaia.eus/fitxategiak/07/Mediateka/5_ECF_Quantifying%20CO2%20saving%20of%20cycling.pdf' };
const RISE_FRITIDSBANKEN = { title: 'Utvärdering av fritidsbanker', org: 'RISE', year: 2020, url: 'https://www.fritidsbanken.se/wp-content/uploads/2020/01/Utvardering-av-fritidsbanker_RISE_rapport.pdf' };

export const METHODS = {
  secondhand: {
    id: 'secondhand',
    label: 'köpts second hand',
    tripsPerCirculation: {
      value: 2,
      kind: 'assumption',
      why: 'En resa dit och en hem. Den som köper second hand gör en tur och retur per köp.',
    },
  },
  // Renting and borrowing count the same way: fetch, use, return. One method,
  // so the sentence does not offer two choices that give the same answer.
  rent: {
    id: 'rent',
    label: 'hyrts eller lånats',
    tripsPerCirculation: {
      value: 4,
      kind: 'assumption',
      why: 'Två turer och returer: en för att hämta, en för att lämna tillbaka.',
    },
  },
  // Research and the choice of shares: docs/research-repair-2026-09-30.md.
  repair: {
    id: 'repair',
    label: 'lagats',
    tripsPerCirculation: {
      value: 4,
      kind: 'assumption',
      why: 'Två turer och returer: en för att lämna in, en för att hämta. Ingen källa mäter resorna till en lagningsverkstad. På ett reparationskafé väntar man ofta medan det lagas, och då blir det två.',
    },
  },
};

const WRAP_2025 = { title: 'Displacement Rates Untangled', org: 'WRAP', year: 2025, url: 'https://www.wrap.ngo/sites/default/files/2025-02/WRAP-Textiles-2030-Displacement-rate-report-REV1.pdf' };
const IVL_2025 = { title: 'Environmental impact of circular e-businesses in the clothing sector', org: 'IVL Svenska Miljöinstitutet', year: 2025, url: 'https://ivl.diva-portal.org/smash/get/diva2:1960643/FULLTEXT02.pdf' };
const PRIVETT = { title: 'Potential impact of UK Repair Cafés on the mitigation of greenhouse gas emissions', org: 'University of Surrey', year: 2018, url: 'https://frc.cfsd.org.uk/wp-content/uploads/2019/11/Impact-of-UK-Repair-Cafe%CC%81s-on-GHG-emissions_v15_SP.pdf' };
const FAIRPHONE = { title: 'Life Cycle Assessment of the Fairphone 5', org: 'Fraunhofer IZM', year: 2024, url: 'https://www.fairphone.com/wp-content/uploads/2024/09/Fairphone5_LCA_Report_2024.pdf' };
const JRC_PHONES = { title: 'Guidance for the Assessment of Material Efficiency: Application to Smartphones', org: 'EU-kommissionens forskningscentrum JRC', year: 2020, url: 'https://publications.jrc.ec.europa.eu/repository/bitstream/JRC116106/jrc116106_jrc_e4c_task2_smartphones_final_publ_id.pdf' };

// Share of repairs that replace a new purchase. Henric 2026-09-30: 82 % for
// clothes, where it is measured, and 50 % for everything else, where it is not.
// Neither figure accounts for how long the repaired item then lasts.
const REPAIR_SHARE_CLOTHES = {
  value: 82, kind: 'source', sources: [WRAP_2025, IVL_2025],
  note: 'WRAP frågade 721 kunder hos tre brittiska lagningsföretag för kläder 2024: 82 procent av lagningarna ersatte ett nyköp (s. 27). IVL använder samma andel i ett räkneexempel. Mätningen frågar om köpet, inte om hur länge det lagade plagget sedan håller. En tidigare enkät från WRAP 2022 gav 51 procent.',
};
const REPAIR_SHARE_OTHER = {
  value: 50, kind: 'assumption',
  why: 'Hälften är samma andel som för second hand, och samma som reparationskaférörelsens beräkningar (Restart Project) använder. Den enda mätningen utanför kläder, på brittiska reparationskaféer (Privett 2018), gav 88 procent, men räknade inte med att en lagad sak kan hålla kortare tid än en ny.',
};

// kg CO2e for the repair itself: spare parts and material. Charged to every
// repaired item, because the parts are new material that buying new would not
// have added. The workshop's premises and energy are in operations, not here.
const repairSmall = (what, extra = '') => ({
  value: 0.2, kind: 'assumption',
  why: `Snittet för en lagning på brittiska reparationskaféer (Privett 2018), där hälften av lagningarna inte behövde några reservdelar alls. Ingen källa mäter lagning av ${what}. Byts en skärm, ett nätaggregat eller en motor blir det 4 till 5,5 kg: ändra då värdet.${extra}`,
});

const perVisit = (value, why) => ({ value, kind: 'assumption', why });

// LCA is kg CO2e for one newly produced item. `value` is the typical item the
// calculation uses; `low` and `high` are the span the sources give, shown next to
// the result so the uncertainty stays visible without making the headline a range.
// Categories without a citable per-item figure (children's clothes, toys, tents,
// bookshelves, prams) are left out rather than guessed.
export const CATEGORIES = [
  {
    id: 'klader', plural: 'kläder', singular: 'ett nytt klädesplagg',
    lca: {
      value: 9, low: 5.2, high: 23.2, kind: 'source',
      sources: [
        { title: 'Hållbarhetsrapport 2025', org: 'Myrorna', year: 2025, url: 'https://www.myrorna.se/app/uploads/hallbarhetsrapport-2025.pdf' },
        { title: 'Vårt miljöuppdrag', org: 'Erikshjälpen', year: 2025, url: 'https://erikshjalpen.se/en/about-erikshjalpen-second-hand/our-commitments/vart-miljouppdrag/' },
        IMPACT_CLOTHES,
        MISTRA,
      ],
      typical: 'Svenska second hand-kedjors schablon per plagg (Myrorna, Erikshjälpen), som de hänvisar till Naturskyddsföreningen. Vad siffran räknar med anges inte.',
      note: 'Spannet är ADEME:s värden från råvara till butik: en t-shirt 5,2 och ett par jeans 23,2 kg. Tyngre plagg ligger över, en kappa 85,8 kg. Mistra Future Fashion anger 1 kg för ett par strumpor till 20 kg för en jacka, men räknar då med hela livet, tvätt och resor till butiken inräknade.',
    },
    itemsPerTrip: {
      value: 2.5, kind: 'source',
      sources: [MISTRA],
      note: 'Studien räknar med två till tre plagg per besök (s. 54). Här används mitten.',
    },
    repairShare: REPAIR_SHARE_CLOTHES,
    repairKg: { value: 0.1, kind: 'source', sources: [IVL_2025, PRIVETT], note: 'Tråd och knappar väger några gram enligt IVL. En ny dragkedja är 0,35 kg och en lapp 0,08 kg enligt Privett. 0,1 kg är ett avrundat mellanläge.' },
    spread: 'En t-shirt och ett par jeans hamnar långt ifrån varandra, och en kappa ännu längre. Material och vikt avgör mest.',
  },
  {
    id: 'skor', plural: 'par skor', singular: 'ett nytt par skor',
    lca: { low: 13.4, high: 18.7, kind: 'source', sources: [BC_2018], note: 'Tillverkning fram till butik. Läderskor 13,4, textilskor 17,3 och sportskor 18,7 kg.' },
    itemsPerTrip: perVisit(1, 'Skor köps oftast ett par i taget.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: repairSmall('skor'),
    spread: 'Läderskor ligger lägst och sportskor högst.',
  },
  {
    id: 'stolar', plural: 'stolar', singular: 'en ny stol',
    lca: { value: 24.8, typical: 'ADEME:s värde för en trästol med klädsel, mitt i spannet.', low: 18.6, high: 34.4, kind: 'source', sources: [BC_2018], note: 'Tillverkning fram till butik. Trästol 18,6, trä med klädsel 24,8 och plaststol 34,4 kg.' },
    itemsPerTrip: perVisit(2, 'Stolar hämtas ofta två eller fler åt gången.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: repairSmall('stolar'),
    spread: 'En enkel trästol ligger lägst, en plaststol högst.',
  },
  {
    id: 'soffor', plural: 'soffor', singular: 'en ny soffa',
    lca: { low: 179, high: 198, kind: 'source', sources: [BC_2018], note: 'Tillverkning fram till butik. Textilklädd 179, läder 182 och bäddsoffa 198 kg.' },
    itemsPerTrip: perVisit(1, 'En soffa är alltid en egen resa.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: repairSmall('soffor', ' Att klä om en soffa ingår inte, och kan bli betydligt mer.'),
    spread: 'Stomme, stoppning och klädsel står för det mesta. En bäddsoffa ligger högst.',
  },
  {
    id: 'bord', plural: 'bord', singular: 'ett nytt bord',
    lca: {
      value: 60.1, low: 60.1, high: 80.2, kind: 'source',
      typical: 'Ett representativt bord enligt ADEME.',
      sources: [BC_2018],
      note: 'Tillverkning fram till butik. Ett representativt bord 60,1 och ett massivt träbord 80,2 kg.',
    },
    itemsPerTrip: perVisit(1, 'Ett bord är oftast en egen resa.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: repairSmall('bord'),
    spread: 'Ett massivt träbord ligger högre än ett genomsnittligt.',
  },
  {
    id: 'mobiler', plural: 'mobiltelefoner', singular: 'en ny mobiltelefon',
    lca: {
      value: 55, typical: 'IVL:s värde för en ny smarttelefon (s. 21), en svensk källa mitt i spannet.',
      low: 32.7, high: 79.3, kind: 'source', sources: [IVL_IT, FAIRPHONE, IMPACT_DIGITAL],
      note: 'Tillverkning fram till butik. Lågt: Fairphone 5, en telefon byggd för att släppa ut lite. Högt: ADEME:s och Arcep:s genomsnitt från 2025.',
    },
    itemsPerTrip: perVisit(1, 'En telefon i taget.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: { value: 3, low: 0.6, high: 14, kind: 'source', sources: [FAIRPHONE, JRC_PHONES, IVL_IT], typical: 'Ungefär en ny skärm enligt JRC:s tal.', note: 'Ett nytt batteri 0,6 kg och en hel skärmmodul 7,5 kg, med delen, frakten och omhändertagandet (Fairphone 5). Ur JRC:s tal blir en skärm ungefär 3 kg. IVL anger 14 kg för en telefonskärm.' },
    spread: 'Nästan allt kommer från tillverkningen av chip och skärm. Större och nyare modeller ligger högre.',
  },
  {
    id: 'datorer', plural: 'bärbara datorer', singular: 'en ny bärbar dator',
    lca: {
      value: 182, typical: 'ADEME:s och Arcep:s genomsnitt för en bärbar dator från 2025.',
      low: 89, high: 280, kind: 'source',
      sources: [{ title: 'MacBook Air (M4) Product Environmental Report', org: 'Apple', year: 2025, url: 'https://www.apple.com/environment/pdf/products/notebooks/M4_MacBook_Air_PER_March2025.pdf' }, IMPACT_DIGITAL, IVL_IT],
      note: 'Tillverkning fram till butik. Lågt: minsta MacBook Air, Apples 120 kg för hela livet utan användningen, som är ungefär en fjärdedel. Högt: IVL:s genomsnitt för bärbara datorer (s. 21).',
    },
    itemsPerTrip: perVisit(1, 'En dator i taget.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: {
      value: 8, low: 0.2, high: 60, kind: 'source', sources: [IVL_IT, PRIVETT],
      typical: 'Ungefär ett nytt batteri. Ingen källa mäter vilken lagning som är vanligast.',
      note: 'IVL anger ett nytt batteri 8, ett tangentbord 3, en laddare 3 och en skärm 60 kg (s. 21). Lägst: snittet på reparationskaféer, där hälften av lagningarna inte behövde reservdelar.',
    },
    spread: 'Skärmstorlek, minne och grafikkort styr. Tillverkningen står för det mesta.',
  },
  {
    id: 'tv', plural: 'tv-apparater', singular: 'en ny tv',
    lca: {
      value: 328, typical: 'ADEME:s och Arcep:s genomsnitt för en tv från 2025.',
      low: 328, high: 500, kind: 'source', sources: [IMPACT_DIGITAL, BC_2018],
      note: 'Tillverkning fram till butik. De äldre värdena från 2018 går efter skärmstorlek, 340 till 500 kg, där 500 kg gäller 49 tum och större.',
    },
    itemsPerTrip: perVisit(1, 'En tv i taget.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: { value: 5.5, low: 0.2, high: 5.5, kind: 'source', sources: [PRIVETT], typical: 'Ett nytt nätaggregat.', note: 'Ett nytt nätaggregat 5,5 kg. Lägst: snittet på reparationskaféer, där hälften av lagningarna inte behövde reservdelar.' },
    spread: 'Skärmstorleken avgör nästan allt.',
  },
  {
    id: 'borr', plural: 'borrskruvdragare', singular: 'en ny sladdlös borrskruvdragare',
    lca: { value: 23.5, typical: 'ADEME:s värde för en sladdlös borrskruvdragare.', low: 11.8, high: 35.3, kind: 'source', sources: [BC_2019], note: 'Tillverkning fram till butik. ADEME anger 23,5 kg med en osäkerhet på 50 procent. Spannet här är 23,5 kg plus och minus 50 procent. Bara en källa finns.' },
    itemsPerTrip: perVisit(1, 'Ett verktyg per lån är det vanliga.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: repairSmall('verktyg'),
    spread: 'Råvarorna står för ungefär två tredjedelar, 15 av 23,5 kg.',
  },
  {
    id: 'skidor', plural: 'par skidor', singular: 'ett nytt par skidor',
    lca: {
      value: 29, typical: 'RISE värde för ett par slalomskidor för vuxna, från utvärderingen av Fritidsbanken.',
      low: 15, high: 29, kind: 'source',
      sources: [RISE_FRITIDSBANKEN, BC_2014],
      note: 'RISE anger 29 kg för ett par slalomskidor för vuxna (s. 21). ADEME:s värde, 15 kg, är från 2014, har en osäkerhet på 80 procent och anger ingen källa.',
    },
    itemsPerTrip: perVisit(1, 'Ett par skidor per besök.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: repairSmall('skidor'),
    spread: 'Bara två källor finns, och ADEME:s lägre värde säger inte vad det gäller.',
  },
  {
    id: 'cyklar', plural: 'cyklar', singular: 'en ny cykel',
    lca: {
      low: 96, high: 150, kind: 'source',
      sources: [ECF, PRIVETT],
      note: 'Cyklar utan motor. Lågt: uträknat ur 5 gram per kilometer över 19 200 kilometer, underhåll inräknat (ECF). Högt: 150 kg enligt Privett (s. 52).',
    },
    itemsPerTrip: perVisit(1, 'En cykel i taget.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: { value: 0.3, kind: 'source', sources: [PRIVETT], note: 'En ny eker 0,27 kg. Att laga en punktering ger nästan inget.' },
    spread: 'Bara två källor finns, och de räknar olika. Ramens material och vikt avgör mest.',
  },
  {
    id: 'elcyklar', plural: 'elcyklar', singular: 'en ny elcykel',
    lca: {
      low: 134, high: 261, kind: 'source',
      sources: [ECF, BC_2019],
      note: 'Lågt: uträknat ur 7 gram per kilometer över 19 200 kilometer, underhåll inräknat (ECF). Högt: ADEME:s värde för en elcykel, tillverkning fram till butik.',
    },
    itemsPerTrip: perVisit(1, 'En elcykel i taget.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: repairSmall('elcyklar', ' Ett nytt batteri ger betydligt mer.'),
    spread: 'Batteriet och motorn gör skillnaden mot en vanlig cykel.',
  },
  {
    id: 'bocker', plural: 'böcker', singular: 'en ny bok',
    lca: {
      low: 1.1, high: 2.71, kind: 'source',
      sources: [BC_2014, { title: 'Carbon Footprint Assessment of a Paperback Book', org: 'Journal of Industrial Ecology', year: 2012, url: 'https://doi.org/10.1111/j.1530-9290.2011.00414.x' }],
      note: 'Lågt: en bok på 300 gram enligt ADEME, ett värde från 2014 utan angiven källa. Högt: en häftad bok från skog till färdig bok i en nordamerikansk studie.',
    },
    itemsPerTrip: perVisit(3, 'Böcker lånas och köps ofta flera åt gången.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: repairSmall('böcker'),
    spread: 'Sidantal och papper avgör mest.',
  },
  {
    id: 'kok', plural: 'små köksapparater', singular: 'en ny liten köksapparat',
    lca: {
      value: 36.6, typical: 'Medianen av sex apparater: mitt emellan en kaffebryggare på 31,9 och en matberedare på 41,3 kg.',
      low: 9.9, high: 98, kind: 'source', sources: [BC_2018, BC_2019],
      note: 'Tillverkning fram till butik. Vattenkokare 9,9, kaffebryggare 22,5 till 47,6, matberedare 41,3 och mikrovågsugn 98 kg.',
    },
    itemsPerTrip: perVisit(1, 'En apparat i taget.'),
    repairShare: REPAIR_SHARE_OTHER,
    repairKg: { value: 1.2, low: 0.2, high: 2.2, kind: 'source', sources: [PRIVETT], typical: 'Mitten av spannet.', note: 'Lågt: snittet för en lagning på reparationskafé, där hälften inte behövde reservdelar. Högt: ett nytt värmeelement. En ny motor ger 4,8 kg.' },
    spread: 'En vattenkokare ligger lägst, en mikrovågsugn högst.',
  },
];

// Where no source names a typical item, the calculation uses the middle of the
// span, and says so.
for (const c of CATEGORIES) {
  if (c.lca.value != null) continue;
  c.lca.value = Math.round((c.lca.low + c.lca.high) * 5) / 10;
  c.lca.typical = 'Mitten av källans spann, för när ni inte vet mer om era produkter.';
}

export const SHARED = {
  replacementShare: {
    value: 50,
    kind: 'source',
    sources: [
      { title: 'The Second Hand Effect Report', org: 'Schibsted', year: 2023, url: 'https://assets.ctfassets.net/9qowtvvo5be7/77HjGUIilek5wIlvIeGkhg/df89f84ef9549d595ca0521a01db97d2/Public_Schibsted-The-Second-Hand-Effect-Report-2023_14-june2024.pdf' },
      { title: 'The Second-hand Effect Report 2025', org: 'Vend', year: 2025, url: 'https://via.tt.se/files/3235399/4570156/434939/sv' },
      RISE_FRITIDSBANKEN,
    ],
    note: '50 procent är Blockets mätning 2023: hälften av köpen ersatte ett nyköp. För möbler och hem var det 41 procent. I mätningen 2025 var snittet 40 procent (s. 16), med en något ändrad fråga. RISE räknade med att hälften av sakerna i Fritidsbankens utlåning ersatte ett nyköp, och kallade det ett bästa fall: 30 procent av låntagarna sa att de annars hade köpt.',
    why: 'Alla second hand-köp, lån och hyror ersätter inte ett nyköp. Något är billigare och köps därför i onödan, något hade aldrig köpts alls.',
  },
  carShare: {
    value: 75,
    kind: 'assumption',
    why: 'Metodens utgångsläge när ni inte vet hur era besökare tar sig dit. RISE räknade med 72 procent bil för Fritidsbanken 2020, Mistra Future Fashion med 50 procent för klädköp 2019.',
  },
  kmPerTrip: {
    value: 7,
    kind: 'assumption',
    why: 'Metodens utgångsläge för avståndet en väg. Mistra Future Fashion räknade med 8,5 km för klädköp 2019.',
  },
  carEf: {
    value: 0.17,
    kind: 'source',
    sources: [{ title: 'Beräkningsverktyg för resors klimatutsläpp, version 9', org: 'Naturvårdsverket', year: 2025, url: 'https://www.naturvardsverket.se/4b1060/contentassets/1224aae0cb7c48138c68f1b6c55e00d4/klimatberakningsverktyget-version-9-251215.xlsx' }],
    note: 'En bensinbil i Sverige, med tillverkningen av bränslet och dagens inblandning av biobränsle, men utan tillverkningen av bilen. En dieselbil ger 0,184 och en elbil 0,007 kg per km.',
  },
  opEfPerItem: {
    value: 0.25,
    kind: 'source',
    sources: [{ title: 'Hållbarhetsrapport 2025', org: 'Myrorna', year: 2025, url: 'https://www.myrorna.se/app/uploads/hallbarhetsrapport-2025.pdf' }],
    note: 'Uträknat ur rapporten: Myrornas hela verksamhet 2025, med insamling, transporter, sortering och butiker, 437 ton, delat på ungefär 1,75 miljoner plagg som sorterades för butikerna.',
  },
  // The same figure for everything that is not clothes: no source measures it,
  // so it is labelled as the assumption it is.
  opEfPerItemOther: {
    value: 0.25,
    kind: 'assumption',
    why: 'Samma tal som för kläder, uträknat ur Myrornas hållbarhetsrapport 2025 (437 ton delat på ungefär 1,75 miljoner plagg som sorterades för butikerna). Ingen källa mäter driften per styck för annat än kläder. För större föremål är den troligen högre, för små som böcker lägre. Byt gärna mot er egen siffra.',
  },
  // One shop visit, there and back: the trips a new purchase would have taken
  // anyway. Trips beyond it are charged even when the circulation replaces a purchase.
  newPurchaseTrips: {
    value: 2,
    kind: 'assumption',
    why: 'Ett nyköp kräver också en tur och retur till butiken.',
  },
  opEfRepair: {
    value: 0.25,
    kind: 'assumption',
    why: 'Ingen källa mäter driften av en lagningsverkstad per lagning. Samma tal som för en second hand-butik används. I IVL:s exempel på en lagningstjänst för kläder var tjänstens egna utsläpp, resor inräknade, några procent av nyttan.',
  },
};

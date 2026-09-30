// Factor table for the calculator. Every value the user sees comes from here,
// and every value carries its provenance:
//   kind: 'source'      published figures, listed in `sources`, with `note` on how they were read
//   kind: 'assumption'  a default the method sets, with the reasoning in `why`
//   kind: 'example'     a placeholder until a source is added; shown as such in the UI
// Change a number here and the page, the copied text and the source table follow.
// Research behind every figure: docs/research-factors-2026-09-30.md.

const ADEME = {
  title: 'Base Carbone och Impact CO2',
  org: 'ADEME (franska miljömyndigheten)',
  year: 2018,
  url: 'https://data.ademe.fr/datasets/base-carboner',
};
const ADEME_2019 = { ...ADEME, year: 2019 };

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
};

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
      value: 9, low: 1, high: 20, kind: 'source',
      sources: [
        { title: 'Hållbarhetsrapport 2025', org: 'Myrorna', year: 2025, url: 'https://www.myrorna.se/app/uploads/hallbarhetsrapport-2025.pdf' },
        { title: 'Vårt miljöuppdrag', org: 'Erikshjälpen', year: 2025, url: 'https://erikshjalpen.se/en/about-erikshjalpen-second-hand/our-commitments/vart-miljouppdrag/' },
        { title: 'Environmental assessment of Swedish clothing consumption', org: 'Mistra Future Fashion, RISE och Chalmers', year: 2019, url: 'https://research.chalmers.se/publication/514322/file/514322_Fulltext.pdf' },
      ],
      typical: 'Snittet per plagg som Myrorna och Erikshjälpen räknar med, hämtat från Naturskyddsföreningen.',
      note: 'Spannet kommer från Mistra Future Fashion: ungefär 1 kg för ett par strumpor och ungefär 20 kg för en jacka, hela livet med tvätt i Sverige (s. 59).',
    },
    itemsPerTrip: {
      value: 2.5, kind: 'source',
      sources: [{ title: 'Environmental assessment of Swedish clothing consumption', org: 'Mistra Future Fashion, RISE och Chalmers', year: 2019, url: 'https://research.chalmers.se/publication/514322/file/514322_Fulltext.pdf' }],
      note: 'Studien räknar med två till tre plagg per besök. Här används mitten.',
    },
    spread: 'Ett par strumpor och en vinterjacka hamnar långt ifrån varandra. Material och vikt avgör mest.',
  },
  {
    id: 'skor', plural: 'par skor', singular: 'ett nytt par skor',
    lca: { low: 13.4, high: 18.7, kind: 'source', sources: [ADEME], note: 'Tillverkning fram till butik. Läderskor 13,4, textilskor 17,3 och sportskor 18,7 kg.' },
    itemsPerTrip: perVisit(1, 'Skor köps oftast ett par i taget.'),
    spread: 'Läderskor ligger lägst och sportskor högst.',
  },
  {
    id: 'stolar', plural: 'stolar', singular: 'en ny stol',
    lca: { low: 18.6, high: 34.4, kind: 'source', sources: [ADEME], note: 'Tillverkning fram till butik. Trästol 18,6, trä med klädsel 24,8 och plaststol 34,4 kg.' },
    itemsPerTrip: perVisit(2, 'Stolar hämtas ofta två eller fler åt gången.'),
    spread: 'En enkel trästol ligger lägst, en plaststol högst.',
  },
  {
    id: 'soffor', plural: 'soffor', singular: 'en ny soffa',
    lca: { low: 179, high: 198, kind: 'source', sources: [ADEME], note: 'Tillverkning fram till butik. Textilklädd 179, läder 182 och bäddsoffa 198 kg.' },
    itemsPerTrip: perVisit(1, 'En soffa är alltid en egen resa.'),
    spread: 'Stomme, stoppning och klädsel står för det mesta. En bäddsoffa ligger högst.',
  },
  {
    id: 'bord', plural: 'bord', singular: 'ett nytt bord',
    lca: {
      value: 60.1, low: 60.1, high: 120, kind: 'source',
      typical: 'Ett representativt bord enligt ADEME.',
      sources: [ADEME, { title: 'Hållbarhetsanalys av cirkulära möbelflöden', org: 'RISE', year: 2017, url: 'https://cirkularitet.se/wp-content/uploads/2019/02/H%C3%A5llbarhetsanalys-av-cirkul%C3%A4ra-m%C3%B6belfl%C3%B6den.pdf' }],
      note: 'Lågt: ett vanligt bord enligt ADEME. Högt: ett skrivbord med stol enligt RISE, uträknat ur rapportens tal per år.',
    },
    itemsPerTrip: perVisit(1, 'Ett bord är oftast en egen resa.'),
    spread: 'Ett enkelt bord ligger lägst, ett kontorsskrivbord högst.',
  },
  {
    id: 'mobiler', plural: 'mobiltelefoner', singular: 'en ny mobiltelefon',
    lca: { low: 16.5, high: 79.3, kind: 'source', sources: [ADEME], note: 'Tillverkning. De äldre värdena från 2018 går efter skärmstorlek (16,5 till 39,1 kg), det nyare värdet i Impact CO2 är 79,3 kg. Källorna skiljer sig mycket, och därför är spannet brett.' },
    itemsPerTrip: perVisit(1, 'En telefon i taget.'),
    spread: 'Nästan allt kommer från tillverkningen av chip och skärm. Större och nyare modeller ligger högre.',
  },
  {
    id: 'datorer', plural: 'bärbara datorer', singular: 'en ny bärbar dator',
    lca: {
      low: 120, high: 182, kind: 'source',
      sources: [{ title: 'MacBook Air (M4) Product Environmental Report', org: 'Apple', year: 2025, url: 'https://www.apple.com/environment/pdf/products/notebooks/M4_MacBook_Air_PER_March2025.pdf' }, ADEME],
      note: 'Lågt: minsta MacBook Air över hela livet enligt Apple. Högt: en genomsnittlig bärbar dator vid tillverkningen enligt Impact CO2.',
    },
    itemsPerTrip: perVisit(1, 'En dator i taget.'),
    spread: 'Skärmstorlek, minne och grafikkort styr. Tillverkningen står för det mesta.',
  },
  {
    id: 'tv', plural: 'tv-apparater', singular: 'en ny tv',
    lca: { low: 328, high: 500, kind: 'source', sources: [ADEME], note: 'Tillverkning. Ökar med skärmstorleken, 500 kg gäller 49 tum och större.' },
    itemsPerTrip: perVisit(1, 'En tv i taget.'),
    spread: 'Skärmstorleken avgör nästan allt.',
  },
  {
    id: 'borr', plural: 'borrskruvdragare', singular: 'en ny sladdlös borrskruvdragare',
    lca: { value: 23.5, typical: 'ADEME:s värde för en sladdlös borrskruvdragare.', low: 11.8, high: 35.3, kind: 'source', sources: [ADEME_2019], note: 'ADEME anger 23,5 kg med en osäkerhet på 50 procent. Spannet här är 23,5 kg plus och minus 50 procent. Bara en källa finns.' },
    itemsPerTrip: perVisit(1, 'Ett verktyg per lån är det vanliga.'),
    spread: 'Råvarorna i motor och batteri står för mer än hälften.',
  },
  {
    id: 'skidor', plural: 'par skidor', singular: 'ett nytt par skidor',
    lca: {
      low: 15, high: 29, kind: 'source',
      sources: [ADEME, { title: 'Utvärdering av fritidsbanker', org: 'RISE', year: 2020, url: 'https://www.fritidsbanken.se/wp-content/uploads/2020/01/Utvardering-av-fritidsbanker_RISE_rapport.pdf' }],
      note: 'Tillverkning av ett par skidor enligt ADEME och enligt RISE utvärdering av Fritidsbanken.',
    },
    itemsPerTrip: perVisit(1, 'Ett par skidor per besök.'),
    spread: 'Utförsskidor med metall ligger högre än enkla längdskidor.',
  },
  {
    id: 'cyklar', plural: 'cyklar', singular: 'en ny cykel',
    lca: {
      low: 96, high: 261, kind: 'source',
      sources: [{ title: 'Cycle more often 2 cool down the planet', org: 'European Cyclists’ Federation', year: 2011, url: 'https://www.bizkaia.eus/fitxategiak/07/Mediateka/5_ECF_Quantifying%20CO2%20saving%20of%20cycling.pdf' }, ADEME_2019],
      note: 'Lågt: en vanlig cykel, uträknat ur 5 gram per kilometer över 19 200 kilometer. Högt: en elcykel enligt ADEME.',
    },
    itemsPerTrip: perVisit(1, 'En cykel i taget.'),
    spread: 'En vanlig cykel ligger lägst. Elcykelns batteri och motor nästan tredubblar utsläppen.',
  },
  {
    id: 'bocker', plural: 'böcker', singular: 'en ny bok',
    lca: {
      low: 1.1, high: 2.71, kind: 'source',
      sources: [ADEME, { title: 'Carbon Footprint Assessment of a Paperback Book', org: 'Journal of Industrial Ecology', year: 2012, url: 'https://doi.org/10.1111/j.1530-9290.2011.00414.x' }],
      note: 'Lågt: en bok på 300 gram enligt ADEME. Högt: en pocketbok från skog till färdig bok i en nordamerikansk studie.',
    },
    itemsPerTrip: perVisit(3, 'Böcker lånas och köps ofta flera åt gången.'),
    spread: 'Sidantal och papper avgör mest.',
  },
  {
    id: 'kok', plural: 'små köksapparater', singular: 'en ny liten köksapparat',
    lca: { low: 9.9, high: 98, kind: 'source', sources: [ADEME_2019], note: 'Bara tillverkningen. Vattenkokare 9,9, kaffebryggare 22,5 till 47,6, matberedare 41,3 och mikrovågsugn 98 kg.' },
    itemsPerTrip: perVisit(1, 'En apparat i taget.'),
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
      { title: 'Second Hand Effect 2025', org: 'Vend', year: 2025, url: 'https://vend.com/news/half-of-second-hand-purchases-replace-new-ones-report-shows' },
      { title: 'Utvärdering av fritidsbanker', org: 'RISE', year: 2020, url: 'https://www.fritidsbanken.se/wp-content/uploads/2020/01/Utvardering-av-fritidsbanker_RISE_rapport.pdf' },
    ],
    note: '50 procent är Blockets mätning 2023: hälften av köpen ersatte ett nyköp. I mätningen 2025 var andelen 40 procent. RISE räknade också med 50 procent för Fritidsbanken, fast 72 procent av låntagarna sa att de hade funderat på att köpa i stället.',
    why: 'Alla second hand-köp, lån och hyror ersätter inte ett nyköp. Något är billigare och köps därför i onödan, något hade aldrig köpts alls.',
  },
  carShare: {
    value: 75,
    kind: 'assumption',
    why: 'Metodens utgångsläge när ni inte vet hur era besökare tar sig dit. RISE räknade med 72 procent bil för Fritidsbanken 2020.',
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
    note: 'En bensinbil i Sverige, med tillverkningen av bränslet och dagens inblandning av biobränsle. En dieselbil ger 0,184 och en elbil 0,007 kg per km.',
  },
  opEfPerItem: {
    value: 0.25,
    kind: 'source',
    sources: [{ title: 'Hållbarhetsrapport 2025', org: 'Myrorna', year: 2025, url: 'https://www.myrorna.se/app/uploads/hallbarhetsrapport-2025.pdf' }],
    note: 'Uträknat ur rapporten: Myrornas hela verksamhet, 437 ton, delat på ungefär 1,75 miljoner sålda plagg. Gäller en kedja av klädbutiker.',
  },
  // The same figure for everything that is not clothes: no source measures it,
  // so it is labelled as the assumption it is.
  opEfPerItemOther: {
    value: 0.25,
    kind: 'assumption',
    why: 'Samma tal som för kläder, uträknat ur Myrornas hållbarhetsrapport 2025 (437 ton delat på ungefär 1,75 miljoner sålda plagg). Ingen källa mäter driften per styck för större föremål, och den är troligen högre. Byt gärna mot er egen siffra.',
  },
};

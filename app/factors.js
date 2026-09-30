// Factor table for the calculator. Every value the user sees comes from here,
// and every value carries its provenance:
//   kind: 'source'      a published figure, with title, org, year and url
//   kind: 'assumption'  a default the method sets, with the reasoning in `why`
//   kind: 'example'     a placeholder until a source is added; shown as such in the UI
// Change a number here and the page, the copied text and the source table follow.

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
  rent: {
    id: 'rent',
    label: 'hyrts',
    tripsPerCirculation: {
      value: 4,
      kind: 'assumption',
      why: 'Två turer och returer: en för att hämta, en för att lämna tillbaka.',
    },
  },
  borrow: {
    id: 'borrow',
    label: 'lånats',
    tripsPerCirculation: {
      value: 4,
      kind: 'assumption',
      why: 'Som att hyra: en tur och retur för att hämta och en för att lämna tillbaka.',
    },
  },
};

// LCA ranges are kg CO2e for one newly produced item, low and high end.
// The range is deliberate: the method never averages it away.
export const CATEGORIES = [
  { id: 'klader', plural: 'kläder', singular: 'ett nytt klädesplagg', lca: { low: 5, high: 30, kind: 'example' }, itemsPerTrip: { value: 3, kind: 'assumption', why: 'Den som handlar kläder tar ofta med sig flera plagg per besök.' }, spread: 'En tunn topp och en vinterjacka hamnar långt ifrån varandra. Material, vikt och tillverkningsland avgör mest.' },
  { id: 'skor', plural: 'par skor', singular: 'ett nytt par skor', lca: { low: 10, high: 30, kind: 'example' }, itemsPerTrip: { value: 1, kind: 'assumption', why: 'Skor köps oftast ett par i taget.' }, spread: 'Gympaskor av syntet och kängor av läder skiljer sig mest.' },
  { id: 'barnklader', plural: 'barnkläder', singular: 'ett nytt barnplagg', lca: { low: 2, high: 15, kind: 'example' }, itemsPerTrip: { value: 4, kind: 'assumption', why: 'Barnkläder köps ofta i omgångar när barnet växer.' }, spread: 'Små plagg väger lite, men ytterkläder för barn kan ligga nära vuxnas.' },
  { id: 'mobler', plural: 'möbler', singular: 'en ny möbel', lca: { low: 20, high: 200, kind: 'example' }, itemsPerTrip: { value: 1, kind: 'assumption', why: 'En möbel är oftast skälet till en egen resa.' }, spread: 'En pinnstol och en soffa hör till samma kategori men skiljer en storleksordning. Stoppning, metall och spånskiva väger tyngst.' },
  { id: 'mobiler', plural: 'mobiltelefoner', singular: 'en ny mobiltelefon', lca: { low: 40, high: 90, kind: 'example' }, itemsPerTrip: { value: 1, kind: 'assumption', why: 'En telefon i taget.' }, spread: 'Det mesta av utsläppen kommer från tillverkningen av chip och skärm. Större och dyrare modeller ligger högre.' },
  { id: 'datorer', plural: 'bärbara datorer', singular: 'en ny bärbar dator', lca: { low: 150, high: 400, kind: 'example' }, itemsPerTrip: { value: 1, kind: 'assumption', why: 'En dator i taget.' }, spread: 'Skärmstorlek, grafikkort och minne styr. Tillverkningen står för nästan allt.' },
  { id: 'verktyg', plural: 'elverktyg', singular: 'ett nytt elverktyg', lca: { low: 10, high: 50, kind: 'example' }, itemsPerTrip: { value: 1, kind: 'assumption', why: 'Ett verktyg per lån är det vanliga.' }, spread: 'Batteriet väger tungt. En slagborrmaskin med två batterier hamnar högt.' },
  { id: 'leksaker', plural: 'leksaker', singular: 'en ny leksak', lca: { low: 1, high: 15, kind: 'example' }, itemsPerTrip: { value: 2, kind: 'assumption', why: 'Leksaker köps ofta några i taget.' }, spread: 'Plast och elektronik drar upp, trä och tyg ligger lägre.' },
  { id: 'sport', plural: 'sport- och friluftsprylar', singular: 'en ny sport- eller friluftspryl', lca: { low: 10, high: 100, kind: 'example' }, itemsPerTrip: { value: 1, kind: 'assumption', why: 'Tält, skidor och liknande hämtas en i taget.' }, spread: 'Ett par stavar och ett tält för fyra personer hör hemma i samma kategori.' },
  { id: 'cyklar', plural: 'cyklar', singular: 'en ny cykel', lca: { low: 100, high: 300, kind: 'example' }, itemsPerTrip: { value: 1, kind: 'assumption', why: 'En cykel i taget.' }, spread: 'Ram av aluminium eller stål avgör, och elcyklar ligger högst på grund av batteriet.' },
  { id: 'bocker', plural: 'böcker', singular: 'en ny bok', lca: { low: 1, high: 3, kind: 'example' }, itemsPerTrip: { value: 3, kind: 'assumption', why: 'Böcker lånas och köps ofta flera åt gången.' }, spread: 'Sidantal och band. Inbundna storformat ligger högst.' },
  { id: 'barnvagnar', plural: 'barnvagnar', singular: 'en ny barnvagn', lca: { low: 50, high: 150, kind: 'example' }, itemsPerTrip: { value: 1, kind: 'assumption', why: 'En vagn i taget.' }, spread: 'Aluminiumram och antal delar (liggdel, sittdel, sufflett) styr mest.' },
];

export const SHARED = {
  replacementShare: {
    value: 50,
    kind: 'assumption',
    why: 'Metodens utgångsläge. Alla second hand-köp, lån och hyror ersätter inte ett nyköp. Något är billigare och köps därför i onödan, något hade aldrig köpts alls.',
  },
  carShare: {
    value: 75,
    kind: 'assumption',
    why: 'Metodens utgångsläge när ni inte vet hur era besökare tar sig dit.',
  },
  kmPerTrip: {
    value: 7,
    kind: 'assumption',
    why: 'Metodens utgångsläge för avståndet en väg till butiken eller utlåningen.',
  },
  carEf: {
    value: 0.12,
    kind: 'example',
    why: 'Utsläpp per kilometer från en genomsnittlig personbil i Sverige.',
  },
  opEfPerItem: {
    value: 0.5,
    kind: 'example',
    why: 'Utsläpp från lokal, uppvärmning och el per cirkulerat föremål.',
  },
};

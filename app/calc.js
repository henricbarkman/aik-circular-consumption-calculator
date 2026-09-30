// The whole method in one pure function, so the page, the copied text and the
// tests all run the same arithmetic. Formula: docs/PROMPT.md, steps 3-7.
//
// Transport and operations are charged to the circulations that do NOT replace
// a new purchase: had the item been bought new, a trip to the shop and the
// shop's own energy would have happened anyway. That offsets one shop visit, a
// trip there and back (p.newTrips). A loan or a repair takes more trips than
// that, and the circulations that do replace a purchase are charged the rest.
//
// Several product types share one set of assumptions about trips and shares;
// only the emissions per new item and the items per visit differ per row. Trips
// are counted as visits, so four chairs fetched together are one trip.

// A repair adds one more cost: the spare parts and material, charged to every
// repaired item, because they are new material that buying new would not add.
// Repair is also the one method whose replacement share differs per product
// type, so a row may carry its own.

/**
 * @param {object} p
 * @param {{count: number, lca: number, itemsPerTrip: number, replacementPct?: number, repairKg?: number}[]} p.rows
 *   count: circulations, lca: kg CO2e per new item, itemsPerTrip: items per visit,
 *   replacementPct: this row's share instead of the shared one, repairKg: kg CO2e per repair
 * @param {number} p.replacementPct   share that replaces a new purchase, 0-100
 * @param {boolean} p.transportOn
 * @param {number} p.carPct           share of visits made by car, 0-100
 * @param {number} p.trips            one-way trips per visit
 * @param {number} [p.newTrips]       one-way trips a new purchase would have taken, default 2
 * @param {number} p.km               km per one-way trip
 * @param {number} p.carEf            kg CO2e per vehicle-km
 * @param {boolean} p.opsOn
 * @param {number} p.opEf             kg CO2e per circulated item
 */
export function calculate(p) {
  const perTrip = (trips) => (p.carPct / 100) * trips * p.km * p.carEf;
  const perTripKg = perTrip(p.trips);
  const extraTrips = Math.max(p.trips - (p.newTrips ?? 2), 0);
  const perExtraKg = perTrip(extraTrips);

  const rows = p.rows.map((row) => {
    const replacing = row.count * ((row.replacementPct ?? p.replacementPct) / 100);
    const notReplacing = row.count - replacing;
    return {
      ...row,
      potential: row.count * row.lca,
      avoided: replacing * row.lca,
      replacing,
      notReplacing,
      visits: row.itemsPerTrip > 0 ? notReplacing / row.itemsPerTrip : 0,
      replacingVisits: row.itemsPerTrip > 0 ? replacing / row.itemsPerTrip : 0,
      repair: row.count * (row.repairKg ?? 0),
    };
  });
  const sum = (k) => rows.reduce((a, x) => a + x[k], 0);

  const potential = sum('potential');
  const avoided = sum('avoided');
  const visits = sum('visits');
  const replacingVisits = sum('replacingVisits');
  const notReplacing = sum('notReplacing');
  const tripsFull = p.transportOn ? visits * perTripKg : 0;
  const tripsExtra = p.transportOn ? replacingVisits * perExtraKg : 0;
  const transportKg = tripsFull + tripsExtra;
  const opsKg = p.opsOn ? notReplacing * p.opEf : 0;
  const repairKg = sum('repair');

  return {
    rows,
    count: sum('count'),
    replacing: sum('replacing'),
    notReplacing,
    potential,
    avoided,
    notReplacingLost: potential - avoided,
    visits,
    replacingVisits,
    perTripKg,
    extraTrips,
    perExtraKg,
    tripsFull,
    tripsExtra,
    transportKg,
    opsKg,
    repairKg,
    net: avoided - transportKg - opsKg - repairKg,
  };
}

const nf = (digits) => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: digits });

/** Plain number, Swedish grouping, sensible decimals for its size. */
export function num(x) {
  const a = Math.abs(x);
  if (a >= 100) return nf(0).format(Math.round(x));
  if (a >= 10) return nf(1).format(x);
  // Three decimals below 10, so an electric car's 0,007 kg per km shows as used.
  return nf(3).format(x);
}

// Tonnes: whole from 10, one decimal from 1, two significant digits below, so
// 22 kg reads 0,022 ton and never a bare 0. A decimal on 81,6 ton claims a
// precision the sources do not have.
function tonnes(kg) {
  const t = kg / 1000;
  const a = Math.abs(t);
  if (a >= 10) return nf(0).format(Math.round(t));
  if (a >= 1 || a === 0) return nf(1).format(t);
  return new Intl.NumberFormat('sv-SE', { maximumSignificantDigits: 2 }).format(t);
}

/** kg CO2e as kg or ton, whichever reads best. */
export function mass(kg) {
  if (Math.abs(kg) >= 1000) return `${tonnes(kg)} ton`;
  return `${nf(0).format(Math.round(kg) || 0)} kg`;
}

/** A low-high pair that shares one unit: "18-90 ton", "740-3 700 kg". */
export function massRange(lowKg, highKg) {
  const big = Math.max(Math.abs(lowKg), Math.abs(highKg)) >= 1000;
  // A dash between two minus signs reads as noise, so negative ranges say "till".
  const join = (a, b, unit) => (a === b ? `${a} ${unit}` : `${a}${lowKg < 0 || highKg < 0 ? ' till ' : '–'}${b} ${unit}`);
  if (!big) return join(nf(0).format(Math.round(lowKg) || 0), nf(0).format(Math.round(highKg) || 0), 'kg');
  return join(tonnes(lowKg), tonnes(highKg), 'ton');
}

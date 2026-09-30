// The whole method in one pure function, so the page, the copied text and the
// tests all run the same arithmetic. The method and the decisions behind it are
// in the README; docs/PROMPT.md is the older Custom GPT's version.
//
// A share of the circulations replaces a new purchase. For a loan that is only
// part of a purchase: someone who owns the thing uses it many times, so a loan
// replaces 1/loansPerPurchase of one (Henric 2026-09-30). Second hand and repair
// replace a whole one.
//
// Every visit costs its trips, and everything that passes through the shop or
// the lending costs its operations. The purchases that were avoided would have
// cost a shop visit, a trip there and back (p.newTrips), and a shop's operations
// too, so those are subtracted. With whole purchases this is the same as
// charging the non-replacing share in full and the replacing share for the
// trips beyond one shop visit.
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
 * @param {{count: number, lca: number, itemsPerTrip: number, replacementPct?: number, repairKg?: number, loansPerPurchase?: number}[]} p.rows
 *   count: circulations, lca: kg CO2e per new item, itemsPerTrip: items per visit,
 *   replacementPct: this row's share instead of the shared one, repairKg: kg CO2e per repair,
 *   loansPerPurchase: loans that together replace one purchase, default 1
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
  // A visit here that takes fewer trips than a shop visit offsets only its own,
  // so the trips never come out below zero.
  const shopTrips = Math.min(p.trips, p.newTrips ?? 2);
  const perShopKg = perTrip(shopTrips);

  const rows = p.rows.map((row) => {
    const replacing = row.count * ((row.replacementPct ?? p.replacementPct) / 100);
    const purchasesAvoided = replacing / (row.loansPerPurchase ?? 1);
    const perVisit = row.itemsPerTrip > 0 ? 1 / row.itemsPerTrip : 0;
    return {
      ...row,
      potential: row.count * row.lca,
      replacing,
      purchasesAvoided,
      avoided: purchasesAvoided * row.lca,
      visits: row.count * perVisit,
      shopVisits: purchasesAvoided * perVisit,
      // What the operation handles beyond what a shop would have handled anyway.
      opsCount: row.count - purchasesAvoided,
      repair: row.count * (row.repairKg ?? 0),
    };
  });
  const sum = (k) => rows.reduce((a, x) => a + x[k], 0);

  const potential = sum('potential');
  const avoided = sum('avoided');
  const visits = sum('visits');
  const shopVisits = sum('shopVisits');
  const opsCount = sum('opsCount');
  const tripsGross = p.transportOn ? visits * perTripKg : 0;
  const tripsCredit = p.transportOn ? shopVisits * perShopKg : 0;
  const transportKg = tripsGross - tripsCredit;
  const opsKg = p.opsOn ? opsCount * p.opEf : 0;
  const repairKg = sum('repair');

  return {
    rows,
    count: sum('count'),
    replacing: sum('replacing'),
    purchasesAvoided: sum('purchasesAvoided'),
    potential,
    avoided,
    notReplacingLost: potential - avoided,
    visits,
    shopVisits,
    perTripKg,
    shopTrips,
    perShopKg,
    tripsGross,
    tripsCredit,
    transportKg,
    opsCount,
    opsKg,
    repairKg,
    net: avoided - transportKg - opsKg - repairKg,
  };
}

/**
 * One car share for rows that each have their own, weighted by visits. The
 * trips all visits make then come out as if every row used its own share.
 * null when there are no visits to weigh.
 * @param {{count: number, itemsPerTrip: number, carPct: number}[]} rows
 */
export function visitWeightedCarPct(rows) {
  let visits = 0;
  let weighted = 0;
  for (const r of rows) {
    const v = r.itemsPerTrip > 0 ? r.count / r.itemsPerTrip : 0;
    visits += v;
    weighted += v * r.carPct;
  }
  return visits > 0 ? weighted / visits : null;
}

/**
 * The car share at which the net reaches zero, everything else as it is. The
 * net falls in a straight line with the car share, so two points give it.
 * null when the net is not negative. 0 when no car share makes it positive:
 * even no car at all stays negative, or trips are not counted.
 * @param {object} p the same input as calculate
 */
export function breakEvenCarPct(p) {
  const net = calculate(p).net;
  if (net >= 0) return null;
  if (!p.transportOn || p.carPct <= 0) return 0;
  const noCar = calculate({ ...p, carPct: 0 }).net;
  if (noCar <= 0) return 0;
  return noCar / ((noCar - net) / p.carPct);
}

const nf =(digits) => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: digits });

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

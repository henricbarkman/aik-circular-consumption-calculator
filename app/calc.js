// The whole method in one pure function, so the page, the copied text and the
// tests all run the same arithmetic. Formula: docs/PROMPT.md, steps 3-7.
//
// Transport and operations are charged only to the circulations that do NOT
// replace a new purchase: had the item been bought new, the trip to the shop and
// the shop's own energy would have happened anyway.

/**
 * @param {object} p
 * @param {number} p.count            circulations
 * @param {number} p.lcaLow           kg CO2e per new item, low end
 * @param {number} p.lcaHigh          kg CO2e per new item, high end
 * @param {number} p.replacementPct   share that replaces a new purchase, 0-100
 * @param {boolean} p.transportOn
 * @param {number} p.carPct           share of visitors going by car, 0-100
 * @param {number} p.trips            one-way trips per circulation
 * @param {number} p.km               km per one-way trip
 * @param {number} p.carEf            kg CO2e per vehicle-km
 * @param {number} p.itemsPerTrip
 * @param {boolean} p.opsOn
 * @param {number} p.opEf             kg CO2e per circulated item
 */
export function calculate(p) {
  const r = p.replacementPct / 100;
  const replacing = p.count * r;
  const notReplacing = p.count - replacing;

  const perTripKg = (p.carPct / 100) * p.trips * p.km * p.carEf;
  const transportKg = p.transportOn && p.itemsPerTrip > 0
    ? (notReplacing * perTripKg) / p.itemsPerTrip
    : 0;
  const opsKg = p.opsOn ? notReplacing * p.opEf : 0;

  const scenario = (lca) => {
    const potential = p.count * lca;
    const avoided = replacing * lca;
    return {
      lca,
      potential,
      avoided,
      notReplacingLost: potential - avoided,
      net: avoided - transportKg - opsKg,
    };
  };

  return {
    replacing,
    notReplacing,
    perTripKg,
    transportKg,
    opsKg,
    low: scenario(p.lcaLow),
    high: scenario(p.lcaHigh),
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

/** kg CO2e as kg or ton, whichever reads best. */
export function mass(kg) {
  const a = Math.abs(kg);
  if (a >= 1000) {
    const t = kg / 1000;
    return `${Math.abs(t) >= 100 ? nf(0).format(Math.round(t)) : nf(1).format(t)} ton`;
  }
  return `${nf(0).format(Math.round(kg))} kg`;
}

/** A low-high pair that shares one unit: "18-90 ton", "740-3 700 kg". */
export function massRange(lowKg, highKg) {
  const big = Math.max(Math.abs(lowKg), Math.abs(highKg)) >= 1000;
  // A dash between two minus signs reads as noise, so negative ranges say "till".
  const join = (a, b, unit) => (a === b ? `${a} ${unit}` : `${a}${lowKg < 0 || highKg < 0 ? ' till ' : '–'}${b} ${unit}`);
  if (!big) return join(nf(0).format(Math.round(lowKg)), nf(0).format(Math.round(highKg)), 'kg');
  // Small ends keep two significant digits, so 22 kg reads 0,022 ton and never a bare 0.
  const f = (kg) => {
    const t = kg / 1000;
    const a = Math.abs(t);
    if (a >= 100) return nf(0).format(Math.round(t));
    if (a >= 1 || a === 0) return nf(1).format(t);
    return new Intl.NumberFormat('sv-SE', { maximumSignificantDigits: 2 }).format(t);
  };
  return join(f(lowKg), f(highKg), 'ton');
}

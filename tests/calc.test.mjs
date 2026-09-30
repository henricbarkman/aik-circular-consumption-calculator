// Hand-worked examples. Each expected number is computed in the comment beside
// it, so a failure points at the arithmetic, not at a snapshot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, breakEvenCarPct, visitWeightedCarPct, massRange, mass, num } from '../app/calc.js';
import { CATEGORIES, SHARED, METHODS } from '../app/factors.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

const shared = {
  replacementPct: 50, transportOn: true, carPct: 75, trips: 2, km: 7, carEf: 0.17,
  opsOn: true, opEf: 0.25,
};
const clothes = { count: 1200, lca: 9, itemsPerTrip: 2.5 };

test('clothes, 1 200 items, the page default', () => {
  const r = calculate({ ...shared, rows: [clothes] });
  close(r.replacing, 600);                  // 1200 × 0.5
  close(r.purchasesAvoided, 600);           // second hand replaces whole purchases
  close(r.potential, 10800);                // 1200 × 9
  close(r.avoided, 5400);                   // 600 × 9
  close(r.perTripKg, 1.785);                // 0.75 × 2 × 7 × 0.17
  close(r.visits, 480);                     // 1200 / 2.5
  close(r.tripsGross, 856.8);               // 480 × 1.785
  close(r.shopVisits, 240);                 // 600 / 2.5, the shop visits the avoided purchases would have taken
  close(r.tripsCredit, 428.4);              // 240 × 1.785
  close(r.transportKg, 428.4);              // 856.8 − 428.4
  close(r.opsCount, 600);                   // 1200 − 600
  close(r.opsKg, 150);                      // 600 × 0.25
  close(r.net, 4821.6);                     // 5400 − 428.4 − 150
  assert.equal(mass(r.net), '4,8 ton');
});

test('several product types share the assumptions and add up', () => {
  const sofas = { count: 40, lca: 188.5, itemsPerTrip: 1 };
  const books = { count: 300, lca: 1.9, itemsPerTrip: 3 };
  const r = calculate({ ...shared, rows: [clothes, sofas, books] });
  close(r.count, 1540);
  close(r.potential, 10800 + 7540 + 570);   // 40 × 188.5 = 7540; 300 × 1.9 = 570
  close(r.avoided, 5400 + 3770 + 285);
  close(r.visits, 480 + 40 + 100);          // 1200/2.5 + 40/1 + 300/3
  close(r.shopVisits, 240 + 20 + 50);       // 600/2.5 + 20/1 + 150/3
  close(r.transportKg, (620 - 310) * 1.785);
  close(r.opsKg, 770 * 0.25);               // (600 + 20 + 150) × 0.25
  close(r.net, 9455 - 553.35 - 192.5);
});

test('rows are independent: one row alone gives the same as its share of many', () => {
  const sofas = { count: 40, lca: 188.5, itemsPerTrip: 1 };
  const both = calculate({ ...shared, rows: [clothes, sofas] });
  const a = calculate({ ...shared, rows: [clothes] });
  const b = calculate({ ...shared, rows: [sofas] });
  close(both.net, a.net + b.net);
});

test('switching off trips and operations leaves only the avoided purchases', () => {
  const r = calculate({ ...shared, transportOn: false, opsOn: false, rows: [clothes] });
  close(r.transportKg, 0);
  const loans = calculate({ ...shared, trips: 4, transportOn: false, rows: [clothes] });
  close(loans.tripsGross + loans.tripsCredit, 0); // no trip figures left over to display
  close(r.opsKg, 0);
  close(r.net, r.avoided);
});

test('everyone replacing a purchase means no trips or operations are charged', () => {
  const r = calculate({ ...shared, replacementPct: 100, rows: [clothes] });
  close(r.opsCount, 0);
  close(r.transportKg, 0);
  close(r.net, 10800);
});

test('net can go negative, and stays a number', () => {
  const r = calculate({ ...shared, km: 40, rows: [{ count: 1200, lca: 1, itemsPerTrip: 2.5 }] });
  // per trip 0.75 × 2 × 40 × 0.17 = 10.2; 240 visits × 10.2 = 2448
  close(r.transportKg, 2448);
  close(r.net, 600 - 2448 - 150);
  assert.ok(r.net < 0);
});

test('zero items per visit does not divide by zero', () => {
  const r = calculate({ ...shared, rows: [{ ...clothes, itemsPerTrip: 0 }] });
  close(r.transportKg, 0);
  assert.ok(Number.isFinite(r.net));
});

test('formatting never hides a small end or the value used', () => {
  assert.equal(massRange(22, 11400), '0,022–11 ton');
  assert.equal(mass(81600), '82 ton');           // no decimal the sources cannot carry
  assert.equal(mass(-0.2), '0 kg');              // never a minus zero
  assert.equal(massRange(740, 3700), '0,74–3,7 ton');
  assert.equal(massRange(4, 5000), '0,004–5 ton');
  assert.equal(massRange(120, 900), '120–900 kg');
  assert.equal(massRange(-300, -200), '−300 till −200 kg');
  assert.equal(massRange(-300, -300), '−300 kg');
  assert.equal(mass(578.4), '578 kg');
  assert.equal(num(0.007), '0,007');
});

test('every factor that says "source" names one', () => {
  const all = [...CATEGORIES, ...Object.values(SHARED), ...Object.values(METHODS)];
  for (const f of all) {
    const defs = [f, f.lca, f.itemsPerTrip, f.tripsPerCirculation, f.repairShare, f.repairKg, f.loansPerPurchase].filter((d) => d && typeof d === 'object' && 'kind' in d);
    for (const d of defs) {
      if (d.kind === 'assumption') assert.ok(d.why, `assumption without a reason: ${JSON.stringify(d).slice(0, 80)}`);
      if (d.kind !== 'source') continue;
      assert.ok(d.sources?.length, `missing sources on ${JSON.stringify(d).slice(0, 80)}`);
      for (const s of d.sources) assert.match(s.url, /^https:\/\//);
    }
  }
});

test('every category has a typical value inside its span, and says where it comes from', () => {
  for (const c of CATEGORIES) {
    assert.ok(c.lca.low <= c.lca.value && c.lca.value <= c.lca.high, c.id);
    assert.ok(c.lca.typical, `${c.id} has no note on its typical value`);
  }
  assert.equal(CATEGORIES.find((c) => c.id === 'klader').lca.value, 9);
});

// Repair: Henric 2026-09-30, 82 % for clothes and 50 % for the rest, and the
// repair's own emissions charged to every repaired item.

test('repair: each row keeps its own share, and the repair itself is charged to all', () => {
  const repair = { ...shared, trips: 4, rows: [
    { ...clothes, replacementPct: 82, repairKg: 0.1 },
    { count: 100, lca: 48, itemsPerTrip: 1, replacementPct: 50, repairKg: 3 },   // phones
  ] };
  const r = calculate(repair);
  close(r.rows[0].replacing, 984);          // 1200 × 0.82
  close(r.rows[0].opsCount, 216);
  close(r.rows[1].replacing, 50);           // 100 × 0.5
  close(r.avoided, 984 * 9 + 50 * 48);      // 8856 + 2400 = 11256
  close(r.repairKg, 1200 * 0.1 + 100 * 3);  // 120 + 300 = 420, all items, not only the non-replacing
  close(r.perTripKg, 3.57);                 // 0.75 × 4 × 7 × 0.17
  close(r.visits, 1200 / 2.5 + 100);        // 480 + 100 = 580
  close(r.shopVisits, 984 / 2.5 + 50);      // 393.6 + 50 = 443.6
  close(r.perShopKg, 1.785);                // one shop visit, there and back: 0.75 × 2 × 7 × 0.17
  close(r.transportKg, 580 * 3.57 - 443.6 * 1.785); // 2070.6 − 791.826 = 1278.774, as before the loans change
  close(r.opsKg, 266 * 0.25);               // (216 + 50) × 0.25 = 66.5
  close(r.net, 11256 - 420 - 1278.774 - 66.5);
});

// A new purchase offsets one shop visit, there and back. A loan takes four
// one-way trips, so the loans that replace a purchase still pay for two.
test('loans: trips beyond one shop visit are charged to the replacing share too', () => {
  const drills = { count: 100, lca: 23.5, itemsPerTrip: 1 };
  const r = calculate({ ...shared, trips: 4, rows: [drills] });
  close(r.perTripKg, 3.57);                 // 0.75 × 4 × 7 × 0.17
  close(r.shopTrips, 2);
  close(r.tripsGross, 100 * 3.57);          // 357, every loan
  close(r.tripsCredit, 50 * 1.785);         // 89.25, one shop visit per avoided purchase
  close(r.transportKg, 267.75);             // = 50 × 3.57 + 50 × 1.785, the old way of counting
  close(r.net, 1175 - 267.75 - 12.5);       // 50 × 23.5 = 1175; ops 50 × 0.25
});

test('second hand takes no more trips than buying new, so nothing extra is charged', () => {
  const r = calculate({ ...shared, rows: [clothes] });
  close(r.transportKg, 600 / 2.5 * 1.785);  // only the 240 visits that replace nothing
  const own = calculate({ ...shared, newTrips: 0, rows: [clothes] });
  close(own.tripsCredit, 0);                // with no shop visit to offset, every item pays
  close(own.transportKg, 1200 / 2.5 * 1.785);
});

// A loan replaces part of a purchase: someone who owns a pair of skis uses it
// 7.5 to 10 times (RISE 2020, p. 22). Henric 2026-09-30.
test('loans: a loan replaces 1/L of a purchase, and pays its trips in full', () => {
  const skis = { count: 1200, lca: 29, itemsPerTrip: 1, loansPerPurchase: 9 };
  const r = calculate({ ...shared, trips: 4, rows: [skis] });
  close(r.replacing, 600);                  // 1200 × 0.5, loans by someone who would otherwise own a pair
  close(r.purchasesAvoided, 600 / 9);       // 66.67
  close(r.avoided, 600 / 9 * 29);           // 1933.33
  close(r.potential, 1200 * 29);            // 34 800, as if every loan had been a purchase
  close(r.tripsGross, 1200 * 3.57);         // 4284, every loan fetched and returned
  close(r.tripsCredit, 600 / 9 * 1.785);    // 119, one shop visit per avoided purchase
  close(r.opsCount, 1200 - 600 / 9);        // 1133.33
  // 1933.33 − (4284 − 119) − 1133.33 × 0.25 = 1933.33 − 4165 − 283.33 = −2515
  close(r.net, 600 / 9 * 29 - (4284 - 600 / 9 * 1.785) - (1200 - 600 / 9) * 0.25);
  assert.ok(r.net < 0);
});

test('loans: one loan per purchase counts exactly as a whole purchase', () => {
  const drills = { count: 100, lca: 23.5, itemsPerTrip: 1 };
  const a = calculate({ ...shared, trips: 4, rows: [drills] });
  const b = calculate({ ...shared, trips: 4, rows: [{ ...drills, loansPerPurchase: 1 }] });
  close(a.net, b.net);
  close(b.net, 1175 - 267.75 - 12.5);
});

test('a visit with fewer trips than a shop visit never gives trips below zero', () => {
  const r = calculate({ ...shared, trips: 1, rows: [clothes] });
  // per trip 0.75 × 1 × 7 × 0.17 = 0.8925; 480 visits − 240 avoided shop visits, one trip each
  close(r.shopTrips, 1);
  close(r.transportKg, 240 * 0.8925);
});

test('rows without their own share or repair use the shared share and add nothing', () => {
  const r = calculate({ ...shared, rows: [clothes] });
  close(r.repairKg, 0);
  close(r.replacing, 600);
});

test('repair defaults: 82 % for clothes, 50 % for the rest, every category has a repair value', () => {
  for (const c of CATEGORIES) {
    assert.equal(c.repairShare.value, c.id === 'klader' ? 82 : 50, c.id);
    assert.ok(c.repairKg.value > 0, c.id);
    if (c.repairKg.low != null) assert.ok(c.repairKg.low <= c.repairKg.value && c.repairKg.value <= c.repairKg.high, c.id);
  }
  assert.equal(METHODS.repair.tripsPerCirculation.value, 4);
});

test('loans: every category says how many loans make one purchase, inside its span', () => {
  for (const c of CATEGORIES) {
    const l = c.loansPerPurchase;
    assert.ok(l && l.value >= 1, c.id);
    if (l.low != null) assert.ok(l.low <= l.value && l.value <= l.high, c.id);
  }
  // RISE: a pair of owned skis is used 1.5 to 2 times a year for 5 years, the middle of 7.5 to 10.
  assert.equal(CATEGORIES.find((c) => c.id === 'skidor').loansPerPurchase.value, 9);
});

test('a mixed list weighs each row\'s car share by its visits, so trips match row by row', () => {
  const books = { count: 1000, lca: 0.56, itemsPerTrip: 3, loansPerPurchase: 1 };
  const shirt = { count: 1, lca: 9, itemsPerTrip: 2.5, loansPerPurchase: 8 };
  // visits 1000/3 = 333.33 at 38 % and 1/2.5 = 0.4 at 75 %: (12 666.67 + 30) / 333.73 = 38.044
  const w = visitWeightedCarPct([{ ...books, carPct: 38 }, { ...shirt, carPct: 75 }]);
  close(w, (1000 / 3 * 38 + 0.4 * 75) / (1000 / 3 + 0.4));
  assert.ok(w > 38 && w < 38.1, 'one garment nudges the share, it does not flip it');
  const p = { ...shared, trips: 4 };
  const apart = calculate({ ...p, carPct: 38, rows: [books] }).tripsGross + calculate({ ...p, carPct: 75, rows: [shirt] }).tripsGross;
  close(calculate({ ...p, carPct: w, rows: [books, shirt] }).tripsGross, apart);
  assert.equal(visitWeightedCarPct([{ count: 5, itemsPerTrip: 0, carPct: 75 }]), null);
});

test('break-even car share: the net is zero there, and 0 when no car share can help', () => {
  const skis = { count: 1200, lca: 29, itemsPerTrip: 1, loansPerPurchase: 9 };
  const p = { ...shared, trips: 4, rows: [skis] };
  const be = breakEvenCarPct(p);
  assert.ok(be > 0 && be < 75, `${be}`);
  assert.ok(Math.abs(calculate({ ...p, carPct: be }).net) < 1e-6);
  // Operations alone outweigh the avoided production: 1200 × 50 kg against 600/9 × 29.
  assert.equal(breakEvenCarPct({ ...p, opEf: 50 }), 0);
  assert.equal(breakEvenCarPct({ ...p, opEf: 50, transportOn: false }), 0);
  assert.equal(breakEvenCarPct({ ...p, opEf: 50, carPct: 0 }), 0);
  assert.equal(breakEvenCarPct({ ...shared, rows: [clothes] }), null, 'positive net has no break-even');
});

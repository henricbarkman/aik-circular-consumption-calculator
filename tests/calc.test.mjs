// Hand-worked examples. Each expected number is computed in the comment beside
// it, so a failure points at the arithmetic, not at a snapshot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, massRange, mass, num } from '../app/calc.js';
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
  close(r.notReplacing, 600);
  close(r.potential, 10800);                // 1200 × 9
  close(r.avoided, 5400);                   // 600 × 9
  close(r.perTripKg, 1.785);                // 0.75 × 2 × 7 × 0.17
  close(r.visits, 240);                     // 600 / 2.5
  close(r.transportKg, 428.4);              // 240 × 1.785
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
  close(r.visits, 240 + 20 + 50);           // 600/2.5 + 20/1 + 150/3
  close(r.transportKg, 310 * 1.785);
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
  close(r.opsKg, 0);
  close(r.net, r.avoided);
});

test('everyone replacing a purchase means no trips or operations are charged', () => {
  const r = calculate({ ...shared, replacementPct: 100, rows: [clothes] });
  close(r.notReplacing, 0);
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
  assert.equal(massRange(22, 11400), '0,022–11,4 ton');
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
    const defs = [f, f.lca, f.itemsPerTrip, f.tripsPerCirculation].filter((d) => d && typeof d === 'object' && 'kind' in d);
    for (const d of defs) {
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

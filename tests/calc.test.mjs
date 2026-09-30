// Hand-worked examples. Each expected number is computed in the comment beside
// it, so a failure points at the arithmetic, not at a snapshot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, massRange, mass, num } from '../app/calc.js';
import { CATEGORIES, SHARED, METHODS } from '../app/factors.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

const defaults = {
  count: 1200, lcaLow: 1, lcaHigh: 20, replacementPct: 50,
  transportOn: true, carPct: 75, trips: 2, km: 7, carEf: 0.17, itemsPerTrip: 2.5,
  opsOn: true, opEf: 0.25,
};

test('clothes, 1 200 items, the page default', () => {
  const r = calculate(defaults);
  close(r.replacing, 600);                  // 1200 × 0.5
  close(r.notReplacing, 600);
  close(r.perTripKg, 1.785);                // 0.75 × 2 × 7 × 0.17
  close(r.transportKg, 428.4);              // 600 × 1.785 / 2.5
  close(r.opsKg, 150);                      // 600 × 0.25
  close(r.low.avoided, 600);                // 600 × 1
  close(r.low.net, 21.6);                   // 600 − 428.4 − 150
  close(r.high.potential, 24000);           // 1200 × 20
  close(r.high.net, 11421.6);               // 12000 − 578.4
  assert.equal(massRange(r.low.net, r.high.net), '0,022–11,4 ton');
});

test('switching off trips and operations leaves only the avoided purchases', () => {
  const r = calculate({ ...defaults, transportOn: false, opsOn: false });
  close(r.transportKg, 0);
  close(r.opsKg, 0);
  close(r.low.net, r.low.avoided);
  close(r.high.net, 12000);
});

test('everyone replacing a purchase means no trips or operations are charged', () => {
  const r = calculate({ ...defaults, replacementPct: 100 });
  close(r.notReplacing, 0);
  close(r.transportKg, 0);
  close(r.low.net, 1200);                   // 1200 × 1
});

test('net can go negative, and stays a number', () => {
  const r = calculate({ ...defaults, km: 40 }); // per trip 0.75 × 2 × 40 × 0.17 = 10.2
  close(r.transportKg, 2448);               // 600 × 10.2 / 2.5
  close(r.low.net, 600 - 2448 - 150);
  assert.ok(r.low.net < 0);
});

test('zero items per visit does not divide by zero', () => {
  const r = calculate({ ...defaults, itemsPerTrip: 0 });
  close(r.transportKg, 0);
  assert.ok(Number.isFinite(r.low.net));
});

test('a range with a small low end never shows a bare zero', () => {
  assert.equal(massRange(22, 11400), '0,022–11,4 ton');
  assert.equal(massRange(4, 5000), '0,004–5 ton');
  assert.equal(massRange(-300, -200), '−300 till −200 kg');
  assert.equal(massRange(-300, -300), '−300 kg');
  assert.equal(num(0.007), '0,007');
  assert.equal(massRange(740, 3700), '0,74–3,7 ton');
  assert.equal(massRange(120, 900), '120–900 kg');
  assert.equal(mass(578.4), '578 kg');
});

test('every category and shared factor that says "source" names one', () => {
  const all = [...Object.values(CATEGORIES), ...Object.values(SHARED), ...Object.values(METHODS)];
  for (const f of all) {
    const defs = [f, f.lca, f.itemsPerTrip, f.tripsPerCirculation].filter((d) => d && typeof d === 'object' && 'kind' in d);
    for (const d of defs) {
      if (d.kind !== 'source') continue;
      assert.ok(d.sources?.length, `missing sources on ${JSON.stringify(d).slice(0, 80)}`);
      for (const s of d.sources) assert.match(s.url, /^https:\/\//);
    }
  }
});

test('low end never above high end in the category table', () => {
  for (const c of Object.values(CATEGORIES)) {
    const v = c.lca?.value ?? c.lca;
    if (v && typeof v === 'object') assert.ok(v.low <= v.high, JSON.stringify(c).slice(0, 60));
  }
});

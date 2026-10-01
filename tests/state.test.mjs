// The page's rules for typed values and links, run without a page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { listPerVisit, pruneOverrides, methodFromLink } from '../app/state.js';
import { METHODS } from '../app/factors.js';

test('items per visit for the whole list applies only to two or more counted types', () => {
  const two = [{ category: 'skidor', count: 100 }, { category: 'skridskor', count: 100 }];
  assert.equal(listPerVisit(two, { itemsPerVisit: 2 }), 2);
  assert.equal(listPerVisit(two, {}), null);
  assert.equal(listPerVisit([two[0]], { itemsPerVisit: 2 }), null);
  // A row added with "+ fler" has no count yet and does not make a list.
  assert.equal(listPerVisit([two[0], { category: 'klader', count: null }], { itemsPerVisit: 2 }), null);
});

test('removing a type down to one counted row drops the list value, even with a blank row left', () => {
  // Found in review 2026-10-01: two counted rows with 2 per visit, "+ fler", then
  // one counted row removed. The blank row kept the value, and typing a count
  // into it applied 2 per visit to a list it was never typed for.
  const overrides = { itemsPerVisit: 2, 'lca:skidor': 30 };
  pruneOverrides([{ category: 'skidor', count: 100 }, { category: 'klader', count: null }], overrides);
  assert.deepEqual(overrides, { 'lca:skidor': 30 });
});

test('a value typed for a type that left the sentence is dropped; a blank row keeps its own', () => {
  const overrides = { 'lca:skidor': 30, 'lca:klader': 8, 'per:skridskor': 2, km: 5, itemsPerVisit: 3 };
  pruneOverrides([{ category: 'skidor', count: 100 }, { category: 'skridskor', count: 50 }, { category: 'klader', count: null }], overrides);
  assert.deepEqual(overrides, { 'lca:skidor': 30, 'lca:klader': 8, 'per:skridskor': 2, km: 5, itemsPerVisit: 3 });
  pruneOverrides([{ category: 'skidor', count: 100 }], overrides);
  assert.deepEqual(overrides, { 'lca:skidor': 30, km: 5 });
});

test('hur= in a link: rent keeps 50 %, borrow opens lending at 25 %, anything else changes nothing', () => {
  assert.equal(methodFromLink('rent', METHODS, 'secondhand'), 'rent');
  assert.equal(METHODS[methodFromLink('rent', METHODS, 'secondhand')].replacementShare.value, 50);
  assert.equal(methodFromLink('borrow', METHODS, 'secondhand'), 'borrow');
  assert.equal(METHODS[methodFromLink('borrow', METHODS, 'secondhand')].replacementShare.value, 25);
  assert.equal(methodFromLink('onsite', METHODS, 'secondhand'), 'onsite');
  assert.equal(methodFromLink('repair', METHODS, 'secondhand'), 'repair');
  for (const how of [null, '', 'lånat', 'hyrt', 'toString', '__proto__', 'constructor']) {
    assert.equal(methodFromLink(how, METHODS, 'secondhand'), 'secondhand', String(how));
  }
});

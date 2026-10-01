// The page's rules for typed values and links that need no page, so the tests
// can run them. app.js holds the state and calls these with it.

const counted = (rows) => rows.filter((r) => r.count != null);

/**
 * Items per visit for the whole list, or null when each product type keeps its
 * own. A single product type has its own number for that already.
 * @param {{category: string, count: number|null}[]} rows
 * @param {Record<string, number>} overrides
 */
export function listPerVisit(rows, overrides) {
  if (counted(rows).length < 2 || !Object.hasOwn(overrides, 'itemsPerVisit')) return null;
  return overrides.itemsPerVisit;
}

/**
 * Drops typed values that no longer apply, in place. A number typed for a
 * product type that is no longer in the sentence goes, so it cannot come back
 * unseen when the type is added again. Items per visit for the whole list goes
 * once fewer than two types are counted: a row without a count does not hold it
 * for a list it was never typed for.
 * @param {{category: string, count: number|null}[]} rows
 * @param {Record<string, number>} overrides  keys 'name' or 'name:category'
 */
export function pruneOverrides(rows, overrides) {
  const inUse = new Set(rows.map((r) => r.category));
  for (const key of Object.keys(overrides)) {
    const catId = key.split(':')[1];
    if (catId && !inUse.has(catId)) delete overrides[key];
  }
  if (counted(rows).length < 2) delete overrides.itemsPerVisit;
}

/**
 * The method a link's hur= names, or the current one when it names none. From
 * 2026-09-30 to 2026-10-01 hur=borrow opened the merged "hyrts eller lånats";
 * it is lending again, and hur=rent is renting with the share it had.
 * @param {string|null} how
 * @param {object} methods  METHODS from factors.js
 * @param {string} current
 */
export function methodFromLink(how, methods, current) {
  return Object.hasOwn(methods, how ?? '') ? how : current;
}

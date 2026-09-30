// Reads a list of products and counts the way a shop is likely to have one:
// saved from Excel (semicolons, sometimes Windows-1252), exported from a till
// system with a header row, or typed by hand. Pure, so the tests run it as is.
//
// A line is matched to a product type by how its words END. A Swedish compound
// names its kind last: a "matbord" is a table and a "bordslampa" is a lamp.
// Every line is reported back with what it was counted as, so a wrong match is
// visible instead of silently in the total.

// Words per product type. A leading '=' means the whole word must match, for
// words too short or too common to trust as the end of a compound ("tv" would
// otherwise also match the end of nothing useful, "mobil" the end of "snömobil").
const WORDS = {
  klader: ['kläder', 'klädesplagg', 'plagg', 'tröja', 'tröjor', 'byxa', 'byxor', 'jeans', 'jacka', 'jackor', 'klänning', 'klänningar', 'kjol', 'kjolar', 'skjorta', 'skjortor', 'tshirt', 'tshirts', 'blus', 'blusar', 'kavaj', 'kavajer', 'blazer', 'blazers', 'kostym', 'kostymer', 'dräkt', 'dräkter', 'rock', 'rockar', 'kappa', 'kappor', 'overall', 'overaller', 'shorts', 'kofta', 'koftor', 'cardigan', 'cardigans', 'hoodie', 'hoodies', 'linne', 'linnen', 'väst', 'västar', 'mössa', 'mössor', 'halsduk', 'halsdukar', 'vantar', 'strumpor', 'pyjamas'],
  skor: ['skor', 'sko', 'stövel', 'stövlar', 'känga', 'kängor', 'sneakers', 'sandal', 'sandaler', 'toffla', 'tofflor', 'pumps', 'loafers'],
  stolar: ['stol', 'stolar', 'pall', 'pallar'],
  soffor: ['soffa', 'soffor'],
  bord: ['bord'],
  mobiler: ['=mobil', '=mobiler', 'mobiltelefon', 'mobiltelefoner', 'telefon', 'telefoner', 'smartphone', 'smartphones', 'iphone', 'iphones'],
  datorer: ['=dator', '=datorer', 'laptop', 'laptops', 'macbook', 'macbooks', 'chromebook', 'chromebooks'],
  tv: ['=tv', '=tvar', '=tvn', '=teve', 'tvapparat', 'tvapparater'],
  borr: ['=borr', 'slagborr', 'slagborrar', 'borrmaskin', 'borrmaskiner', 'skruvdragare', 'borrskruvdragare'],
  skidor: ['skida', 'skidor'],
  cyklar: ['cykel', 'cyklar'],
  bocker: ['bok', 'böcker', 'pocket', 'pocketar'],
  kok: ['köksapparat', 'köksapparater', 'mixer', 'mixrar', 'brödrost', 'brödrostar', 'vattenkokare', 'kaffebryggare', 'kaffemaskin', 'kaffemaskiner', 'elvisp', 'elvispar', 'våffeljärn', 'matberedare', 'juicepress'],
};

// Real words that end like a product type but are something else.
const NOT = new Set(['motorcykel', 'motorcyklar', 'disko', 'snömobil', 'snömobiler', 'lastpall', 'lastpallar']);

const HEAD_COUNT = /^(antal|antalsålda|sålda|st|styck|stycken|kvantitet|qty|quantity|count|antalst)$/;
const HEAD_NAME = /(sort|kategori|produkt|artikel|namn|vara|varor|benämning|typ|beskrivning)/;

const norm = (s) => s.toLowerCase().replace(/[^a-zåäöéüæø]/g, '');

/** The product type one word names, or null. Longest matching word wins. */
function typeOfWord(word) {
  const w = norm(word);
  if (!w || NOT.has(w)) return null;
  let best = null;
  for (const [id, words] of Object.entries(WORDS)) {
    for (const raw of words) {
      const exact = raw.startsWith('=');
      const k = exact ? raw.slice(1) : raw;
      // A compound needs at least two letters in front: "elcykel", "matbord".
      const hit = w === k || (!exact && w.endsWith(k) && w.length - k.length >= 2);
      if (hit && (!best || k.length > best.len)) best = { id, len: k.length };
    }
  }
  return best?.id ?? null;
}

/** Every product type a line's name mentions. */
export function typesOf(name) {
  return [...new Set(name.split(/[\s/&+]+/).map(typeOfWord).filter(Boolean))];
}

/** A count as people write it: "1200", "1 200", "1.200", "300 st". Null if it is not one. */
export function parseAmount(cell) {
  let s = String(cell).trim().replace(/[\s  ]/g, '').replace(/(st|st\.|stycken|pcs)$/i, '');
  if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^\d+([.,]\d+)?$/.test(s)) return null;
  return Number(s.replace(',', '.'));
}

function splitLine(line, sep) {
  if (!sep) {
    // No delimiter: "Tröjor 300" or "300 tröjor".
    const tail = line.match(/^(.*?\D)\s+(\d[\d\s .,]*?)\s*(st\.?|stycken)?$/i);
    if (tail) return [tail[1], tail[2]];
    const head = line.match(/^(\d[\d\s .,]*?)\s*(st\.?|stycken)?\s+(\D.*)$/i);
    if (head) return [head[3], head[1]];
    return [line];
  }
  const cells = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted;
    } else if (ch === sep && !quoted) { cells.push(cur); cur = ''; } else cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

// A separator is one most lines have. A single comma inside a name ("Tröjor,
// barn 100") must not turn the whole file into comma-separated cells.
function guessSeparator(lines) {
  const sample = lines.slice(0, 20);
  for (const ch of ['\t', ';', ',']) {
    if (sample.filter((l) => l.includes(ch)).length >= Math.max(1, sample.length * 0.6)) return ch;
  }
  return null;
}

/** Bytes from a file, as text. Excel on Windows still saves CSV as Windows-1252. */
export function decodeList(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/**
 * @param {string} text
 * @param {number} maxCount  largest count one product type may reach
 * @returns {{rows: {category: string, count: number}[], lines: {name: string, count: number|null, category: string|null, reason: string, types?: string[]}[]}}
 *   rows: one per product type, counts added up, in order of first appearance.
 *   lines: every line that was counted or needs the reader's attention.
 *   reason: 'ok' | 'unknown' | 'ambiguous' | 'nocount' | 'numbers' | 'decimal' | 'toomany'
 */
export function parseList(text, maxCount = 1e8) {
  const raw = text.split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
  const sep = guessSeparator(raw);
  let table = raw.map((l) => splitLine(l, sep));

  // A first line is a header when it has no numbers and names a column. A first
  // line like "Tröjor;" is data, and is reported like any other.
  let nameCol = null;
  let countCol = null;
  const looksLikeHeader = (cells) => cells.every((c) => parseAmount(c) == null)
    && cells.some((c) => HEAD_COUNT.test(norm(c)) || HEAD_NAME.test(norm(c)));
  if (table.length && looksLikeHeader(table[0])) {
    const head = table[0].map(norm);
    const c = head.findIndex((h) => HEAD_COUNT.test(h));
    if (c >= 0) {
      countCol = c;
      // "Artikelnr" names a column, but one of numbers: the name is where the text is.
      const body = table.slice(1);
      const isName = (h, i) => i !== c && HEAD_NAME.test(h) && body.some((r) => r[i] && parseAmount(r[i]) == null);
      const ids = /(nr|nummer|kod|id)$/;
      const n = [...head.keys()].sort((a, b) => ids.test(head[a]) - ids.test(head[b])).find((i) => isName(head[i], i));
      if (n != null) nameCol = n;
    }
    table = table.slice(1);
  }

  const lines = [];
  const totals = new Map();
  for (const cells of table) {
    const nums = cells.map((c, i) => [i, parseAmount(c)]).filter(([, v]) => v != null);
    const name = (nameCol != null ? cells[nameCol] : cells.find((c) => c && parseAmount(c) == null)) ?? '';
    const types = name ? typesOf(name) : [];

    let amount = null;
    let reason = 'ok';
    if (countCol != null) amount = parseAmount(cells[countCol] ?? '');
    else if (nums.length === 1) amount = nums[0][1];
    else if (nums.length > 1) reason = 'numbers';

    if (reason === 'ok' && amount == null) {
      // A known type followed by empty cells is a template line the shop left
      // blank. Anything else without a count is shown, so nothing vanishes.
      const blank = cells.length > 1 && cells.every((c, i) => i === cells.indexOf(name) || !c.trim());
      if (types.length === 1 && blank) continue;
      reason = 'nocount';
    }
    if (reason === 'ok' && !Number.isInteger(amount)) reason = 'decimal';
    const count = amount;
    if (reason === 'ok' && count === 0) continue; // none of them: nothing to count or to lose
    if (reason === 'ok' && types.length === 0) reason = 'unknown';
    if (reason === 'ok' && types.length > 1) reason = 'ambiguous';

    const category = reason === 'ok' ? types[0] : null;
    if (category) {
      const sum = (totals.get(category) ?? 0) + count;
      if (sum > maxCount) reason = 'toomany';
      else totals.set(category, sum);
    }
    lines.push({ name: name || cells.join(' '), count, category: reason === 'ok' ? category : null, reason, types });
  }

  return { rows: [...totals].map(([category, count]) => ({ category, count })), lines };
}

/** A file to fill in: every product type, one per line, count left blank. */
export function templateCsv(categories) {
  return `﻿Sort;Antal\r\n${categories.map((c) => `${c.plural};`).join('\r\n')}\r\n`;
}

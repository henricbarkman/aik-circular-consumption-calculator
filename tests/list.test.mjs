import test from 'node:test';
import assert from 'node:assert/strict';
import { parseList, parseAmount, typesOf, decodeList, templateCsv } from '../app/list.js';
import { CATEGORIES } from '../app/factors.js';

const byName = (res) => Object.fromEntries(res.lines.map((l) => [l.name, l]));

test('a list saved from Swedish Excel: header, semicolons, compounds, a total line', () => {
  const res = parseList('Artikel;Antal\nHerrjackor;120\nJeans;300\nMatbord;12\nBordslampa;8\nKöksstolar;40\nSumma;480\n');
  assert.deepEqual(res.rows, [
    { category: 'klader', count: 420 },   // 120 jackets + 300 jeans
    { category: 'bord', count: 12 },
    { category: 'stolar', count: 40 },
  ]);
  const l = byName(res);
  assert.equal(l.Bordslampa.reason, 'unknown');  // a lamp, not a table
  assert.equal(l.Summa.reason, 'unknown');       // never counted twice
  assert.equal(l.Summa.category, null);
});

test('every product type in the template is read back as itself', () => {
  const text = templateCsv(CATEGORIES).replace(/;\r\n/g, ';5\r\n');
  const res = parseList(decodeList(new TextEncoder().encode(text)));
  assert.deepEqual(res.rows.map((r) => r.category), CATEGORIES.map((c) => c.id));
  assert.ok(res.lines.every((l) => l.reason === 'ok'));
});

test('blank counts in the template are lines the shop does not have, not errors', () => {
  const res = parseList(templateCsv(CATEGORIES).replace('kläder;', 'kläder;1200'));
  assert.deepEqual(res.rows, [{ category: 'klader', count: 1200 }]);
  assert.equal(res.lines.length, 1);
});

test('a line without a count that is not a template line is shown, not dropped', () => {
  const res = parseList('Tröjor;\nLampor;\n');
  // "Tröjor;" is a known type with a blank count: skipped like a template line.
  // "Lampor;" is unknown and blank: shown so the reader sees it was not counted.
  assert.deepEqual(res.rows, []);
  assert.equal(byName(res).Lampor.reason, 'nocount');
});

test('Windows-1252 bytes from older Excel decode to å, ä, ö', () => {
  const bytes = Uint8Array.from([0x4b, 0xe4, 0x6c, 0x6c, 0x3b, 0x31]); // "Käll;1"
  assert.equal(decodeList(bytes), 'Käll;1');
  const utf8 = new TextEncoder().encode('﻿böcker;3');
  assert.equal(decodeList(utf8), 'böcker;3');
});

test('counts as people write them', () => {
  assert.equal(parseAmount('1200'), 1200);
  assert.equal(parseAmount('1 200'), 1200);
  assert.equal(parseAmount('1 200'), 1200);
  assert.equal(parseAmount('1.200'), 1200);
  assert.equal(parseAmount('300 st'), 300);
  assert.equal(parseAmount('12,5'), 12.5);
  assert.equal(parseAmount('-3'), null);
  assert.equal(parseAmount('ca 40'), null);
});

test('no delimiter at all: one product and a count per line, either order', () => {
  const res = parseList('Tröjor 300\n40 soffor\nCyklar 1 200 st\n');
  assert.deepEqual(res.rows, [
    { category: 'klader', count: 300 },
    { category: 'soffor', count: 40 },
    { category: 'cyklar', count: 1200 },
  ]);
});

test('named columns win over guessing, so an article number is not read as a count', () => {
  const res = parseList('Artikelnr,Benämning,Pris,Antal\n10023,Barncykel,450,3\n10024,Kokbok,40,25\n');
  assert.deepEqual(res.rows, [{ category: 'cyklar', count: 3 }, { category: 'bocker', count: 25 }]);
});

test('without a header, a line with several numbers is shown instead of guessed', () => {
  const res = parseList('10023;Barncykel;3\n');
  assert.deepEqual(res.rows, []);
  assert.equal(res.lines[0].reason, 'numbers');
});

test('a line naming two product types is not split by guessing', () => {
  const res = parseList('Bord och stolar;10\n');
  assert.equal(res.lines[0].reason, 'ambiguous');
  assert.deepEqual(res.lines[0].types.sort(), ['bord', 'stolar']);
});

test('quoted cells with the separator inside them', () => {
  const res = parseList('"Jeans, blå";30\n"Soffa ""Klippan""";2\n');
  assert.deepEqual(res.rows, [{ category: 'klader', count: 30 }, { category: 'soffor', count: 2 }]);
});

test('words that only look like a product type', () => {
  assert.deepEqual(typesOf('Motorcykel'), []);
  assert.deepEqual(typesOf('Disko'), []);
  assert.deepEqual(typesOf('TV-bänk'), []);
  assert.deepEqual(typesOf('Snömobil'), []);
  assert.deepEqual(typesOf('Elcykel'), ['cyklar']);
  assert.deepEqual(typesOf('T-shirts'), ['klader']);
  assert.deepEqual(typesOf('Kokbok'), ['bocker']);
  assert.deepEqual(typesOf('iPhone 12'), ['mobiler']);
});

test('a count that would pass the limit is shown, not silently capped', () => {
  const res = parseList('Tröjor;90000000\nJeans;20000000\n', 1e8);
  assert.deepEqual(res.rows, [{ category: 'klader', count: 90000000 }]);
  assert.equal(byName(res).Jeans.reason, 'toomany');
});

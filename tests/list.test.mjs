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
  assert.equal(l.Summa.reason, 'total');         // never counted twice, and said to be a total
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
  // "Skridskor" ends in "skor", so it was counted as shoes until skates had a type.
  assert.deepEqual(typesOf('Skridskor'), ['skridskor']);
  assert.deepEqual(typesOf('Hockeyskridskor'), ['skridskor']);
  assert.deepEqual(typesOf('Rullskridskor'), []);
  assert.deepEqual(typesOf('Elcykel'), ['elcyklar']);
  assert.deepEqual(typesOf('Damcykel'), ['cyklar']);
  assert.deepEqual(typesOf('Elsparkcykel'), []);
  assert.deepEqual(typesOf('El cykel'), ['elcyklar']);
  assert.deepEqual(typesOf('Sparkcykel'), []);
  assert.deepEqual(typesOf('Motionscykel'), []);
  assert.deepEqual(typesOf('T-shirts'), ['klader']);
  assert.deepEqual(typesOf('Kokbok'), ['bocker']);
  assert.deepEqual(typesOf('iPhone 12'), ['mobiler']);
});

test('a count that would pass the limit is shown, not silently capped', () => {
  const res = parseList('Tröjor;90000000\nJeans;20000000\n', 1e8);
  assert.deepEqual(res.rows, [{ category: 'klader', count: 90000000 }]);
  assert.equal(byName(res).Jeans.reason, 'toomany');
});

// From the adversarial review 2026-09-30: every one of these lost lines silently.

test('one comma inside a name does not make the whole file comma-separated', () => {
  const res = parseList('Tröjor, barn 100\nSkor 200\nBord 50\n');
  assert.deepEqual(res.rows, [
    { category: 'klader', count: 100 },
    { category: 'skor', count: 200 },
    { category: 'bord', count: 50 },
  ]);
});

test('a count with decimals is shown, not rounded into the total', () => {
  const res = parseList('Tröjor 1,5\nSkor 3\n');
  assert.deepEqual(res.rows, [{ category: 'skor', count: 3 }]);
  assert.equal(byName(res).Tröjor.reason, 'decimal');
  assert.equal(parseAmount('0.500'), 0.5);   // not five hundred
});

test('a first line that is data is not swallowed as a header', () => {
  assert.deepEqual(parseList('Tröjor;300\nSkor;200\n').rows.length, 2);
  const res = parseList('Tröjor:300\n');
  assert.equal(res.lines.length, 1);          // unreadable, but shown
  assert.equal(res.lines[0].reason, 'nocount');
});

test('a line with neither separator nor count in a separated file is shown', () => {
  const res = parseList('Sort;Antal\nTröjor;300\nSkor\n');
  assert.deepEqual(res.rows, [{ category: 'klader', count: 300 }]);
  assert.equal(byName(res).Skor.reason, 'nocount');
});

test('a text article number does not take the name column', () => {
  const res = parseList('Artikelnr;Sort;Antal\nA-1;Tröjor;5\n');
  assert.deepEqual(res.rows, [{ category: 'klader', count: 5 }]);
});

// From the persona test and the code review 2026-09-30.

test('a till export names small appliances its own way', () => {
  const res = parseList('Varugrupp;Antal\nSmåapparater kök;400\nTotalt;400\nLampor;80\n');
  assert.deepEqual(res.rows, [{ category: 'kok', count: 400 }]);
  const l = byName(res);
  assert.equal(l.Totalt.reason, 'total');
  assert.equal(l.Lampor.reason, 'unknown');
});

test('grouped thousands with a comma are a thousand, not one', () => {
  assert.equal(parseAmount('1,000'), 1000);
  assert.equal(parseAmount('12,500'), 12500);
  assert.equal(parseAmount('12,5'), 12.5);      // a decimal is still a decimal, and still refused
});

test('Excel "Unicode text" (UTF-16 with a byte order mark) decodes', () => {
  const text = 'Sort\tAntal\r\nTröjor\t300\r\n';
  const le = new Uint8Array(2 + text.length * 2);
  le[0] = 0xff; le[1] = 0xfe;
  for (let i = 0; i < text.length; i++) { le[2 + i * 2] = text.charCodeAt(i) & 0xff; le[3 + i * 2] = text.charCodeAt(i) >> 8; }
  assert.deepEqual(parseList(decodeList(le)).rows, [{ category: 'klader', count: 300 }]);
});

test('a total line is not counted, even when it names a product', () => {
  const res = parseList('Tröjor;300\nByxor;200\nSumma kläder;500\nKläder totalt;500\n');
  assert.deepEqual(res.rows, [{ category: 'klader', count: 500 }]);   // 300 + 200, not 1 500
  assert.deepEqual(res.lines.filter((l) => l.reason === 'total').map((l) => l.name), ['Summa kläder', 'Kläder totalt']);
});

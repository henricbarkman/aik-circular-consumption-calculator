// ?v=dev: stamped at deploy, see the note in index.html. Only this file imports
// the modules, so each still loads once.
import { CATEGORIES, METHODS, SHARED } from './factors.js?v=dev';
import { calculate, num, mass, massRange } from './calc.js?v=dev';
import { parseList, decodeList, templateCsv } from './list.js?v=dev';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---------- State ----------

const state = {
  rows: [{ category: 'klader', count: 1200 }],
  method: 'secondhand',
  transportOn: true,
  opsOn: true,
  // key -> value the user typed. Shared keys are plain ('km'); keys that belong
  // to one product type carry it ('lca:klader').
  overrides: {},
};

// Every editable number that is the same for all product types.
const FIELDS = {
  replacementPct: { label: () => 'Andel som ersätter ett nyköp', unit: '%', get: () => SHARED.replacementShare, chip: (v) => `${num(v)} %`, min: 0, max: 100 },
  carPct: { label: () => 'Andel av besöken som görs med bil', unit: '%', get: () => SHARED.carShare, chip: (v) => `${num(v)} %`, min: 0, max: 100 },
  trips: { label: () => 'Enkelresor per besök', unit: 'resor', get: () => METHODS[state.method].tripsPerCirculation, chip: (v) => `${num(v)} ${v === 1 ? 'resa' : 'resor'}`, min: 0, max: 100 },
  km: { label: () => 'Avstånd en väg', unit: 'km', get: () => SHARED.kmPerTrip, chip: (v) => `${num(v)} km`, min: 0, max: 10000 },
  carEf: { label: () => 'Utsläpp per bilkilometer', unit: 'kg per km', get: () => SHARED.carEf, chip: (v) => `${num(v)} kg per km`, min: 0, max: 10, step: 0.01 },
  // The Myrorna figure is measured for clothes shops only; for anything else it is an assumption.
  opEf: { label: () => 'Driftens utsläpp per föremål', unit: 'kg', get: opEfDefault, chip: (v) => `${num(v)} kg`, min: 0, max: 10000, step: 0.1 },
};

function opEfDefault() {
  if (isRepair()) return SHARED.opEfRepair;
  return state.rows.every((r) => r.category === 'klader') ? SHARED.opEfPerItem : SHARED.opEfPerItemOther;
}

const isRepair = () => state.method === 'repair';

// Editable numbers that differ per product type. share and repairKg are used
// only when the method is repair.
const ROW_FIELDS = {
  lca: { label: (c) => `Utsläpp från ${c.singular}`, unit: 'kg koldioxidekvivalenter', get: (c) => c.lca, chip: (v) => `${num(v)} kg`, min: 0, max: 100000, step: 'any' },
  itemsPerTrip: { label: (c) => `${cap(c.plural)} per besök`, unit: 'st', get: (c) => c.itemsPerTrip, chip: (v) => num(v), min: 0.1, max: 1000, step: 0.5 },
  share: { label: (c) => `Andel lagade ${c.plural} som ersätter ett nyköp`, unit: '%', get: (c) => c.repairShare, chip: (v) => `${num(v)} %`, min: 0, max: 100 },
  repairKg: { label: (c) => `Utsläpp från en lagning av ${c.plural}`, unit: 'kg koldioxidekvivalenter', get: (c) => c.repairKg, chip: (v) => `${num(v)} kg`, min: 0, max: 10000, step: 'any' },
};

const MAX_COUNT = 100000000;

function spec(key) {
  const [name, catId] = key.split(':');
  return catId ? { d: ROW_FIELDS[name], c: catById[catId], name, catId } : { d: FIELDS[name], name };
}

function field(key) {
  const { d, c } = spec(key);
  const def = d.get(c);
  const has = Object.hasOwn(state.overrides, key);
  return { value: has ? state.overrides[key] : def.value, kind: has ? 'user' : def.kind, def, key };
}

// One check for a typed or linked value, so a link can never hold a number the
// editor would refuse. Returns an error message, or '' when the value is fine.
// Plain decimals only: Number() would also accept ' ', '0x10' and '1e3'.
const DECIMAL = /^\d*\.?\d+$/;

function problem(key, raw) {
  const { d } = spec(key);
  if (!d) return 'Okänt fält.';
  const v = Number(raw);
  if (raw == null || !DECIMAL.test(String(raw)) || v < d.min || v > d.max) {
    return `Skriv ett tal från ${num(d.min)} till ${num(d.max)}.`;
  }
  return '';
}

function parseCount(raw) {
  if (raw == null || !DECIMAL.test(String(raw))) return null;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= 1 && n <= MAX_COUNT ? n : null;
}

function rowInputs(lcaOf = (row) => field(`lca:${row.category}`).value, repairOf = (row) => field(`repairKg:${row.category}`).value) {
  return state.rows.map((row) => ({
    category: row.category,
    count: row.count,
    lca: lcaOf(row),
    itemsPerTrip: field(`itemsPerTrip:${row.category}`).value,
    ...(isRepair() ? {
      replacementPct: field(`share:${row.category}`).value,
      repairKg: repairOf(row),
    } : {}),
  }));
}

function inputs(lcaOf, repairOf) {
  return {
    rows: rowInputs(lcaOf, repairOf),
    replacementPct: field('replacementPct').value,
    transportOn: state.transportOn,
    carPct: field('carPct').value,
    trips: field('trips').value,
    km: field('km').value,
    carEf: field('carEf').value,
    opsOn: state.opsOn,
    opEf: field('opEf').value,
  };
}

// The same calculation at the low and high end of each source's span. A value
// the user typed is their own and does not move. A repair's span runs the other
// way: the lowest net pairs the cheapest new item with the costliest repair.
function spanOfResult() {
  const pick = (name, row, which) => {
    const key = `${name}:${row.category}`;
    const def = catById[row.category][name];
    return Object.hasOwn(state.overrides, key) ? state.overrides[key] : def[which] ?? def.value;
  };
  const end = (which, other) => calculate(inputs(
    (row) => pick('lca', row, which),
    (row) => pick('repairKg', row, other),
  )).net;
  return { low: end('low', 'high'), high: end('high', 'low') };
}

// ---------- URL: a calculation is a link ----------

const URL_KEYS = { replacementPct: 'r', carPct: 'bil', trips: 'resor', km: 'km', carEf: 'ef', opEf: 'drift' };
const ROW_URL = { lca: 'kg', itemsPerTrip: 'per', share: 'r', repairKg: 'lag' };

function readUrl() {
  const q = new URLSearchParams(location.search);
  const rows = [];
  for (const part of (q.get('rader') ?? '').split(',')) {
    const [id, n] = part.split('.');
    const count = parseCount(n);
    if (Object.hasOwn(catById, id ?? '') && count && !rows.some((r) => r.category === id)) rows.push({ category: id, count });
  }
  // Links from the first version carried one product as vad + antal.
  if (!rows.length && Object.hasOwn(catById, q.get('vad') ?? '')) {
    rows.push({ category: q.get('vad'), count: parseCount(q.get('antal')) ?? 1200 });
    if (q.has('per') && !q.has(`per.${q.get('vad')}`)) q.set(`per.${q.get('vad')}`, q.get('per'));
  }
  if (rows.length) state.rows = rows;
  // "borrow" was its own method until renting and borrowing were merged.
  const how = q.get('hur') === 'borrow' ? 'rent' : q.get('hur') ?? '';
  if (Object.hasOwn(METHODS, how)) state.method = how;
  if (q.get('resor_med') === '0') state.transportOn = false;
  if (q.get('drift_med') === '0') state.opsOn = false;
  for (const [name, key] of Object.entries(URL_KEYS)) {
    if (q.has(key) && !problem(name, q.get(key))) state.overrides[name] = Number(q.get(key));
  }
  for (const row of state.rows) {
    for (const [name, prefix] of Object.entries(ROW_URL)) {
      const k = `${prefix}.${row.category}`;
      const key = `${name}:${row.category}`;
      if (q.has(k) && !problem(key, q.get(k))) state.overrides[key] = Number(q.get(k));
    }
  }
}

function linkForState() {
  const q = new URLSearchParams({ rader: state.rows.map((r) => `${r.category}.${r.count}`).join(','), hur: state.method });
  if (!state.transportOn) q.set('resor_med', '0');
  if (!state.opsOn) q.set('drift_med', '0');
  for (const [key, v] of Object.entries(state.overrides)) {
    const { name, catId } = spec(key);
    q.set(catId ? `${ROW_URL[name]}.${catId}` : URL_KEYS[name], v);
  }
  return `${location.origin}${location.pathname}?${q}`;
}

// A number typed for a product type that is no longer in the sentence is dropped,
// so it cannot come back unseen when the type is added again.
function pruneOverrides() {
  const inUse = new Set(state.rows.map((r) => r.category));
  for (const key of Object.keys(state.overrides)) {
    const { catId } = spec(key);
    if (catId && !inUse.has(catId)) delete state.overrides[key];
  }
}

// ---------- The sentence ----------

const sentence = $('sentence-rows');
const inMethod = $('in-method');
const addBtn = $('btn-add-row');

function optionsFor(rowIndex) {
  const taken = new Set(state.rows.filter((_, i) => i !== rowIndex).map((r) => r.category));
  return CATEGORIES.filter((c) => !taken.has(c.id))
    .map((c) => `<option value="${c.id}"${c.id === state.rows[rowIndex].category ? ' selected' : ''}>${c.plural}</option>`).join('');
}

function fillSentence() {
  const n = state.rows.length;
  sentence.innerHTML = state.rows.map((row, i) => {
    const sep = i === 0 ? '' : i === n - 1 ? ' och ' : ', ';
    const c = catById[row.category];
    const remove = n > 1 ? `<button type="button" class="row-remove" data-remove="${i}" aria-label="Ta bort ${c.plural}">×</button>` : '';
    return `${sep}<span class="row-slot"><input class="slot" type="number" inputmode="numeric" min="1" step="1" data-row="${i}" aria-label="Antal ${c.plural}" value="${row.count}"> <select class="slot" data-row="${i}" aria-label="Vilken sorts produkt">${optionsFor(i)}</select>${remove}</span>`;
  }).join('');
  inMethod.innerHTML = Object.values(METHODS).map((m) => `<option value="${m.id}">${m.label}</option>`).join('');
  inMethod.value = state.method;
  $('ask-h1').classList.toggle('is-list', n > 1);
  addBtn.hidden = n >= CATEGORIES.length;
  sizeSlots();
}

const measureCtx = document.createElement('canvas').getContext('2d');
function textWidth(el, text) {
  const cs = getComputedStyle(el);
  measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return measureCtx.measureText(text).width;
}
// Size each slot to its own text, so the sentence reads as a sentence and not a form.
function sizeSlots() {
  for (const el of $('ask-h1').querySelectorAll('.slot')) {
    const em = parseFloat(getComputedStyle(el).fontSize);
    if (el.tagName === 'INPUT') el.style.width = `${textWidth(el, String(el.value || '0')) + em * 0.2}px`;
    else el.style.width = `${textWidth(el, el.options[el.selectedIndex]?.text ?? '') + em * 0.72}px`;
  }
}

sentence.addEventListener('input', (e) => {
  const i = Number(e.target.dataset.row);
  if (e.target.tagName !== 'INPUT' || !state.rows[i]) return;
  const n = parseCount(e.target.value);
  if (n) { state.rows[i].count = n; render(); }
  sizeSlots();
});
sentence.addEventListener('change', (e) => {
  const i = Number(e.target.dataset.row);
  if (!state.rows[i]) return;
  // Leaving a blank or half-typed count shows the number the calculation uses.
  if (e.target.tagName === 'INPUT') { e.target.value = state.rows[i].count; sizeSlots(); return; }
  if (e.target.tagName !== 'SELECT') return;
  state.rows[i].category = e.target.value;
  pruneOverrides(); fillSentence(); render();
  sentence.querySelector(`select[data-row="${i}"]`)?.focus();
});
sentence.addEventListener('click', (e) => {
  const b = e.target.closest('[data-remove]');
  if (!b) return;
  state.rows.splice(Number(b.dataset.remove), 1);
  pruneOverrides(); fillSentence(); render();
  addBtn.focus();
});
addBtn.addEventListener('click', () => {
  const taken = new Set(state.rows.map((r) => r.category));
  const next = CATEGORIES.find((c) => !taken.has(c.id));
  if (!next) return;
  state.rows.push({ category: next.id, count: 100 });
  fillSentence(); render();
  sentence.querySelector(`select[data-row="${state.rows.length - 1}"]`)?.focus();
});
// ---------- A list instead of the sentence ----------

const REASON = {
  unknown: 'Inte med: sorten finns inte i verktyget',
  nocount: 'Inte med: inget antal',
  numbers: 'Inte med: flera tal på raden. Ge kolumnen med antal rubriken Antal.',
  decimal: 'Inte med: antalet är inte ett heltal',
  toomany: `Inte med: fler än ${MAX_COUNT.toLocaleString('sv-SE')} av samma sort`,
};

$('dl-template').href = URL.createObjectURL(new Blob([templateCsv(CATEGORIES)], { type: 'text/csv;charset=utf-8' }));
$('btn-list').addEventListener('click', () => $('in-list').click());
$('in-list').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  e.target.value = ''; // the same file again should load again
  if (file) readListFile(file);
});

const ask = document.querySelector('.ask');
ask.addEventListener('dragover', (e) => {
  if (![...(e.dataTransfer?.types ?? [])].includes('Files')) return;
  e.preventDefault();
  ask.classList.add('is-dropping');
});
ask.addEventListener('dragleave', (e) => { if (!ask.contains(e.relatedTarget)) ask.classList.remove('is-dropping'); });
ask.addEventListener('drop', (e) => {
  ask.classList.remove('is-dropping');
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  e.preventDefault();
  readListFile(file);
});

const MAX_LIST_BYTES = 2 * 1024 * 1024;
const MAX_LIST_LINES_SHOWN = 200;
let listRead = 0;

// The spreadsheet reader is nearly a megabyte, so it loads only when someone
// actually reads in an Excel or LibreOffice file.
let spreadsheetLib = null;
function loadSpreadsheetLib() {
  spreadsheetLib ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'vendor/xlsx.full.min.js?v=dev';
    s.onload = () => resolve(window.XLSX);
    s.onerror = () => { spreadsheetLib = null; reject(new Error('load')); };
    document.head.append(s);
  });
  return spreadsheetLib;
}

// .xlsx and .ods are zip archives ("PK"); old .xls is an OLE file.
const isZip = (b) => b[0] === 0x50 && b[1] === 0x4b;
const isOle = (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;

/** The first sheet with anything in it, as the same text a CSV would give. */
async function spreadsheetText(bytes) {
  const X = await loadSpreadsheetLib();
  const wb = X.read(bytes, { type: 'array' });
  const filled = wb.SheetNames.filter((n) => X.utils.sheet_to_csv(wb.Sheets[n], { blankrows: false }).trim());
  if (!filled.length) return { text: '', sheet: null, others: [] };
  // Raw numbers: "1 200" formatted for Sweden or "1,200" for the US both come out as 1200.
  const text = X.utils.sheet_to_csv(wb.Sheets[filled[0]], { FS: ';', rawNumbers: true, blankrows: false });
  return { text, sheet: filled[0], others: filled.slice(1) };
}

async function readListFile(file) {
  // Only the file picked last may change the sentence, however the reads finish.
  const mine = ++listRead;
  if (file.size > MAX_LIST_BYTES) {
    return listReport(`<p><b>${esc(file.name)}</b> är större än 2 MB. En lista med sort och antal per rad brukar vara några kilobyte: kontrollera att det är rätt fil.</p>`);
  }
  let bytes;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return listReport(`<p><b>${esc(file.name)}</b> gick inte att läsa. Försök igen, eller spara om filen.</p>`);
  }
  if (mine !== listRead) return;
  let text;
  let sheetNote = '';
  if (isZip(bytes) || isOle(bytes)) {
    let sheet;
    try {
      sheet = await spreadsheetText(bytes);
    } catch {
      return listReport(`<p><b>${esc(file.name)}</b> gick inte att läsa som kalkylark. Spara den som CSV och läs in den igen.</p>`);
    }
    if (mine !== listRead) return;
    if (!sheet.sheet) return listReport(`<p><b>${esc(file.name)}</b> har inga ifyllda celler.</p>`);
    text = sheet.text;
    sheetNote = ` (bladet ${esc(sheet.sheet)}${sheet.others.length ? `; ${sheet.others.length === 1 ? 'bladet' : 'bladen'} ${sheet.others.map(esc).join(', ')} lästes inte` : ''})`;
  } else {
    text = decodeList(bytes);
  }
  const { rows, lines } = parseList(text, MAX_COUNT);
  const left = lines.filter((l) => l.reason !== 'ok');
  if (!rows.length) {
    return listReport(`<p>Ingen rad i <b>${esc(file.name)}</b>${sheetNote} gick att räkna, så meningen är oförändrad. Varje rad behöver en sort och ett antal, till exempel <i>Tröjor;300</i>.</p>${lineTable(lines)}`);
  }
  state.rows = rows;
  pruneOverrides(); fillSentence(); render();
  const total = rows.reduce((a, r) => a + r.count, 0).toLocaleString('sv-SE');
  const n = rows.length;
  listReport(`<p>Från <b>${esc(file.name)}</b>${sheetNote}: ${total} produkter i ${n} ${n === 1 ? 'sort' : 'sorter'}, nu i meningen ovan.${left.length ? ` <b>${left.length} ${left.length === 1 ? 'rad räknas' : 'rader räknas'} inte med.</b>` : ''}</p>
    <details${left.length ? ' open' : ''}><summary>Så läste vi listan</summary>${lineTable(lines)}</details>`);
}

function lineTable(all) {
  if (!all.length) return '';
  // Lines left out first: they are the ones that need reading.
  const sorted = [...all.filter((l) => l.reason !== 'ok'), ...all.filter((l) => l.reason === 'ok')];
  const lines = sorted.slice(0, MAX_LIST_LINES_SHOWN);
  const more = sorted.length - lines.length;
  const what = (l) => {
    if (l.reason === 'ok') return esc(catById[l.category].plural);
    if (l.reason === 'ambiguous') return `Inte med: passar både ${l.types.map((t) => esc(catById[t].plural)).join(' och ')}. Dela upp raden.`;
    return REASON[l.reason];
  };
  return `<div class="table-scroll"><table class="list-lines"><thead><tr><th>Rad i listan</th><th>Antal</th><th>Räknas som</th></tr></thead><tbody>${
    lines.map((l) => `<tr${l.reason === 'ok' ? '' : ' class="is-left"'}><td>${esc(l.name)}</td><td class="num">${l.count == null ? '' : l.count.toLocaleString('sv-SE')}</td><td>${what(l)}</td></tr>`).join('')
  }</tbody></table></div>${more ? `<p>Och ${more.toLocaleString('sv-SE')} rader till.</p>` : ''}`;
}

function listReport(html) {
  const box = $('list-report');
  box.innerHTML = `${html}<button type="button" class="linkbtn list-close">Dölj</button>`;
  box.hidden = false;
  box.querySelector('.list-close').addEventListener('click', () => { box.hidden = true; $('btn-list').focus(); });
}

inMethod.addEventListener('change', () => {
  state.method = inMethod.value;
  delete state.overrides.trips;
  sizeSlots(); render();
});

// ---------- Rendering ----------

let openField = null;

function chip(key) {
  const f = field(key);
  const { d, c } = spec(key);
  const expanded = openField === key;
  return `<button type="button" class="chip" data-field="${key}" data-kind="${f.kind}" aria-expanded="${expanded}" aria-controls="editor-${key.replace(':', '-')}" aria-label="${d.label(c)}: ${d.chip(f.value)}. Öppna för källa och ändra.">${d.chip(f.value)}</button>`;
}

function editor(key) {
  const f = field(key);
  const { d, c } = spec(key);
  const hidden = openField === key ? '' : 'hidden';
  return `<div class="editor" id="editor-${key.replace(':', '-')}" data-editor="${key}" ${hidden}>
    <label>${d.label(c)}</label>
    <div class="editor-fields"><span>${d.unit}<input type="number" min="${d.min}" max="${d.max}" step="${d.step ?? 1}" value="${f.value}"></span></div>
    <p class="editor-msg" role="alert"></p>
    <p class="editor-source">${provenanceText(f)}</p>
    <div class="editor-actions">
      <button type="button" class="btn" data-reset="${key}" ${f.kind === 'user' ? '' : 'disabled'}>Återställ</button>
      <button type="button" class="btn btn--solid" data-close="${key}">Klar</button>
    </div>
  </div>`;
}

function provenanceText(f) {
  const def = f.def;
  const span = def.low != null ? ` Källorna anger ${num(def.low)} till ${num(def.high)} kg, beroende på vad det är. ${def.typical ?? ''}` : '';
  const base = (() => {
    if (def.kind === 'source' && def.sources?.length) {
      const list = def.sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>, ${s.org} ${s.year}`).join('; ');
      return `<span class="kind">${def.sources.length > 1 ? 'Källor' : 'Källa'}:</span> ${list}.${span}${def.note ? ` ${def.note}` : ''}`;
    }
    if (def.kind === 'assumption') return `<span class="kind">Antagande i metoden.</span> ${def.why ?? ''}`;
    return `<span class="kind">Exempelvärde.</span> Här ska en källa in innan verktyget publiceras.${def.why ? ` ${def.why}` : ''}`;
  })();
  if (f.kind === 'user') return `<span class="kind">Du har ändrat värdet.</span> Utgångsläget var ${num(def.value)}. ${base}`;
  return base;
}

function render() {
  const res = calculate(inputs());
  renderResult(res);
  renderBars(res);
  renderSteps(res);
  renderTables();
  $('sticky-figure').textContent = mass(res.net);
  // The address bar always holds the calculation on screen, without piling up history.
  history.replaceState(null, '', linkForState());
}

// Words for "the things" in the sentence: the product's own plural when there
// is one type, otherwise "produkter".
function things(n) {
  return state.rows.length === 1 ? catById[state.rows[0].category].plural : (n === 1 ? 'produkt' : 'produkter');
}

function renderResult(res) {
  // A negative net is shown as its size; the caption carries the sign.
  const [figure, unit] = splitUnit(mass(Math.abs(res.net)));
  $('out-figure').innerHTML = `${figure}<span class="unit"> ${unit}</span>`;
  $('out-caption').textContent = res.net < 0
    ? 'koldioxidekvivalenter mer än om ingenting hade cirkulerats.'
    : 'koldioxidekvivalenter som inte släpptes ut.';

  $('out-note').innerHTML = basisSentence(true);

  const neg = $('out-negative');
  neg.hidden = res.net >= 0;
  if (res.net < 0) {
    neg.textContent = isRepair()
      ? 'Lagningen, resorna och driften ger mer utsläpp än de nyköp som undveks. Titta på vad en lagning kostar i steg 3 och på andelen som ersätter ett nyköp, sedan på antagandena om bil och avstånd.'
      : 'Resorna och driften ger mer utsläpp än de nyköp som undveks. Titta på antagandena om bil och avstånd, eller räkna utan driften om den redan finns av andra skäl.';
  }
}

// What the net rests on, in words: typical values, the user's own, or a mix,
// and the span from the sources for the rows that still use them.
function basisSentence(html) {
  const own = state.rows.filter((r) => Object.hasOwn(state.overrides, `lca:${r.category}`));
  const b = (t) => (html ? `<strong>${t}</strong>` : t);
  if (own.length === state.rows.length) return 'Uträkningen bygger på era egna värden för utsläppen från nya produkter.';
  const span = spanOfResult();
  const one = state.rows.length === 1 ? catById[state.rows[0].category] : null;
  if (!own.length) {
    return `Uträkningen utgår från ${one ? `ett typiskt värde för ${one.singular}` : 'ett typiskt värde för varje sorts produkt'}. Med källornas lägsta och högsta värden blir nettot ${b(massRange(span.low, span.high))}. Vet ni mer om era produkter, ändra värdet i steg 1.`;
  }
  const list = own.map((r) => catById[r.category].plural);
  const named = list.length > 1 ? `${list.slice(0, -1).join(', ')} och ${list.at(-1)}` : list[0];
  return `Uträkningen använder era egna värden för ${named} och typiska värden för resten. Med källornas lägsta och högsta värden för resten blir nettot ${b(massRange(span.low, span.high))}.`;
}

function pct(part, whole) {
  if (!whole) return '0 %';
  const p = (part / whole) * 100;
  if (p > 0 && p < 1) return 'under 1 %';
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: p < 10 ? 1 : 0 }).format(p)} %`;
}

function splitUnit(s) {
  const i = s.lastIndexOf(' ');
  return [s.slice(0, i), s.slice(i + 1)];
}

const SEGMENTS = [
  { key: 'net', label: 'Netto, undvikna utsläpp', color: 'var(--mark-net)' },
  { key: 'trip', label: 'Resor', color: 'var(--mark-trip)' },
  { key: 'ops', label: 'Drift', color: 'var(--mark-ops)' },
  { key: 'repair', label: 'Lagningen', color: 'var(--mark-repair)' },
  { key: 'rest', label: 'Ersätter inte ett nyköp', color: 'var(--mark-rest)' },
];

function renderBars(res) {
  const costs = isRepair() ? 'lagning, resor och drift' : 'resor och drift';
  $('flow-intro').textContent = `Stapeln är hela nyttan om alla ${res.count.toLocaleString('sv-SE')} ${things(res.count)} hade ersatt ett nyköp. Färgerna visar hur stor del som blir kvar och vart resten tar vägen.${res.net < 0 ? ` Nettot är negativt, så det finns ingen grön del: ${costs} kostar mer än det som undveks, och stapeln blir längre än nyttan.` : ''}`;
  $('legend').innerHTML = SEGMENTS.filter((s) => s.key !== 'repair' || isRepair()).map((s) => `<li><span class="swatch" style="background:${s.color}"></span>${s.label}</li>`).join('');
  const parts = (res.net >= 0
    ? [['net', res.net], ['trip', res.transportKg], ['ops', res.opsKg], ['repair', res.repairKg], ['rest', res.notReplacingLost]]
    : [['trip', res.transportKg], ['ops', res.opsKg], ['repair', res.repairKg], ['rest', res.notReplacingLost]]).filter(([, v]) => v > 0);
  const width = $('bars').clientWidth || 600;
  const gap = 2;
  const scale = Math.max(1, parts.reduce((a, [, v]) => a + v, 0));
  const cost = res.transportKg + res.opsKg + res.repairKg;
  let x = 0;
  const rects = parts.map(([key, v], i) => {
    const seg = SEGMENTS.find((q) => q.key === key);
    const full = (v / scale) * width;
    const last = i === parts.length - 1;
    // A 2px surface gap between touching segments; a sliver still shows as 1px.
    const w = Math.max(1, full - (last ? 0 : gap));
    const d = last ? roundedEnd(x, 2, w, 24, Math.min(4, w)) : `M${x},2h${w}v24h${-w}z`;
    x += full;
    return `<path data-tip="${seg.label}: ${mass(v)}" d="${d}" fill="${seg.color}"></path>`;
  }).join('');
  $('bars').innerHTML = `<div class="bar-row">
      <p>${res.net >= 0 ? `Netto <b>${mass(res.net)}</b>` : `Netto minus <b>${mass(-res.net)}</b>`} av möjliga ${mass(res.potential)}.${cost > 0 ? ` ${cap(costs)} drar bort ${mass(cost)}${res.avoided > 0 ? `, ${pct(cost, res.avoided)} av det som undveks` : ''}.` : ''}</p>
      <svg role="img" viewBox="0 0 ${width} 28" aria-label="Netto ${mass(res.net)}, resor ${mass(res.transportKg)}, drift ${mass(res.opsKg)},${isRepair() ? ` lagningen ${mass(res.repairKg)},` : ''} ersätter inte ett nyköp ${mass(res.notReplacingLost)}">${rects}</svg>
    </div>`;
}

// Square at the baseline, 4px rounded at the data end.
function roundedEnd(x, y, w, h, r) {
  return `M${x},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(w - r)}z`;
}

const op = (s) => ` <span class="op">${s}</span> `;
const res$ = (s) => `<span class="res">${s}</span>`;

function renderSteps(res) {
  const many = res.rows.length > 1;
  const total = res.count.toLocaleString('sv-SE');
  const lcaKeys = res.rows.map((r) => `lca:${r.category}`);
  const perKeys = res.rows.map((r) => `itemsPerTrip:${r.category}`);

  const potentialLines = res.rows.map((r) => `<p class="equation">${r.count.toLocaleString('sv-SE')} ${catById[r.category].plural}${op('×')}${chip(`lca:${r.category}`)}${op('=')}${res$(mass(r.potential))}</p>`).join('');
  const visitTerms = res.rows.map((r) => `${num(r.notReplacing)} ${catById[r.category].plural}${op('÷')}${chip(`itemsPerTrip:${r.category}`)} per besök`).join(op('+'));

  const steps = [
    {
      title: 'Om allt hade köpts nytt',
      body: `${potentialLines}
        ${many ? `<p class="equation">Tillsammans ${res$(mass(res.potential))}</p>` : ''}
        <p>Utsläppen från att tillverka lika många nya produkter. Det är den största möjliga nyttan, och den förutsätter att allt hade köpts nytt annars. Talen per produkt är typiska värden: öppna dem för att se källan, spannet och byta mot era egna.</p>`,
      editors: lcaKeys,
    },
    isRepair() ? {
      title: 'Men alla lagningar ersätter inte ett nyköp',
      body: `${res.rows.map((r) => `<p class="equation">${chip(`share:${r.category}`)} av ${r.count.toLocaleString('sv-SE')} ${catById[r.category].plural}${op('×')}${num(r.lca)} kg${op('=')}${res$(mass(r.avoided))}</p>`).join('')}
        ${many ? `<p class="equation">Tillsammans ${res$(mass(res.avoided))} undvikna utsläpp</p>` : ''}
        <p>Räkna bara lagningar som blev klara. På reparationskaféer lyckas ungefär två av tre.</p>
        <details class="why"><summary>Varför inte alla?</summary><p>En del trasiga saker hade fått ligga kvar, eller ersatts av något begagnat. En lagad sak håller inte heller alltid lika länge som en ny. För kläder finns en mätning: 82 procent av lagningarna ersatte ett nyköp. För annat finns ingen, så metoden räknar med hälften. Vet ni mer, ändra andelen.</p></details>`,
      editors: res.rows.map((r) => `share:${r.category}`),
    } : {
      title: 'Men alla ersätter inte ett nyköp',
      body: `<p class="equation">${chip('replacementPct')} av ${total} ${things(res.count)}${op('=')}${num(res.replacing)} som ersätter ett nyköp</p>
        <p class="equation">${mass(res.potential)}${op('×')}${num(field('replacementPct').value)} %${op('=')}${res$(mass(res.avoided))} undvikna utsläpp</p>
        <details class="why"><summary>Varför inte alla?</summary><p>Begagnat är billigare, så en del köps som annars aldrig hade köpts. En del lånas en gång för att det går, fast behovet hade kunnat vänta. Metodens utgångsläge är att hälften ersätter ett nyköp. Vet ni mer om era besökare, ändra andelen.</p></details>`,
      editors: ['replacementPct'],
    },
    ...(isRepair() ? [{
      title: 'Själva lagningen',
      body: `${res.rows.map((r) => `<p class="equation">${r.count.toLocaleString('sv-SE')} ${catById[r.category].plural}${op('×')}${chip(`repairKg:${r.category}`)}${op('=')}${res$(mass(r.repair))}</p>`).join('')}
        ${many ? `<p class="equation">Tillsammans ${res$(mass(res.repairKg))}</p>` : ''}
        <p>Reservdelar, tråd och verkstadens el. Räknas för varje lagning: när lagningen ersätter ett nyköp kostar delarna ändå något, och när den inte gör det tillkommer de helt.</p>`,
      editors: res.rows.map((r) => `repairKg:${r.category}`),
    }] : []),
    {
      title: 'Resorna till och från',
      off: !state.transportOn,
      body: `<label class="switch"><input type="checkbox" data-toggle="transportOn" ${state.transportOn ? 'checked' : ''}> Räkna med resorna</label>
        <p class="equation">${chip('carPct')} åker bil${op('×')}${chip('trips')}${op('×')}${chip('km')}${op('×')}${chip('carEf')}${op('=')}${num(res.perTripKg)} kg per besök</p>
        <p class="equation">${visitTerms}${op('=')}${num(res.visits)} besök</p>
        <p class="equation">${num(res.visits)} besök${op('×')}${num(res.perTripKg)} kg${op('=')}${res$(mass(res.transportKg))}</p>
        <details class="why"><summary>Varför bara för dem som inte ersätter ett nyköp?</summary><p>Den som hade köpt nytt i stället hade också åkt till en butik. Resan tillkommer bara när köpet, hyran, lånet eller lagningen inte ersatte något. Flera saker som hämtas vid samma besök delar på resan.</p></details>`,
      editors: ['carPct', 'trips', 'km', 'carEf', ...perKeys],
    },
    {
      title: isRepair() ? 'Driften av verkstaden' : 'Driften av butiken eller utlåningen',
      off: !state.opsOn,
      body: `<label class="switch"><input type="checkbox" data-toggle="opsOn" ${state.opsOn ? 'checked' : ''}> Räkna med driften</label>
        <p class="equation">${num(res.notReplacing)} ${things(res.notReplacing)} som inte ersätter ett nyköp${op('×')}${chip('opEf')} per styck${op('=')}${res$(mass(res.opsKg))}</p>
        <p>Lokal, värme och el. Samma resonemang som för resorna: bara den del som inte ersätter ett nyköp räknas som ett tillskott.</p>`,
      editors: ['opEf'],
    },
    {
      total: true,
      title: 'Netto',
      body: `<p class="equation">${mass(res.avoided)}${isRepair() ? `${op('−')}${mass(res.repairKg)}` : ''}${op('−')}${mass(res.transportKg)}${op('−')}${mass(res.opsKg)}${op('=')}${res$(mass(res.net))}</p>`,
    },
  ];

  const typing = document.activeElement?.closest?.('[data-editor]');
  const typingInput = typing && document.activeElement;
  const caret = typingInput?.selectionStart ?? null;

  $('steps').innerHTML = steps.map((s) => `<li class="step${s.total ? ' step--total' : ''}${s.off ? ' is-off' : ''}">
      <div class="step-body"><h3>${s.title}</h3>${s.body}${(s.editors ?? []).map(editor).join('')}</div>
    </li>`).join('');

  // Put the editor being typed in back as it was, text and caret included, and
  // take only its source line and reset button from the fresh render. A number
  // input cannot hand back "1." as text, so rebuilding it would lose the dot.
  if (typing) {
    const fresh = document.querySelector(`[data-editor="${typing.dataset.editor}"]`);
    if (fresh) {
      typing.querySelector('.editor-source').innerHTML = fresh.querySelector('.editor-source').innerHTML;
      typing.querySelector('[data-reset]').disabled = fresh.querySelector('[data-reset]').disabled;
      fresh.replaceWith(typing);
      typingInput.focus();
      try { if (caret != null) typingInput.setSelectionRange(caret, caret); } catch { /* number inputs have no selection API */ }
    }
  }
}

function renderTables() {
  const keys = [
    ...state.rows.map((r) => `lca:${r.category}`),
    ...(isRepair() ? state.rows.flatMap((r) => [`share:${r.category}`, `repairKg:${r.category}`]) : ['replacementPct']),
    'carPct', 'trips', 'km', 'carEf',
    ...state.rows.map((r) => `itemsPerTrip:${r.category}`),
    'opEf',
  ];
  const rows = keys.map((key) => {
    const f = field(key);
    const { d, c } = spec(key);
    return `<tr><td>${d.label(c)}</td><td class="num">${d.chip(f.value)}</td><td><span class="kindtag"><span class="mark mark--${f.kind}"></span>${kindName(f.kind)}</span></td><td>${provenanceText(f)}</td></tr>`;
  }).join('');
  $('src-table').innerHTML = `<thead><tr><th>Vad</th><th>Värde</th><th>Typ</th><th>Ursprung</th></tr></thead><tbody>${rows}</tbody>`;

  $('cat-table').innerHTML = `<thead><tr><th>Kategori</th><th>Typiskt värde</th><th>Källornas spann</th><th>Typ</th><th>Per besök</th></tr></thead><tbody>${
    CATEGORIES.map((c) => `<tr><td>${c.plural}</td><td class="num">${num(c.lca.value)} kg</td><td class="num">${num(c.lca.low)}–${num(c.lca.high)} kg</td><td><span class="kindtag"><span class="mark mark--${c.lca.kind}"></span>${kindName(c.lca.kind)}</span></td><td class="num">${num(c.itemsPerTrip.value)}</td></tr>`).join('')
  }</tbody>`;
}

function kindName(kind) {
  return { source: 'Källa', assumption: 'Antagande', user: 'Ditt värde', example: 'Exempelvärde' }[kind];
}

// ---------- Interaction in the steps ----------

$('steps').addEventListener('click', (e) => {
  const chipEl = e.target.closest('.chip');
  if (chipEl) {
    openField = openField === chipEl.dataset.field ? null : chipEl.dataset.field;
    render();
    document.querySelector(`[data-editor="${openField}"] input`)?.focus();
    return;
  }
  const reset = e.target.closest('[data-reset]');
  if (reset) {
    const key = reset.dataset.reset;
    delete state.overrides[key]; render();
    document.querySelector(`[data-editor="${key}"] input`)?.focus();
    return;
  }
  const close = e.target.closest('[data-close]');
  if (close) {
    const key = close.dataset.close;
    openField = null; render();
    document.querySelector(`.chip[data-field="${key}"]`)?.focus();
  }
});

$('steps').addEventListener('change', (e) => {
  const t = e.target.closest('[data-toggle]');
  if (!t) return;
  state[t.dataset.toggle] = t.checked;
  render();
  document.querySelector(`[data-toggle="${t.dataset.toggle}"]`)?.focus();
});

$('steps').addEventListener('input', (e) => {
  const ed = e.target.closest('[data-editor]');
  if (!ed) return;
  const key = ed.dataset.editor;
  const msg = ed.querySelector('.editor-msg');
  if (e.target.validity?.badInput) return; // mid-number, like "1." on its way to "1.9"
  const err = problem(key, e.target.value);
  if (err) { msg.textContent = err; return; }
  state.overrides[key] = Number(e.target.value);
  msg.textContent = '';
  render();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !openField) return;
  const key = openField;
  openField = null; render();
  document.querySelector(`.chip[data-field="${key}"]`)?.focus();
});

// ---------- Chart tooltip ----------

const tip = $('tooltip');
$('bars').addEventListener('pointermove', (e) => {
  const r = e.target.closest('[data-tip]');
  if (!r) { tip.classList.remove('is-on'); return; }
  tip.textContent = r.dataset.tip;
  tip.style.left = `${Math.min(e.clientX + 14, innerWidth - 270)}px`;
  tip.style.top = `${e.clientY + 16}px`;
  tip.classList.add('is-on');
});
$('bars').addEventListener('pointerleave', () => tip.classList.remove('is-on'));

// ---------- Copy ----------

function plainText() {
  const res = calculate(inputs());
  const src = (key) => {
    const x = field(key);
    if (x.kind === 'user') return 'eget värde';
    if (x.kind === 'source' && x.def.sources?.length) return `källa: ${x.def.sources.map((q) => `${q.org} ${q.year}, ${q.url}`).join('; ')}`;
    if (x.kind === 'assumption') return 'antagande i metoden';
    return 'exempelvärde utan källa';
  };
  const f = (key) => field(key).value;
  const L = [];
  L.push(`CCC, Circular Consumption Calculator: ${res.rows.map((r) => `${r.count.toLocaleString('sv-SE')} ${catById[r.category].plural}`).join(', ')} som ${METHODS[state.method].label}`);
  L.push(`Netto: ${res.net < 0 ? `${mass(-res.net)} koldioxidekvivalenter mer än om ingenting hade cirkulerats` : `${mass(res.net)} koldioxidekvivalenter som inte släpptes ut`}.`);
  L.push(basisSentence(false));
  L.push('');
  L.push('1. Om allt hade köpts nytt:');
  for (const r of res.rows) L.push(`   ${r.count.toLocaleString('sv-SE')} ${catById[r.category].plural} × ${num(r.lca)} kg (${src(`lca:${r.category}`)}) = ${mass(r.potential)}`);
  let n = 2;
  if (isRepair()) {
    L.push(`${n++}. Andel lagningar som ersätter ett nyköp:`);
    for (const r of res.rows) L.push(`   ${catById[r.category].plural}: ${num(r.replacementPct)} % (${src(`share:${r.category}`)}) = ${mass(r.avoided)}`);
    L.push(`   Undvikna utsläpp: ${mass(res.avoided)}. Bara lagningar som blev klara räknas.`);
    L.push(`${n++}. Själva lagningen:`);
    for (const r of res.rows) L.push(`   ${r.count.toLocaleString('sv-SE')} ${catById[r.category].plural} × ${num(r.repairKg)} kg (${src(`repairKg:${r.category}`)}) = ${mass(r.repair)}`);
  } else {
    L.push(`${n++}. Andel som ersätter ett nyköp: ${num(f('replacementPct'))} % (${src('replacementPct')}). Undvikna utsläpp: ${mass(res.avoided)}`);
  }
  if (state.transportOn) {
    L.push(`${n}. Resor: ${num(f('carPct'))} % med bil (${src('carPct')}), ${num(f('trips'))} enkelresor per besök (${src('trips')}), ${num(f('km'))} km (${src('km')}), ${num(f('carEf'))} kg per km (${src('carEf')}) = ${num(res.perTripKg)} kg per besök.`);
    for (const r of res.rows) L.push(`   ${catById[r.category].plural}: ${num(r.itemsPerTrip)} per besök (${src(`itemsPerTrip:${r.category}`)}), ${num(r.visits)} besök`);
    L.push(`   ${num(res.visits)} besök × ${num(res.perTripKg)} kg = ${mass(res.transportKg)}`);
  } else L.push(`${n}. Resor: inte medräknade.`);
  n++;
  if (state.opsOn) L.push(`${n}. Drift: ${num(f('opEf'))} kg per styck (${src('opEf')}). Avdrag: ${mass(res.opsKg)}`);
  else L.push(`${n}. Drift: inte medräknad.`);
  L.push('');
  L.push(`Resor och drift räknas bara för den del som inte ersätter ett nyköp.${isRepair() ? ' Själva lagningen räknas för varje lagning.' : ''}`);
  L.push(`Uträkningen: ${linkForState()}`);
  return L.join('\n');
}

let toastTimer;
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
}

async function copy(text, done) {
  try { await navigator.clipboard.writeText(text); toast(done); }
  catch { toast('Det gick inte att kopiera. Markera texten och kopiera för hand.'); }
}
$('btn-copy').addEventListener('click', () => copy(plainText(), 'Uträkningen är kopierad'));
$('btn-link').addEventListener('click', () => copy(linkForState(), 'Länken är kopierad'));

// ---------- Sticky net line ----------

const sticky = $('stickysum');
new IntersectionObserver(([entry]) => {
  const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
  sticky.classList.toggle('is-on', past);
}).observe(document.querySelector('.result'));

try {
  readUrl();
  fillSentence();
  // Shown before the first render, so the chart can measure its own width.
  // is-broken too: an unrelated error (an extension, say) during loading must
  // not leave the failure message above a working calculator.
  document.documentElement.classList.remove('is-pending', 'is-broken');
  render();
} catch (err) {
  document.documentElement.classList.add('is-pending', 'is-broken');
  throw err;
}
document.fonts?.ready.then(sizeSlots);
let resizeTimer;
addEventListener('resize', () => {
  sizeSlots();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderBars(calculate(inputs())), 120);
});

import { CATEGORIES, METHODS, SHARED } from './factors.js';
import { calculate, num, mass, massRange } from './calc.js';

const $ = (id) => document.getElementById(id);
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
  // The Myrorna figure is measured for clothes only; for anything else it is an assumption.
  opEf: { label: () => 'Driftens utsläpp per föremål', unit: 'kg', get: () => (state.rows.every((r) => r.category === 'klader') ? SHARED.opEfPerItem : SHARED.opEfPerItemOther), chip: (v) => `${num(v)} kg`, min: 0, max: 10000, step: 0.1 },
};

// Editable numbers that differ per product type.
const ROW_FIELDS = {
  lca: { label: (c) => `Utsläpp från ${c.singular}`, unit: 'kg koldioxidekvivalenter', get: (c) => c.lca, chip: (v) => `${num(v)} kg`, min: 0, max: 100000, step: 'any' },
  itemsPerTrip: { label: (c) => `${cap(c.plural)} per besök`, unit: 'st', get: (c) => c.itemsPerTrip, chip: (v) => num(v), min: 0.1, max: 1000, step: 0.5 },
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
function problem(key, raw) {
  const { d } = spec(key);
  if (!d) return 'Okänt fält.';
  const v = Number(raw);
  if (raw === '' || raw == null || !Number.isFinite(v) || v < d.min || v > d.max) {
    return `Skriv ett tal från ${num(d.min)} till ${num(d.max)}.`;
  }
  return '';
}

function parseCount(raw) {
  if (raw == null || raw === '') return null;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= 1 && n <= MAX_COUNT ? n : null;
}

function rowInputs(lcaOf = (row) => field(`lca:${row.category}`).value) {
  return state.rows.map((row) => ({
    category: row.category,
    count: row.count,
    lca: lcaOf(row),
    itemsPerTrip: field(`itemsPerTrip:${row.category}`).value,
  }));
}

function inputs(lcaOf) {
  return {
    rows: rowInputs(lcaOf),
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
// the user typed is their own and does not move.
function spanOfResult() {
  const end = (which) => calculate(inputs((row) => {
    const key = `lca:${row.category}`;
    return Object.hasOwn(state.overrides, key) ? state.overrides[key] : catById[row.category].lca[which];
  })).net;
  return { low: end('low'), high: end('high') };
}

// ---------- URL: a calculation is a link ----------

const URL_KEYS = { replacementPct: 'r', carPct: 'bil', trips: 'resor', km: 'km', carEf: 'ef', opEf: 'drift' };
const ROW_URL = { lca: 'kg', itemsPerTrip: 'per' };

function readUrl() {
  const q = new URLSearchParams(location.search);
  const rows = [];
  for (const part of (q.get('rader') ?? '').split(',')) {
    const [id, n] = part.split('.');
    const count = parseCount(n);
    if (Object.hasOwn(catById, id ?? '') && count && !rows.some((r) => r.category === id)) rows.push({ category: id, count });
  }
  // Links from the first version carried one product as vad + antal.
  if (!rows.length && Object.hasOwn(catById, q.get('vad') ?? '')) rows.push({ category: q.get('vad'), count: parseCount(q.get('antal')) ?? 1200 });
  if (rows.length) state.rows = rows;
  if (Object.hasOwn(METHODS, q.get('hur') ?? '')) state.method = q.get('hur');
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
  if (e.target.tagName !== 'SELECT' || !state.rows[i]) return;
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

  const span = spanOfResult();
  const typed = state.rows.every((r) => Object.hasOwn(state.overrides, `lca:${r.category}`));
  const one = state.rows.length === 1 ? catById[state.rows[0].category] : null;
  $('out-note').innerHTML = typed
    ? 'Uträkningen bygger på era egna värden för utsläppen från nya produkter.'
    : `Uträkningen utgår från ${one ? `ett typiskt värde för ${one.singular}` : 'ett typiskt värde för varje sorts produkt'}. Med källornas lägsta och högsta värden blir nettot <strong>${massRange(span.low, span.high)}</strong>. Vet ni mer om era produkter, ändra värdet i steg 1.`;

  const neg = $('out-negative');
  neg.hidden = res.net >= 0;
  if (res.net < 0) neg.textContent = 'Resorna och driften ger mer utsläpp än de nyköp som undveks. Titta på antagandena om bil och avstånd, eller räkna utan driften om den redan finns av andra skäl.';
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
  { key: 'rest', label: 'Ersätter inte ett nyköp', color: 'var(--mark-rest)' },
];

function renderBars(res) {
  $('flow-intro').textContent = `Stapeln är hela nyttan om alla ${res.count.toLocaleString('sv-SE')} ${things(res.count)} hade ersatt ett nyköp. Färgerna visar hur stor del som blir kvar och vart resten tar vägen.${res.net < 0 ? ' Nettot är negativt, så det finns ingen grön del: resor och drift kostar mer än det som undveks, och stapeln blir längre än nyttan.' : ''}`;
  $('legend').innerHTML = SEGMENTS.map((s) => `<li><span class="swatch" style="background:${s.color}"></span>${s.label}</li>`).join('');
  const parts = (res.net >= 0
    ? [['net', res.net], ['trip', res.transportKg], ['ops', res.opsKg], ['rest', res.notReplacingLost]]
    : [['trip', res.transportKg], ['ops', res.opsKg], ['rest', res.notReplacingLost]]).filter(([, v]) => v > 0);
  const width = $('bars').clientWidth || 600;
  const gap = 2;
  const scale = Math.max(1, parts.reduce((a, [, v]) => a + v, 0));
  const cost = res.transportKg + res.opsKg;
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
      <p>${res.net >= 0 ? `Netto <b>${mass(res.net)}</b>` : `Netto minus <b>${mass(-res.net)}</b>`} av möjliga ${mass(res.potential)}.${cost > 0 ? ` Resor och drift drar bort ${mass(cost)}${res.avoided > 0 ? `, ${pct(cost, res.avoided)} av det som undveks` : ''}.` : ''}</p>
      <svg role="img" viewBox="0 0 ${width} 28" aria-label="Netto ${mass(res.net)}, resor ${mass(res.transportKg)}, drift ${mass(res.opsKg)}, ersätter inte ett nyköp ${mass(res.notReplacingLost)}">${rects}</svg>
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
    {
      title: 'Men alla ersätter inte ett nyköp',
      body: `<p class="equation">${chip('replacementPct')} av ${total} ${things(res.count)}${op('=')}${num(res.replacing)} som ersätter ett nyköp</p>
        <p class="equation">${mass(res.potential)}${op('×')}${num(field('replacementPct').value)} %${op('=')}${res$(mass(res.avoided))} undvikna utsläpp</p>
        <details class="why"><summary>Varför inte alla?</summary><p>Begagnat är billigare, så en del köps som annars aldrig hade köpts. En del lånas en gång för att det går, fast behovet hade kunnat vänta. Metodens utgångsläge är att hälften ersätter ett nyköp. Vet ni mer om era besökare, ändra andelen.</p></details>`,
      editors: ['replacementPct'],
    },
    {
      title: 'Resorna till och från',
      off: !state.transportOn,
      body: `<label class="switch"><input type="checkbox" data-toggle="transportOn" ${state.transportOn ? 'checked' : ''}> Räkna med resorna</label>
        <p class="equation">${chip('carPct')} åker bil${op('×')}${chip('trips')}${op('×')}${chip('km')}${op('×')}${chip('carEf')}${op('=')}${num(res.perTripKg)} kg per besök</p>
        <p class="equation">${visitTerms}${op('=')}${num(res.visits)} besök</p>
        <p class="equation">${num(res.visits)} besök${op('×')}${num(res.perTripKg)} kg${op('=')}${res$(mass(res.transportKg))}</p>
        <details class="why"><summary>Varför bara för dem som inte ersätter ett nyköp?</summary><p>Den som hade köpt nytt i stället hade också åkt till en butik. Resan tillkommer bara när köpet, hyran eller lånet inte ersatte något. Flera saker som hämtas vid samma besök delar på resan.</p></details>`,
      editors: ['carPct', 'trips', 'km', 'carEf', ...perKeys],
    },
    {
      title: 'Driften av butiken eller utlåningen',
      off: !state.opsOn,
      body: `<label class="switch"><input type="checkbox" data-toggle="opsOn" ${state.opsOn ? 'checked' : ''}> Räkna med driften</label>
        <p class="equation">${num(res.notReplacing)} ${things(res.notReplacing)} som inte ersätter ett nyköp${op('×')}${chip('opEf')} per styck${op('=')}${res$(mass(res.opsKg))}</p>
        <p>Lokal, värme och el. Samma resonemang som för resorna: bara den del som inte ersätter ett nyköp räknas som ett tillskott.</p>`,
      editors: ['opEf'],
    },
    {
      total: true,
      title: 'Netto',
      body: `<p class="equation">${mass(res.avoided)}${op('−')}${mass(res.transportKg)}${op('−')}${mass(res.opsKg)}${op('=')}${res$(mass(res.net))}</p>`,
    },
  ];

  const focused = document.activeElement?.closest?.('[data-editor]')?.dataset.editor;

  $('steps').innerHTML = steps.map((s) => `<li class="step${s.total ? ' step--total' : ''}${s.off ? ' is-off' : ''}">
      <div class="step-body"><h3>${s.title}</h3>${s.body}${(s.editors ?? []).map(editor).join('')}</div>
    </li>`).join('');

  // Keep the caret in the editor the user is typing in.
  if (focused) {
    const el = document.querySelector(`[data-editor="${focused}"] input`);
    if (el) { const v = el.value; el.focus(); el.value = ''; el.value = v; }
  }
}

function renderTables() {
  const keys = [
    ...state.rows.map((r) => `lca:${r.category}`),
    'replacementPct', 'carPct', 'trips', 'km', 'carEf',
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
  const span = spanOfResult();
  const L = [];
  L.push(`CCC, Circular Consumption Calculator: ${res.rows.map((r) => `${r.count.toLocaleString('sv-SE')} ${catById[r.category].plural}`).join(', ')} som ${METHODS[state.method].label}`);
  L.push(`Netto: ${mass(res.net)} koldioxidekvivalenter som inte släpptes ut. Med källornas lägsta och högsta värden: ${massRange(span.low, span.high)}.`);
  L.push('');
  L.push('1. Om allt hade köpts nytt:');
  for (const r of res.rows) L.push(`   ${r.count.toLocaleString('sv-SE')} ${catById[r.category].plural} × ${num(r.lca)} kg (${src(`lca:${r.category}`)}) = ${mass(r.potential)}`);
  L.push(`2. Andel som ersätter ett nyköp: ${num(f('replacementPct'))} % (${src('replacementPct')}). Undvikna utsläpp: ${mass(res.avoided)}`);
  if (state.transportOn) {
    L.push(`3. Resor: ${num(f('carPct'))} % med bil (${src('carPct')}), ${num(f('trips'))} enkelresor per besök (${src('trips')}), ${num(f('km'))} km (${src('km')}), ${num(f('carEf'))} kg per km (${src('carEf')}) = ${num(res.perTripKg)} kg per besök.`);
    for (const r of res.rows) L.push(`   ${catById[r.category].plural}: ${num(r.itemsPerTrip)} per besök (${src(`itemsPerTrip:${r.category}`)}), ${num(r.visits)} besök`);
    L.push(`   ${num(res.visits)} besök × ${num(res.perTripKg)} kg = ${mass(res.transportKg)}`);
  } else L.push('3. Resor: inte medräknade.');
  if (state.opsOn) L.push(`4. Drift: ${num(f('opEf'))} kg per styck (${src('opEf')}). Avdrag: ${mass(res.opsKg)}`);
  else L.push('4. Drift: inte medräknad.');
  L.push('');
  L.push('Resor och drift räknas bara för den del som inte ersätter ett nyköp.');
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

readUrl();
fillSentence();
render();
document.fonts?.ready.then(sizeSlots);
let resizeTimer;
addEventListener('resize', () => {
  sizeSlots();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderBars(calculate(inputs())), 120);
});

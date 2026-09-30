import { CATEGORIES, METHODS, SHARED } from './factors.js';
import { calculate, num, mass, massRange } from './calc.js';

const $ = (id) => document.getElementById(id);
const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// ---------- State ----------

const state = {
  count: 1200,
  category: 'klader',
  method: 'secondhand',
  transportOn: true,
  opsOn: true,
  overrides: {}, // field -> value (or {low, high} for lca) the user typed
};

// Every editable number. `get` returns the default and its provenance for the
// current selection; overrides win over it and flip the kind to 'user'.
const FIELDS = {
  lca: {
    label: () => `Utsläpp från ${cat().singular}`,
    unit: 'kg koldioxidekvivalenter',
    range: true,
    get: () => ({ value: { low: cat().lca.low, high: cat().lca.high }, ...cat().lca }),
    chip: (v) => `${num(v.low)}–${num(v.high)} kg`,
    min: 0,
  },
  replacementPct: { label: () => 'Andel som ersätter ett nyköp', unit: '%', get: () => SHARED.replacementShare, chip: (v) => `${num(v)} %`, min: 0, max: 100 },
  carPct: { label: () => 'Andel av besöken som görs med bil', unit: '%', get: () => SHARED.carShare, chip: (v) => `${num(v)} %`, min: 0, max: 100 },
  trips: { label: () => 'Enkelresor per cirkulering', unit: 'resor', get: () => METHODS[state.method].tripsPerCirculation, chip: (v) => `${num(v)} ${v === 1 ? 'resa' : 'resor'}`, min: 0 },
  km: { label: () => 'Avstånd en väg', unit: 'km', get: () => SHARED.kmPerTrip, chip: (v) => `${num(v)} km`, min: 0 },
  carEf: { label: () => 'Utsläpp per bilkilometer', unit: 'kg per km', get: () => SHARED.carEf, chip: (v) => `${num(v)} kg per km`, min: 0, step: 0.01 },
  itemsPerTrip: { label: () => 'Föremål per besök', unit: 'st', get: () => cat().itemsPerTrip, chip: (v) => `${num(v)} föremål`, min: 0.1, step: 0.5 },
  opEf: { label: () => 'Driftens utsläpp per föremål', unit: 'kg', get: () => SHARED.opEfPerItem, chip: (v) => `${num(v)} kg`, min: 0, step: 0.1 },
};

function cat() { return catById[state.category]; }

function field(name) {
  const def = FIELDS[name].get();
  const has = Object.prototype.hasOwnProperty.call(state.overrides, name);
  return {
    value: has ? state.overrides[name] : def.value,
    kind: has ? 'user' : def.kind,
    def,
  };
}

function inputs() {
  const lca = field('lca').value;
  return {
    count: state.count,
    lcaLow: lca.low,
    lcaHigh: lca.high,
    replacementPct: field('replacementPct').value,
    transportOn: state.transportOn,
    carPct: field('carPct').value,
    trips: field('trips').value,
    km: field('km').value,
    carEf: field('carEf').value,
    itemsPerTrip: field('itemsPerTrip').value,
    opsOn: state.opsOn,
    opEf: field('opEf').value,
  };
}

// ---------- URL: a calculation is a link ----------

const URL_KEYS = { lca: ['lo', 'hi'], replacementPct: 'r', carPct: 'bil', trips: 'resor', km: 'km', carEf: 'ef', itemsPerTrip: 'per', opEf: 'drift' };

function readUrl() {
  const q = new URLSearchParams(location.search);
  if (catById[q.get('vad')]) state.category = q.get('vad');
  if (METHODS[q.get('hur')]) state.method = q.get('hur');
  const n = Number(q.get('antal'));
  if (Number.isFinite(n) && n > 0) state.count = Math.round(n);
  if (q.get('resor_med') === '0') state.transportOn = false;
  if (q.get('drift_med') === '0') state.opsOn = false;
  const lo = Number(q.get('lo')); const hi = Number(q.get('hi'));
  if (q.has('lo') && q.has('hi') && lo >= 0 && hi >= lo) state.overrides.lca = { low: lo, high: hi };
  for (const [name, key] of Object.entries(URL_KEYS)) {
    if (name === 'lca' || !q.has(key)) continue;
    const v = Number(q.get(key));
    if (Number.isFinite(v) && v >= 0) state.overrides[name] = v;
  }
}

function linkForState() {
  const q = new URLSearchParams({ vad: state.category, hur: state.method, antal: String(state.count) });
  if (!state.transportOn) q.set('resor_med', '0');
  if (!state.opsOn) q.set('drift_med', '0');
  for (const [name, v] of Object.entries(state.overrides)) {
    if (name === 'lca') { q.set('lo', v.low); q.set('hi', v.high); } else q.set(URL_KEYS[name], v);
  }
  return `${location.origin}${location.pathname}?${q}`;
}

// ---------- The sentence ----------

const inCount = $('in-count');
const inCat = $('in-cat');
const inMethod = $('in-method');

function fillSentence() {
  inCat.innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.plural}</option>`).join('');
  inMethod.innerHTML = Object.values(METHODS).map((m) => `<option value="${m.id}">${m.label}</option>`).join('');
  inCount.value = state.count;
  inCat.value = state.category;
  inMethod.value = state.method;
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
  const em = parseFloat(getComputedStyle(inCount).fontSize);
  inCount.style.width = `${textWidth(inCount, String(inCount.value || '0')) + em * 0.2}px`;
  for (const sel of [inCat, inMethod]) {
    const text = sel.options[sel.selectedIndex]?.text ?? '';
    sel.style.width = `${textWidth(sel, text) + em * 0.72}px`;
  }
}

inCount.addEventListener('input', () => {
  const n = Math.round(Number(inCount.value));
  if (Number.isFinite(n) && n > 0) { state.count = n; render(); }
  sizeSlots();
});
inCat.addEventListener('change', () => {
  state.category = inCat.value;
  delete state.overrides.lca; // a range typed for chairs says nothing about phones
  delete state.overrides.itemsPerTrip;
  sizeSlots(); render();
});
inMethod.addEventListener('change', () => {
  state.method = inMethod.value;
  delete state.overrides.trips;
  sizeSlots(); render();
});

// ---------- Rendering ----------

let openField = null;

function chip(name) {
  const f = field(name);
  const d = FIELDS[name];
  const expanded = openField === name;
  return `<button type="button" class="chip" data-field="${name}" data-kind="${f.kind}" aria-expanded="${expanded}" aria-controls="editor-${name}" aria-label="${d.label()}: ${d.chip(f.value)}. Öppna för källa och ändra.">${d.chip(f.value)}</button>`;
}

function editor(name) {
  const f = field(name);
  const d = FIELDS[name];
  const hidden = openField === name ? '' : 'hidden';
  const step = d.step ?? 1;
  const inputsHtml = d.range
    ? `<span>Lågt<input type="number" data-part="low" min="${d.min}" step="any" value="${f.value.low}"></span>
       <span>Högt<input type="number" data-part="high" min="${d.min}" step="any" value="${f.value.high}"></span>`
    : `<span>${d.unit}<input type="number" min="${d.min}" ${d.max != null ? `max="${d.max}"` : ''} step="${step}" value="${f.value}"></span>`;
  return `<div class="editor" id="editor-${name}" data-editor="${name}" ${hidden}>
    <label>${d.label()}${d.range ? `, ${d.unit}` : ''}</label>
    <div class="editor-fields">${inputsHtml}</div>
    <p class="editor-msg" role="alert"></p>
    <p class="editor-source">${provenanceText(f)}</p>
    <div class="editor-actions">
      <button type="button" class="btn" data-reset="${name}" ${f.kind === 'user' ? '' : 'disabled'}>Återställ</button>
      <button type="button" class="btn btn--solid" data-close="${name}">Klar</button>
    </div>
  </div>`;
}

function provenanceText(f) {
  const def = f.def;
  const base = (() => {
    if (def.kind === 'source' && def.sources?.length) {
      const list = def.sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>, ${s.org} ${s.year}`).join('; ');
      return `<span class="kind">${def.sources.length > 1 ? 'Källor' : 'Källa'}:</span> ${list}.${def.note ? ` ${def.note}` : ''}`;
    }
    if (def.kind === 'assumption') return `<span class="kind">Antagande i metoden.</span> ${def.why ?? ''}`;
    return `<span class="kind">Exempelvärde.</span> Här ska en källa in innan verktyget publiceras.${def.why ? ` ${def.why}` : ''}`;
  })();
  if (f.kind === 'user') return `<span class="kind">Du har ändrat värdet.</span> Utgångsläget var ${fmtDefault(def)}. ${base}`;
  return base;
}
function fmtDefault(def) {
  return typeof def.value === 'object' ? `${num(def.value.low)}–${num(def.value.high)}` : num(def.value);
}

function render() {
  const res = calculate(inputs());
  renderResult(res);
  renderBars(res);
  renderSteps(res);
  renderTables();
  $('sticky-figure').textContent = massRange(res.low.net, res.high.net);
  // The address bar always holds the calculation on screen, without piling up history.
  history.replaceState(null, '', linkForState());
}

function renderResult(res) {
  const c = cat();
  const lca = field('lca').value;
  const [figure, unit] = splitUnit(massRange(res.low.net, res.high.net));
  $('out-figure').innerHTML = `${figure}<span class="unit">${unit}</span>`;
  $('out-note').innerHTML = `Spannet finns för att ${c.singular} ger allt från <strong>${num(lca.low)}</strong> till <strong>${num(lca.high)} kg</strong>, beroende på vad det är. Vi räknar med båda ändarna hela vägen, i stället för ett snitt som döljer osäkerheten.`;
  const neg = $('out-negative');
  if (res.low.net < 0) {
    neg.hidden = false;
    neg.textContent = res.high.net < 0
      ? 'Resorna och driften ger mer utsläpp än de nyköp som undveks. Titta på antagandena om bil och avstånd, eller räkna utan driften om den redan finns av andra skäl.'
      : 'Lågt räknat blir nettot negativt: resorna och driften väger tyngre än de nyköp som undveks.';
  } else neg.hidden = true;
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
  const c = cat();
  $('flow-intro').textContent = `Varje stapel är hela nyttan om alla ${state.count.toLocaleString('sv-SE')} ${c.plural} hade ersatt ett nyköp. Färgerna visar hur stor del som blir kvar och vart resten tar vägen.`;
  $('legend').innerHTML = SEGMENTS.map((s) => `<li><span class="swatch" style="background:${s.color}"></span>${s.label}</li>`).join('');
  const lca = field('lca').value;
  const rows = [
    [`Lågt räknat, ${num(lca.low)} kg per ny`, res.low],
    [`Högt räknat, ${num(lca.high)} kg per ny`, res.high],
  ];
  // Part-to-whole: each bar is its own scenario's potential. The absolute
  // figures are in the row text, so the two scenarios stay comparable.
  const partsOf = (s) => (s.net >= 0
    ? [['net', s.net], ['trip', res.transportKg], ['ops', res.opsKg], ['rest', s.notReplacingLost]]
    : [['trip', res.transportKg], ['ops', res.opsKg], ['rest', s.notReplacingLost]]);
  const width = $('bars').clientWidth || 600;
  const gap = 2;
  const cost = res.transportKg + res.opsKg;
  $('bars').innerHTML = rows.map(([name, s]) => {
    const scale = Math.max(1, partsOf(s).reduce((a, [, v]) => a + v, 0));
    const visible = partsOf(s).filter(([, v]) => v > 0);
    let x = 0;
    const rects = visible.map(([key, v], i) => {
      const seg = SEGMENTS.find((q) => q.key === key);
      const full = (v / scale) * width;
      const last = i === visible.length - 1;
      // A 2px surface gap between touching segments; a sliver still shows as 1px.
      const w = Math.max(1, full - (last ? 0 : gap));
      const d = last ? roundedEnd(x, 2, w, 24, Math.min(4, w)) : `M${x},2h${w}v24h${-w}z`;
      x += full;
      return `<path data-tip="${seg.label}: ${mass(v)}" d="${d}" fill="${seg.color}"></path>`;
    }).join('');
    return `<div class="bar-row">
      <p><b>${name}:</b> ${s.net >= 0 ? `netto ${mass(s.net)}` : `netto minus ${mass(-s.net)}`} av möjliga ${mass(s.potential)}.${cost > 0 ? ` Resor och drift drar bort ${mass(cost)}, ${pct(cost, s.avoided)} av det som undveks.` : ''}</p>
      <svg role="img" viewBox="0 0 ${width} 28" aria-label="${name}: netto ${mass(s.net)}, resor ${mass(res.transportKg)}, drift ${mass(res.opsKg)}, ersätter inte ett nyköp ${mass(s.notReplacingLost)}">${rects}</svg>
    </div>`;
  }).join('');
}

// Square at the baseline, 4px rounded at the data end.
function roundedEnd(x, y, w, h, r) {
  return `M${x},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(w - r)}z`;
}

function renderSteps(res) {
  const c = cat();
  const f = (n) => field(n).value;
  const count = state.count.toLocaleString('sv-SE');
  const repl = res.replacing;
  const notRepl = res.notReplacing;
  const Singular = c.singular[0].toUpperCase() + c.singular.slice(1);

  const steps = [
    {
      name: 'lca',
      title: `Utsläppen från ${c.singular}`,
      body: `<p class="equation">${Singular} ger ${chip('lca')} koldioxidekvivalenter.</p>
        <p>${c.spread}</p>`,
      editors: ['lca'],
    },
    {
      title: `Om varje cirkulering ersatte ett nyköp`,
      body: `<p class="equation">${count} <span class="op">×</span> ${massRange(res.low.lca, res.high.lca)} <span class="op">=</span> <span class="res">${massRange(res.low.potential, res.high.potential)}</span></p>
        <p>Det här är den största möjliga nyttan. Den förutsätter att alla ${c.plural} hade köpts nya annars.</p>`,
    },
    {
      title: 'Men alla ersätter inte ett nyköp',
      body: `<p class="equation">${chip('replacementPct')} av ${count} <span class="op">=</span> ${num(repl)} ${c.plural} som ersätter ett nyköp</p>
        <p class="equation">${num(repl)} <span class="op">×</span> ${massRange(res.low.lca, res.high.lca)} <span class="op">=</span> <span class="res">${massRange(res.low.avoided, res.high.avoided)}</span> undvikna utsläpp</p>
        <details class="why"><summary>Varför inte alla?</summary><p>Begagnat är billigare, så en del köps som annars aldrig hade köpts. En del lånas en gång för att det går, fast behovet hade kunnat vänta. Metodens utgångsläge är att hälften ersätter ett nyköp. Vet ni mer om era besökare, ändra andelen.</p></details>`,
      editors: ['replacementPct'],
    },
    {
      name: 'transport',
      title: 'Resorna till och från',
      off: !state.transportOn,
      body: `<label class="switch"><input type="checkbox" data-toggle="transportOn" ${state.transportOn ? 'checked' : ''}> Räkna med resorna</label>
        <p class="equation">${chip('carPct')} åker bil <span class="op">×</span> ${chip('trips')} <span class="op">×</span> ${chip('km')} <span class="op">×</span> ${chip('carEf')} <span class="op">=</span> ${num(res.perTripKg)} kg per besök</p>
        <p class="equation">${num(notRepl)} som inte ersätter ett nyköp <span class="op">×</span> ${num(res.perTripKg)} kg <span class="op">÷</span> ${chip('itemsPerTrip')} per besök <span class="op">=</span> <span class="res">${mass(res.transportKg)}</span></p>
        <details class="why"><summary>Varför bara för dem som inte ersätter ett nyköp?</summary><p>Den som hade köpt nytt i stället hade också åkt till en butik. Resan tillkommer bara när köpet, hyran eller lånet inte ersatte något.</p></details>`,
      editors: ['carPct', 'trips', 'km', 'carEf', 'itemsPerTrip'],
    },
    {
      name: 'ops',
      title: 'Driften av butiken eller utlåningen',
      off: !state.opsOn,
      body: `<label class="switch"><input type="checkbox" data-toggle="opsOn" ${state.opsOn ? 'checked' : ''}> Räkna med driften</label>
        <p class="equation">${num(notRepl)} <span class="op">×</span> ${chip('opEf')} per föremål <span class="op">=</span> <span class="res">${mass(res.opsKg)}</span></p>
        <p>Lokal, värme och el. Samma resonemang som för resorna: bara den del som inte ersätter ett nyköp räknas som ett tillskott.</p>`,
      editors: ['opEf'],
    },
    {
      total: true,
      title: 'Netto',
      body: `<p class="equation">${massRange(res.low.avoided, res.high.avoided)} <span class="op">−</span> ${mass(res.transportKg)} <span class="op">−</span> ${mass(res.opsKg)} <span class="op">=</span> <span class="res">${massRange(res.low.net, res.high.net)}</span></p>`,
    },
  ];

  const focused = document.activeElement?.closest?.('[data-editor]')?.dataset.editor;
  const focusSel = focused ? (document.activeElement.dataset.part ?? 'single') : null;

  $('steps').innerHTML = steps.map((s) => `<li class="step${s.total ? ' step--total' : ''}${s.off ? ' is-off' : ''}">
      <div class="step-body"><h3>${s.title}</h3>${s.body}${(s.editors ?? []).map(editor).join('')}</div>
    </li>`).join('');

  // Keep the caret in the editor the user is typing in.
  if (focused) {
    const ed = document.querySelector(`[data-editor="${focused}"]`);
    const el = focusSel === 'single' ? ed?.querySelector('input') : ed?.querySelector(`input[data-part="${focusSel}"]`);
    if (el) { const v = el.value; el.focus(); el.value = ''; el.value = v; }
  }
}

function renderTables() {
  const rows = ['lca', 'replacementPct', 'carPct', 'trips', 'km', 'carEf', 'itemsPerTrip', 'opEf'].map((name) => {
    const f = field(name);
    const d = FIELDS[name];
    return `<tr><td>${d.label()}</td><td class="num">${d.chip(f.value)}</td><td><span class="kindtag"><span class="mark mark--${f.kind}"></span>${kindName(f.kind)}</span></td><td>${provenanceText(f)}</td></tr>`;
  }).join('');
  $('src-table').innerHTML = `<thead><tr><th>Vad</th><th>Värde</th><th>Typ</th><th>Ursprung</th></tr></thead><tbody>${rows}</tbody>`;

  $('cat-table').innerHTML = `<thead><tr><th>Kategori</th><th>Lågt</th><th>Högt</th><th>Typ</th><th>Föremål per besök</th></tr></thead><tbody>${
    CATEGORIES.map((c) => `<tr><td>${c.plural}</td><td class="num">${num(c.lca.low)} kg</td><td class="num">${num(c.lca.high)} kg</td><td><span class="kindtag"><span class="mark mark--${c.lca.kind}"></span>${kindName(c.lca.kind)}</span></td><td class="num">${num(c.itemsPerTrip.value)}</td></tr>`).join('')
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
    const ed = document.querySelector(`[data-editor="${openField}"] input`);
    ed?.focus();
    return;
  }
  const reset = e.target.closest('[data-reset]');
  if (reset) { delete state.overrides[reset.dataset.reset]; render(); return; }
  const close = e.target.closest('[data-close]');
  if (close) {
    const name = close.dataset.close;
    openField = null; render();
    document.querySelector(`.chip[data-field="${name}"]`)?.focus();
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
  const name = ed.dataset.editor;
  const d = FIELDS[name];
  const msg = ed.querySelector('.editor-msg');
  if (d.range) {
    const low = Number(ed.querySelector('[data-part="low"]').value);
    const high = Number(ed.querySelector('[data-part="high"]').value);
    if (!(low >= 0) || !(high >= 0)) { msg.textContent = 'Skriv ett tal som är noll eller större.'; return; }
    if (low > high) { msg.textContent = 'Det låga värdet kan inte vara högre än det höga.'; return; }
    state.overrides[name] = { low, high };
  } else {
    const v = Number(e.target.value);
    if (e.target.value === '' || !Number.isFinite(v) || v < d.min) { msg.textContent = `Skriv ett tal från ${num(d.min)} och uppåt.`; return; }
    if (d.max != null && v > d.max) { msg.textContent = `Högst ${num(d.max)} ${d.unit}.`; return; }
    state.overrides[name] = v;
  }
  msg.textContent = '';
  render();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !openField) return;
  const name = openField;
  openField = null; render();
  document.querySelector(`.chip[data-field="${name}"]`)?.focus();
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
  const c = cat();
  const f = (n) => field(n);
  const src = (n) => {
    const x = f(n);
    if (x.kind === 'user') return 'eget värde';
    if (x.kind === 'source' && x.def.sources?.length) return `källa: ${x.def.sources.map((q) => `${q.org} ${q.year}, ${q.url}`).join('; ')}`;
    if (x.kind === 'assumption') return 'antagande i metoden';
    return 'exempelvärde utan källa';
  };
  const L = [];
  L.push(`Klimatnyttan av cirkulär konsumtion: ${state.count.toLocaleString('sv-SE')} ${c.plural} som ${METHODS[state.method].label}`);
  L.push(`Netto: ${massRange(res.low.net, res.high.net)} koldioxidekvivalenter som inte släpptes ut.`);
  L.push('');
  L.push(`1. Utsläpp från ${c.singular}: ${FIELDS.lca.chip(f('lca').value)} (${src('lca')})`);
  L.push(`2. Om alla ersatte ett nyköp: ${massRange(res.low.potential, res.high.potential)}`);
  L.push(`3. Andel som ersätter ett nyköp: ${num(f('replacementPct').value)} % (${src('replacementPct')}). Undvikna utsläpp: ${massRange(res.low.avoided, res.high.avoided)}`);
  if (state.transportOn) {
    L.push(`4. Resor: ${num(f('carPct').value)} % med bil (${src('carPct')}), ${num(f('trips').value)} enkelresor (${src('trips')}), ${num(f('km').value)} km (${src('km')}), ${num(f('carEf').value)} kg per km (${src('carEf')}), ${num(f('itemsPerTrip').value)} föremål per besök (${src('itemsPerTrip')}). Avdrag: ${mass(res.transportKg)}`);
  } else L.push('4. Resor: inte medräknade.');
  if (state.opsOn) L.push(`5. Drift: ${num(f('opEf').value)} kg per föremål (${src('opEf')}). Avdrag: ${mass(res.opsKg)}`);
  else L.push('5. Drift: inte medräknad.');
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

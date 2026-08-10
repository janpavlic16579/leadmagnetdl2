/**
 * Iz questionnaire.json zgradi interaktivno HTML aplikacijo: en velik diagram
 * celotnega vprašalnika (pan/zoom) z iskanjem, filtri, gostoto prikaza in
 * klikanjem po povezavah med triažo in moduli.
 *
 * Pognati: node build-diagram.mjs  (iz scratchpad mape)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const data = JSON.parse(readFileSync(new URL('./questionnaire.json', import.meta.url), 'utf8'));

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Zloži šumnike in male črke — isti postopek teče ob iskanju v brskalniku. */
const fold = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();

const KIND_LABEL = {
  number: 'številka',
  slider: 'drsnik',
  percent: 'odstotek',
  choice: 'izbira',
  checkbox: 'kljukica',
};

const BUCKET_LABEL = {
  directLoss: 'neposredna izguba',
  capacity: 'kapaciteta',
  oneTimeCapital: 'enkratni kapital',
  risk: 'tveganje',
};

const TYPE_LABEL = {
  core: 'panožno',
  horizontal: 'horizontalno',
  diagnostic: 'diagnostika',
  'risk-costs': 'tvegani stroški',
};

const fmtEUR = (n) => n.toLocaleString('sl-SI');
const fmtDefault = (f) => {
  if (f.kind === 'percent') return `${(f.default * 100).toLocaleString('sl-SI')} %`;
  return String(f.default);
};

// ---------- gradniki ----------

let renderedFieldCount = 0;
let renderedTriageCount = 0;
let renderedContextCount = 0;

const chips = (items) => items.filter(Boolean).join('');
const chip = (text, cls = '') => `<span class="chip ${cls}">${esc(text)}</span>`;

function choiceList(choices, opts = {}) {
  const items = choices
    .map((c) => {
      const cls = [c.unknown ? 'unk' : '', opts.defValue === c.value ? 'def' : ''].join(' ').trim();
      const extra = c.extra ? ` <span class="ce">${esc(c.extra)}</span>` : '';
      return `<li${cls ? ` class="${cls}"` : ''}><span class="v">${esc(c.value)}</span>${esc(c.label)}${extra}</li>`;
    })
    .join('');
  return `<ul class="opts">${items}</ul>`;
}

/** Eno podrobno vprašanje modula (polje). */
function fieldHtml(f, segId, modId) {
  renderedFieldCount += 1;
  const meta = chips([
    chip(KIND_LABEL[f.kind] ?? f.kind),
    f.unit ? chip(f.unit) : '',
    f.kind !== 'choice' && f.kind !== 'checkbox' ? chip(`privzeto ${fmtDefault(f)}`) : '',
    f.min !== undefined && f.max !== undefined ? chip(`razpon ${f.min}–${f.max}`) : '',
    f.contextOnly ? chip('ne vpliva na izračun', 'ctx') : '',
  ]);
  const hay = fold(
    [f.key, f.label, f.help ?? '', KIND_LABEL[f.kind], f.unit ?? '', ...(f.choices ?? []).map((c) => c.label)].join(' '),
  );
  return `<div class="q" data-s="${esc(hay)}" data-seg="${esc(segId)}" data-mod="${esc(modId)}" data-key="${esc(f.key)}" data-kind="${esc(f.kind)}"${f.contextOnly ? ' data-ctx="1"' : ''}>
<div class="qh"><code class="qk">${esc(f.key)}</code><span class="ql">${esc(f.label)}</span></div>
<div class="qm">${meta}</div>
${f.help ? `<p class="qhelp">${esc(f.help)}</p>` : ''}
${f.choices ? choiceList(f.choices, { defValue: f.kind === 'choice' ? f.default : undefined }) : ''}
</div>`;
}

/** Triažni blok enega modula znotraj škatle Koraka 4. */
function triageBlock(segId, mod, isDefault) {
  renderedTriageCount += 1;
  const hay = fold([mod.title, mod.id, mod.triage.prompt, ...mod.triage.options.map((o) => o.label)].join(' '));
  return `<div class="tq t-${mod.type}" id="t-${segId}-${mod.id}" data-s="${esc(hay)}" data-seg="${esc(segId)}" data-mod="${esc(mod.id)}" data-type="${esc(mod.type)}" role="button" tabindex="0" aria-label="Triažno vprašanje za področje ${esc(mod.title)} — pokaži pripadajoča podrobna vprašanja">
<div class="tq-top"><span class="tq-mod">${esc(mod.title)}</span>${isDefault ? chip('privzeto izbran', 'def') : ''}<span class="tq-go">odklene modul ↓</span></div>
<p class="tq-p">${esc(mod.triage.prompt)}</p>
${choiceList(mod.triage.options)}
</div>`;
}

function contextQuestion(key, legend, options, segId, mapOption) {
  renderedContextCount += 1;
  const hay = fold([key, legend, ...options.map((o) => o.label + ' ' + o.id)].join(' '));
  return `<div class="q" data-s="${esc(hay)}" data-seg="${esc(segId)}" data-key="${esc(key)}">
<div class="qh"><code class="qk">${esc(key)}</code><span class="ql">${esc(legend)}</span></div>
<ul class="opts">${options
    .map((o) => {
      const m = mapOption ? mapOption(o) : {};
      return `<li${m.cls ? ` class="${m.cls}"` : ''}><span class="v">${esc(o.id)}</span>${esc(o.label)}${
        m.extra ? ` <span class="ce">${esc(m.extra)}</span>` : ''
      }</li>`;
    })
    .join('')}</ul>
</div>`;
}

function costQuestion(key, q, segId) {
  renderedContextCount += 1;
  const hay = fold([key, q.label, q.help, ...q.bands.map((b) => b.label)].join(' '));
  return `<div class="q" data-s="${esc(hay)}" data-seg="${esc(segId)}" data-key="${esc(key)}">
<div class="qh"><code class="qk">${esc(key)}</code><span class="ql">${esc(q.label)}</span></div>
<div class="qm">${chips([chip(`prazno → ${fmtEUR(q.fallbackEUR)} EUR`), chip('vnos ali razpon')])}</div>
<p class="qhelp">${esc(q.help)}</p>
<ul class="opts">${q.bands
    .map((b) => `<li><span class="v">${esc(b.id)}</span>${esc(b.label)} <span class="ce">sredina ${fmtEUR(b.midpointEUR)} EUR</span></li>`)
    .join('')}</ul>
</div>`;
}

/** Škatla enega modula v Koraku 6. */
function moduleBox(segId, mod) {
  const gate =
    mod.type === 'diagnostic'
      ? chip('vpraša se vedno', 'gate')
      : mod.type === 'risk-costs'
        ? chip('samo uporabnikom PANTHEON', 'gate-hard')
        : chip('le če med izbranimi 3', 'gate');
  const bucketIds = [...new Set(mod.buckets.map((b) => b.bucket))];
  const bucketRow = mod.buckets.length
    ? `<div class="mbuckets">${mod.buckets
        .map(
          (b) =>
            `<span class="bk bk-${b.bucket}"><span class="dot d-${b.bucket}"></span>${esc(
              BUCKET_LABEL[b.bucket] ?? b.bucket,
            )} · ${esc(b.label)}</span>`,
        )
        .join('')}</div>`
    : `<div class="mbuckets"><span class="bk bk-none">brez vpliva na koše — samo opozorila z datumi</span></div>`;
  const hay = fold(
    [mod.title, mod.id, mod.summary, TYPE_LABEL[mod.type], ...mod.buckets.map((b) => BUCKET_LABEL[b.bucket] + ' ' + b.label)].join(' '),
  );
  const back = mod.triage
    ? `<button class="mod-back" data-goto-triage="${esc(segId)}|${esc(mod.id)}">↑ triažno vprašanje</button>`
    : '';
  return `<div class="mod t-${mod.type}" id="m-${segId}-${mod.id}" data-s="${esc(hay)}" data-seg="${esc(segId)}" data-mod="${esc(mod.id)}" data-type="${esc(mod.type)}" data-buckets="${esc(bucketIds.join(' '))}" data-fields="${mod.fields.length}">
<div class="mod-h">
<div class="mod-chips">${chip(TYPE_LABEL[mod.type], `mt-${mod.type}`)}<code class="qk">${esc(mod.id)}</code>${chip(`${mod.fields.length} polj`)}${gate}${back}</div>
<h4>${esc(mod.title)}</h4>
<p class="msum">${esc(mod.summary)}</p>
</div>
${mod.fields.map((f) => fieldHtml(f, segId, mod.id)).join('')}
${bucketRow}
</div>`;
}

// ---------- stolpec segmenta ----------

/**
 * Koliko vprašanj vidi en obiskovalec: kontekst + vse triažne ocene + urne postavke
 * + polja treh izbranih področij + področja, ki se vprašajo vedno (diagnostika, E).
 * Za izbrana tri se vzame najslabši primer — tri področja z največ polji.
 */
function visitorQuestionCount(seg) {
  const triageable = seg.modules.filter((m) => m.triage);
  const top3Fields = triageable
    .map((m) => m.fields.length)
    .sort((a, b) => b - a)
    .slice(0, seg.triage?.recommendedCount ?? 3)
    .reduce((a, n) => a + n, 0);
  return (
    3 +
    triageable.length +
    2 +
    (seg.context.chargeOutRate ? 1 : 0) +
    top3Fields +
    seg.modules.filter((m) => !m.triage).reduce((a, m) => a + m.fields.length, 0)
  );
}

function segmentColumn(seg, idx) {
  const ctx = seg.context;
  const triageable = seg.modules.filter((m) => m.triage);
  const defaults = seg.triage?.defaultIds ?? triageable.slice(0, seg.triage?.recommendedCount ?? 3).map((m) => m.id);
  const provenance = [
    ...data.industries.filter((i) => i.segment === seg.id && i.id !== 'drugo').map((i) => i.label),
    ...data.drugoSubs.filter((i) => i.segment === seg.id).map((i) => `»${i.label}«`),
  ];
  if (seg.id === 'splosno') provenance.push('neznana dejavnost (varovalo)');
  const visitorCount = visitorQuestionCount(seg);
  const totalFields = seg.modules.reduce((a, m) => a + m.fields.length, 0);

  const header = `<div class="seghead" id="col-${seg.id}">
<div class="seg-eyebrow">Segment ${idx + 1} od ${data.segments.length} · <code>${esc(seg.id)}</code></div>
<h3>${esc(seg.displayName)}</h3>
<p class="story">„${esc(seg.headlineStory)}"</p>
<div class="prov">${provenance.map((p) => chip(p, 'prov')).join('')}</div>
<div class="segfacts">${chips([
    chip(`${seg.modules.length} modulov`),
    chip(`${triageable.length} triažnih ocen`),
    chip(`${totalFields} polj`),
    chip(`obiskovalec odgovori na ≈${visitorCount}`),
    seg.highLossThresholdEUR ? chip(`prag visoke izgube ${fmtEUR(seg.highLossThresholdEUR)} EUR`) : '',
  ])}</div>
</div>`;

  const k3 = `<div class="box step" id="k3-${seg.id}">
<div class="step-k">Korak 3 · Kontekst</div>
<h4>${esc(ctx.title)}</h4>
<p class="intro">${esc(ctx.intro)}</p>
${contextQuestion('businessType', ctx.businessType.legend, ctx.businessType.options, seg.id)}
${contextQuestion('currentSystem', ctx.currentSystem.legend, ctx.currentSystem.options, seg.id, (o) => ({
    extra: `pas izboljšave ${Math.round(o.band.min * 100)}–${Math.round(o.band.max * 100)} %${o.isPantheon ? ' · PANTHEON' : ''}`,
    cls: o.isPantheon ? 'pantheon' : '',
  }))}
${contextQuestion('role', ctx.role.legend, ctx.role.options, seg.id)}
<p class="note">Odgovor o sistemu določi pas izboljšave in ali se pokaže modul »Tvegani stroški«; v formule modulov ne vstopa.</p>
</div>`;

  const k4 = `<div class="box step" id="k4-${seg.id}">
<div class="step-k">Korak 4 · Triaža — „Kje vas najbolj tišči?"</div>
<p class="intro">Vsako od ${triageable.length} področij ocenite z eno oceno 0–3. Podrobna vprašanja v Koraku 6 dobijo le tri področja z najvišjo oceno (izbiro lahko ročno spremenite; ob izenačenju imajo prednost ${seg.triage?.defaultIds ? 'privzeta področja' : 'prva po vrstnem redu'}). Kliknite področje, da vidite, katera vprašanja odklene.</p>
${triageable.map((m) => triageBlock(seg.id, m, defaults.includes(m.id))).join('')}
</div>`;

  const k5 = `<div class="box step" id="k5-${seg.id}">
<div class="step-k">Korak 5 · Skupna finančna osnova</div>
<p class="intro">${esc(ctx.costBasisIntro)}</p>
${costQuestion('operationalHour', ctx.operationalHour, seg.id)}
${costQuestion('adminHour', ctx.adminHour, seg.id)}
${ctx.chargeOutRate ? costQuestion('chargeOutRate', ctx.chargeOutRate, seg.id) : ''}
</div>`;

  const k6 = `<div class="k6" id="k6-${seg.id}">
<div class="k6-h box step" id="k6h-${seg.id}"><div class="step-k">Korak 6 · Vaše številke</div>
<p class="intro">Prikažejo se: tri izbrana področja iz triaže + kratka diagnostika (vedno) + tvegani stroški (le PANTHEON). Vsa polja na eni strani, s sprotnim seštevkom.</p></div>
${seg.modules.map((m) => moduleBox(seg.id, m)).join('')}
</div>`;

  return `<div class="col" id="segcol-${seg.id}" data-seg="${esc(seg.id)}">${header}${k3}${k4}${k5}${k6}</div>`;
}

// ---------- deblo in zaključek ----------

function spineHtml() {
  const k1 = `<div class="box step spine-box" id="k1">
<div class="step-k">Korak 1 · Dejavnost</div>
<h4>${esc(data.industryQuestion)}</h4>
<p class="intro">Spustni seznam; »Drugo« ni odgovor, ampak vrata do podvprašanja. Kampanjska povezava <code>?s=segment</code> tu le prednastavi dejavnost — koraka ne preskoči.</p>
<ul class="opts opts-col">${data.industries
    .map(
      (i) =>
        `<li${i.id === 'drugo' ? ' class="drugo"' : ''}><span class="v">${esc(i.id)}</span>${esc(i.label)} <span class="ce">→ ${esc(
          i.id === 'drugo' ? 'podvprašanje' : i.segment,
        )}</span></li>`,
    )
    .join('')}</ul>
</div>`;
  const drugo = `<div class="box step spine-box" id="k1b">
<div class="step-k">Korak 1b · samo ob izbiri »Drugo«</div>
<h4>${esc(data.subIndustryQuestion)}</h4>
<p class="intro">Vprašanje po poslovnem modelu, ne po panogi — gradbinec ali agencija se tu prepoznata kot storitveno-projektno podjetje.</p>
<ul class="opts opts-col">${data.drugoSubs
    .map((i) => `<li><span class="v">${esc(i.id)}</span>${esc(i.label)} <span class="ce">→ ${esc(i.segment)}</span></li>`)
    .join('')}</ul>
</div>`;
  const k2 = `<div class="box step spine-box" id="k2">
<div class="step-k">Korak 2 · Velikost</div>
<h4>${esc(data.employeeQuestion)}</h4>
<div class="qm">${chips([chip('številka'), chip('> 0'), chip('ne vstopa v formule', 'ctx')])}</div>
<p class="intro">Določa le velikostni razred in oceno primernosti stranke (ICP) v prodajnem paketu.</p>
</div>`;
  return `<div class="spine"><div class="spine-row">${k1}${drugo}</div>${k2}</div>`;
}

function tailHtml() {
  const emailFields = [
    ['firstName', 'Ime', 'obvezno'],
    ['lastName', 'Priimek', 'obvezno'],
    ['company', 'Ime podjetja', 'obvezno'],
    ['email', 'E-naslov', 'obvezno'],
    ['phone', 'Telefon', 'neobvezno'],
    ['taxNumber', 'Davčna številka', 'neobvezno'],
  ];
  const consents = [
    ['consentProcessing', 'Soglasje za obdelavo podatkov', 'obvezno'],
    ['consentOffers', 'Soglasje za ponudbe', 'neobvezno'],
    ['consentContent', 'Soglasje za vsebine', 'neobvezno'],
  ];
  const slim = (k, l, req, kind) =>
    `<div class="q" data-s="${esc(fold(k + ' ' + l + ' ' + req))}" data-key="${esc(k)}"><div class="qh"><code class="qk">${k}</code><span class="ql">${l}</span></div><div class="qm">${chip(kind)}${chip(req, req === 'obvezno' ? 'req' : '')}</div></div>`;
  return `<div class="tail">
<div class="box step tail-box" id="k7">
<div class="step-k">Korak 7 · Rezultati</div>
<h4>Zneski, potencial in tveganja</h4>
<p class="intro">Seštevek po štirih koših — ista postavka šteje le v enem. Neposredna izguba + kapaciteta letno; enkratni kapital ločeno; tveganja brez zneska. Potencial = naslovljivi delež × pas izboljšave sistema. Razdelek »Česa nismo izmerili« našteje preskočena področja in jih pusti doračunati.</p>
<div class="mbuckets">
<span class="bk bk-directLoss"><span class="dot d-directLoss"></span>neposredna izguba — denar odteka</span>
<span class="bk bk-capacity"><span class="dot d-capacity"></span>kapaciteta — izgubljene ure</span>
<span class="bk bk-oneTimeCapital"><span class="dot d-oneTimeCapital"></span>enkratni kapital — vezan denar</span>
<span class="bk bk-risk"><span class="dot d-risk"></span>tveganje — brez zneska</span>
</div>
</div>
<div class="box step tail-box" id="gate">
<div class="step-k">Oddaja e-naslova · zadnja vprašanja</div>
<h4>Kontakt in soglasja</h4>
${emailFields.map(([k, l, r]) => slim(k, l, r, 'besedilo')).join('')}
${consents.map(([k, l, r]) => slim(k, l, r, 'kljukica')).join('')}
</div>
<div class="tail-outs">
<div class="box step out-box" id="pdf1"><div class="step-k">Izhod 1</div><h4>PDF za stranko</h4><p class="intro">Rezultati, metodologija in akcijski načrt za največjo postavko.</p></div>
<div class="box step out-box" id="pdf2"><div class="step-k">Izhod 2</div><h4>Prodajni paket (PDF + HTML)</h4><p class="intro">Vsi odgovori, triažne ocene, ICP-ocena A/B/C, playbook in predlog nadaljevanja.</p></div>
</div>
</div>`;
}

// ---------- levi rob z orodji ----------

function railHtml() {
  const segBtns = data.segments
    .map(
      (s) =>
        `<button class="f" data-f="seg" data-v="${esc(s.id)}" aria-pressed="true">${esc(s.displayName.split(/[ —]/)[0])}</button>`,
    )
    .join('');
  const typeBtns = Object.entries(TYPE_LABEL)
    .map(([id, label]) => `<button class="f ft-${id}" data-f="type" data-v="${esc(id)}" aria-pressed="true">${esc(label)}</button>`)
    .join('');
  const bucketBtns = Object.entries(BUCKET_LABEL)
    .map(
      ([id, label]) =>
        `<button class="f" data-f="bucket" data-v="${esc(id)}" aria-pressed="true"><span class="dot d-${id}"></span>${esc(label)}</button>`,
    )
    .join('');
  const outline = data.segments
    .map(
      (s) => `<details><summary>${esc(s.displayName)}</summary>
<button class="ol" data-goto="col-${esc(s.id)}">Glava segmenta</button>
<button class="ol" data-goto="k3-${esc(s.id)}">Korak 3 · kontekst</button>
<button class="ol" data-goto="k4-${esc(s.id)}">Korak 4 · triaža</button>
<button class="ol" data-goto="k5-${esc(s.id)}">Korak 5 · urne postavke</button>
${s.modules.map((m) => `<button class="ol ol-${m.type}" data-goto="m-${esc(s.id)}-${esc(m.id)}">${esc(m.title)}</button>`).join('')}
</details>`,
    )
    .join('');
  return `<aside id="rail" aria-label="Orodja">
<div class="rail-in">
<div class="rgrp">
<label class="rlab" for="search">Iskanje po vseh vprašanjih</label>
<div class="searchwrap"><input id="search" type="search" placeholder="npr. izmet, zaloge, mainCause…" autocomplete="off" spellcheck="false"><button id="clearq" aria-label="Počisti iskanje" hidden>×</button></div>
<p class="rcount" id="rcount" aria-live="polite">Iščite po besedilu vprašanja, ključu ali odgovoru.</p>
<div class="hitnav" id="hitnav" hidden><button id="prevhit" aria-label="Prejšnji zadetek">↑</button><span id="hitpos">—</span><button id="nexthit" aria-label="Naslednji zadetek">↓</button></div>
</div>
<div class="rgrp"><div class="rlab">Gostota prikaza</div>
<div class="seg3" role="group" aria-label="Gostota prikaza">
<button class="d" data-d="map" aria-pressed="false">Zemljevid</button>
<button class="d" data-d="q" aria-pressed="false">Vprašanja</button>
<button class="d" data-d="all" aria-pressed="true">Vse</button>
</div></div>
<div class="rgrp"><div class="rlab">Segment</div><div class="fset">${segBtns}</div></div>
<div class="rgrp"><div class="rlab">Vrsta področja</div><div class="fset">${typeBtns}</div></div>
<div class="rgrp"><div class="rlab">Vrača v koš</div><div class="fset">${bucketBtns}</div>
<label class="chkline"><input type="checkbox" id="hidectx"> skrij polja, ki ne vplivajo na izračun</label></div>
<div class="rgrp"><button id="reset" class="wide">Ponastavi vse</button></div>
<div class="rgrp"><div class="rlab">Tema</div>
<div class="seg3" role="group" aria-label="Tema">
<button class="t" data-t="system" aria-pressed="true">Sistem</button>
<button class="t" data-t="light" aria-pressed="false">Svetlo</button>
<button class="t" data-t="dark" aria-pressed="false">Temno</button>
</div></div>
<div class="rgrp"><div class="rlab">Kazalo</div><div class="outline">${outline}</div></div>
<div class="rgrp khelp"><div class="rlab">Tipkovnica</div>
<p><kbd>/</kbd> iskanje · <kbd>Esc</kbd> počisti · <kbd>Enter</kbd> naslednji zadetek · <kbd>+</kbd> <kbd>−</kbd> zoom · <kbd>0</kbd> celota</p></div>
</div></aside>`;
}

// ---------- sestava strani ----------

const totals = (() => {
  const uniq = new Map();
  for (const s of data.segments) for (const m of s.modules) if (!uniq.has(m.id)) uniq.set(m.id, m);
  const uniqFields = [...uniq.values()].reduce((a, m) => a + m.fields.length, 0);
  const uniqTriage = [...uniq.values()].filter((m) => m.triage).length;
  const ctxCount = data.segments.reduce((a, s) => a + 3 + 2 + (s.context.chargeOutRate ? 1 : 0), 0);
  const visitor = data.segments.map(visitorQuestionCount);
  return {
    segments: data.segments.length,
    modules: uniq.size,
    uniqFields,
    uniqTriage,
    ctxCount,
    total: uniqFields + uniqTriage + ctxCount,
    visitorMin: Math.min(...visitor),
    visitorMax: Math.max(...visitor),
  };
})();

const columnsHtml = data.segments.map((s, i) => segmentColumn(s, i)).join('');

/**
 * Barvni žetoni. Zapisani so enkrat in vstavljeni v vse selektorje spodaj — prej so
 * bili štirikrat prepisani na roko in ob dodajanju `--canvas` jih je bilo treba
 * popravljati s skripto. Nabora morata imeti enaka imena spremenljivk; to preveri
 * kontrola ob koncu gradnje.
 */
const LIGHT_TOKENS = `
 --paper:#F7F9FB; --canvas:#E9EEF4; --surface:#FFFFFF; --surface-2:#F1F5F9;
 --ink:#0E1620; --muted:#59677A; --faint:#8695A8;
 --line:#DFE5EC; --line-strong:#C6D0DB;
 --accent:#14618E; --accent-soft:#E4EFF7;
 --horizon:#8F5D0F; --horizon-soft:#FBF0DC;
 --loss:#A03A2B; --cap:#14618E; --capital:#5A4A87; --risk:#63707F;
 --wire:#9FB0C0; --wire-strong:#59677A;
 --hit:#B8860B; --hit-soft:#FBF0DC;
 color-scheme:light;`;

const DARK_TOKENS = `
 --paper:#0B1016; --canvas:#070B10; --surface:#121A22; --surface-2:#18222C;
 --ink:#DDE5EC; --muted:#8C9BAB; --faint:#6B7B8C;
 --line:#233040; --line-strong:#33465A;
 --accent:#5BA9DC; --accent-soft:#12293A;
 --horizon:#DBA850; --horizon-soft:#2A2113;
 --loss:#E08272; --cap:#5BA9DC; --capital:#A695D6; --risk:#93A2B2;
 --wire:#33465A; --wire-strong:#8C9BAB;
 --hit:#DBA850; --hit-soft:#2A2113;
 color-scheme:dark;`;

const FONT_TOKENS = `
 --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
 --sans:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;`;

/**
 * Vrstni red pravil je pomemben. Pregledovalnik artefakta odtisne `data-theme` in ga ob
 * menjavi svoje teme prepiše; izbira, narejena v karti, piše `data-user-theme` in stoji
 * ZADNJA, zato pri enaki specifičnosti prevlada — brez prepiranja s pregledovalnikom.
 */
const THEME_CSS = `:root{${LIGHT_TOKENS}${FONT_TOKENS}
}
@media (prefers-color-scheme:dark){:root{${DARK_TOKENS}
}}
:root[data-theme="dark"]{${DARK_TOKENS}
}
:root[data-theme="light"]{${LIGHT_TOKENS}
}
:root[data-user-theme="dark"]{${DARK_TOKENS}
}
:root[data-user-theme="light"]{${LIGHT_TOKENS}
}`;

// Razglasitev kodiranja mora biti prva: brskalnik ga ugotavlja s predbranjem surovih
// bajtov in mora nanjo naleteti PRED prvim nešumniškim znakom. Brez tega se stran,
// ki je ne postreže strežnik z glavo charset (file:// ali Vitejev dev strežnik),
// bere kot windows-1252 in vsi šumniki razpadejo.
//
// Skript za temo stoji pred blokom <style>, da je atribut odtisnjen še pred prvim
// izrisom — sicer bi ob nalaganju bliskala napačna tema.
const html = `<meta charset="utf-8">
<title>Vprašalnik kalkulatorja — interaktivna karta</title>
<script>
try{var t=localStorage.getItem('karta-vprasalnika-tema');
if(t==='dark'||t==='light')document.documentElement.dataset.userTheme=t;}catch(e){}
</script>
<style>
${THEME_CSS}
*{box-sizing:border-box}
[hidden]{display:none!important}
html,body{height:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);
 font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;overflow:hidden;
 display:flex;flex-direction:column}
code{font-family:var(--mono);font-size:.92em}
kbd{font-family:var(--mono);font-size:10.5px;border:1px solid var(--line-strong);border-bottom-width:2px;
 border-radius:4px;padding:1px 4px;color:var(--muted);background:var(--surface-2)}

/* ---- glava ---- */
header.top{flex:0 0 auto;border-bottom:1px solid var(--line);background:var(--paper);
 padding:10px 18px;display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;z-index:6}
.title h1{font-size:16px;margin:0;font-weight:650;letter-spacing:-.01em}
.title .sub{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.stats{display:flex;gap:13px;font-variant-numeric:tabular-nums}
.stats span{font-size:12.5px;color:var(--muted);white-space:nowrap}
.stats b{color:var(--ink);font-weight:650}
.stats .shown{padding-left:13px;border-left:1px solid var(--line-strong);color:var(--faint)}
.stats .shown b{color:var(--accent)}
.legendbar{display:flex;flex-wrap:wrap;gap:9px;font-size:11.5px;color:var(--muted);align-items:center}
.legendbar .sw{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}
.controls{margin-left:auto;display:flex;gap:6px;align-items:center}
.controls button,#rail button{font-family:var(--mono);font-size:11px;letter-spacing:.04em;color:var(--muted);
 background:var(--surface);border:1px solid var(--line-strong);border-radius:5px;padding:5px 9px;cursor:pointer}
.controls button:hover,#rail button:hover{color:var(--accent);border-color:var(--accent)}
.controls .zl{font-family:var(--mono);font-size:11px;color:var(--faint);min-width:44px;text-align:center}

/* ---- ogrodje ---- */
#main{flex:1 1 auto;display:flex;min-height:0}
#rail{flex:0 0 292px;border-right:1px solid var(--line);background:var(--surface);
 overflow-y:auto;overscroll-behavior:contain}
body.norail #rail{display:none}
.rail-in{padding:14px 16px 40px;display:flex;flex-direction:column;gap:18px}
.rgrp{display:flex;flex-direction:column;gap:7px}
.rlab{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.searchwrap{position:relative;display:flex}
#search{flex:1;font-family:var(--sans);font-size:13.5px;color:var(--ink);background:var(--surface-2);
 border:1px solid var(--line-strong);border-radius:6px;padding:8px 30px 8px 10px;width:100%}
#search::placeholder{color:var(--faint)}
#clearq{position:absolute;right:4px;top:4px;border:0;background:transparent;font-size:16px;padding:2px 6px;color:var(--faint)}
.rcount{font-size:12px;color:var(--muted);margin:0}
.rcount.none{color:var(--loss)}
.hitnav{display:flex;gap:6px;align-items:center;font-family:var(--mono);font-size:11px;color:var(--muted)}
.hitnav span{min-width:60px;text-align:center;font-variant-numeric:tabular-nums}
.fset{display:flex;flex-wrap:wrap;gap:5px}
#rail button.f,#rail button.d,#rail button.t{text-transform:none;font-family:var(--sans);font-size:12px;letter-spacing:0;
 display:inline-flex;align-items:center;gap:5px}
#rail button.f[aria-pressed="false"],#rail button.d[aria-pressed="false"],
#rail button.t[aria-pressed="false"]{opacity:.42;background:transparent}
#rail button.f[aria-pressed="true"]{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
#rail button.ft-horizontal[aria-pressed="true"]{border-color:var(--horizon);color:var(--horizon);background:var(--horizon-soft)}
.seg3{display:flex;gap:0}
.seg3 button{border-radius:0;flex:1;justify-content:center}
.seg3 button:first-child{border-radius:5px 0 0 5px}
.seg3 button:last-child{border-radius:0 5px 5px 0}
.seg3 button+button{border-left:0}
#rail button.d[aria-pressed="true"],#rail button.t[aria-pressed="true"]{color:var(--accent);border-color:var(--accent);background:var(--accent-soft);opacity:1}
.chkline{display:flex;gap:7px;align-items:center;font-size:12px;color:var(--muted);margin-top:3px;cursor:pointer}
#rail button.wide{width:100%;text-align:center}
.outline{display:flex;flex-direction:column;gap:2px}
.outline details{border-left:2px solid var(--line);padding-left:8px}
.outline summary{font-size:12.5px;color:var(--ink);cursor:pointer;padding:3px 0;font-weight:520}
#rail button.ol{display:block;width:100%;text-align:left;border:0;background:transparent;padding:3px 6px;
 font-family:var(--sans);font-size:12px;text-transform:none;letter-spacing:0;border-left:2px solid transparent}
#rail button.ol:hover{background:var(--surface-2);border-left-color:var(--accent)}
#rail button.ol-core{color:var(--accent)} #rail button.ol-horizontal{color:var(--horizon)}
.khelp p{font-size:11.5px;color:var(--faint);margin:0;line-height:2}

/* ---- platno ---- */
#viewport{flex:1 1 auto;position:relative;overflow:hidden;cursor:grab;touch-action:none;background:
 radial-gradient(circle at 1px 1px, var(--line-strong) 1px, transparent 0) 0 0/32px 32px var(--canvas)}
#viewport.dragging{cursor:grabbing}
/* --s je trenutni zoom. Vse ločnice se delijo z njim, zato ostanejo enako debele
   na zaslonu pri vsakem povečanju — sicer se skrčijo skupaj z vsebino in izginejo. */
#canvas{position:absolute;top:0;left:0;transform-origin:0 0;will-change:transform;--s:1;
 --hair:min(max(0px, calc(1.6px / var(--s) - 1px)), 26px)}
#wires{position:absolute;top:0;left:0;pointer-events:none;overflow:visible}
#wires path{fill:none;stroke:var(--wire);stroke-width:min(calc(2px / var(--s)),40px)}
#wires path.main{stroke:var(--wire-strong);stroke-width:min(calc(2.5px / var(--s)),50px)}
#wires path.tw{stroke-width:min(calc(1.6px / var(--s)),32px);opacity:.7;
 stroke-dasharray:min(calc(5px / var(--s)),100px) min(calc(5px / var(--s)),100px)}
#wires path.tw-core{stroke:var(--accent)}
#wires path.tw-horizontal{stroke:var(--horizon)}
#wires path.live{stroke:var(--hit);stroke-width:min(calc(3px / var(--s)),60px);opacity:1;stroke-dasharray:none}
#wires text{font-family:var(--mono);font-size:11px;fill:var(--muted)}
#empty{position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;padding:40px}
body.isempty #empty{display:flex}
#empty div{max-width:44ch;color:var(--muted)}

/* ---- razporeditev ---- */
.layout{position:relative;padding:80px}
.spine{display:flex;flex-direction:column;align-items:center;gap:130px;margin-bottom:190px}
.spine-row{display:flex;gap:170px;align-items:flex-start}
.columns{display:flex;gap:260px;align-items:flex-start}
.col{width:1150px;flex:0 0 auto;display:flex;flex-direction:column;gap:120px}
.tail{margin-top:190px;display:flex;flex-direction:column;align-items:center;gap:130px}
.tail-outs{display:flex;gap:170px}
.off{display:none!important}

/* ---- škatle ---- */
/* outline in ne border: ne vpliva na postavitev, zato se ob zoomiranju višine škatel
   ne spreminjajo in žice ostanejo pripete na iste točke. */
.box,.seghead,.mod{outline:var(--hair) solid var(--line-strong);outline-offset:0}
.box{background:var(--surface);border:1px solid var(--line-strong);border-radius:12px;padding:20px 24px;
 box-shadow:0 calc(1px / var(--s)) calc(4px / var(--s)) rgba(14,22,32,.10)}
.spine-box{width:640px}
.tail-box{width:760px}
.out-box{width:460px}
.step-k{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.box h4,.mod h4{font-size:16.5px;margin:0 0 6px;font-weight:650;letter-spacing:-.01em;text-wrap:balance}
.intro{font-size:13px;color:var(--muted);margin:0 0 12px;max-width:70ch}
.note{font-size:12px;color:var(--faint);margin:12px 0 0;border-top:1px dashed var(--line);padding-top:10px}

.seghead{border:1px solid var(--line-strong);border-radius:12px;padding:22px 26px;background:var(--surface)}
.seg-eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-bottom:6px}
.seghead h3{font-size:24px;margin:0 0 4px;font-weight:650;letter-spacing:-.015em}
.story{font-size:14.5px;color:var(--muted);font-style:italic;margin:0 0 12px}
.prov{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.segfacts{display:flex;flex-wrap:wrap;gap:6px}

/* ---- vprašanja ---- */
.q{padding:11px 0;border-top:1px solid var(--line);scroll-margin:80px}
.qh{display:flex;gap:9px;align-items:baseline;flex-wrap:wrap}
.qk{font-size:11px;color:var(--accent);white-space:nowrap}
.ql{font-weight:520;flex:1;min-width:220px}
.qm{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
.qhelp{font-size:12.5px;color:var(--muted);margin:5px 0 0;max-width:70ch}
.chip{display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:10px;
 letter-spacing:.05em;text-transform:uppercase;padding:2px 7px;border-radius:4px;
 border:1px solid var(--line-strong);color:var(--muted);white-space:nowrap}
.chip.ctx{border-style:dashed;color:var(--faint)}
.chip.def{color:var(--accent);border-color:var(--accent);background:var(--accent-soft)}
.chip.req{color:var(--loss);border-color:var(--loss)}
.chip.prov{color:var(--ink);background:var(--surface-2);text-transform:none;font-size:11px}
.chip.gate{color:var(--muted);border-style:dashed}
.chip.gate-hard{color:var(--horizon);border-color:var(--horizon);border-style:dashed}
.chip.mt-core{color:var(--accent);border-color:var(--accent);background:var(--accent-soft)}
.chip.mt-horizontal{color:var(--horizon);border-color:var(--horizon);background:var(--horizon-soft)}
.chip.mt-diagnostic,.chip.mt-risk-costs{color:var(--muted)}
.opts{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 0;padding:0;list-style:none}
.opts.opts-col{flex-direction:column;align-items:stretch}
.opts li{font-size:12.5px;border:1px solid var(--line);background:var(--surface-2);
 border-radius:4px;padding:3px 9px;color:var(--ink)}
.opts li .v{font-family:var(--mono);font-size:10px;color:var(--faint);margin-right:5px}
.opts li.unk{border-style:dashed;color:var(--muted)}
.opts li.def{border-color:var(--accent);background:var(--accent-soft)}
.opts li.drugo{border-color:var(--horizon);background:var(--horizon-soft)}
.opts li.pantheon{border-color:var(--accent)}
.ce{font-family:var(--mono);font-size:10px;color:var(--faint);white-space:nowrap}

/* ---- triaža ---- */
.tq{border:1px solid var(--line);border-radius:8px;--edge:var(--line-strong);
 box-shadow:inset calc(3px / var(--s)) 0 0 0 var(--edge);
 padding:12px 16px;margin-top:10px;background:var(--surface);cursor:pointer;scroll-margin:80px}
.tq.t-core{--edge:var(--accent)}
.tq.t-horizontal{--edge:var(--horizon)}
.tq:hover{border-color:var(--accent)}
.tq-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px}
.tq-mod{font-family:var(--mono);font-size:11px;letter-spacing:.05em;color:var(--muted);text-transform:uppercase}
.tq-go{font-family:var(--mono);font-size:10px;color:var(--faint);opacity:0;margin-left:auto}
.tq:hover .tq-go,.tq:focus-visible .tq-go{opacity:1}
.tq-p{margin:0;font-weight:520}

/* ---- moduli ---- */
.k6{display:flex;flex-direction:column;gap:64px}
.k6-h{padding:16px 24px 6px}
/* Barvni rob vrste področja je notranja senca in ne border: pri pomanjšanem pogledu
   ostane 4 px širok na zaslonu in je glavni znak, kakšne vrste je posamezen modul. */
.mod{background:var(--surface);border:1px solid var(--line-strong);border-radius:12px;overflow:hidden;
 padding:18px 24px 18px 28px;scroll-margin:80px;--edge:var(--line-strong);
 box-shadow:inset calc(4px / var(--s)) 0 0 0 var(--edge),
            0 calc(2px / var(--s)) calc(6px / var(--s)) rgba(14,22,32,.12)}
.mod.t-core{--edge:var(--accent)}
.mod.t-horizontal{--edge:var(--horizon)}
.mod-h{margin-bottom:6px}
.mod-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:7px;align-items:center}
.mod-back{font-family:var(--mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;
 color:var(--muted);background:transparent;border:1px dashed var(--line-strong);border-radius:4px;
 padding:2px 7px;cursor:pointer;margin-left:auto}
.mod-back:hover{color:var(--accent);border-color:var(--accent)}
.msum{font-size:12.5px;color:var(--muted);margin:0 0 8px;max-width:72ch}
.mbuckets{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;border-top:1px dashed var(--line);padding-top:12px}
.bk{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);
 border:1px solid var(--line);border-radius:4px;padding:3px 8px;background:var(--surface-2)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;flex:0 0 auto}
.d-directLoss{background:var(--loss)} .d-capacity{background:var(--cap)}
.d-oneTimeCapital{background:var(--capital)} .d-risk{background:var(--risk)}
.bk-none{border-style:dashed;color:var(--faint)}

/* ---- gostota ---- */
body.d-map .mod .q,body.d-map .mod .mbuckets,body.d-map .mod .msum,
body.d-map .box.step .q,body.d-map .tq .opts,body.d-map .box.step .note{display:none}
body.d-q .opts,body.d-q .qhelp,body.d-q .intro{display:none}

/* ---- iskanje in poudarki ---- */
.dim{opacity:.28}
.q.hit{background:var(--hit-soft);box-shadow:inset calc(3px / var(--s)) 0 0 0 var(--hit);border-radius:4px;padding-left:10px}
.tq.hit{background:var(--hit-soft);--edge:var(--hit)}
.mod.selfhit{border-color:var(--hit)}
.cur{outline:max(3px, calc(3px / var(--s))) solid var(--hit);outline-offset:calc(3px / var(--s));border-radius:6px}
.linked{outline:max(3px, calc(3px / var(--s))) solid var(--hit);outline-offset:calc(4px / var(--s))}
@keyframes flash{from{background:var(--hit-soft)}to{background:transparent}}
.flash{animation:flash 1.1s ease-out}

:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (max-width:900px){
 #rail{position:absolute;left:0;top:0;bottom:0;width:292px;z-index:7;box-shadow:0 0 24px rgba(0,0,0,.18)}
 body.norail #rail{display:none}
 .legendbar{display:none}
}
</style>

<header class="top">
<div class="title"><span class="sub">Kalkulator „Koliko vas stane sedanji način dela?"</span>
<h1>Vprašalnik od prve izbire do zadnjega vprašanja</h1></div>
<div class="stats">
<span><b>${totals.total}</b> unikatnih vprašanj</span>
<span><b>${totals.modules}</b> modulov v <b>${totals.segments}</b> segmentih</span>
<span>obiskovalec vidi <b>${totals.visitorMin}–${totals.visitorMax}</b></span>
<span class="shown">prikazano <b id="st-q">—</b> vprašanj · <b id="st-m">—</b> področij</span>
</div>
<div class="legendbar">
<span><span class="sw" style="background:var(--accent)"></span>panožno</span>
<span><span class="sw" style="background:var(--horizon)"></span>horizontalno</span>
<span><span class="dot d-directLoss"></span> izguba</span>
<span><span class="dot d-capacity"></span> kapaciteta</span>
<span><span class="dot d-oneTimeCapital"></span> kapital</span>
<span><span class="dot d-risk"></span> tveganje</span>
</div>
<div class="controls">
<button id="railtog" aria-pressed="true">Orodja</button>
<button id="zout" aria-label="Pomanjšaj">−</button>
<span class="zl" id="zlabel">100 %</span>
<button id="zin" aria-label="Povečaj">+</button>
<button id="zfit">Celota</button>
</div>
</header>

<div id="main">
${railHtml()}
<div id="viewport">
<div id="canvas">
<svg id="wires" aria-hidden="true">
<defs>
<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
<path d="M0 0 L10 5 L0 10 z" fill="var(--wire-strong)" stroke="none"></path>
</marker>
</defs>
<g id="wg"></g>
</svg>
<div class="layout" id="layout">
${spineHtml()}
<div class="columns" id="columns">${columnsHtml}</div>
${tailHtml()}
</div>
</div>
<div id="empty"><div><strong>Filtri ne pustijo nobenega področja.</strong><br>Popustite izbiro segmenta, vrste področja ali koša.<br><br><button id="reset2">Ponastavi vse</button></div></div>
</div>
</div>

<script>
(function(){
'use strict';
var viewport=document.getElementById('viewport');
var canvas=document.getElementById('canvas');
var wires=document.getElementById('wires');
var wg=document.getElementById('wg');
var layout=document.getElementById('layout');
var zlabel=document.getElementById('zlabel');
var search=document.getElementById('search');
var rcount=document.getElementById('rcount');
var hitnav=document.getElementById('hitnav');
var hitpos=document.getElementById('hitpos');

var COLS=[].slice.call(document.querySelectorAll('.col'));
var MODS=[].slice.call(document.querySelectorAll('.mod'));
var TQS=[].slice.call(document.querySelectorAll('.tq'));
var QS=[].slice.call(document.querySelectorAll('.q[data-s]'));
var TARGETS=[].slice.call(document.querySelectorAll('.mod,.tq,.q[data-s]'));
var SEGS=${JSON.stringify(data.segments.map((s) => s.id))};
var TYPES=['core','horizontal','diagnostic','risk-costs'];
var BUCKETS=['directLoss','capacity','oneTimeCapital','risk'];
/* Vprašanja se med segmenti ponavljajo: ${totals.total} jih je unikatnih, na platnu pa jih stoji več. */
var TOTALQ=QS.length,TOTALM=MODS.length;

var modByKey={};
MODS.forEach(function(m){modByKey[m.dataset.seg+'|'+m.dataset.mod]=m;});
QS.forEach(function(q){q._mod=q.closest('.mod');q._col=q.closest('.col');});
TQS.forEach(function(t){t._col=t.closest('.col');});
MODS.forEach(function(m){m._col=m.closest('.col');});

var state={q:'',segs:new Set(SEGS),types:new Set(TYPES),buckets:new Set(BUCKETS),ctx:false,density:'all'};
var hits=[],hitIdx=-1;

/* Slovenska števila: 1 zadetek, 2 zadetka, 3–4 zadetki, 5+ zadetkov. */
function plural(n,forms){
 var h=n%100,d=n%10;
 if(h!==11&&d===1)return forms[0];
 if(h!==12&&d===2)return forms[1];
 if(h!==13&&h!==14&&(d===3||d===4))return forms[2];
 return forms[3];
}
function fold(s){return String(s).toLowerCase()
 .replace(/[\\u010D\\u0107]/g,'c').replace(/\\u0161/g,'s').replace(/\\u017E/g,'z').replace(/\\u0111/g,'d')
 .replace(/\\s+/g,' ').trim();}

/* ---------- pan / zoom ---------- */
var scale=1,tx=0,ty=0,MIN=0.04,MAX=1.6;
/* --s podpira ločnice, ki se ne krčijo z zoomom. Sprememba te spremenljivke sproži
   preračun sloga na vseh škatlah, zato jo zapišemo le ob spremembi za več kot odstotek. */
var lastS=0;
function apply(){
 canvas.style.transform='translate('+tx+'px,'+ty+'px) scale('+scale+')';
 if(Math.abs(scale-lastS)>lastS*0.01){lastS=scale;canvas.style.setProperty('--s',scale);}
 zlabel.textContent=Math.round(scale*100)+' %';
}
function clampScale(s){return Math.min(MAX,Math.max(MIN,s));}
function zoomAt(cx,cy,factor){var ns=clampScale(scale*factor);factor=ns/scale;tx=cx-(cx-tx)*factor;ty=cy-(cy-ty)*factor;scale=ns;apply();}
viewport.addEventListener('wheel',function(e){e.preventDefault();var r=viewport.getBoundingClientRect();
 zoomAt(e.clientX-r.left,e.clientY-r.top,Math.pow(1.0015,-e.deltaY));},{passive:false});
var drag=null;
viewport.addEventListener('pointerdown',function(e){if(e.button!==0)return;
 if(e.target.closest('.tq,.mod-back'))return;
 drag={x:e.clientX,y:e.clientY,tx:tx,ty:ty};viewport.classList.add('dragging');viewport.setPointerCapture(e.pointerId);});
viewport.addEventListener('pointermove',function(e){if(!drag)return;tx=drag.tx+(e.clientX-drag.x);ty=drag.ty+(e.clientY-drag.y);apply();});
function endDrag(){drag=null;viewport.classList.remove('dragging');}
viewport.addEventListener('pointerup',endDrag);
viewport.addEventListener('pointercancel',endDrag);
document.getElementById('zin').addEventListener('click',function(){var r=viewport.getBoundingClientRect();zoomAt(r.width/2,r.height/2,1.3);});
document.getElementById('zout').addEventListener('click',function(){var r=viewport.getBoundingClientRect();zoomAt(r.width/2,r.height/2,1/1.3);});
/* Ob nalaganju ima platno lahko še ničelno velikost — takrat poskusi znova v naslednji sličici,
   sicer se diagram postavi po praznem pravokotniku in obtiči v kotu. */
function fitAll(){
 var r=viewport.getBoundingClientRect(),w=layout.offsetWidth,h=layout.offsetHeight;
 if(r.width<2||r.height<2||!w||!h){requestAnimationFrame(fitAll);return;}
 scale=clampScale(Math.min(r.width/w,r.height/h)*0.96);
 tx=(r.width-w*scale)/2;ty=(r.height-h*scale)/2;apply();}
document.getElementById('zfit').addEventListener('click',fitAll);

function off(el){var x=0,y=0;while(el&&el!==canvas){x+=el.offsetLeft;y+=el.offsetTop;el=el.offsetParent;}return {x:x,y:y};}
function centerOn(el,zoom){
 var r=viewport.getBoundingClientRect(),o=off(el);
 var s=zoom||Math.min(1,Math.max(scale,0.55));scale=clampScale(s);
 tx=r.width/2-(o.x+el.offsetWidth/2)*scale;
 var hh=el.offsetHeight*scale;
 ty=hh>r.height-90?70-o.y*scale:r.height/2-(o.y+el.offsetHeight/2)*scale;
 apply();
 el.classList.add('flash');setTimeout(function(){el.classList.remove('flash');},1200);
}

/* ---------- žice ---------- */
function path(d,cls){var p=document.createElementNS('http://www.w3.org/2000/svg','path');
 p.setAttribute('d',d);if(cls)p.setAttribute('class',cls);wg.appendChild(p);return p;}
function label(x,y,text,anchor){var t=document.createElementNS('http://www.w3.org/2000/svg','text');
 t.setAttribute('x',x);t.setAttribute('y',y);if(anchor)t.setAttribute('text-anchor',anchor);
 t.textContent=text;wg.appendChild(t);return t;}
function box(el){if(!el||el.offsetParent===null&&el.offsetHeight===0)return null;var o=off(el);
 return {x:o.x,y:o.y,w:el.offsetWidth,h:el.offsetHeight};}
function byId(id){return box(document.getElementById(id));}
function vline(a,b,cls,text){if(!a||!b)return null;
 var x1=a.x+a.w/2,y1=a.y+a.h,x2=b.x+b.w/2,y2=b.y,my=(y1+y2)/2;
 var p=path('M'+x1+' '+y1+' C'+x1+' '+my+' '+x2+' '+my+' '+x2+' '+(y2-4),cls||'');
 p.setAttribute('marker-end','url(#arr)');
 if(text)label((x1+x2)/2+10,my-8,text);
 return p;}

var twPaths={};
function drawWires(){
 wg.textContent='';twPaths={};
 var W=layout.offsetWidth,H=layout.offsetHeight;
 wires.setAttribute('width',W);wires.setAttribute('height',H);
 wires.setAttribute('viewBox','0 0 '+W+' '+H);
 var k1=byId('k1'),k1b=byId('k1b'),k2=byId('k2'),k7=byId('k7'),gate=byId('gate'),p1=byId('pdf1'),p2=byId('pdf2');
 if(!k1||!k2)return;
 path('M'+(k1.x+k1.w)+' '+(k1.y+k1.h*0.62)+' C'+(k1.x+k1.w+70)+' '+(k1.y+k1.h*0.62)+' '+(k1b.x-70)+' '+(k1b.y+40)+' '+(k1b.x-4)+' '+(k1b.y+40),'main')
  .setAttribute('marker-end','url(#arr)');
 label((k1.x+k1.w+k1b.x)/2,k1.y+k1.h*0.62-12,'izbira »Drugo«','middle');
 vline(k1,k2,'main');vline(k1b,k2,'');
 var any=false;
 for(var i=0;i<SEGS.length;i++){var h=byId('col-'+SEGS[i]);if(h){vline(k2,h,'');any=true;}}
 if(any)label(k2.x+k2.w/2,k2.y+k2.h+56,'segment določi nabor modulov','middle');
 for(var s=0;s<SEGS.length;s++){
  var id=SEGS[s];
  var head=byId('col-'+id);if(!head)continue;
  var k3=byId('k3-'+id),k4=byId('k4-'+id),k5=byId('k5-'+id),k6h=byId('k6h-'+id);
  vline(head,k3,'main');vline(k3,k4,'main');
  vline(k4,k5,'main','ocene 0–3 → izbrana 3 področja');
  vline(k5,k6h,'main');
  var tqs=TQS.filter(function(t){return t.dataset.seg===id;});
  for(var m=0;m<tqs.length;m++){
   var t=box(tqs[m]),mb=box(modByKey[id+'|'+tqs[m].dataset.mod]);
   if(!t||!mb)continue;
   var depth=26+m*9;
   var p=path('M'+t.x+' '+(t.y+t.h/2)+' C'+(t.x-depth)+' '+(t.y+t.h/2)+' '+(mb.x-depth)+' '+(mb.y+26)+' '+(mb.x-3)+' '+(mb.y+26),
     'tw tw-'+tqs[m].dataset.type);
   p.setAttribute('marker-end','url(#arr)');
   twPaths[id+'|'+tqs[m].dataset.mod]=p;
  }
  var colEl=box(document.getElementById('segcol-'+id));
  if(colEl&&k7){var x1=colEl.x+colEl.w/2,y1=colEl.y+colEl.h,x2=k7.x+k7.w/2,y2=k7.y;
   path('M'+x1+' '+y1+' C'+x1+' '+(y1+90)+' '+x2+' '+(y2-90)+' '+x2+' '+(y2-4),'')
    .setAttribute('marker-end','url(#arr)');}
 }
 vline(k7,gate,'main','ogled rezultatov je brezplačen; PDF zahteva kontakt');
 vline(gate,p1,'main');vline(gate,p2,'main');
}
var redrawPending=false;
function redraw(){if(redrawPending)return;redrawPending=true;
 requestAnimationFrame(function(){redrawPending=false;drawWires();});}

/* ---------- filtri in iskanje ---------- */
function bucketOk(m){
 if(state.buckets.size===BUCKETS.length)return true;
 var bs=m.dataset.buckets?m.dataset.buckets.split(' '):[];
 for(var i=0;i<bs.length;i++)if(state.buckets.has(bs[i]))return true;
 return false;
}
function applyAll(){
 COLS.forEach(function(c){c.classList.toggle('off',!state.segs.has(c.dataset.seg));});
 MODS.forEach(function(m){m.classList.toggle('off',!state.types.has(m.dataset.type)||!bucketOk(m));});
 TQS.forEach(function(t){var m=modByKey[t.dataset.seg+'|'+t.dataset.mod];
  t.classList.toggle('off',!!(m&&m.classList.contains('off')));});
 QS.forEach(function(q){q.classList.toggle('off',state.ctx&&q.dataset.ctx==='1');});

 var f=fold(state.q);
 hits=[];hitIdx=-1;
 MODS.forEach(function(m){m._h=0;m.classList.remove('selfhit');});
 TARGETS.forEach(function(t){t.classList.remove('hit','cur','dim','linked');});
 var visQ=0,visM=0;
 QS.forEach(function(q){if(vis(q))visQ++;});
 MODS.forEach(function(m){if(vis(m))visM++;});

 if(f){
  TARGETS.forEach(function(t){
   if(!vis(t))return;
   if(t.dataset.s.indexOf(f)<0)return;
   t.classList.add('hit');hits.push(t);
   var m=t.classList.contains('mod')?t:t._mod;
   if(m){m._h=(m._h||0)+1;if(t===m)m.classList.add('selfhit');}
  });
  MODS.forEach(function(m){if(vis(m)&&!m._h)m.classList.add('dim');});
  TQS.forEach(function(t){if(vis(t)&&!t.classList.contains('hit'))t.classList.add('dim');});
  var nMods=MODS.filter(function(m){return m._h>0;}).length;
  rcount.textContent=hits.length
   ?hits.length+' '+plural(hits.length,['zadetek','zadetka','zadetki','zadetkov'])+
     ' v '+nMods+' '+plural(nMods,['področju','področjih','področjih','področjih'])
   :'Ni zadetkov za „'+state.q+'".';
  rcount.classList.toggle('none',!hits.length);
  hitnav.hidden=!hits.length;
  if(hits.length){hitIdx=0;markCur();}
 }else{
  rcount.textContent=visQ===TOTALQ
   ?'Vseh '+TOTALQ+' vprašanj na platnu (${totals.total} unikatnih, ostalo se ponovi med segmenti).'
   :'Prikazanih '+visQ+' od '+TOTALQ+' vprašanj · '+visM+' od '+TOTALM+' področij.';
  rcount.classList.remove('none');
  hitnav.hidden=true;
 }
 document.getElementById('st-q').textContent=visQ;
 document.getElementById('st-m').textContent=visM;
 document.body.classList.toggle('isempty',visM===0);
 syncHash();redraw();
}
function vis(el){
 if(el.classList.contains('off'))return false;
 if(el._col&&el._col.classList.contains('off'))return false;
 if(el._mod&&el._mod.classList.contains('off'))return false;
 return true;
}
function markCur(){
 TARGETS.forEach(function(t){t.classList.remove('cur');});
 if(hitIdx<0||!hits[hitIdx])return;
 hits[hitIdx].classList.add('cur');
 hitpos.textContent=(hitIdx+1)+' / '+hits.length;
 centerOn(hits[hitIdx]);
}
function step(d){if(!hits.length)return;hitIdx=(hitIdx+d+hits.length)%hits.length;markCur();}

/* ---------- povezave triaža ↔ modul ---------- */
function linkTo(seg,mod,fromTriage){
 var t=document.getElementById('t-'+seg+'-'+mod),m=modByKey[seg+'|'+mod];
 TARGETS.forEach(function(x){x.classList.remove('linked');});
 Object.keys(twPaths).forEach(function(k){twPaths[k].classList.remove('live');});
 if(t)t.classList.add('linked');
 if(m)m.classList.add('linked');
 var p=twPaths[seg+'|'+mod];if(p)p.classList.add('live');
 var target=fromTriage?m:t;
 if(target)centerOn(target);
}
viewport.addEventListener('click',function(e){
 var back=e.target.closest('.mod-back');
 if(back){var parts=back.dataset.gotoTriage.split('|');linkTo(parts[0],parts[1],false);return;}
 var tq=e.target.closest('.tq');
 if(tq){linkTo(tq.dataset.seg,tq.dataset.mod,true);}
});
viewport.addEventListener('keydown',function(e){
 var tq=e.target.closest&&e.target.closest('.tq');
 if(tq&&(e.key==='Enter'||e.key===' ')){e.preventDefault();linkTo(tq.dataset.seg,tq.dataset.mod,true);}
});

/* ---------- rob ---------- */
var qTimer=null;
search.addEventListener('input',function(){
 document.getElementById('clearq').hidden=!search.value;
 clearTimeout(qTimer);qTimer=setTimeout(function(){state.q=search.value;applyAll();},120);
});
search.addEventListener('keydown',function(e){
 if(e.key==='Enter'){e.preventDefault();step(e.shiftKey?-1:1);}
 if(e.key==='Escape'){clearSearch();}
});
function clearSearch(){search.value='';state.q='';document.getElementById('clearq').hidden=true;applyAll();}
document.getElementById('clearq').addEventListener('click',clearSearch);
document.getElementById('nexthit').addEventListener('click',function(){step(1);});
document.getElementById('prevhit').addEventListener('click',function(){step(-1);});

document.querySelectorAll('#rail .f').forEach(function(b){
 b.addEventListener('click',function(){
  var set=b.dataset.f==='seg'?state.segs:b.dataset.f==='type'?state.types:state.buckets;
  var v=b.dataset.v;
  if(set.has(v))set.delete(v);else set.add(v);
  b.setAttribute('aria-pressed',set.has(v)?'true':'false');
  applyAll();
 });
});
document.querySelectorAll('#rail .d').forEach(function(b){
 b.addEventListener('click',function(){
  state.density=b.dataset.d;
  document.querySelectorAll('#rail .d').forEach(function(o){o.setAttribute('aria-pressed',o===b?'true':'false');});
  document.body.classList.remove('d-map','d-q');
  if(state.density!=='all')document.body.classList.add('d-'+state.density);
  applyAll();
 });
});
document.getElementById('hidectx').addEventListener('change',function(e){state.ctx=e.target.checked;applyAll();});

/* ---------- tema ---------- */
/* Izbira piše data-user-theme, ne data-theme: slednjega si lasti pregledovalnik
   artefakta in ga ob menjavi svoje teme prepiše. »Sistem« atribut odstrani in
   odločitev vrne mediju prefers-color-scheme oziroma pregledovalniku. */
var THEME_KEY='karta-vprasalnika-tema';
function setTheme(t,persist){
 var root=document.documentElement;
 if(t==='light'||t==='dark')root.dataset.userTheme=t;else delete root.dataset.userTheme;
 document.querySelectorAll('#rail .t').forEach(function(b){
  b.setAttribute('aria-pressed',b.dataset.t===t?'true':'false');});
 if(persist)try{
  if(t==='system')localStorage.removeItem(THEME_KEY);else localStorage.setItem(THEME_KEY,t);
 }catch(e){/* peskovnik ali zasebno brskanje — izbira velja za tekoči ogled */}
}
document.querySelectorAll('#rail .t').forEach(function(b){
 b.addEventListener('click',function(){setTheme(b.dataset.t,true);});
});
/* Atribut je odtisnil skript na vrhu strani, še pred izrisom; tu se le uskladijo gumbi. */
setTheme(document.documentElement.dataset.userTheme||'system',false);
function resetAll(){
 state.q='';search.value='';document.getElementById('clearq').hidden=true;
 state.segs=new Set(SEGS);state.types=new Set(TYPES);state.buckets=new Set(BUCKETS);state.ctx=false;
 document.getElementById('hidectx').checked=false;
 document.querySelectorAll('#rail .f').forEach(function(b){b.setAttribute('aria-pressed','true');});
 applyAll();fitAll();
}
document.getElementById('reset').addEventListener('click',resetAll);
document.getElementById('reset2').addEventListener('click',resetAll);
document.getElementById('railtog').addEventListener('click',function(){
 var on=document.body.classList.toggle('norail');
 this.setAttribute('aria-pressed',on?'false':'true');
});
document.querySelector('.outline').addEventListener('click',function(e){
 var b=e.target.closest('button[data-goto]');if(!b)return;
 var el=document.getElementById(b.dataset.goto);
 if(el&&el.offsetParent!==null)centerOn(el,Math.min(1,Math.max(scale,0.7)));
});

/* ---------- tipkovnica ---------- */
document.addEventListener('keydown',function(e){
 var inField=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
 if((e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key==='k'))&&!inField){e.preventDefault();search.focus();search.select();return;}
 if(inField)return;
 if(e.key==='Escape'){clearSearch();}
 if(e.key==='+'||e.key==='='){var r=viewport.getBoundingClientRect();zoomAt(r.width/2,r.height/2,1.3);}
 if(e.key==='-'){var r2=viewport.getBoundingClientRect();zoomAt(r2.width/2,r2.height/2,1/1.3);}
 if(e.key==='0'){fitAll();}
 if(e.key==='ArrowDown'&&hits.length){e.preventDefault();step(1);}
 if(e.key==='ArrowUp'&&hits.length){e.preventDefault();step(-1);}
});

/* ---------- stanje v naslovu ---------- */
var hashLock=false;
function syncHash(){
 if(hashLock)return;
 var p=[];
 if(state.q)p.push('q='+encodeURIComponent(state.q));
 if(state.segs.size!==SEGS.length)p.push('seg='+[].concat(Array.from(state.segs)).join(','));
 if(state.types.size!==TYPES.length)p.push('type='+Array.from(state.types).join(','));
 if(state.buckets.size!==BUCKETS.length)p.push('bucket='+Array.from(state.buckets).join(','));
 if(state.ctx)p.push('ctx=0');
 if(state.density!=='all')p.push('d='+state.density);
 var h=p.length?'#'+p.join('&'):'';
 if(h!==location.hash)history.replaceState(null,'',location.pathname+location.search+h);
}
/* Ponovljivo: vsakič postavi stanje na privzeto in šele nato prebere naslov, zato deluje
   enako ob prvem nalaganju kot ob prilepljeni povezavi v isti zavihek. */
function readHash(){
 hashLock=true;
 state.q='';state.segs=new Set(SEGS);state.types=new Set(TYPES);
 state.buckets=new Set(BUCKETS);state.ctx=false;state.density='all';
 var h=location.hash.replace(/^#/,'');
 if(h)h.split('&').forEach(function(pair){
  var i=pair.indexOf('=');if(i<0)return;
  var k=pair.slice(0,i),v=decodeURIComponent(pair.slice(i+1));
  if(k==='q')state.q=v;
  if(k==='seg')state.segs=new Set(v.split(','));
  if(k==='type')state.types=new Set(v.split(','));
  if(k==='bucket')state.buckets=new Set(v.split(','));
  if(k==='ctx')state.ctx=true;
  if(k==='d')state.density=v;
 });
 search.value=state.q;
 document.getElementById('clearq').hidden=!state.q;
 document.getElementById('hidectx').checked=state.ctx;
 document.body.classList.remove('d-map','d-q');
 if(state.density!=='all')document.body.classList.add('d-'+state.density);
 document.querySelectorAll('#rail .f').forEach(function(b){
  var set=b.dataset.f==='seg'?state.segs:b.dataset.f==='type'?state.types:state.buckets;
  b.setAttribute('aria-pressed',set.has(b.dataset.v)?'true':'false');
 });
 document.querySelectorAll('#rail .d').forEach(function(b){
  b.setAttribute('aria-pressed',b.dataset.d===state.density?'true':'false');
 });
 hashLock=false;
}
window.addEventListener('hashchange',function(){readHash();applyAll();});

readHash();
applyAll();
fitAll();
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){drawWires();});}
var rTimer=null;
window.addEventListener('resize',function(){clearTimeout(rTimer);rTimer=setTimeout(function(){drawWires();},150);});
})();
</script>`;

/**
 * Izhodna pot je neobvezen argument, ker objava karto potrebuje drugje kot razvoj:
 * CI jo zapiše v `public/karta/index.html`, od koder jo Vite prekopira v `dist`.
 * Brez argumenta ostane vse kot doslej — datoteka nastane ob skripti.
 */
const outPath = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : fileURLToPath(new URL('./diagram-vprasalnika.html', import.meta.url));
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html);

// ---------- kontrola ----------
// Pričakovanja se izpeljejo iz konfiguracije, ne iz vpisanih števil: kontrola lovi
// izpad pri izrisu (modul ali polje, ki ga generator spusti), ne pa spremembe
// vprašalnika — ta se sme spreminjati, ne da bi bilo treba popravljati to skripto.
const expect = data.segments.reduce(
  (a, s) => ({
    fields: a.fields + s.modules.reduce((n, m) => n + m.fields.length, 0),
    triage: a.triage + s.modules.filter((m) => m.triage).length,
    context: a.context + 3 + 2 + (s.context.chargeOutRate ? 1 : 0),
    modules: a.modules + s.modules.length,
  }),
  { fields: 0, triage: 0, context: 0, modules: 0 },
);
// Nabora žetonov morata pokrivati ista imena — spremenljivka, ki bi obstajala le v enem,
// bi v drugi temi tiho padla na vrednost iz prve in barva bi bila napačna.
const tokenNames = (block) => (block.match(/--[a-z0-9-]+(?=:)/g) ?? []).sort();
const lightNames = tokenNames(LIGHT_TOKENS);
const darkNames = tokenNames(DARK_TOKENS);
const onlyLight = lightNames.filter((n) => !darkNames.includes(n));
const onlyDark = darkNames.filter((n) => !lightNames.includes(n));

const FORM_QUESTIONS = 9; // 6 polj kontakta + 3 soglasja v zaključnem obrazcu
const qWithoutHay = (html.match(/<div class="q"(?![^>]*data-s=)/g) ?? []).length;
const modWithoutBuckets = (html.match(/<div class="mod (?![^>]*data-buckets=)/g) ?? []).length;
const dataSCount = (html.match(/ data-s="/g) ?? []).length;
const expectedIndexed = expect.fields + expect.context + FORM_QUESTIONS + expect.triage + expect.modules;

console.log(
  JSON.stringify(
    {
      renderedFieldInstances: renderedFieldCount,
      renderedTriageInstances: renderedTriageCount,
      renderedContextQuestions: renderedContextCount,
      moduleInstances: expect.modules,
      nodesWithSearchIndex: dataSCount,
      headerTotals: totals,
      bytes: html.length,
    },
    null,
    2,
  ),
);

const fail = (msg) => {
  throw new Error(msg);
};
if (renderedFieldCount !== expect.fields)
  fail(`konfiguracija ima ${expect.fields} instanc polj, izrisanih ${renderedFieldCount}`);
if (renderedTriageCount !== expect.triage)
  fail(`konfiguracija ima ${expect.triage} triažnih vprašanj, izrisanih ${renderedTriageCount}`);
if (renderedContextCount !== expect.context)
  fail(`konfiguracija ima ${expect.context} kontekstno-urnih vprašanj, izrisanih ${renderedContextCount}`);
if (onlyLight.length || onlyDark.length)
  fail(
    `žetoni se ne ujemajo — samo v svetli: ${onlyLight.join(', ') || '–'}; samo v temni: ${onlyDark.join(', ') || '–'}`,
  );
if (qWithoutHay > 0) fail(`${qWithoutHay} vprašanj brez iskalnega indeksa`);
if (modWithoutBuckets > 0) fail(`${modWithoutBuckets} modulov brez podatka o koših`);
if (dataSCount !== expectedIndexed)
  fail(`pričakovanih ${expectedIndexed} indeksiranih vozlišč, najdenih ${dataSCount}`);
console.log(
  `OK — izris se ujema s konfiguracijo: ${totals.total} unikatnih vprašanj, ${totals.modules} modulov, ${expect.fields + expect.context + FORM_QUESTIONS} vprašanj na platnu.\nZapisano v ${outPath}`,
);

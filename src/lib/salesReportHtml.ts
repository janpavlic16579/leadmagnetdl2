import { roleDisplay } from './answerLabels';
import { slugify, type DownloadFile } from './download';
import { formatEUR, formatEURRange, formatHours, formatPercent, isoDate } from './format';
import { displayRange, type EURRange } from './range';
import {
  contactPerson,
  hourAssumptionSource,
  taxNumberCell,
  type MeasuredArea,
  type SalesReport,
} from './salesReport';

/**
 * Prodajna priprava kot samostojna HTML datoteka.
 *
 * Ista vsebina kot PDF, druga raba: PDF gre v prilogo in na tiskalnik, HTML se
 * odpre na telefonu pet minut pred sestankom. Dolgi deli (vsi odgovori,
 * metodologija) so v <details>, da je zgornji del berljiv brez drsenja.
 *
 * Vse je vgrajeno — slog v <style>, nobene zunanje pisave in nobene slike. Datoteka
 * se odpira prek file://, kjer vsak zunanji vir tiho odpove; poleg tega je namenjena
 * pošiljanju naprej in mora delovati tudi brez omrežja.
 */

const DATE_TIME = new Intl.DateTimeFormat('sl-SI', { dateStyle: 'long', timeStyle: 'short' });

export function buildSalesReportHtml(report: SalesReport): string {
  const q = report.qualification;
  const title = `Priprava na pogovor — ${report.meta.companyName || 'stranka'}`;

  return `<!doctype html>
<html lang="sl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<header>
  <p class="eyebrow">Datalab · priprava na pogovor</p>
  <h1>${esc(report.meta.companyName || 'Stranka brez imena')}</h1>
  <p class="sub">${esc(q.industryLabel)} · ${esc(q.sizeClass)} zaposlenih · izpolnjeno ${esc(
    DATE_TIME.format(new Date(report.meta.generatedAtISO)),
  )}</p>
</header>

<main>
${sectionScore(report)}
${sectionQualification(report)}
${sectionResults(report)}
${sectionRecommendation(report)}
${sectionIcp(report)}
</main>

<footer>
  <p>To je samostojna ocena za interno rabo, ne plačan strokovni pregled. Izračun ne predpostavlja
  in ne obljublja specifičnih funkcionalnosti PANTHEON izven trenutno objavljenega slovenskega cenika.</p>
</footer>
</body>
</html>`;
}

/** Sestavi datoteko in jo vrne — dostavo opravi lib/download.ts (glej pdf.ts). */
export function buildSalesHtmlFile(report: SalesReport): DownloadFile {
  const company = slugify(report.meta.companyName);
  return {
    filename: `datalab-prodajna-priprava${company ? `-${company}` : ''}-${isoDate(new Date(report.meta.generatedAtISO))}.html`,
    blob: new Blob([buildSalesReportHtml(report)], { type: 'text/html;charset=utf-8' }),
  };
}

// --- 1. Ocena — kvalifikacija stranke ----------------------------------------

/**
 * Sodba na vrh, utemeljitev na dno.
 *
 * Prodajnik mora v treh sekundah vedeti, ali je to A ali C; razčlenitev po
 * dimenzijah ga takrat ne zanima in je zato v zadnjem razdelku.
 */
function sectionScore(report: SalesReport): string {
  const { icp } = report;
  const deal = report.playbook.dealSizing;

  return `<section class="icp">
  <h2>Ocena — kvalifikacija stranke</h2>
  <div class="icp-head">
    <span class="icp-total">${icp.total} / 100</span>
    <span class="icp-band icp-band-${icp.band}">pas ${icp.band}</span>
    <span class="note">${esc(icp.bandNote)}</span>
  </div>
  ${keyValueTable([
    ['Velikost posla', `${deal.sizeLabel} (${report.qualification.sizeClass} zaposlenih)`],
    ['Izmerjena letna bolečina', formatEUR(deal.measuredLossEUR)],
    ['Nujnost', `${deal.urgency} — ${deal.urgencyReason}`],
    ['Priporočena licenca', report.playbook.recommendedPantheon.licence.name],
  ])}
</section>`;
}

// --- 3. Rezultati vprašalnika ------------------------------------------------

/**
 * Dva podnaslova znotraj enega razdelka: kaj so vnesli in kaj jih najbolj boli.
 * Zgradba ostane petdelna, zato sta 3a in 3b `<h3>` in ne `<h2>`.
 */
function sectionResults(report: SalesReport): string {
  return `<section>
  <h2>Rezultati vprašalnika</h2>
  ${subsectionTheirInfo(report)}
  ${subsectionPainPoints(report)}
</section>`;
}

function subsectionTheirInfo(report: SalesReport): string {
  const s = report.summary;
  // Isti razpon kot na strankinem zaslonu — točka, ki je stranka ni videla, bi
  // bila na sestanku takoj izpodbita.
  const value = (point: number, range: EURRange | undefined): string => {
    const span = displayRange(range);
    return span ? formatEURRange(span.minEUR, span.maxEUR) : formatEUR(point);
  };
  const cards: string[] = [
    card('Neposredne letne izgube', value(s.directLossEUR, s.rangeEUR?.directLoss), 'Denar, ki odteka'),
    ...(s.lostMarginEUR > 0
      ? [card('Nezaslužena letna marža', value(s.lostMarginEUR, s.rangeEUR?.lostMargin), 'Posel, do katerega ni prišlo')]
      : []),
    card(
      'Izgubljena kapaciteta',
      value(s.capacityEUR, s.rangeEUR?.capacity),
      `${formatHours(s.capacityHoursPerMonth)}/mesec — ni prihranek pri plačah`,
    ),
  ];
  if (s.oneTimeCapitalEUR > 0) {
    cards.push(
      card(
        'Sprostljiv kapital',
        value(s.oneTimeCapitalEUR, s.rangeEUR?.oneTimeCapital),
        'Enkraten učinek, se ne sešteva',
      ),
    );
  }
  if (s.potentialMinEUR !== undefined && s.potentialMaxEUR !== undefined) {
    cards.push(
      card(
        'Realistični potencial',
        formatEURRange(
          s.rangeEUR?.potential?.minEUR ?? s.potentialMinEUR,
          s.rangeEUR?.potential?.maxEUR ?? s.potentialMaxEUR,
        ),
        'Letno, konservativno — ni obljuba',
      ),
    );
  }

  const hours = report.softness.hourAssumptions;

  return `<h3>Njihove info</h3>
  <div class="cards">${cards.join('')}</div>
  <p class="note">${esc(s.confidenceReason)}</p>
  ${
    report.softness.plausibilityWarning
      ? `<p class="warn"><strong>Opozorilo o verjetnosti:</strong> ${esc(report.softness.plausibilityWarning)}</p>`
      : ''
  }
  ${
    hours.length > 0
      ? table(
          ['Urna postavka', 'Vrednost', 'Vir'],
          hours.map((row) => [
            row.label,
            formatEUR(row.valueEUR),
            raw(
              `<span class="${row.estimated ? 'soft' : 'firm'}">${esc(hourAssumptionSource(row))}</span>`,
            ),
          ]),
        )
      : ''
  }
  ${report.measured.map(areaBlock).join('\n')}`;
}

function subsectionPainPoints(report: SalesReport): string {
  const painful = report.triage.filter(
    (row) => !row.measured && row.score !== null && row.score >= 2,
  );
  const questions = report.playbook.openingQuestions;
  const objections = report.playbook.objections;

  const triageTable =
    report.triage.length > 0
      ? table(
          ['Področje', 'Ocena stranke', 'Izmerjeno'],
          report.triage.map((row) => [
            row.title,
            row.scoreLabel ? `${row.scoreLabel} (${row.score}/3)` : 'ni ocenjeno',
            row.measured ? 'da' : raw('<span class="soft">ne</span>'),
          ]),
        )
      : '';

  const painfulNote =
    painful.length > 0
      ? `<p class="note"><strong>Neizmerjeno, a ocenjeno kot boleče:</strong>
         ${esc(painful.map((row) => row.title).join(', '))}. Za ta področja v poročilu ni nobenega
         zneska — vprašanje zanje je najbolj naravno izhodišče pogovora.</p>`
      : '';

  const questionsBlock =
    questions.length > 0
      ? `<h4>Kaj vprašati</h4>
         <ol class="questions">${questions
           .map(
             (item) =>
               `<li><strong>${esc(item.question)}</strong><span class="note">${esc(item.why)}</span></li>`,
           )
           .join('')}</ol>`
      : '';

  const objectionsBlock =
    objections.length > 0
      ? `<h4>Kaj boste slišali in kaj odgovoriti</h4>
         ${objections
           .map(
             (item) => `<article>
      <h3>${esc(item.objection)}</h3>
      <p class="note">Sproženo: ${esc(item.trigger)}</p>
      <p>${esc(item.answer)}</p>
    </article>`,
           )
           .join('')}`
      : '';

  return `<h3>Njihovi največji painpointi</h3>
  ${triageTable}
  ${painfulNote}
  ${risksBlock(report)}
  ${questionsBlock}
  ${objectionsBlock}`;
}


// --- 4. Priporočilo licenc ---------------------------------------------------

function sectionRecommendation(report: SalesReport): string {
  const fit = report.playbook.recommendedPantheon;
  return `<section>
  <h2>Priporočilo licenc glede na kriterije</h2>
  ${keyValueTable([
    ['Licenca', fit.licence.name],
    ['Dejavnost', report.qualification.industryLabel],
    ['Sedanji sistem', report.qualification.currentSystemLabel ?? '—'],
    ['Velikost', `${report.qualification.sizeClass} zaposlenih`],
  ])}
  ${fit.licence.note ? `<p class="note"><strong>Pozor:</strong> ${esc(fit.licence.note)}</p>` : ''}
  <p class="lead"><strong>${esc(fit.headline)}</strong></p>
  <p>${esc(fit.why)}</p>
  ${
    fit.addresses.length > 0
      ? `<p class="pantheon"><strong>Naslavlja:</strong> ${esc(fit.addresses.join(' · '))}</p>`
      : ''
  }
  <p class="note">${esc(fit.confirm)}</p>
  ${actionsBlock(report)}
</section>`;
}

// --- 5. Kvalifikacija stranke — podrobnejša razlaga --------------------------


/**
 * Ocena je na dnu in vedno z razčlenitvijo: skupno število brez utemeljitev je pri
 * pogovoru neuporabno in pozneje neuravnavljivo.
 */
function sectionIcp(report: SalesReport): string {
  const { icp } = report;
  return `<section class="icp">
  <h2>Kvalifikacija stranke — podrobnejša razlaga</h2>
  <p class="note">Skupna ocena <strong>${icp.total} / 100</strong> (pas ${icp.band}) je vsota spodnjih
  sedmih dimenzij. Vsaka pove, kaj je izmerila in koliko točk je prispevala.</p>
  ${table(
    ['Dimenzija', 'Točke', 'Iz česa'],
    icp.dimensions.map((dimension) => [
      dimension.label,
      `${Math.round(dimension.points)} / ${Math.round(dimension.weight * 100)}`,
      dimension.note,
    ]),
  )}
  <p class="note">Merila so začetne ocene brez empirije in se uravnavajo v
  <code>src/config/icp.ts</code>. Ocena pove ustreznost profilu, ne kakovosti podjetja.</p>
</section>`;
}

// --- Razdelki ----------------------------------------------------------------

function sectionQualification(report: SalesReport): string {
  const q = report.qualification;
  const band = `${formatPercent(q.improvementBand.min)} – ${formatPercent(q.improvementBand.max)}`;

  const rows: [string, string][] = [
    // Kontakt gre na vrh: svetovalec najprej potrebuje, koga pokliče.
    ['Kontaktna oseba', contactPerson(report) || '—'],
    ['E-naslov', report.meta.email || '—'],
    ['Telefon', report.meta.phone || '—'],
    ['Davčna številka', taxNumberCell(report)],
    ['Dejavnost', q.industryLabel],
    ['Vprašalnik', q.segmentName],
    ['Velikost', `${q.sizeClass} zaposlenih (vneseno: ${q.employeeCount})`],
    ['Vlogo navaja kot', roleDisplay(q.roleLabel, q.roleOther)],
    ['Pretežno dela', q.businessTypeLabel ?? '—'],
    ['Sedanji sistem', q.currentSystemLabel ?? '—'],
    ['Obstoječi uporabnik PANTHEON', q.isPantheonCustomer ? 'Da' : 'Ne'],
    ['Pas realistične izboljšave', band],
    ['Vir obiska', report.meta.utmSource ?? 'neposredno'],
    // Tri ločene vrstice in ne ena združena: revizijsko vprašanje je "ali je
    // privolil v trženje?", na kar skupna celica ne odgovori.
    ['Privolitev — obdelava osebnih podatkov', report.meta.consentProcessing ? 'Da' : 'Ne'],
    ['Privolitev — ponudbe PANTHEON', report.meta.consentOffers ? 'Da' : 'Ne'],
    ['Privolitev — vsebine in dogodki', report.meta.consentContent ? 'Da' : 'Ne'],
  ];

  const note = q.isPantheonCustomer
    ? ''
    : `<p class="note">Stranka ni obstoječi uporabnik PANTHEON, zato ji tehnična opozorila o rokih
       (SQL Server, Windows Server, ZIERDED) niso bila prikazana. Njihova odsotnost tu torej ni
       podatek o podjetju.</p>`;

  return `<section>
  <h2>Osnovni podatki</h2>
  ${keyValueTable(rows)}
  ${note}
</section>`;
}





function areaBlock(area: MeasuredArea): string {
  const intro: string[] = [`Skupaj <strong>${esc(formatEUR(area.totalEUR))}</strong> letno.`];
  if (area.mainCauseLabel) {
    intro.push(`Glavni vzrok po oceni stranke: ${esc(area.mainCauseLabel.toLowerCase())}.`);
  }
  if (area.addressableShare !== null) {
    intro.push(`Naslovljiv delež ${esc(formatPercent(area.addressableShare))}.`);
  }

  const outputs = area.outputs.filter((output) => (output.valueEUR ?? 0) > 0);

  return `<article>
  <h3>${esc(area.title)}</h3>
  <p class="lead">${intro.join(' ')}</p>
  ${
    outputs.length > 0
      ? table(
          ['Izračunana postavka', 'Letni znesek'],
          outputs.map((output) => [
            output.hoursPerMonth
              ? `${output.label} (${formatHours(output.hoursPerMonth)}/mesec)`
              : output.label,
            formatEUR(output.valueEUR ?? 0),
          ]),
        )
      : ''
  }
  <details>
    <summary>Vsi odgovori (${area.answers.length})</summary>
    ${table(
      ['Vprašanje', 'Odgovor', 'Vir'],
      area.answers.map((row) => [
        row.contextOnly ? raw(`${esc(row.question)} <em>(kontekst)</em>`) : row.question,
        row.answer,
        // Trdnost stoji OB številki. Prej je bila v svojem razdelku dvajset vrstic niže.
        row.answered ? raw(`<span class="firm">${esc(row.source)}</span>`) : raw(`<span class="soft">${esc(row.source)}</span>`),
      ]),
    )}
  </details>
  ${
    area.pantheon.length > 0
      ? `<p class="pantheon"><strong>PANTHEON naslavlja:</strong> ${esc(area.pantheon.join(' · '))}</p>`
      : ''
  }
  ${
    area.methodology
      ? `<details><summary>Kako je izračunano</summary>
         <p><code>${esc(area.methodology.formula)}</code></p>
         <p class="note">${esc(area.methodology.rationale)}</p></details>`
      : ''
  }
</article>`;
}

/** Tveganja so del painpointov, ne svoj razdelek — zato blok in ne <section>. */
function risksBlock(report: SalesReport): string {
  if (report.risks.length === 0) return '';
  return `<h4>Podatki, procesna tveganja in roki</h4>
  ${report.risks
    .map(
      // Nevtralen slog ('low'), a resnično besedilo: brez odgovora ni stopnje.
      (risk) => `<div class="risk risk-${risk.riskLevel ?? 'low'}">
      <p class="risk-head"><strong>${esc(risk.label)}</strong> <span>${esc(
        risk.riskLevel ? LEVEL_LABEL[risk.riskLevel] : LEVEL_UNRATED_LABEL,
      )}</span></p>
      ${risk.note ? `<p>${esc(risk.note)}</p>` : ''}
    </div>`,
    )
    .join('\n')}`;
}

/** "3 ukrepi" so del priporočila: ukrep brez ponudbe je nasvet, ki ga stranka že ima. */
function actionsBlock(report: SalesReport): string {
  if (!report.actionPlan) return '';
  return `<h3>${esc(report.actionPlan.headline)}</h3>
  <p class="note">Isti trije ukrepi so v strankinem poročilu — na sestanku so izhodišče, ne novica.</p>
  <ol>${report.actionPlan.actions.map((action) => `<li>${esc(action)}</li>`).join('')}</ol>`;
}

// --- Gradniki ----------------------------------------------------------------

const LEVEL_LABEL: Record<string, string> = {
  low: 'nizko tveganje',
  medium: 'srednje tveganje',
  high: 'visoko tveganje',
};

/** Diagnostični par brez odgovora — glej RISK_LEVEL_UNRATED_LABEL v pdfKit.ts. */
const LEVEL_UNRATED_LABEL = 'ni ocenjeno';

/**
 * Ubeži HTML posebne znake.
 *
 * Obiskovalec vnese ŠEST nizov, ki pristanejo v tej datoteki — ime, priimek, ime
 * podjetja, e-naslov, telefon in davčno. Brez tega bi `<script>` v katerem koli od
 * njih pristal v datoteki, ki jo svetovalec odpre v brskalniku. Celice, ki vsebujejo
 * namerno oznako (npr. `<span class="soft">`), se sestavijo posebej in ne gredo skozi tu.
 *
 * Apostrof je ubežen, čeprav danes noben izpis ne pristane v atributu: enojno
 * narekovani atribut je en refaktor stran, polj obiskovalca pa je šest namesto enega.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function keyValueTable(rows: [string, string][]): string {
  return `<table class="kv"><tbody>${rows
    .map(([key, value]) => `<tr><th scope="row">${esc(key)}</th><td>${esc(value)}</td></tr>`)
    .join('')}</tbody></table>`;
}

/**
 * Celica, ki namenoma nosi oznako (poudarek, značka).
 *
 * Privzeto se vsaka celica ubeži; markup je treba izrecno označiti. Obratna
 * odločitev — "celice so že HTML" — pomeni, da se ob dodajanju novega stolpca
 * ubežanje tiho pozabi, in ravno ime podjetja je tisto, ki ga vpiše obiskovalec.
 */
interface RawCell {
  html: string;
}

function raw(html: string): RawCell {
  return { html };
}

type Cell = string | RawCell;

function table(head: string[], rows: Cell[][]): string {
  const cell = (value: Cell) => (typeof value === 'string' ? esc(value) : value.html);
  return `<table><thead><tr>${head
    .map((label) => `<th>${esc(label)}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((value) => `<td>${cell(value)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function card(title: string, value: string, note: string): string {
  return `<div class="card"><p class="card-title">${esc(title)}</p><p class="card-value">${esc(
    value,
  )}</p><p class="card-note">${esc(note)}</p></div>`;
}

/** Barve prepisane iz src/styles/tokens.css (svetla tema) — enako kot PALETTE v pdfKit. */
const STYLE = `
:root{--dark:#231f20;--yellow:#faaf17;--amber:#8a600d;--cream:#f1ede2;--border:#dfe3e8;
--text:#444;--muted:#5b6773;--warn-bg:#fff4e5;--warn-border:#f0b429;--warn-text:#7a4a00}
*{box-sizing:border-box}
body{margin:0;font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--text);background:#fff}
header{background:var(--dark);color:#fff;padding:24px 20px;border-bottom:4px solid var(--yellow)}
header h1{margin:4px 0;font-size:1.6rem}
.eyebrow{margin:0;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--cream)}
.sub{margin:0;color:var(--cream);font-size:.9rem}
main{max-width:900px;margin:0 auto;padding:8px 20px 40px}
section{margin:28px 0}
section.highlight{background:var(--cream);padding:16px;border-radius:8px}
h2{font-size:1.15rem;margin:0 0 10px;padding-left:10px;border-left:4px solid var(--yellow)}
h3{font-size:1rem;margin:18px 0 6px}
article{border:1px solid var(--border);border-radius:8px;padding:14px;margin:12px 0}
article h3{margin-top:0}
.lead{margin:.3rem 0 .8rem}
.note{color:var(--muted);font-size:.85rem}
.pantheon{font-size:.85rem;color:var(--muted)}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:.88rem}
th,td{text-align:left;padding:7px 9px;border-bottom:1px solid var(--border);vertical-align:top}
thead th{background:var(--dark);color:#fff;font-weight:600}
tbody tr:nth-child(even){background:#faf9f6}
table.kv th{width:40%;background:none;color:var(--text);font-weight:600}
td:last-child{white-space:normal}
.soft{color:var(--warn-text);background:var(--warn-bg);padding:1px 6px;border-radius:4px;font-size:.8rem}
.warn{color:var(--warn-text);background:var(--warn-bg);border:1px solid var(--warn-border);
padding:8px 12px;border-radius:6px;font-size:.85rem}
.firm{color:var(--amber);font-weight:600}
.cards{display:flex;flex-wrap:wrap;gap:10px}
.card{flex:1 1 200px;border:1px solid var(--border);border-radius:8px;padding:12px}
.card-title{margin:0;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.card-value{margin:4px 0;font-size:1.3rem;font-weight:700;color:var(--amber)}
.card-note{margin:0;font-size:.78rem;color:var(--muted)}
.risk{border:1px solid var(--border);background:var(--cream);border-radius:8px;padding:12px;margin:8px 0}
.risk-medium,.risk-high{background:var(--warn-bg);border-color:var(--warn-border)}
.risk-high .risk-head strong{color:var(--warn-text)}
.risk-head{display:flex;justify-content:space-between;gap:12px;margin:0 0 4px}
.risk-head span{color:var(--muted);font-size:.82rem;white-space:nowrap}
.questions{padding-left:20px;margin:8px 0}
.questions li{margin:10px 0}
.questions li strong{display:block}
.questions li .note{display:block;margin-top:2px}
.icp{border:1px solid var(--border);border-radius:8px;padding:16px;background:#faf9f6}
.icp-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:8px}
.icp-total{font-size:1.9rem;font-weight:700;color:var(--amber)}
.icp-band{padding:2px 10px;border-radius:999px;font-weight:600;font-size:.82rem;
background:var(--cream);color:var(--dark)}
.icp-band-A{background:var(--yellow);color:var(--dark)}
.icp-band-C{background:var(--warn-bg);color:var(--warn-text)}
details{margin:8px 0}
summary{cursor:pointer;font-size:.88rem;color:var(--amber);font-weight:600}
code{background:var(--cream);padding:2px 5px;border-radius:4px;font-size:.82rem}
ol{padding-left:20px}
li{margin:6px 0}
footer{border-top:1px solid var(--border);padding:16px 20px;color:var(--muted);font-size:.75rem;
max-width:900px;margin:0 auto}
@media print{header{background:#fff;color:var(--dark)}.eyebrow,.sub{color:var(--muted)}
details{display:block}details>summary{display:none}}
`;

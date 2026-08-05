import { slugify, type DownloadFile } from './download';
import { formatEUR, formatHours, formatPercent } from './format';
import { hourAssumptionSource, type MeasuredArea, type SalesReport } from './salesReport';

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
${sectionQualification(report)}
${sectionSummary(report)}
${sectionSoftness(report)}
${sectionTriage(report)}
${sectionAreas(report)}
${sectionRisks(report)}
${sectionActions(report)}
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
    filename: `datalab-prodajna-priprava${company ? `-${company}` : ''}-${report.meta.generatedAtISO.slice(0, 10)}.html`,
    blob: new Blob([buildSalesReportHtml(report)], { type: 'text/html;charset=utf-8' }),
  };
}

// --- Razdelki ----------------------------------------------------------------

function sectionQualification(report: SalesReport): string {
  const q = report.qualification;
  const band = `${formatPercent(q.improvementBand.min)} – ${formatPercent(q.improvementBand.max)}`;

  const rows: [string, string][] = [
    ['Dejavnost', q.industryLabel],
    ['Vprašalnik', q.segmentName],
    ['Velikost', `${q.sizeClass} zaposlenih (vneseno: ${q.employeeCount})`],
    ['Vlogo navaja kot', q.roleLabel ?? '—'],
    ['Pretežno dela', q.businessTypeLabel ?? '—'],
    ['Sedanji sistem', q.currentSystemLabel ?? '—'],
    ['Obstoječi uporabnik PANTHEON', q.isPantheonCustomer ? 'Da' : 'Ne'],
    ['Pas realistične izboljšave', band],
    ['E-naslov', report.meta.email || '—'],
    ['Vir obiska', report.meta.utmSource ?? 'neposredno'],
    ['Privolitev za obdelavo (GDPR)', report.meta.gdprConsent ? 'Da' : 'Ne'],
  ];

  const note = q.isPantheonCustomer
    ? ''
    : `<p class="note">Stranka ni obstoječi uporabnik PANTHEON, zato ji tehnična opozorila o rokih
       (SQL Server, Windows Server, ZIERDED) niso bila prikazana. Njihova odsotnost tu torej ni
       podatek o podjetju.</p>`;

  return `<section>
  <h2>Kdo je stranka</h2>
  ${keyValueTable(rows)}
  ${note}
</section>`;
}

function sectionSummary(report: SalesReport): string {
  const s = report.summary;
  const cards: string[] = [
    card('Neposredne letne izgube', formatEUR(s.directLossEUR), 'Denar, ki odteka'),
    card(
      'Izgubljena kapaciteta',
      formatEUR(s.capacityEUR),
      `${formatHours(s.capacityHoursPerMonth)}/mesec — ni prihranek pri plačah`,
    ),
  ];
  if (s.oneTimeCapitalEUR > 0) {
    cards.push(
      card(
        'Sprostljiv kapital',
        formatEUR(s.oneTimeCapitalEUR),
        'Enkraten učinek, se z letnimi zneski ne sešteva',
      ),
    );
  }
  if (s.potentialMinEUR !== undefined && s.potentialMaxEUR !== undefined) {
    cards.push(
      card(
        'Realistični potencial',
        `${formatEUR(s.potentialMinEUR)} – ${formatEUR(s.potentialMaxEUR)}`,
        'Letno, konservativno — ni obljuba prihranka',
      ),
    );
  }

  return `<section>
  <h2>Kaj je izračun pokazal</h2>
  <div class="cards">${cards.join('')}</div>
</section>`;
}

function sectionSoftness(report: SalesReport): string {
  const { hourAssumptions, unknownAnswers, untouchedFields } = report.softness;
  const blocks: string[] = [];

  if (hourAssumptions.length > 0) {
    blocks.push(
      table(
        ['Urna postavka', 'Vrednost', 'Vir'],
        hourAssumptions.map((row) => [
          row.label,
          formatEUR(row.valueEUR),
          raw(`<span class="${row.estimated ? 'soft' : 'firm'}">${esc(hourAssumptionSource(row))}</span>`),
        ]),
      ),
    );
  }
  if (unknownAnswers.length > 0) {
    blocks.push(
      `<h3>Odgovor „Ne vem" (${unknownAnswers.length})</h3>`,
      table(
        ['Vprašanje', 'Področje'],
        unknownAnswers.map((row) => [row.question, row.moduleTitle]),
      ),
    );
  }
  if (untouchedFields.length > 0) {
    blocks.push(
      `<h3>Ostalo na privzeti vrednosti (${untouchedFields.length})</h3>`,
      table(
        ['Vprašanje', 'Področje'],
        untouchedFields.map((row) => [row.question, row.moduleTitle]),
      ),
      `<p class="note">Ta polja v izračun vstopajo z ničlo ali privzetkom. Vsaka številka, ki jo
       stranka na sestanku doda, znesek zviša — nikoli zniža.</p>`,
    );
  }
  if (blocks.length === 0) {
    blocks.push('<p class="note">Stranka je odgovorila na vsa vprašanja.</p>');
  }

  return `<section class="highlight">
  <h2>Kje so številke trdne in kje ne</h2>
  <p class="lead">${esc(report.summary.confidenceReason)}</p>
  ${blocks.join('\n')}
</section>`;
}

function sectionTriage(report: SalesReport): string {
  if (report.triage.length === 0) return '';

  const painful = report.triage.filter((row) => !row.measured && row.score >= 2);
  const note =
    painful.length > 0
      ? `<p class="note"><strong>Neizmerjeno, a ocenjeno kot boleče:</strong>
         ${esc(painful.map((row) => row.title).join(', '))}. Za ta področja v poročilu ni nobenega
         zneska — vprašanje zanje je najbolj naravno izhodišče pogovora.</p>`
      : '';

  return `<section>
  <h2>Kaj stranko tišči</h2>
  ${table(
    ['Področje', 'Ocena stranke', 'Izmerjeno'],
    report.triage.map((row) => [
      row.title,
      row.scoreLabel ? `${row.scoreLabel} (${row.score}/3)` : String(row.score),
      row.measured ? 'da' : raw('<span class="soft">ne</span>'),
    ]),
  )}
  ${note}
</section>`;
}

function sectionAreas(report: SalesReport): string {
  if (report.measured.length === 0) return '';
  return `<section>
  <h2>Po področjih</h2>
  ${report.measured.map(areaBlock).join('\n')}
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
        row.answered ? 'vneseno' : raw('<span class="soft">privzeto</span>'),
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

function sectionRisks(report: SalesReport): string {
  if (report.risks.length === 0) return '';
  return `<section>
  <h2>Podatki, procesna tveganja in roki</h2>
  ${report.risks
    .map(
      (risk) => `<div class="risk risk-${risk.riskLevel ?? 'low'}">
      <p class="risk-head"><strong>${esc(risk.label)}</strong> <span>${esc(
        LEVEL_LABEL[risk.riskLevel ?? 'low'],
      )}</span></p>
      ${risk.note ? `<p>${esc(risk.note)}</p>` : ''}
    </div>`,
    )
    .join('\n')}
</section>`;
}

function sectionActions(report: SalesReport): string {
  if (!report.actionPlan) return '';
  return `<section>
  <h2>${esc(report.actionPlan.headline)}</h2>
  <p class="note">Isti trije ukrepi so v strankinem poročilu — na sestanku so izhodišče, ne novica.</p>
  <ol>${report.actionPlan.actions.map((action) => `<li>${esc(action)}</li>`).join('')}</ol>
</section>`;
}

// --- Gradniki ----------------------------------------------------------------

const LEVEL_LABEL: Record<string, string> = {
  low: 'nizko tveganje',
  medium: 'srednje tveganje',
  high: 'visoko tveganje',
};

/**
 * Ubeži HTML posebne znake.
 *
 * Ime podjetja vnese obiskovalec; brez tega bi `<script>` v imenu pristal v
 * datoteki, ki jo prodajnik odpre v brskalniku. Celice, ki vsebujejo namerno
 * oznako (npr. `<span class="soft">`), se sestavijo posebej in ne gredo skozi tu.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

/**
 * Izvoz celotne strukture vprašalnika v en JSON — vir za veliki diagram.
 * Pognati z: npx tsx scratchpad/extract.ts  (iz korena repozitorija)
 */
import { writeFileSync } from 'node:fs';
import {
  INDUSTRIES,
  DRUGO_SUB_INDUSTRIES,
  SUB_INDUSTRY_QUESTION,
} from '../../src/config/industries';
import {
  SEGMENTS,
  SEGMENT_ORDER,
} from '../../src/config/segments';
import { SEGMENT_CONTEXTS } from '../../src/config/contexts/index';
import {
  MODULE_REGISTRY,
  type ModuleDefinition,
} from '../../src/config/modules/index';

function moduleType(id: string): string {
  if (id === 'E') return 'risk-costs';
  if (id.startsWith('diagnostika')) return 'diagnostic';
  if (id.endsWith('Hz')) return 'horizontal';
  return 'core';
}

/** Vzorčni vnos, ki sproži vse izhode compute() — samo za popis košev. */
function sampleInput(def: ModuleDefinition): Record<string, number> {
  const input: Record<string, number> = {};
  for (const f of def.fields) {
    switch (f.kind) {
      case 'number':
        input[f.key] = 1000;
        break;
      case 'percent':
        input[f.key] = f.default > 0 ? f.default : 0.05;
        break;
      case 'slider':
        input[f.key] = f.max !== undefined ? (f.min ?? 0) / 2 + f.max / 2 : Math.max(f.default, 1);
        break;
      case 'checkbox':
        input[f.key] = 1;
        break;
      case 'choice':
        input[f.key] = f.default;
        break;
    }
  }
  return input;
}

function serializeModule(def: ModuleDefinition) {
  let buckets: { bucket: string; label: string }[] = [];
  try {
    buckets = def
      .compute(sampleInput(def), {
        operationalHourCostEUR: 45,
        adminHourCostEUR: 35,
        chargeOutRateEUR: 75,
      })
      .map((o) => ({ bucket: o.bucket, label: o.label }));
  } catch (e) {
    buckets = [{ bucket: 'ERROR', label: String(e) }];
  }
  return {
    id: def.id,
    title: def.title,
    summary: def.summary,
    type: moduleType(def.id),
    triage: def.triage
      ? { prompt: def.triage.prompt, options: def.triage.options }
      : null,
    fields: def.fields.map((f) => ({
      key: f.key,
      label: f.label,
      kind: f.kind,
      unit: f.unit,
      min: f.min,
      max: f.max,
      step: f.step,
      default: f.default,
      help: f.help,
      contextOnly: f.contextOnly === true,
      choices: f.choices?.map((c) => ({ value: c.value, label: c.label, unknown: c.unknown === true })),
    })),
    buckets,
  };
}

const out = {
  industryQuestion: 'S čim se ukvarja vaše podjetje?',
  industries: INDUSTRIES.map((i) => ({ id: i.id, label: i.label, segment: i.segment })),
  subIndustryQuestion: SUB_INDUSTRY_QUESTION,
  drugoSubs: DRUGO_SUB_INDUSTRIES.map((i) => ({
    id: i.id,
    label: i.choiceLabel ?? i.label,
    crmLabel: i.label,
    segment: i.segment,
  })),
  employeeQuestion: 'Koliko ljudi zaposlujete?',
  segments: SEGMENT_ORDER.map((segId) => {
    const seg = SEGMENTS[segId];
    const ctx = SEGMENT_CONTEXTS[segId];
    return {
      id: seg.id,
      displayName: seg.displayName,
      headlineStory: seg.headlineStory,
      directLossNote: seg.directLossNote ?? null,
      highLossThresholdEUR: seg.highLossThresholdEUR ?? null,
      accountingCapacity: seg.accountingCapacity ?? null,
      triage: seg.triage
        ? { recommendedCount: seg.triage.recommendedCount, defaultIds: seg.triage.defaultIds ?? null }
        : null,
      context: ctx
        ? {
            title: ctx.title,
            intro: ctx.intro,
            costBasisIntro: ctx.costBasisIntro,
            businessType: ctx.businessType,
            currentSystem: {
              legend: ctx.currentSystem.legend,
              options: ctx.currentSystem.options.map((o) => ({
                id: o.id,
                label: o.label,
                band: o.band,
                isPantheon: o.isPantheon === true,
              })),
            },
            role: ctx.role,
            operationalHour: ctx.operationalHour,
            adminHour: ctx.adminHour,
            chargeOutRate: ctx.chargeOutRate ?? null,
          }
        : null,
      modules: seg.moduleIds
        .map((id) => MODULE_REGISTRY[id])
        .filter((d): d is ModuleDefinition => d !== undefined)
        .map(serializeModule),
    };
  }),
};

// ---- kontrolni števci (pričakovanja iz obstoječega artefakta) ----
const uniqueModules = new Set<string>();
let triageInstances = 0;
let fieldInstances = 0;
const uniqueQuestionKeys = new Set<string>();
let contextHourly = 0;
for (const seg of out.segments) {
  if (seg.context) {
    contextHourly += 3 + 2 + (seg.context.chargeOutRate ? 1 : 0);
  }
  for (const mod of seg.modules) {
    fieldInstances += mod.fields.length;
    if (mod.triage) triageInstances += 1;
    if (!uniqueModules.has(mod.id)) {
      uniqueModules.add(mod.id);
      for (const f of mod.fields) uniqueQuestionKeys.add(`${mod.id}.${f.key}`);
    }
  }
}
const uniqueTriage = new Set<string>();
for (const seg of out.segments) for (const m of seg.modules) if (m.triage) uniqueTriage.add(m.id);
const uniqueFieldCount = uniqueQuestionKeys.size;
const totalUnique = uniqueFieldCount + uniqueTriage.size + contextHourly;

const summary = {
  segments: out.segments.length,
  uniqueModules: uniqueModules.size,
  uniqueTriage: uniqueTriage.size,
  uniqueFields: uniqueFieldCount,
  contextAndHourly: contextHourly,
  totalUniqueQuestions: totalUnique,
  fieldInstances,
  triageInstances,
  perSegment: out.segments.map((s) => ({
    id: s.id,
    modules: s.modules.length,
    triage: s.modules.filter((m) => m.triage).length,
    fields: s.modules.reduce((a, m) => a + m.fields.length, 0),
  })),
  computeErrors: out.segments.flatMap((s) =>
    s.modules.filter((m) => m.buckets.some((b) => b.bucket === 'ERROR')).map((m) => `${s.id}/${m.id}`),
  ),
};

console.log(JSON.stringify(summary, null, 2));
writeFileSync(new URL('./questionnaire.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('written questionnaire.json');

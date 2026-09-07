import { describe, it, expect } from 'vitest';
import {
  DRUGO_ID,
  DRUGO_SUB_INDUSTRIES,
  INDUSTRIES,
  INDUSTRY_PATHS,
  findSubIndustry,
  getIndustryForPath,
  getIndustryForSegment,
  getIndustryLabel,
  getSegmentForIndustry,
  industryChoiceLabel,
} from './industries';
import { SEGMENTS, SEGMENT_ORDER } from './segments';

describe('Preslikava dejavnost -> segment', () => {
  it('vsaka dejavnost se preslika v obstoječ segment', () => {
    for (const industry of INDUSTRIES) {
      expect(SEGMENTS[industry.segment]).toBeDefined();
    }
  });

  it('vsi id-ji dejavnosti so unikatni', () => {
    const ids = INDUSTRIES.map((industry) => industry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reprezentativni primeri se preslikajo pravilno', () => {
    expect(getSegmentForIndustry('proizvodnja')).toBe('proizvodnja');
    expect(getSegmentForIndustry('kovinarstvo')).toBe('kovinarstvo');
    expect(getSegmentForIndustry('zivilstvo')).toBe('zivilstvo');
    expect(getSegmentForIndustry('plastika')).toBe('plastika');
    expect(getSegmentForIndustry('inzeniring')).toBe('inzeniring');
    expect(getSegmentForIndustry('trgovina')).toBe('trgovina');
    expect(getSegmentForIndustry('maloprodaja')).toBe('maloprodaja');
    expect(getSegmentForIndustry('logistika')).toBe('logistika');
    expect(getSegmentForIndustry('racunovodstvo')).toBe('racunovodstvo');
    expect(getSegmentForIndustry('storitve')).toBe('storitve');
    expect(getSegmentForIndustry('gradbenistvo')).toBe('gradbenistvo');
    expect(getSegmentForIndustry('drugo')).toBe('splosno');
  });

  it('vsak segment je dosegljiv iz vsaj ene dejavnosti', () => {
    // Preverjeno proti SEGMENT_ORDER in ne proti prepisanemu seznamu: segment, ki
    // ga spustni seznam ne doseže, je mrtev kod — obiskovalec do njega ne pride.
    const reachable = new Set(INDUSTRIES.map((industry) => industry.segment));
    expect(reachable).toEqual(new Set(SEGMENT_ORDER));
  });

  it('neznana ali prazna dejavnost pade v splošni segment', () => {
    expect(getSegmentForIndustry('neobstojeca-panoga')).toBe('splosno');
    expect(getSegmentForIndustry('')).toBe('splosno');
  });

  it('getIndustryLabel vrne oznako oz. prazen niz za neznano dejavnost', () => {
    expect(getIndustryLabel('maloprodaja')).toBe('Maloprodaja');
    expect(getIndustryLabel('neobstojeca-panoga')).toBe('');
  });
});

describe('Pod-dejavnosti pod "Drugo"', () => {
  it('vsaka se preslika v obstoječ segment', () => {
    for (const industry of DRUGO_SUB_INDUSTRIES) {
      expect(SEGMENTS[industry.segment], industry.id).toBeDefined();
    }
  });

  it('id-ji se ne prekrivajo z dejavnostmi iz spustnega seznama', () => {
    // Preslikava išče po združenem seznamu, zato bi podvojen id tiho povozil enega
    // od obeh — obiskovalec bi dobil napačen vprašalnik brez sledi v konfiguraciji.
    const ids = [...INDUSTRIES, ...DRUGO_SUB_INDUSTRIES].map((industry) => industry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('preusmerijo v panožni vprašalnik, "nič od tega" pa v splošnega', () => {
    expect(getSegmentForIndustry('drugo_izdelki')).toBe('proizvodnja');
    expect(getSegmentForIndustry('drugo_blago')).toBe('trgovina');
    expect(getSegmentForIndustry('drugo_storitve')).toBe('storitve');
    expect(getSegmentForIndustry('drugo_prevoz')).toBe('logistika');
    expect(getSegmentForIndustry('drugo_nic')).toBe('splosno');
  });

  it('natanko ena možnost pelje v splošni segment', () => {
    // Dve bi pomenili, da obiskovalec izbira med enakima izidoma — vprašanje bi
    // dajalo videz odločitve, ki je ni.
    const toSplosno = DRUGO_SUB_INDUSTRIES.filter((industry) => industry.segment === 'splosno');
    expect(toSplosno).toHaveLength(1);
    expect(toSplosno[0].id).toBe('drugo_nic');
  });

  it('oznaka za CRM nosi predpono, obiskovalec pa vidi cel stavek', () => {
    for (const industry of DRUGO_SUB_INDUSTRIES) {
      expect(getIndustryLabel(industry.id), industry.id).toMatch(/^Drugo — /);
      const choice = industryChoiceLabel(industry);
      expect(choice, industry.id).not.toMatch(/^Drugo — /);
      // Stavek se začne z veliko začetnico: izpeljava iz oznake za CRM bi tu dala
      // malo črko sredi seznama izbir.
      expect(choice[0], industry.id).toBe(choice[0].toUpperCase());
    }
  });

  it('navadna dejavnost nima ločene oznake za obiskovalca', () => {
    for (const industry of INDUSTRIES) {
      expect(industryChoiceLabel(industry), industry.id).toBe(industry.label);
    }
  });

  it('findSubIndustry loči pod-dejavnost od navadne', () => {
    expect(findSubIndustry('drugo_storitve')?.segment).toBe('storitve');
    expect(findSubIndustry(DRUGO_ID)).toBeUndefined();
    expect(findSubIndustry('proizvodnja')).toBeUndefined();
  });

  it('sam "drugo" ostane varovalo in pelje v splošni segment', () => {
    // StepIndustry z njim ne pusti naprej, kampanjski ?s= in stari zapisi pa se
    // nanj še lahko sklicujejo — preslikava zato ne sme odpovedati.
    expect(getSegmentForIndustry(DRUGO_ID)).toBe('splosno');
  });
});

describe('Dejavnost, ki jo prednastavi kampanjski ?s=', () => {
  it('obhod velja za vsak segment', () => {
    // Segment ima en sam vir — dejavnost. Če se ta obhod kje pretrga, kampanjska
    // povezava pripelje obiskovalca v vprašalnik druge dejavnosti, kot obljublja.
    for (const segmentId of SEGMENT_ORDER) {
      const industryId = getIndustryForSegment(segmentId);
      expect(industryId, segmentId).not.toBe('');
      expect(getSegmentForIndustry(industryId), segmentId).toBe(segmentId);
    }
  });

  it('vrnjena dejavnost je popoln odgovor, nikoli sam "drugo"', () => {
    // StepIndustry zahteva podizbiro, zato bi 'drugo' pripeljal obiskovalca na
    // Korak 1 z onemogočenim gumbom Naprej — kampanjska povezava v slepo ulico.
    for (const segmentId of SEGMENT_ORDER) {
      expect(getIndustryForSegment(segmentId), segmentId).not.toBe(DRUGO_ID);
    }
  });

  it('za splošni segment seže po pod-dejavnosti', () => {
    expect(getIndustryForSegment('splosno')).toBe('drugo_nic');
  });

  it('panožni segmenti dobijo svojo dejavnost iz spustnega seznama', () => {
    expect(getIndustryForSegment('proizvodnja')).toBe('proizvodnja');
    expect(getIndustryForSegment('zivilstvo')).toBe('zivilstvo');
    expect(getIndustryForSegment('plastika')).toBe('plastika');
    expect(getIndustryForSegment('inzeniring')).toBe('inzeniring');
    expect(getIndustryForSegment('storitve')).toBe('storitve');
    expect(getIndustryForSegment('gradbenistvo')).toBe('gradbenistvo');
    expect(getIndustryForSegment('logistika')).toBe('logistika');
  });
});

describe('Kampanjske poti (/dejavnost)', () => {
  it('vsaka glavna dejavnost razen "Drugo" ima pot, pod-dejavnosti in "drugo" je nimajo', () => {
    expect(INDUSTRY_PATHS).toEqual(
      INDUSTRIES.filter((industry) => industry.id !== DRUGO_ID).map((industry) => industry.id),
    );
    expect(getIndustryForPath(`/${DRUGO_ID}/`, '/')).toBe('');
    for (const sub of DRUGO_SUB_INDUSTRIES) {
      expect(getIndustryForPath(`/${sub.id}/`, '/'), sub.id).toBe('');
    }
  });

  it('poti so veljavna imena map v objavi: male črke brez šumnikov in poševnic', () => {
    for (const path of INDUSTRY_PATHS) {
      expect(path).toMatch(/^[a-z0-9_-]+$/);
    }
  });

  it('prebere dejavnost za potjo objave, s poševnico ali brez nje', () => {
    expect(getIndustryForPath('/leadmagnetdl2/proizvodnja/', '/leadmagnetdl2/')).toBe('proizvodnja');
    expect(getIndustryForPath('/leadmagnetdl2/proizvodnja', '/leadmagnetdl2/')).toBe('proizvodnja');
    expect(getIndustryForPath('/racunovodstvo/', '/')).toBe('racunovodstvo');
    expect(getIndustryForPath('/leadmagnetdl2/zivilstvo/', '/leadmagnetdl2/')).toBe('zivilstvo');
    expect(getIndustryForPath('/leadmagnetdl2/inzeniring/', '/leadmagnetdl2/')).toBe('inzeniring');
  });

  it('koren, neznana pot, druga velikost črk in pot zunaj objave dajo prazen niz', () => {
    expect(getIndustryForPath('/leadmagnetdl2/', '/leadmagnetdl2/')).toBe('');
    expect(getIndustryForPath('/leadmagnetdl2/karta/', '/leadmagnetdl2/')).toBe('');
    expect(getIndustryForPath('/leadmagnetdl2/Proizvodnja/', '/leadmagnetdl2/')).toBe('');
    expect(getIndustryForPath('/proizvodnja/', '/leadmagnetdl2/')).toBe('');
  });
});

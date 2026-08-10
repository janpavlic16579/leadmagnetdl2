import type { ConfidenceLevel } from '../lib/potential';

/**
 * Ocena ustreznosti stranke glede na idealni profil (ICP).
 *
 * VSE ŠTEVILKE V TEJ DATOTEKI SO ZAČETNE OCENE, NE EMPIRIJA. Natančna merila
 * idealnega profila še niso določena — dogovorjeno je, da se določijo naknadno.
 * Datoteka je zato zasnovana tako, da je uravnavanje sprememba ene vrstice v eni
 * tabeli in ne poseg v logiko: uteži, pragovi, pasovi in razredi velikosti posla
 * so podatki, izračun pa je ena sama vsota.
 *
 * Dve pravili, ki naj preživita vsako uravnavanje:
 *
 * 1. VSAKA DIMENZIJA VRNE UTEMELJITEV, ne le število. Ocena brez razlage se ne da
 *    umerjati — čez tri mesece nihče ne ve, zakaj je stranka dobila 62.
 * 2. OCENA JE USTREZNOST, NE SODBA O PODJETJU. "Velikost: pod ciljnim razredom" in
 *    ne "premajhen". Poročilo se prenese na strankino napravo; vsak stavek mora
 *    zdržati, da ga prebere tisti, o katerem govori.
 */

export interface IcpSignals {
  /** Vneseno število zaposlenih (0, kadar obiskovalec ni odgovoril). */
  employeeCount: number;
  /**
   * Zgornja meja pasu izboljšave sedanjega sistema (0,08–0,40).
   *
   * Edini medsegmentni normalizator, ki ga imamo: id-ji sistemov so segmentno
   * unikatni (pantheonMfMt, pantheonWms, pantheonRetail …), pas pa je primerljiv.
   * 0,40 pomeni Excel in papir, 0,08 PANTHEON z ustreznim modulom.
   */
  improvementBandMax: number;
  isPantheonCustomer: boolean;
  /** Id vloge iz konteksta dejavnosti; segmentno unikaten, zato preslikan spodaj. */
  roleId: string | null;
  /** Izmerjena letna bolečina: neposredne izgube + vrednost izgubljene kapacitete. */
  measuredLossEUR: number;
  /** Segmentni prag visoke izgube — že umerjen po dejavnosti (config/segments.ts). */
  highLossThresholdEUR: number | undefined;
  /** Roki, ki jih je obiskovalec odkljukal v modulu E (ISO datumi). */
  deadlineDates: string[];
  confidence: ConfidenceLevel | undefined;
  /** Koliko stroškovnih področij je dejansko izpolnil in koliko jih segment ponuja. */
  measuredAreaCount: number;
  offeredAreaCount: number;
  hasPhone: boolean;
  hasTaxNumber: boolean;
  consentOffers: boolean;
  /** Datum oddaje — nujnost rokov je odvisna od tega, koliko dni je še do njih. */
  generatedAtISO: string;
}

export interface DimensionResult {
  /** 0–1. */
  value: number;
  note: string;
}

export interface IcpDimension {
  key: string;
  label: string;
  /** Seštevek vseh uteži mora biti 1 — sicer "100 točk" ni 100. Varuje test. */
  weight: number;
  rate: (signals: IcpSignals) => DimensionResult;
}

// --- Preslikave, ki jih uravnavaš ------------------------------------------

/**
 * Velikost podjetja proti ciljnemu razredu.
 *
 * KALIBRACIJA: imena segmentov ("Proizvodnja 10–249 zaposlenih") so edini že
 * zapisani podatek o ciljni velikosti, zato je 10–249 zaenkrat polna ocena.
 * Mikro podjetja in velike hiše niso izključena, le nižje ovrednotena.
 */
const SIZE_FIT: { max: number | null; value: number; note: string }[] = [
  { max: 9, value: 0.35, note: 'Pod ciljnim razredom (mikro podjetje).' },
  { max: 49, value: 1, note: 'V ciljnem razredu.' },
  { max: 249, value: 1, note: 'V ciljnem razredu, zgornja polovica.' },
  { max: null, value: 0.6, note: 'Nad ciljnim razredom — daljši cikel odločanja.' },
];

/**
 * Bližina odločevalcu.
 *
 * Id-ji vlog so segmentno unikatni (vodjaProizvodnje, vodjaSkladisca, vodjaTrgovine …),
 * zato se ujemajo po predponi. Kdor ni na seznamu, pade na privzeto vrednost —
 * dodajanje nove vloge v kontekst zato ne podre ocene.
 */
const ROLE_FIT: { match: (roleId: string) => boolean; value: number; note: string }[] = [
  {
    match: (id) => id === 'direktor' || id === 'lastnik',
    value: 1,
    note: 'Vprašalnik je izpolnil direktor oziroma lastnik — odloča sam.',
  },
  {
    match: (id) => id === 'finance',
    value: 0.8,
    note: 'Finance: pozna številke in je običajno v odločitvi zraven.',
  },
  {
    match: (id) => id.startsWith('vodja'),
    value: 0.6,
    note: 'Vodja področja — pozna problem, o nakupu pa praviloma ne odloča sam.',
  },
];

const ROLE_FALLBACK: DimensionResult = {
  value: 0.35,
  note: 'Vloge ni navedel ali je izbral "Drugo" — kdo odloča, ni znano.',
};

/**
 * Razredi velikosti posla.
 *
 * KALIBRACIJA: groba ocena po številu zaposlenih, brez cenika. Namenjena je
 * razvrščanju in ne ponudbi — zato razpon in ne znesek.
 */
export interface DealSizeBand {
  max: number | null;
  label: string;
}

export const DEAL_SIZE_BANDS: DealSizeBand[] = [
  { max: 9, label: 'majhen posel' },
  { max: 49, label: 'srednji posel' },
  { max: 249, label: 'večji posel' },
  { max: null, label: 'velik posel, daljši cikel' },
];

export function dealSizeLabel(employeeCount: number): string {
  return (
    DEAL_SIZE_BANDS.find((band) => band.max === null || employeeCount <= band.max)?.label ??
    DEAL_SIZE_BANDS[0].label
  );
}

/** Pasovi končne ocene. Meji se ne prekrivata in skupaj pokrijeta 0–100. */
export const ICP_BANDS = {
  /** >= */
  a: 70,
  /** >= */
  b: 45,
} as const;

export type IcpBand = 'A' | 'B' | 'C';

export function icpBandOf(total: number): IcpBand {
  if (total >= ICP_BANDS.a) return 'A';
  if (total >= ICP_BANDS.b) return 'B';
  return 'C';
}

export const ICP_BAND_NOTE: Record<IcpBand, string> = {
  A: 'Visoka ustreznost — obravnavaj prednostno.',
  B: 'Srednja ustreznost — vredno klica, a ne pred pasom A.',
  C: 'Nizka ustreznost po zdajšnjih merilih — preveri, preden vlagaš čas.',
};

// --- Dimenzije --------------------------------------------------------------

const DAY_MS = 86_400_000;

/** Dnevi do roka; negativno pomeni, da je rok že mimo. */
function daysUntil(deadlineISO: string, fromISO: string): number {
  return Math.round((Date.parse(deadlineISO) - Date.parse(fromISO)) / DAY_MS);
}

export const ICP_DIMENSIONS: IcpDimension[] = [
  {
    key: 'size',
    label: 'Velikost podjetja',
    weight: 0.2,
    rate: ({ employeeCount }) => {
      if (employeeCount <= 0) {
        return { value: 0.35, note: 'Števila zaposlenih ni vnesel.' };
      }
      const fit = SIZE_FIT.find((band) => band.max === null || employeeCount <= band.max)!;
      return { value: fit.value, note: `${employeeCount} zaposlenih. ${fit.note}` };
    },
  },

  {
    key: 'opportunity',
    label: 'Priložnost v sedanjem sistemu',
    weight: 0.2,
    /**
     * Meri VELIKOST VRZELI, ne vrste stranke.
     *
     * Ali je boljši lead podjetje na Excelu (nova licenca) ali obstoječi uporabnik
     * PANTHEON brez modula (nadgradnja), je poslovna odločitev, ki še ni sprejeta.
     * Dokler ni, ta dimenzija ostane nevtralna — meri, koliko je sploh mogoče
     * izboljšati — status uporabnika PANTHEON pa je izpisan kot ločeno dejstvo.
     * Ob odločitvi se spremeni samo ta funkcija.
     */
    rate: ({ improvementBandMax, isPantheonCustomer }) => {
      // Pas je med 0,08 in 0,40; preslikamo ga na 0–1 čez ta razpon.
      const value = clamp01((improvementBandMax - 0.08) / (0.4 - 0.08));
      const gap =
        improvementBandMax >= 0.3
          ? 'Velika vrzel — večino vodijo zunaj sistema.'
          : improvementBandMax >= 0.2
            ? 'Srednja vrzel — sistem imajo, a ne za vse.'
            : 'Majhna vrzel — ustrezen modul že uporabljajo.';
      const who = isPantheonCustomer
        ? 'Obstoječi uporabnik PANTHEON (nadgradnja).'
        : 'Ni uporabnik PANTHEON (nova licenca).';
      return { value, note: `${gap} ${who}` };
    },
  },

  {
    key: 'pain',
    label: 'Izmerjena bolečina',
    weight: 0.2,
    rate: ({ measuredLossEUR, highLossThresholdEUR }) => {
      if (!highLossThresholdEUR) {
        return { value: 0.5, note: 'Segment nima praga visoke izgube — ocena je nevtralna.' };
      }
      // Dvakratnik segmentnega praga velja za polno oceno: prag sam pomeni "visoka
      // izguba", vse nad dvakratnikom pa ne pove več kot to.
      const value = clamp01(measuredLossEUR / (highLossThresholdEUR * 2));
      const relation =
        measuredLossEUR >= highLossThresholdEUR
          ? 'nad segmentnim pragom visoke izgube'
          : 'pod segmentnim pragom visoke izgube';
      return {
        value,
        note: `${Math.round(measuredLossEUR).toLocaleString('sl-SI')} EUR letno — ${relation} (${Math.round(highLossThresholdEUR).toLocaleString('sl-SI')} EUR).`,
      };
    },
  },

  {
    key: 'role',
    label: 'Bližina odločevalcu',
    weight: 0.15,
    rate: ({ roleId }) => {
      if (!roleId) return ROLE_FALLBACK;
      const fit = ROLE_FIT.find((candidate) => candidate.match(roleId));
      return fit ? { value: fit.value, note: fit.note } : ROLE_FALLBACK;
    },
  },

  {
    key: 'urgency',
    label: 'Nujnost zaradi rokov',
    weight: 0.1,
    /**
     * Edina dimenzija z zunanjim, od stranke neodvisnim rokom. Uporablja
     * `warningDate` iz MODULE_E_ITEMS, ki doslej ni bil uporabljen nikjer —
     * prikazovalo se je le besedilo opozorila.
     */
    rate: ({ deadlineDates, generatedAtISO }) => {
      if (deadlineDates.length === 0) {
        return {
          value: 0.2,
          note: 'Ni odkljukanega tehničnega roka. Pozor: modul z roki se podjetju brez PANTHEON-a sploh ne prikaže, zato to ni nujno podatek o podjetju.',
        };
      }
      const soonest = Math.min(...deadlineDates.map((date) => daysUntil(date, generatedAtISO)));
      if (soonest < 0) {
        return { value: 1, note: `Rok je že potekel (pred ${Math.abs(soonest)} dnevi).` };
      }
      if (soonest <= 365) {
        return { value: 0.8, note: `Najbližji rok čez ${soonest} dni.` };
      }
      return { value: 0.5, note: `Najbližji rok čez ${soonest} dni — čas še je.` };
    },
  },

  {
    key: 'engagement',
    label: 'Resnost vnosa',
    weight: 0.1,
    /**
     * Kdor je izpolnil vsa področja in vnesel svoje številke, je pokazal namero.
     * Kdor je kliknil skozi, je pustil privzetke — isti obrazec, druga temperatura.
     */
    rate: ({ confidence, measuredAreaCount, offeredAreaCount }) => {
      const confidenceValue = confidence === 'high' ? 1 : confidence === 'medium' ? 0.6 : 0.25;
      const coverage = offeredAreaCount > 0 ? measuredAreaCount / offeredAreaCount : 0;
      const value = clamp01(confidenceValue * 0.6 + coverage * 0.4);
      const label =
        confidence === 'high'
          ? 'vnesel je konkretne številke'
          : confidence === 'medium'
            ? 'del vrednosti je iz razponov'
            : 'večina ključnih podatkov manjka';
      return {
        value,
        note: `Izmeril ${measuredAreaCount} od ${offeredAreaCount} področij, ${label}.`,
      };
    },
  },

  {
    key: 'reachability',
    label: 'Dosegljivost',
    weight: 0.05,
    /**
     * Telefon in privolitev za ponudbe sta neobvezna — kdor ju da, je pristal na
     * pogovor. Davčna omogoča, da se podjetje pred klicem preveri v registru.
     */
    rate: ({ hasPhone, hasTaxNumber, consentOffers }) => {
      const given = [hasPhone, hasTaxNumber, consentOffers].filter(Boolean).length;
      const parts = [
        hasPhone ? 'telefon' : null,
        hasTaxNumber ? 'davčna' : null,
        consentOffers ? 'privolitev za ponudbe' : null,
      ].filter(Boolean);
      return {
        value: given / 3,
        note: parts.length > 0 ? `Pustil: ${parts.join(', ')}.` : 'Pustil je samo e-naslov.',
      };
    },
  },
];

// --- Izračun ----------------------------------------------------------------

export interface IcpDimensionScore {
  key: string;
  label: string;
  weight: number;
  /** 0–1. */
  value: number;
  /** Prispevek k skupnim 100 točkam. */
  points: number;
  note: string;
}

export interface IcpScore {
  /** 0–100. */
  total: number;
  band: IcpBand;
  bandNote: string;
  dimensions: IcpDimensionScore[];
}

export function scoreIcp(signals: IcpSignals): IcpScore {
  const dimensions = ICP_DIMENSIONS.map((dimension) => {
    const { value, note } = dimension.rate(signals);
    const bounded = clamp01(value);
    return {
      key: dimension.key,
      label: dimension.label,
      weight: dimension.weight,
      value: bounded,
      points: bounded * dimension.weight * 100,
      note,
    };
  });

  const total = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.points, 0));
  const band = icpBandOf(total);
  return { total, band, bandNote: ICP_BAND_NOTE[band], dimensions };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

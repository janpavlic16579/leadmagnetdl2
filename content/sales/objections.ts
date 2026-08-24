/**
 * Ugovori, ki jih sproži stanje podatkov — ne seznam na pamet.
 *
 * Vsak vnos ima POGOJ: prikaže se samo, kadar iz strankinih odgovorov res sledi.
 * Splošen seznam desetih ugovorov je za prodajnika enak nič — prebrati ga mora
 * vsakič in vsakič sam ugotoviti, kateri od njih velja tokrat.
 *
 * Odgovor izhaja iz NAČINA RAČUNANJA (content/methodology.ts) in ne iz prodajne
 * fraze: edini argument, ki pri skeptičnem direktorju zdrži, je razlaga, zakaj je
 * številka konservativna. Kjer argumenta ni, ugovora ne navajamo.
 *
 * Uredništvo (marketing) sme besedila spreminjati brez poseganja v logiko.
 */

export interface ObjectionEntry {
  /** Kar bo stranka rekla — dobesedno, da ga prodajnik prepozna. */
  objection: string;
  /** Zakaj to pričakujemo prav pri tej stranki. */
  trigger: string;
  /** Odgovor, ki se opira na metodologijo izračuna. */
  answer: string;
}

export type ObjectionId =
  | 'inflatedNumber'
  | 'noData'
  | 'externalCause'
  | 'alreadyHavePantheon'
  | 'triedBefore'
  | 'noTimeToImplement'
  | 'unmeasuredAreas'
  | 'notMyDecision';

export const OBJECTIONS: Record<ObjectionId, ObjectionEntry> = {
  inflatedNumber: {
    objection: '„Ta številka je pretirana."',
    trigger: 'Nizka zanesljivost — večina ključnih podatkov je privzetih ali izbranih iz razpona.',
    answer:
      'Strinjajte se in obrnite: izračun je spodnja meja, ne ocena navzgor. Nedotaknjena polja vstopajo z ničlo, „Ne vem" pade na najkonservativnejšo vrednost, prikazani potencial pa je le tisti del izmerjenega stroška, ki ga po njihovem lastnem glavnem vzroku sploh je mogoče odpraviti. Ponudite, da skupaj vnesete dve pravi številki — znesek se bo zvišal, ne znižal.',
  },

  noData: {
    objection: '„Teh podatkov nimamo."',
    trigger: 'Veliko polj je ostalo na privzeti vrednosti ali z odgovorom „Ne vem".',
    answer:
      'To ni ovira za pogovor — to JE ugotovitev. Podjetje, ki ne ve, koliko ur gre v iskanje ali koliko stane naloga, tega tudi ne more upravljati. Vprašajte, kdaj bi ta podatek potrebovali za odločitev, in pokažite, od kod bi prišel.',
  },

  externalCause: {
    objection: '„To ni odvisno od nas — krivi so dobavitelji in kupci."',
    trigger: 'Kot glavni vzrok je izbran zunanji dejavnik.',
    answer:
      'Izračun se s tem že strinja: zunanji vzrok ima naslovljiv delež 25 % in ne 75 %, kot ga ima vzrok v podatkih. Prav zato je prikazani potencial tako nizek. Vprašanje ni, kdo je kriv, ampak koliko prej bi za težavo izvedeli — in koliko od tega je še mogoče rešiti.',
  },

  alreadyHavePantheon: {
    objection: '„PANTHEON že imamo."',
    trigger: 'Stranka je obstoječi uporabnik PANTHEON.',
    answer:
      'Prav zato je vrzel njihovega sistema najmanjša med vsemi — a prikazani znesek iz nje ne izhaja. Meri stroške, ki so jih navedli sami, in vzroke, ki jih je po njihovem odgovoru mogoče odpraviti. Pogovor torej ni o zamenjavi sistema, ampak o modulu, ki ga nimajo: ta znesek je tisto, česar sedanja postavitev ne pokriva.',
  },

  triedBefore: {
    objection: '„To smo že poskusili in ni delovalo."',
    trigger: 'Vedno smiselno pri podjetju z zrelim sistemom in kljub temu visoko izgubo.',
    answer:
      'Vprašajte, kaj natanko so poskusili in kje se je ustavilo — pri podatkih, pri ljudeh ali pri procesu. Odgovor se skoraj vedno ujema z glavnim vzrokom, ki so ga sami izbrali v vprašalniku. Tam začnite.',
  },

  noTimeToImplement: {
    objection: '„Nimamo časa za uvedbo."',
    trigger: 'Visoka izmerjena izguba ob nizki zrelosti sistema.',
    answer:
      'Ne prepričujte o času — pokažite ceno čakanja. Izračun je letni: vsak mesec odlašanja je dvanajstina prikazanega zneska. Nato ponudite najmanjši prvi korak iz razdelka „3 ukrepi", ki ne zahteva nobene uvedbe.',
  },

  unmeasuredAreas: {
    objection: '„Saj to ni tako velik problem."',
    trigger: 'Področja z visoko triažno oceno stranka ni izbrala za izračun.',
    answer:
      'Opozorite, da so ta področja sami ocenili kot boleča, a zanje v poročilu ni nobenega zneska — izračun jih namenoma ni ugibal. Prikazana številka torej ne vključuje prav tistega, kar jih po lastni oceni najbolj tišči.',
  },

  notMyDecision: {
    objection: '„O tem ne odločam jaz."',
    trigger: 'Vprašalnik je izpolnil nekdo, ki ni direktor ali lastnik.',
    answer:
      'Ne preskočite ga — oborožite ga. Strankino poročilo je pisano tako, da ga sme poslati upravi: en znesek, razčlenitev in razkrita metodologija. Vprašajte, kdo bo odločal in katero številko bo ta oseba najprej izpodbijala.',
  },
};

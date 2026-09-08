/**
 * Koliko časa počakamo na rAF, preden gremo naprej brez njega. V skritem
 * zavihku brskalnik requestAnimationFrame ne izvaja (glej useCountUp); brez
 * varovala bi oddaja, sprožena tik pred preklopom zavihka, obtičala do vrnitve.
 */
const HIDDEN_TAB_GUARD_MS = 100;

/**
 * Razreši se, ko je brskalnik IZRISAL trenutno stanje DOM-a.
 *
 * React zasedeno stanje gumba (»Pripravljam …« s krogcem) zapiše v DOM ob koncu
 * dogodka, izris pa s tem ni zagotovljen: nadaljevanje verige `await` —
 * razrešen `import()`, deliverLead, sinhrona gradnja PDF-ja z jsPDF in base64 —
 * lahko glavno nit zasede, preden brskalnik pride do izrisa. Krogec bi se tako
 * prvič pokazal šele, ko je delo že opravljeno, torej nikoli.
 *
 * requestAnimationFrame teče tik PRED izrisom, setTimeout znotraj njega pa šele
 * PO njem — šele takrat je stanje res na zaslonu. Brez rAF (node) takoj.
 */
export function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      resolve();
      return;
    }
    const guard = setTimeout(resolve, HIDDEN_TAB_GUARD_MS);
    requestAnimationFrame(() => {
      setTimeout(() => {
        clearTimeout(guard);
        resolve();
      }, 0);
    });
  });
}

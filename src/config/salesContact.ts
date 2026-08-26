/**
 * Prodajni kontakt Datalaba — en zapis za vse površine.
 *
 * Doslej je živel samo v EmailGate (zahvalni zaslon); strankin PDF, ki po lastni
 * obljubi "kroži po upravi", pa ni imel nobene poti nazaj k Datalabu. Zapis je
 * zato tu: obrazec in PDF morata imenovati isto številko, ali pa je nima nihče.
 *
 * Telefon je zapisan dvakrat: mednarodno za `tel:` (brskalnik na telefonu
 * predpone ne ugane) in domače za oči.
 */
export const SALES_CONTACT = {
  label: 'Datalab prodaja',
  phone: '01 252 89 50',
  phoneHref: 'tel:+38612528950',
  email: 'prodaja@datalab.si',
} as const;

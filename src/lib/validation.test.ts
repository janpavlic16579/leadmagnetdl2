import { describe, it, expect } from 'vitest';
import {
  isFilled,
  isValidEmail,
  isValidTaxNumber,
  normalizeName,
  normalizeTaxNumber,
  phoneState,
  taxNumberState,
} from './validation';

describe('E-naslov', () => {
  // Pravilo je preneseno iz obrazca znak za znak. Ti testi pripenjajo OBSTOJEČE
  // ohlapno vedenje, da je selitev dokazljivo brez spremembe — ne opisujejo,
  // kakšno bi bilo idealno preverjanje e-pošte.
  it('sprejme običajne naslove', () => {
    expect(isValidEmail('janez@podjetje.si')).toBe(true);
    expect(isValidEmail('a@b.c')).toBe(true);
    expect(isValidEmail('ime.priimek+oznaka@pod-jetje.co.uk')).toBe(true);
  });

  it('zavrne naslov brez pike v domeni ali brez afne', () => {
    expect(isValidEmail('janez@podjetje')).toBe(false);
    expect(isValidEmail('janez.podjetje.si')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('zavrne presledke', () => {
    expect(isValidEmail('janez @podjetje.si')).toBe(false);
    expect(isValidEmail('janez@pod jetje.si')).toBe(false);
  });
});

describe('Obvezno besedilno polje', () => {
  it('sami presledki ne štejejo za izpolnjeno', () => {
    expect(isFilled('Janez')).toBe(true);
    expect(isFilled('   ')).toBe(false);
    expect(isFilled('')).toBe(false);
  });
});

describe('Ime', () => {
  it('obdrži vezaje, opuščaje, presledke in šumnike', () => {
    // Vzorec za "črke" bi vsako od teh imen prej ali slej zavrnil, nič nižje po
    // toku pa od oblike imena ni odvisno.
    for (const name of ['Ana-Marija', "O'Brien", 'Đorđević', 'Žnidaršič', 'van der Berg']) {
      expect(normalizeName(name), name).toBe(name);
      expect(isFilled(name), name).toBe(true);
    }
  });

  it('pospravi odvečne presledke', () => {
    expect(normalizeName('  Janez   Novak  ')).toBe('Janez Novak');
  });
});

describe('Telefon', () => {
  it('prazen je "ni podan" in ne "neveljaven"', () => {
    // Ta ločnica drži pravilnost oddajnega pogoja: neobvezno prazno polje ne sme
    // šteti kot napaka, sicer bi obiskovalcu blokiralo prenos poročila.
    expect(phoneState('')).toBe('empty');
    expect(phoneState('   ')).toBe('empty');
  });

  it('sprejme oblike, kot jih ljudje pišejo', () => {
    expect(phoneState('+386 1 234 5678')).toBe('valid');
    expect(phoneState('01/234-56-78')).toBe('valid');
    expect(phoneState('(01) 234 5678')).toBe('valid');
    expect(phoneState('041234567')).toBe('valid');
  });

  it('zavrne črke in prekratke nize', () => {
    expect(phoneState('abc')).toBe('invalid');
    expect(phoneState('12345')).toBe('invalid');
  });
});

describe('Davčna številka', () => {
  it('normalizacija odstrani presledke in predpono SI', () => {
    expect(normalizeTaxNumber('12345678')).toBe('12345678');
    expect(normalizeTaxNumber('SI 12345678')).toBe('12345678');
    expect(normalizeTaxNumber('si 12 345 678')).toBe('12345678');
  });

  it('kontrolna vsota loči veljavno od neveljavne ob isti dolžini', () => {
    // Preverjanje dolžine te razlike ne bi ujelo — prav zato je vsota vredna osmih vrstic.
    expect(isValidTaxNumber('12345679')).toBe(true);
    expect(isValidTaxNumber('12345678')).toBe(false);
    expect(isValidTaxNumber('15012557')).toBe(true);
  });

  it('zavrne napačno dolžino in vodilno ničlo', () => {
    expect(isValidTaxNumber('1234567')).toBe(false);
    expect(isValidTaxNumber('123456789')).toBe(false);
    expect(isValidTaxNumber('01234567')).toBe(false);
  });

  it('nemogoča kontrolna vsota (ostanek 11) je neveljavna', () => {
    // Utežena vsota je deljiva z 11, zato kontrolna števka ne obstaja.
    expect(isValidTaxNumber('10000100')).toBe(false);
  });

  it('prazna je "ni podana" in ne "neveljavna"', () => {
    expect(taxNumberState('')).toBe('empty');
    expect(taxNumberState('   ')).toBe('empty');
  });

  it('stanje upošteva normalizacijo', () => {
    expect(taxNumberState('SI 12345679')).toBe('valid');
    expect(taxNumberState('12345678')).toBe('invalid');
  });
});

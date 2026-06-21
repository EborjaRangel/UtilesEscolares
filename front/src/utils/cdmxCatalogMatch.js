import { ALCALDIAS, COLONIAS_BY_ALCALDIA, getColoniasByAlcaldia } from '@/data/cdmxCatalog';

function normalize(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function findAlcaldiaMatch(name) {
  if (!name) return '';

  const norm = normalize(name);
  if (norm.includes('ciudad de mexico') || norm === 'cdmx') return '';

  const exact = ALCALDIAS.find((a) => normalize(a) === norm);
  if (exact) return exact;

  const partial = ALCALDIAS.find(
    (a) => normalize(a).includes(norm) || norm.includes(normalize(a))
  );
  return partial || '';
}

export function findColoniaMatch(alcaldia, coloniaName, cp) {
  const colonias = getColoniasByAlcaldia(alcaldia);
  if (!colonias.length || !coloniaName) return null;

  const norm = normalize(coloniaName);

  if (cp) {
    const byCpExact = colonias.filter(
      (c) => c.cp === cp && normalize(c.nombre) === norm
    );
    if (byCpExact.length === 1) return byCpExact[0];

    const byCpPartial = colonias.filter(
      (c) =>
        c.cp === cp &&
        (normalize(c.nombre).includes(norm) || norm.includes(normalize(c.nombre)))
    );
    if (byCpPartial.length === 1) return byCpPartial[0];
  }

  const exact = colonias.find((c) => normalize(c.nombre) === norm);
  if (exact) return exact;

  const partial = colonias.filter(
    (c) => normalize(c.nombre).includes(norm) || norm.includes(normalize(c.nombre))
  );
  if (partial.length === 1) return partial[0];

  return null;
}

export function buildColoniaFieldValue(coloniaEntry) {
  if (!coloniaEntry) return '';
  return `${coloniaEntry.nombre}|${coloniaEntry.cp}`;
}

export function findColoniaAcrossAlcaldias(coloniaName, cp) {
  for (const alcaldia of ALCALDIAS) {
    const match = findColoniaMatch(alcaldia, coloniaName, cp);
    if (match) return { alcaldia, colonia: match };
  }
  return null;
}

export function guessAlcaldiaFromPostcode(cp) {
  if (!cp) return '';
  for (const [alcaldia, colonias] of Object.entries(COLONIAS_BY_ALCALDIA)) {
    if (colonias.some((c) => c.cp === cp)) return alcaldia;
  }
  return '';
}

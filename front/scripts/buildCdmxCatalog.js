import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALCALDIAS_ORDER = [
  'Álvaro Obregón',
  'Azcapotzalco',
  'Benito Juárez',
  'Coyoacán',
  'Cuajimalpa de Morelos',
  'Cuauhtémoc',
  'Gustavo A. Madero',
  'Iztacalco',
  'Iztapalapa',
  'La Magdalena Contreras',
  'Miguel Hidalgo',
  'Milpa Alta',
  'Tláhuac',
  'Tlalpan',
  'Venustiano Carranza',
  'Xochimilco',
];

function normalizeAlcaldia(name) {
  return name?.trim() || '';
}

function buildFromCpMexico() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'CP_CDMX_raw.json'), 'utf8'));
  const catalog = {};

  for (const row of raw) {
    const alcaldia = normalizeAlcaldia(row.D_mnpio);
    const nombre = row.d_asenta?.trim();
    const cp = row.d_codigo?.trim();

    if (!alcaldia || !nombre || !cp) continue;

    if (!catalog[alcaldia]) catalog[alcaldia] = [];
    catalog[alcaldia].push({ nombre, cp });
  }

  return catalog;
}

function dedupeAndSort(catalog) {
  const result = {};

  for (const alcaldia of ALCALDIAS_ORDER) {
    const entries = catalog[alcaldia] || [];
    const unique = new Map();

    for (const { nombre, cp } of entries) {
      const key = `${nombre}::${cp}`;
      unique.set(key, { nombre, cp });
    }

    result[alcaldia] = [...unique.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );
  }

  return result;
}

function buildCatalogJs(catalog) {
  const lines = [
    '// Catálogo completo CDMX — generado desde datos SEPOMEX (cp-mexico/CP_CDMX.json)',
    '// Regenerar: node scripts/buildCdmxCatalog.js',
    '',
    'export const ALCALDIAS = ' + JSON.stringify(ALCALDIAS_ORDER, null, 2) + ';',
    '',
    'export const COLONIAS_BY_ALCALDIA = ' + JSON.stringify(catalog, null, 2) + ';',
    '',
    `export function getColoniasByAlcaldia(alcaldia) {
  return COLONIAS_BY_ALCALDIA[alcaldia] || [];
}

export function getCodigoPostal(alcaldia, colonia, cp) {
  const colonias = getColoniasByAlcaldia(alcaldia);
  if (cp) {
    const match = colonias.find((c) => c.nombre === colonia && c.cp === cp);
    if (match) return match.cp;
  }
  const found = colonias.find((c) => c.nombre === colonia);
  return found?.cp || '';
}

export function alcaldiaOptions() {
  return [
    { value: '', label: 'Selecciona la alcaldía' },
    ...ALCALDIAS.map((a) => ({ value: a, label: a })),
  ];
}

export function coloniaOptions(alcaldia) {
  const colonias = getColoniasByAlcaldia(alcaldia);
  return [
    { value: '', label: alcaldia ? 'Selecciona la colonia' : 'Primero elige alcaldía' },
    ...colonias.map((c) => ({
      value: c.cp ? \`\${c.nombre}|\${c.cp}\` : c.nombre,
      label: \`\${c.nombre} (CP \${c.cp})\`,
    })),
  ];
}

export function parseColoniaValue(value) {
  if (!value) return { colonia: '', cp: '' };
  const idx = value.lastIndexOf('|');
  if (idx === -1) return { colonia: value, cp: '' };
  return { colonia: value.slice(0, idx), cp: value.slice(idx + 1) };
}
`,
  ];

  return lines.join('\n');
}

const catalog = dedupeAndSort(buildFromCpMexico());
const total = Object.values(catalog).reduce((sum, arr) => sum + arr.length, 0);

console.log('Alcaldías:', ALCALDIAS_ORDER.length);
for (const a of ALCALDIAS_ORDER) {
  console.log(`  ${a}: ${catalog[a]?.length || 0} colonias`);
}
console.log('Total colonias:', total);

const outPath = path.join(__dirname, '../src/data/cdmxCatalog.js');
fs.writeFileSync(outPath, buildCatalogJs(catalog), 'utf8');
console.log('Escrito:', outPath);

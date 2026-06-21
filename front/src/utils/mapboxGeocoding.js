import { formatDireccionEntrega } from '@/utils/formatAddress';

const CDMX_BBOX = '-99.36,19.05,-98.94,19.59';

export async function geocodeAddress(address, token) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&country=mx&language=es&limit=1&bbox=${CDMX_BBOX}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo geocodificar la dirección');
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;
  const [lng, lat] = feature.center;
  return { lat, lng };
}

export function buildAddressQuery(values) {
  const { calle, numero_exterior, colonia, alcaldia, codigo_postal, numero_interior } = values;
  if (!calle?.trim() || !numero_exterior?.trim() || !colonia || !alcaldia || !codigo_postal) {
    return '';
  }

  const coloniaNombre = colonia.includes('|') ? colonia.split('|')[0] : colonia;
  return formatDireccionEntrega({
    calle,
    numero_exterior,
    numero_interior,
    colonia: coloniaNombre,
    alcaldia,
    codigo_postal,
  });
}

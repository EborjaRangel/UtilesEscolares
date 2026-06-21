import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const token = (env.match(/NEXT_PUBLIC_MAPBOX_TOKEN=(.+)/)?.[1] ?? '').trim().replace(/^["']|["']$/g, '');
const lat = 19.38759;
const lng = -99.16368;
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=mx&language=es&limit=5&types=address`;

const res = await fetch(url);
const data = await res.json();
console.log('status', res.status);
console.log('message', data.message || 'ok');
console.log('place', data.features?.[0]?.place_name);

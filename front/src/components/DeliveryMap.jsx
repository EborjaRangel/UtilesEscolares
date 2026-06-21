'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { buildAddressQuery, geocodeAddress } from '@/utils/mapboxGeocoding';

const CDMX_CENTER = { lat: 19.4326, lng: -99.1332 };

export default function DeliveryMap({ values, setFieldValue, setFieldTouched, errors, touched }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const skipForwardGeocodeRef = useRef(false);
  const [viewState, setViewState] = useState({
    latitude: CDMX_CENTER.lat,
    longitude: CDMX_CENTER.lng,
    zoom: 11,
  });

  const addressQuery = buildAddressQuery(values);

  const updateLocation = useCallback(
    (lat, lng, zoom = 16) => {
      setFieldValue('lat', lat);
      setFieldValue('lng', lng);
      setFieldTouched('lat', true, false);
      setFieldTouched('lng', true, false);
      setViewState((prev) => ({ ...prev, latitude: lat, longitude: lng, zoom }));
    },
    [setFieldValue, setFieldTouched]
  );

  const handleMapLocation = useCallback(
    (lat, lng) => {
      skipForwardGeocodeRef.current = true;
      updateLocation(lat, lng, viewState.zoom);
      setMapError('');
    },
    [updateLocation, viewState.zoom]
  );

  useEffect(() => {
    if (!token || !addressQuery) return;
    if (skipForwardGeocodeRef.current) {
      skipForwardGeocodeRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setMapError('');
      try {
        const result = await geocodeAddress(addressQuery, token);
        if (result) {
          updateLocation(result.lat, result.lng);
        } else {
          setMapError(
            'No ubicamos esa dirección en el mapa. Coloca el marcador manualmente en el punto de entrega.'
          );
        }
      } catch {
        setMapError('Error al ubicar la dirección en el mapa.');
      } finally {
        setLoading(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [addressQuery, token, updateLocation]);

  const lat = values.lat ?? viewState.latitude;
  const lng = values.lng ?? viewState.longitude;
  const hasLocationError = (touched.lat && errors.lat) || (touched.lng && errors.lng);

  if (!token) {
    return (
      <div className="mb-4 rounded-xl border-2 border-dashed border-escolar-coral/40 bg-escolar-coral/5 px-4 py-6 text-center text-sm text-escolar-coral">
        Configura <code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code> en{' '}
        <code className="font-mono">front/.env.local</code> para usar el mapa de entrega.
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="label-field">Ubicación en el mapa</label>
      <p className="mb-3 text-sm text-gray-600">
        Marca el punto exacto de entrega. La dirección guardada sale de alcaldía, colonia,
        código postal, calle y números exterior e interior.
      </p>

      <div
        className={`overflow-hidden rounded-xl border-2 ${
          hasLocationError ? 'border-escolar-coral' : 'border-escolar-sky'
        }`}
      >
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={(evt) => handleMapLocation(evt.lngLat.lat, evt.lngLat.lng)}
          mapboxAccessToken={token}
          style={{ width: '100%', height: 280 }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          scrollZoom={false}
          doubleClickZoom
          cursor="crosshair"
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Marker
            latitude={lat}
            longitude={lng}
            draggable
            onDragEnd={(evt) => handleMapLocation(evt.lngLat.lat, evt.lngLat.lng)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-escolar-coral text-lg shadow-lg">
              📍
            </div>
          </Marker>
        </Map>
      </div>

      {loading && <p className="mt-2 text-sm text-escolar-blue">Ubicando dirección en el mapa...</p>}
      {mapError && <p className="mt-2 text-sm text-escolar-gold">{mapError}</p>}
      {hasLocationError && <p className="error-text">{errors.lat || errors.lng}</p>}
      {values.lat && values.lng && (
        <p className="mt-2 text-xs text-gray-500">
          Coordenadas: {Number(values.lat).toFixed(5)}, {Number(values.lng).toFixed(5)}
        </p>
      )}
    </div>
  );
}

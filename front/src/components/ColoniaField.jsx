'use client';

import { Field } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import { coloniaOptions } from '@/data/cdmxCatalog';

export default function ColoniaField({ alcaldia, onColoniaChange }) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSearch('');
  }, [alcaldia]);
  const allOptions = useMemo(() => coloniaOptions(alcaldia), [alcaldia]);

  const filteredOptions = useMemo(() => {
    const placeholder = allOptions[0];
    const items = allOptions.slice(1);
    if (!search.trim()) return allOptions;

    const term = search.trim().toLowerCase();
    const filtered = items.filter(
      (opt) => opt.label.toLowerCase().includes(term) || opt.value.toLowerCase().includes(term)
    );

    return [placeholder, ...filtered];
  }, [allOptions, search]);

  return (
    <Field name="colonia">
      {({ field, meta, form }) => (
        <div className="mb-4">
          <label htmlFor="colonia" className="label-field">
            Colonia
          </label>
          {alcaldia && (
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar colonia o CP..."
              className="input-field mb-2"
            />
          )}
          <select
            {...field}
            id="colonia"
            disabled={!alcaldia}
            onChange={(e) => {
              field.onChange(e);
              onColoniaChange?.(e.target.value, form);
            }}
            className={`input-field ${meta.touched && meta.error ? 'input-error' : ''}`}
          >
            {filteredOptions.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {alcaldia && filteredOptions.length <= 1 && search.trim() && (
            <p className="mt-1 text-sm text-gray-500">No hay colonias que coincidan con tu búsqueda.</p>
          )}
          {meta.touched && meta.error && <p className="error-text">{meta.error}</p>}
        </div>
      )}
    </Field>
  );
}

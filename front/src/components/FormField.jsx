'use client';

import { Field } from 'formik';

export default function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  as = 'input',
  options = [],
  rows,
  onChange,
  disabled = false,
}) {
  return (
    <Field name={name}>
      {({ field, meta, form }) => (
        <div className="mb-4">
          <label htmlFor={name} className="label-field">
            {label}
          </label>

          {as === 'select' ? (
            <select
              {...field}
              id={name}
              disabled={disabled}
              onChange={(e) => {
                field.onChange(e);
                onChange?.(e.target.value, form);
              }}
              className={`input-field ${meta.touched && meta.error ? 'input-error' : ''}`}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : as === 'textarea' ? (
            <textarea
              {...field}
              id={name}
              rows={rows || 3}
              placeholder={placeholder}
              className={`input-field resize-none ${meta.touched && meta.error ? 'input-error' : ''}`}
            />
          ) : (
            <input
              {...field}
              id={name}
              type={type}
              placeholder={placeholder}
              className={`input-field ${meta.touched && meta.error ? 'input-error' : ''}`}
            />
          )}

          {meta.touched && meta.error && <p className="error-text">{meta.error}</p>}
        </div>
      )}
    </Field>
  );
}

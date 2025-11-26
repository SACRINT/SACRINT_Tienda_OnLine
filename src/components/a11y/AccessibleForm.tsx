/**
 * Formulario accesible con validación
 * Cumple WCAG AA
 */

import { ReactNode } from 'react';

interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  error?: string;
  help?: string;
  placeholder?: string;
}

interface AccessibleFormProps {
  onSubmit: (data: any) => void;
  fields: FormField[];
  submitText?: string;
  isLoading?: boolean;
}

export function AccessibleForm({
  onSubmit,
  fields,
  submitText = 'Enviar',
  isLoading = false,
}: AccessibleFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {fields.map((field) => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.name} className="form-label">
            {field.label}
            {field.required && <span aria-label="required"> *</span>}
          </label>

          <input
            id={field.name}
            name={field.name}
            type={field.type}
            required={field.required}
            placeholder={field.placeholder}
            aria-required={field.required}
            aria-invalid={!!field.error}
            aria-describedby={
              field.error ? `${field.name}-error` : field.help ? `${field.name}-help` : undefined
            }
            disabled={isLoading}
            className={field.error ? 'input-error' : ''}
          />

          {field.help && (
            <p id={`${field.name}-help`} className="form-help">
              {field.help}
            </p>
          )}

          {field.error && (
            <p id={`${field.name}-error`} className="form-error" role="alert">
              ❌ {field.error}
            </p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary"
        aria-busy={isLoading}
      >
        {isLoading ? 'Enviando...' : submitText}
      </button>
    </form>
  );
}

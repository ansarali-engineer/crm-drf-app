import type { ReactNode } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface BaseFieldProps {
  label: string;
  name: string;
  value: string | number | boolean | null;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

function toStr(v: string | number | boolean | null): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

export function TextField({
  label, name, value, onChange, error, required, disabled, placeholder, type = 'text',
}: BaseFieldProps & { type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label-field">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input id={name} type={type} className="input-field" value={toStr(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function TextAreaField({
  label, name, value, onChange, error, required, disabled, placeholder, rows = 4,
}: BaseFieldProps & { rows?: number }) {
  return (
    <div>
      <label htmlFor={name} className="label-field">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea id={name} className="input-field" value={toStr(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} rows={rows} />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function SelectField({
  label, name, value, onChange, error, required, disabled, options, placeholder = 'Select...',
}: BaseFieldProps & { options: SelectOption[] }) {
  return (
    <div>
      <label htmlFor={name} className="label-field">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select id={name} className="input-field" value={toStr(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function BooleanField({
  label, name, value, onChange, error, disabled,
}: BaseFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <button
          type="button"
          role="switch"
          aria-checked={!!value}
          id={name}
          disabled={disabled}
          onClick={() => onChange(!value ? 'true' : 'false')}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-200 disabled:opacity-50 ${value ? 'bg-primary-600 shadow-sm shadow-primary-600/30' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-bounce-subtle ${value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </button>
      </label>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function DateField({
  label, name, value, onChange, error, required, disabled,
}: BaseFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="label-field">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input id={name} type="date" className="input-field" value={toStr(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function DateTimeField({
  label, name, value, onChange, error, required, disabled,
}: BaseFieldProps) {
  const formatValue = (v: string | number | boolean | null): string => {
    const s = toStr(v);
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  return (
    <div>
      <label htmlFor={name} className="label-field">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input id={name} type="datetime-local" className="input-field" value={formatValue(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function NumberField({
  label, name, value, onChange, error, required, disabled, placeholder, step = 'any',
}: BaseFieldProps & { step?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label-field">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input id={name} type="number" step={step} className="input-field" value={toStr(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-200/70">{children}</div>;
}

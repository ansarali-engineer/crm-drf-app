import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors focus:text-primary-500" />
      <input
        type="text"
        className="input-field pl-10 pr-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      {children}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
}

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-semibold text-slate-500 whitespace-nowrap hidden sm:block">{label}</label>
      <select
        className="input-field py-1.5 text-sm min-w-[140px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

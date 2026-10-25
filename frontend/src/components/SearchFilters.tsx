import { VehicleFilters } from '../types';
import { CATEGORIES, hasActiveFilters } from '../utils/format';
import { SearchIcon, XIcon } from './Icons';

interface SearchFiltersProps {
  filters: VehicleFilters;
  onChange: (filters: VehicleFilters) => void;
  onReset: () => void;
}

export function SearchFilters({ filters, onChange, onReset }: SearchFiltersProps) {
  const set = (key: keyof VehicleFilters) => (event: { target: { value: string } }) =>
    onChange({ ...filters, [key]: event.target.value });

  const priceRangeInvalid =
    filters.minPrice !== '' && filters.maxPrice !== '' && Number(filters.minPrice) > Number(filters.maxPrice);

  return (
    <section aria-label="Search and filter vehicles" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="f-make" className="label">Make</label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={16} height={16} />
            <input id="f-make" className="input !pl-9" placeholder="e.g. Toyota" value={filters.make} onChange={set('make')} />
          </div>
        </div>
        <div>
          <label htmlFor="f-model" className="label">Model</label>
          <input id="f-model" className="input" placeholder="e.g. Camry" value={filters.model} onChange={set('model')} />
        </div>
        <div>
          <label htmlFor="f-category" className="label">Category</label>
          <select id="f-category" className="input" value={filters.category} onChange={set('category')}>
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-min" className="label">Min price</label>
          <input id="f-min" type="number" min={0} inputMode="numeric" className={`input ${priceRangeInvalid ? 'input-error' : ''}`} placeholder="0" value={filters.minPrice} onChange={set('minPrice')} />
        </div>
        <div>
          <label htmlFor="f-max" className="label">Max price</label>
          <input id="f-max" type="number" min={0} inputMode="numeric" className={`input ${priceRangeInvalid ? 'input-error' : ''}`} placeholder="Any" value={filters.maxPrice} onChange={set('maxPrice')} />
        </div>
      </div>

      {(priceRangeInvalid || hasActiveFilters(filters)) && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-rose-600">{priceRangeInvalid ? 'Min price cannot be greater than max price.' : ''}</p>
          <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={onReset}>
            <XIcon width={14} height={14} /> Clear filters
          </button>
        </div>
      )}
    </section>
  );
}

import { VehicleFilters } from '../types';

export const CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Van', 'Electric'] as const;

export const EMPTY_FILTERS: VehicleFilters = { make: '', model: '', category: '', minPrice: '', maxPrice: '' };

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const formatPrice = (value: number): string => currency.format(value);

export type StockLevel = 'out' | 'low' | 'in';

/** Sold out at 0, "low" at 1–3 units, otherwise in stock. */
export function getStockLevel(quantity: number): StockLevel {
  if (quantity <= 0) return 'out';
  if (quantity <= 3) return 'low';
  return 'in';
}

export const hasActiveFilters = (filters: VehicleFilters): boolean =>
  Object.values(filters).some((value) => value.trim() !== '');

/** Tailwind gradient per category so cards are visually distinct without needing photos. */
export const CATEGORY_GRADIENTS: Record<string, string> = {
  sedan: 'from-indigo-500 to-blue-600',
  suv: 'from-emerald-500 to-teal-600',
  hatchback: 'from-amber-400 to-orange-500',
  coupe: 'from-rose-500 to-pink-600',
  convertible: 'from-sky-400 to-cyan-500',
  truck: 'from-slate-500 to-slate-700',
  van: 'from-violet-500 to-purple-600',
  electric: 'from-lime-400 to-green-500',
};

export const gradientFor = (category: string): string =>
  CATEGORY_GRADIENTS[category.trim().toLowerCase()] ?? 'from-slate-400 to-slate-600';

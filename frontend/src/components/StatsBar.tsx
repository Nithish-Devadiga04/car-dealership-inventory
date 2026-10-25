import { Vehicle } from '../types';
import { formatPrice } from '../utils/format';

export function StatsBar({ vehicles, showValue }: { vehicles: Vehicle[]; showValue: boolean }) {
  const units = vehicles.reduce((sum, v) => sum + v.quantity, 0);
  const soldOut = vehicles.filter((v) => v.quantity === 0).length;
  const value = vehicles.reduce((sum, v) => sum + v.quantity * v.price, 0);

  const stats = [
    { label: 'Models', value: String(vehicles.length) },
    { label: 'Units in stock', value: String(units) },
    { label: 'Sold out', value: String(soldOut) },
    ...(showValue ? [{ label: 'Inventory value', value: formatPrice(value) }] : []),
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
          <dt className="text-xs font-medium uppercase tracking-wider text-slate-300">{stat.label}</dt>
          <dd className="mt-0.5 text-xl font-extrabold text-white">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

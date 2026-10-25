import { Vehicle } from '../types';
import { formatPrice, getStockLevel, gradientFor } from '../utils/format';
import { BoxIcon, CarIllustration, CartIcon, EditIcon, TrashIcon } from './Icons';

interface VehicleCardProps {
  vehicle: Vehicle;
  isAdmin: boolean;
  /** True while a request for this vehicle is in flight. */
  busy?: boolean;
  onPurchase: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onRestock: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

const STOCK_BADGE = {
  in: { label: 'In stock', className: 'bg-emerald-100 text-emerald-700' },
  low: { label: 'Low stock', className: 'bg-amber-100 text-amber-700' },
  out: { label: 'Sold out', className: 'bg-rose-100 text-rose-700' },
} as const;

export function VehicleCard({ vehicle, isAdmin, busy = false, onPurchase, onEdit, onRestock, onDelete }: VehicleCardProps) {
  const level = getStockLevel(vehicle.quantity);
  const badge = STOCK_BADGE[level];
  const soldOut = vehicle.quantity === 0;

  return (
    <article className="group flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative flex h-36 items-end justify-center bg-gradient-to-br ${gradientFor(vehicle.category)} px-4 pt-4 text-white/90`}>
        <span className="absolute left-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
          {vehicle.category}
        </span>
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
        <CarIllustration className="h-24 w-auto drop-shadow-lg transition duration-300 group-hover:translate-x-1" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{vehicle.make}</p>
        <h3 className="text-xl font-bold text-slate-900">{vehicle.model}</h3>

        <div className="mt-3 flex items-end justify-between">
          <p className="text-2xl font-extrabold text-slate-900">{formatPrice(vehicle.price)}</p>
          <p className="flex items-center gap-1.5 text-sm text-slate-500" data-testid="quantity">
            <BoxIcon width={15} height={15} />
            <span>
              <strong className="font-semibold text-slate-700">{vehicle.quantity}</strong> available
            </span>
          </p>
        </div>

        <button
          type="button"
          className="btn-primary mt-4 w-full"
          disabled={soldOut || busy}
          onClick={() => onPurchase(vehicle)}
          aria-label={`Purchase ${vehicle.make} ${vehicle.model}`}
        >
          <CartIcon />
          {soldOut ? 'Sold out' : busy ? 'Processing…' : 'Purchase'}
        </button>

        {isAdmin && (
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
            <button type="button" className="btn-secondary !px-2 !py-2 !text-xs" onClick={() => onEdit(vehicle)} aria-label={`Edit ${vehicle.make} ${vehicle.model}`}>
              <EditIcon width={14} height={14} /> Edit
            </button>
            <button type="button" className="btn-secondary !px-2 !py-2 !text-xs" onClick={() => onRestock(vehicle)} aria-label={`Restock ${vehicle.make} ${vehicle.model}`}>
              <BoxIcon width={14} height={14} /> Restock
            </button>
            <button type="button" className="btn-secondary !px-2 !py-2 !text-xs !text-rose-600 hover:!bg-rose-50" onClick={() => onDelete(vehicle)} aria-label={`Delete ${vehicle.make} ${vehicle.model}`}>
              <TrashIcon width={14} height={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

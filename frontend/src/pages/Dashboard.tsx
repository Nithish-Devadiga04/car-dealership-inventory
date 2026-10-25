import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlusIcon } from '../components/Icons';
import { Navbar } from '../components/Navbar';
import { RestockModal } from '../components/RestockModal';
import { SearchFilters } from '../components/SearchFilters';
import { StatsBar } from '../components/StatsBar';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleFormModal } from '../components/VehicleFormModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { Vehicle, VehicleFilters } from '../types';
import { EMPTY_FILTERS, hasActiveFilters } from '../utils/format';

type SortKey = 'name' | 'price-asc' | 'price-desc' | 'stock';

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; vehicle: Vehicle }
  | { type: 'restock'; vehicle: Vehicle }
  | { type: 'delete'; vehicle: Vehicle };

const SORTERS: Record<SortKey, (a: Vehicle, b: Vehicle) => number> = {
  name: (a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  stock: (a, b) => b.quantity - a.quantity,
};

export function Dashboard() {
  const { user } = useAuth();
  const { notify } = useToast();
  const isAdmin = user?.role === 'admin';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState<VehicleFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('name');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const debouncedFilters = useDebounce(filters, 350);
  const latestRequest = useRef(0);

  const load = useCallback(async (activeFilters: VehicleFilters) => {
    const requestId = ++latestRequest.current;
    setLoadError('');
    try {
      const data = hasActiveFilters(activeFilters) ? await api.searchVehicles(activeFilters) : await api.listVehicles();
      if (requestId === latestRequest.current) setVehicles(data); // ignore out-of-order responses
    } catch (err) {
      if (requestId === latestRequest.current) setLoadError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(debouncedFilters);
  }, [debouncedFilters, load]);

  const reload = () => load(debouncedFilters);
  const closeModal = () => setModal({ type: 'none' });
  const replaceVehicle = (updated: Vehicle) => setVehicles((current) => current.map((v) => (v.id === updated.id ? updated : v)));

  const handlePurchase = async (vehicle: Vehicle) => {
    setBusyId(vehicle.id);
    try {
      const updated = await api.purchaseVehicle(vehicle.id);
      replaceVehicle(updated);
      notify('success', `Purchased ${vehicle.make} ${vehicle.model}. ${updated.quantity} left.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Purchase failed');
      if (err instanceof ApiError && err.status === 409) void reload(); // someone else bought the last one
    } finally {
      setBusyId(null);
    }
  };

  const visible = useMemo(() => {
    const list = inStockOnly ? vehicles.filter((v) => v.quantity > 0) : vehicles;
    return [...list].sort(SORTERS[sort]);
  }, [vehicles, inStockOnly, sort]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-gradient-to-br from-slate-900 via-brand-900 to-violet-900 pb-10 pt-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-200">Hello, {user?.name.split(' ')[0]} 👋</p>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Vehicle inventory</h1>
            </div>
            {isAdmin && (
              <button type="button" className="btn bg-white text-brand-700 shadow-lg hover:bg-brand-50" onClick={() => setModal({ type: 'create' })}>
                <PlusIcon /> Add vehicle
              </button>
            )}
          </div>
          <StatsBar vehicles={vehicles} showValue={isAdmin} />
        </div>
      </section>

      <main className="mx-auto -mt-6 max-w-7xl space-y-6 px-4 pb-16 sm:px-6">
        <SearchFilters filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500" aria-live="polite">
            Showing <strong className="text-slate-800">{visible.length}</strong> {visible.length === 1 ? 'vehicle' : 'vehicles'}
          </p>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              In stock only
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="sr-only sm:not-sr-only">Sort by</span>
              <select aria-label="Sort vehicles" className="input !w-auto !py-2" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="name">Name (A–Z)</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="stock">Most in stock</option>
              </select>
            </label>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{loadError}</span>
            <button type="button" className="btn-secondary !py-1.5" onClick={() => void reload()}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading vehicles">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : visible.length === 0 && !loadError ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-4xl">🔍</p>
            <h2 className="mt-3 text-lg font-bold text-slate-800">No vehicles found</h2>
            <p className="mt-1 text-sm text-slate-500">Try adjusting or clearing your filters.</p>
            {hasActiveFilters(filters) && (
              <button type="button" className="btn-secondary mt-4" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isAdmin={isAdmin}
                busy={busyId === vehicle.id}
                onPurchase={handlePurchase}
                onEdit={(v) => setModal({ type: 'edit', vehicle: v })}
                onRestock={(v) => setModal({ type: 'restock', vehicle: v })}
                onDelete={(v) => setModal({ type: 'delete', vehicle: v })}
              />
            ))}
          </div>
        )}
      </main>

      {modal.type === 'create' && (
        <VehicleFormModal
          onClose={closeModal}
          onSubmit={async (values) => {
            await api.createVehicle(values);
            closeModal();
            notify('success', `Added ${values.make} ${values.model}`);
            await reload();
          }}
        />
      )}
      {modal.type === 'edit' && (
        <VehicleFormModal
          vehicle={modal.vehicle}
          onClose={closeModal}
          onSubmit={async (values) => {
            replaceVehicle(await api.updateVehicle(modal.vehicle.id, values));
            closeModal();
            notify('success', `Updated ${values.make} ${values.model}`);
          }}
        />
      )}
      {modal.type === 'restock' && (
        <RestockModal
          vehicle={modal.vehicle}
          onClose={closeModal}
          onSubmit={async (quantity) => {
            replaceVehicle(await api.restockVehicle(modal.vehicle.id, quantity));
            closeModal();
            notify('success', `Restocked ${quantity} × ${modal.vehicle.make} ${modal.vehicle.model}`);
          }}
        />
      )}
      {modal.type === 'delete' && (
        <ConfirmDialog
          title="Delete vehicle?"
          message={`${modal.vehicle.make} ${modal.vehicle.model} will be permanently removed from the inventory.`}
          confirmLabel="Delete"
          onClose={closeModal}
          onConfirm={async () => {
            try {
              await api.deleteVehicle(modal.vehicle.id);
              setVehicles((current) => current.filter((v) => v.id !== modal.vehicle.id));
              notify('success', `Deleted ${modal.vehicle.make} ${modal.vehicle.model}`);
            } catch (err) {
              notify('error', err instanceof Error ? err.message : 'Delete failed');
            } finally {
              closeModal();
            }
          }}
        />
      )}
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { Vehicle } from '../types';
import { Modal } from './Modal';

interface RestockModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSubmit: (quantity: number) => Promise<void>;
}

export function RestockModal({ vehicle, onClose, onSubmit }: RestockModalProps) {
  const [value, setValue] = useState('1');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Enter a whole number of 1 or more');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(quantity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Restock ${vehicle.make} ${vehicle.model}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <p className="text-sm text-slate-500">
          Currently <strong className="text-slate-800">{vehicle.quantity}</strong> in stock.
        </p>
        <div>
          <label htmlFor="restock-qty" className="label">Units to add</label>
          <input
            id="restock-qty"
            type="number"
            min={1}
            step={1}
            autoFocus
            className={`input ${error ? 'input-error' : ''}`}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError('');
            }}
          />
          {error && <p role="alert" className="field-error">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Restocking…' : 'Restock'}</button>
        </div>
      </form>
    </Modal>
  );
}

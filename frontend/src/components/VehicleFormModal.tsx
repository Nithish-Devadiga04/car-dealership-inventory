import { FormEvent, useState } from 'react';
import { ApiError } from '../api/client';
import { Vehicle, VehicleInput } from '../types';
import { CATEGORIES } from '../utils/format';
import { Modal } from './Modal';

interface VehicleFormModalProps {
  /** When provided the form edits this vehicle; otherwise it creates a new one. */
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSubmit: (values: VehicleInput) => Promise<void>;
}

type Errors = Partial<Record<keyof VehicleInput | 'form', string>>;

export function validateVehicleForm(raw: Record<keyof VehicleInput, string>): { values?: VehicleInput; errors: Errors } {
  const errors: Errors = {};
  const make = raw.make.trim();
  const model = raw.model.trim();
  const category = raw.category.trim();
  const price = Number(raw.price);
  const quantity = Number(raw.quantity);

  if (!make) errors.make = 'Make is required';
  if (!model) errors.model = 'Model is required';
  if (!category) errors.category = 'Category is required';
  if (raw.price.trim() === '' || Number.isNaN(price) || price < 0) errors.price = 'Enter a price of 0 or more';
  if (raw.quantity.trim() === '' || !Number.isInteger(quantity) || quantity < 0) errors.quantity = 'Enter a whole number of 0 or more';

  return Object.keys(errors).length ? { errors } : { values: { make, model, category, price, quantity }, errors };
}

export function VehicleFormModal({ vehicle, onClose, onSubmit }: VehicleFormModalProps) {
  const [form, setForm] = useState({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    price: vehicle ? String(vehicle.price) : '',
    quantity: vehicle ? String(vehicle.quantity) : '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateVehicleForm(form);
    setErrors(result.errors);
    if (!result.values) return;

    setSubmitting(true);
    try {
      await onSubmit(result.values);
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors: Errors = {};
        err.details.forEach(({ path, message }) => {
          fieldErrors[path as keyof VehicleInput] = message;
        });
        setErrors({ ...fieldErrors, form: err.details.length ? undefined : err.message });
      } else {
        setErrors({ form: 'Unexpected error. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof VehicleInput, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={`v-${key}`} className="label">{label}</label>
      <input
        id={`v-${key}`}
        className={`input ${errors[key] ? 'input-error' : ''}`}
        value={form[key]}
        onChange={update(key)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `v-${key}-error` : undefined}
        {...props}
      />
      {errors[key] && <p id={`v-${key}-error`} className="field-error">{errors[key]}</p>}
    </div>
  );

  return (
    <Modal title={vehicle ? 'Edit vehicle' : 'Add a vehicle'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {field('make', 'Make', { placeholder: 'Toyota', autoFocus: true })}
          {field('model', 'Model', { placeholder: 'Camry' })}
        </div>
        {field('category', 'Category', { placeholder: 'Sedan', list: 'category-options' })}
        <datalist id="category-options">
          {CATEGORIES.map((category) => <option key={category} value={category} />)}
        </datalist>
        <div className="grid grid-cols-2 gap-3">
          {field('price', 'Price (USD)', { type: 'number', min: 0, step: '0.01', inputMode: 'decimal', placeholder: '28500' })}
          {field('quantity', 'Quantity', { type: 'number', min: 0, step: 1, inputMode: 'numeric', placeholder: '5' })}
        </div>

        {errors.form && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errors.form}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : vehicle ? 'Save changes' : 'Add vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

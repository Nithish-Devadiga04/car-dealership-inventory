import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { validateVehicleForm, VehicleFormModal } from './VehicleFormModal';

describe('validateVehicleForm', () => {
  const valid = { make: ' Toyota ', model: 'Camry', category: 'Sedan', price: '28500', quantity: '5' };

  it('returns trimmed, numeric values when valid', () => {
    expect(validateVehicleForm(valid).values).toEqual({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28500, quantity: 5 });
  });

  it.each([
    ['blank make', { ...valid, make: ' ' }, 'make'],
    ['negative price', { ...valid, price: '-1' }, 'price'],
    ['empty price', { ...valid, price: '' }, 'price'],
    ['fractional quantity', { ...valid, quantity: '1.5' }, 'quantity'],
    ['negative quantity', { ...valid, quantity: '-2' }, 'quantity'],
  ])('flags %s', (_name, input, field) => {
    const result = validateVehicleForm(input);
    expect(result.values).toBeUndefined();
    expect(result.errors).toHaveProperty(field);
  });
});

describe('<VehicleFormModal />', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn();
    render(<VehicleFormModal onClose={vi.fn()} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));
    expect(screen.getByText('Make is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits parsed values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<VehicleFormModal onClose={vi.fn()} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Make'), 'Honda');
    await userEvent.type(screen.getByLabelText('Model'), 'Civic');
    await userEvent.type(screen.getByLabelText('Category'), 'Sedan');
    await userEvent.type(screen.getByLabelText(/price/i), '24900');
    await userEvent.type(screen.getByLabelText('Quantity'), '12');
    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));
    expect(onSubmit).toHaveBeenCalledWith({ make: 'Honda', model: 'Civic', category: 'Sedan', price: 24900, quantity: 12 });
  });

  it('displays server-side errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(403, 'Administrator access is required'));
    render(<VehicleFormModal onClose={vi.fn()} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Make'), 'A');
    await userEvent.type(screen.getByLabelText('Model'), 'B');
    await userEvent.type(screen.getByLabelText('Category'), 'C');
    await userEvent.type(screen.getByLabelText(/price/i), '1');
    await userEvent.type(screen.getByLabelText('Quantity'), '1');
    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Administrator access is required');
  });

  it('pre-fills the form when editing', () => {
    const vehicle = { id: 1, make: 'Ford', model: 'Mustang', category: 'Coupe', price: 39900, quantity: 2, createdAt: '', updatedAt: '' };
    render(<VehicleFormModal vehicle={vehicle} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Make')).toHaveValue('Ford');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});

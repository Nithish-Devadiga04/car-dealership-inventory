import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Vehicle } from '../types';
import { VehicleCard } from './VehicleCard';

const vehicle: Vehicle = {
  id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28500, quantity: 5,
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
};

const handlers = () => ({ onPurchase: vi.fn(), onEdit: vi.fn(), onRestock: vi.fn(), onDelete: vi.fn() });

describe('VehicleCard', () => {
  it('shows make, model, category, formatted price and quantity', () => {
    render(<VehicleCard vehicle={vehicle} isAdmin={false} {...handlers()} />);
    expect(screen.getByText('Camry')).toBeInTheDocument();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Sedan')).toBeInTheDocument();
    expect(screen.getByText('$28,500')).toBeInTheDocument();
    expect(screen.getByTestId('quantity')).toHaveTextContent('5 available');
  });

  it('enables Purchase and calls the handler when in stock', async () => {
    const h = handlers();
    render(<VehicleCard vehicle={vehicle} isAdmin={false} {...h} />);
    const button = screen.getByRole('button', { name: /purchase toyota camry/i });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(h.onPurchase).toHaveBeenCalledWith(vehicle);
  });

  it('disables Purchase when quantity is zero', async () => {
    const h = handlers();
    render(<VehicleCard vehicle={{ ...vehicle, quantity: 0 }} isAdmin={false} {...h} />);
    const button = screen.getByRole('button', { name: /purchase toyota camry/i });
    expect(button).toBeDisabled();
    expect(screen.getAllByText('Sold out').length).toBeGreaterThan(0);
    await userEvent.click(button);
    expect(h.onPurchase).not.toHaveBeenCalled();
  });

  it('disables Purchase while a request is in flight', () => {
    render(<VehicleCard vehicle={vehicle} isAdmin={false} busy {...handlers()} />);
    expect(screen.getByRole('button', { name: /purchase/i })).toBeDisabled();
  });

  it('shows a low-stock badge for 1-3 units', () => {
    render(<VehicleCard vehicle={{ ...vehicle, quantity: 2 }} isAdmin={false} {...handlers()} />);
    expect(screen.getByText('Low stock')).toBeInTheDocument();
  });

  it('hides admin controls from regular users', () => {
    render(<VehicleCard vehicle={vehicle} isAdmin={false} {...handlers()} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restock/i })).not.toBeInTheDocument();
  });

  it('shows edit, restock and delete for admins and wires the handlers', async () => {
    const h = handlers();
    render(<VehicleCard vehicle={vehicle} isAdmin {...h} />);
    await userEvent.click(screen.getByRole('button', { name: /edit toyota camry/i }));
    await userEvent.click(screen.getByRole('button', { name: /restock toyota camry/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete toyota camry/i }));
    expect(h.onEdit).toHaveBeenCalledWith(vehicle);
    expect(h.onRestock).toHaveBeenCalledWith(vehicle);
    expect(h.onDelete).toHaveBeenCalledWith(vehicle);
  });
});

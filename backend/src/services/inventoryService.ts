import { ConflictError, NotFoundError } from '../errors';
import { VehicleRepository } from '../repositories/interfaces';
import { Vehicle } from '../types';

/** Stock movements: purchases decrease quantity, restocks increase it. */
export class InventoryService {
  constructor(private readonly vehicles: VehicleRepository) {}

  purchase(id: number, quantity = 1): Vehicle {
    this.ensureExists(id);

    // The repository performs the check-and-decrement atomically, so two simultaneous
    // buyers can never push stock below zero.
    if (!this.vehicles.decrementQuantity(id, quantity)) {
      throw new ConflictError('Insufficient stock to complete this purchase');
    }
    return this.ensureExists(id);
  }

  restock(id: number, quantity: number): Vehicle {
    this.ensureExists(id);
    this.vehicles.incrementQuantity(id, quantity);
    return this.ensureExists(id);
  }

  private ensureExists(id: number): Vehicle {
    const vehicle = this.vehicles.findById(id);
    if (!vehicle) throw new NotFoundError(`Vehicle ${id} not found`);
    return vehicle;
  }
}

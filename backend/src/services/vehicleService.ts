import { NotFoundError } from '../errors';
import { VehicleRepository } from '../repositories/interfaces';
import { NewVehicle, Vehicle, VehicleSearchFilters, VehicleUpdate } from '../types';

/** CRUD and search for vehicles. */
export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  create(input: NewVehicle): Vehicle {
    return this.vehicles.create(input);
  }

  list(): Vehicle[] {
    return this.vehicles.findAll();
  }

  search(filters: VehicleSearchFilters): Vehicle[] {
    return this.vehicles.search(filters);
  }

  get(id: number): Vehicle {
    const vehicle = this.vehicles.findById(id);
    if (!vehicle) throw new NotFoundError(`Vehicle ${id} not found`);
    return vehicle;
  }

  update(id: number, patch: VehicleUpdate): Vehicle {
    const updated = this.vehicles.update(id, patch);
    if (!updated) throw new NotFoundError(`Vehicle ${id} not found`);
    return updated;
  }

  remove(id: number): void {
    if (!this.vehicles.delete(id)) throw new NotFoundError(`Vehicle ${id} not found`);
  }
}

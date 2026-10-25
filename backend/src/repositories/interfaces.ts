import { NewUser, NewVehicle, User, Vehicle, VehicleSearchFilters, VehicleUpdate } from '../types';

/**
 * Repository abstractions (Dependency Inversion): services depend on these interfaces,
 * not on SQLite, so they can be unit-tested with in-memory fakes.
 */
export interface UserRepository {
  create(user: NewUser): User;
  findByEmail(email: string): User | undefined;
  findById(id: number): User | undefined;
}

export interface VehicleRepository {
  create(vehicle: NewVehicle): Vehicle;
  findAll(): Vehicle[];
  findById(id: number): Vehicle | undefined;
  search(filters: VehicleSearchFilters): Vehicle[];
  update(id: number, patch: VehicleUpdate): Vehicle | undefined;
  delete(id: number): boolean;
  /** Atomically subtracts `amount`; returns false (and changes nothing) if stock is insufficient. */
  decrementQuantity(id: number, amount: number): boolean;
  /** Adds `amount` to stock; returns false if the vehicle does not exist. */
  incrementQuantity(id: number, amount: number): boolean;
}

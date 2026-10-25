import { PasswordHasher } from '../../src/services/passwordHasher';
import { TokenService } from '../../src/services/tokenService';
import { UserRepository, VehicleRepository } from '../../src/repositories/interfaces';
import { AuthContext, NewUser, NewVehicle, User, Vehicle, VehicleSearchFilters, VehicleUpdate } from '../../src/types';

/** In-memory test doubles so service unit tests don't touch a database. */
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];
  private nextId = 1;

  create(user: NewUser): User {
    const created: User = { id: this.nextId++, ...user, createdAt: new Date().toISOString() };
    this.users.push(created);
    return created;
  }
  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }
}

export class InMemoryVehicleRepository implements VehicleRepository {
  private vehicles: Vehicle[] = [];
  private nextId = 1;

  create(v: NewVehicle): Vehicle {
    const now = new Date().toISOString();
    const created: Vehicle = { id: this.nextId++, ...v, createdAt: now, updatedAt: now };
    this.vehicles.push(created);
    return created;
  }
  findAll(): Vehicle[] {
    return [...this.vehicles];
  }
  findById(id: number): Vehicle | undefined {
    return this.vehicles.find((v) => v.id === id);
  }
  search = jest.fn((filters: VehicleSearchFilters): Vehicle[] =>
    this.vehicles.filter((v) => !filters.make || v.make.toLowerCase().includes(filters.make.toLowerCase())),
  );
  update(id: number, patch: VehicleUpdate): Vehicle | undefined {
    const vehicle = this.findById(id);
    if (!vehicle) return undefined;
    Object.assign(vehicle, patch);
    return vehicle;
  }
  delete(id: number): boolean {
    const before = this.vehicles.length;
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    return this.vehicles.length < before;
  }
  decrementQuantity(id: number, amount: number): boolean {
    const vehicle = this.findById(id);
    if (!vehicle || vehicle.quantity < amount) return false;
    vehicle.quantity -= amount;
    return true;
  }
  incrementQuantity(id: number, amount: number): boolean {
    const vehicle = this.findById(id);
    if (!vehicle) return false;
    vehicle.quantity += amount;
    return true;
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

export class FakeTokenService implements TokenService {
  sign({ id, role }: AuthContext): string {
    return `token-${id}-${role}`;
  }
  verify(token: string): AuthContext {
    const [, id, role] = token.split('-');
    return { id: Number(id), role: role as AuthContext['role'] };
  }
}

export const sampleVehicle: NewVehicle = {
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: 28500,
  quantity: 5,
};

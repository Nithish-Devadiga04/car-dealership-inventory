export type Role = 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

/** The user shape that is safe to send to clients (no password hash). */
export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewVehicle {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

export type VehicleUpdate = Partial<NewVehicle>;

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

/** Identity attached to a request after the JWT has been verified. */
export interface AuthContext {
  id: number;
  role: Role;
}

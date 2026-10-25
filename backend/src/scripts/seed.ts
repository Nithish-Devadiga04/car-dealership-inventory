import 'dotenv/config';
import { loadConfig } from '../config';
import { createDatabase } from '../db/database';
import { SqliteUserRepository } from '../repositories/userRepository';
import { SqliteVehicleRepository } from '../repositories/vehicleRepository';
import { BcryptPasswordHasher } from '../services/passwordHasher';
import { NewVehicle } from '../types';

/**
 * Provisions an administrator (public registration only creates regular users),
 * a demo customer and a sample inventory. Safe to run repeatedly.
 */
const SAMPLE_VEHICLES: NewVehicle[] = [
  { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28500, quantity: 8 },
  { make: 'Honda', model: 'Civic', category: 'Sedan', price: 24900, quantity: 12 },
  { make: 'Honda', model: 'CR-V', category: 'SUV', price: 33200, quantity: 6 },
  { make: 'Toyota', model: 'RAV4', category: 'SUV', price: 34800, quantity: 4 },
  { make: 'Ford', model: 'F-150', category: 'Truck', price: 41500, quantity: 5 },
  { make: 'Ford', model: 'Mustang', category: 'Coupe', price: 39900, quantity: 2 },
  { make: 'Tesla', model: 'Model 3', category: 'Electric', price: 42990, quantity: 7 },
  { make: 'Tesla', model: 'Model Y', category: 'Electric', price: 47990, quantity: 1 },
  { make: 'Volkswagen', model: 'Golf', category: 'Hatchback', price: 26700, quantity: 9 },
  { make: 'Mazda', model: 'MX-5 Miata', category: 'Convertible', price: 31200, quantity: 3 },
  { make: 'Chrysler', model: 'Pacifica', category: 'Van', price: 38400, quantity: 0 },
  { make: 'BMW', model: '330i', category: 'Sedan', price: 46200, quantity: 4 },
];

async function main(): Promise<void> {
  const config = loadConfig();
  const db = createDatabase(config.dbPath);
  const users = new SqliteUserRepository(db);
  const vehicles = new SqliteVehicleRepository(db);
  const hasher = new BcryptPasswordHasher(config.bcryptRounds);

  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@dealership.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@12345';

  if (!users.findByEmail(adminEmail)) {
    users.create({ name: 'Dealership Admin', email: adminEmail, passwordHash: await hasher.hash(adminPassword), role: 'admin' });
    console.log(`Created admin: ${adminEmail} / ${adminPassword}`);
  }
  if (!users.findByEmail('customer@dealership.com')) {
    users.create({
      name: 'Demo Customer',
      email: 'customer@dealership.com',
      passwordHash: await hasher.hash('Customer@12345'),
      role: 'user',
    });
    console.log('Created customer: customer@dealership.com / Customer@12345');
  }
  if (vehicles.findAll().length === 0) {
    SAMPLE_VEHICLES.forEach((vehicle) => vehicles.create(vehicle));
    console.log(`Inserted ${SAMPLE_VEHICLES.length} sample vehicles`);
  }

  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

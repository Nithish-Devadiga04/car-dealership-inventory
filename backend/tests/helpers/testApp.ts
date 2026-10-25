import fs from 'fs';
import os from 'os';
import path from 'path';
import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { loadConfig } from '../../src/config';
import { createDatabase, DB } from '../../src/db/database';
import { SqliteUserRepository } from '../../src/repositories/userRepository';
import { SqliteVehicleRepository } from '../../src/repositories/vehicleRepository';
import { BcryptPasswordHasher } from '../../src/services/passwordHasher';
import { NewVehicle } from '../../src/types';

export interface TestContext {
  app: Express;
  db: DB;
  vehicles: SqliteVehicleRepository;
  close: () => void;
}

/** Spins up the real app against a throw-away, file-backed SQLite database. */
export function createTestContext(): TestContext {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dealership-test-'));
  const dbPath = path.join(dir, 'test.db');
  const db = createDatabase(dbPath);
  const config = loadConfig({ JWT_SECRET: 'test-secret', BCRYPT_ROUNDS: '4', DB_PATH: dbPath } as NodeJS.ProcessEnv);

  return {
    app: createApp({ db, config }),
    db,
    vehicles: new SqliteVehicleRepository(db),
    close: () => {
      db.close();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

export const validUser = { name: 'Test Buyer', email: 'buyer@example.com', password: 'Passw0rdOK' };

/** Registers a regular user through the public API and returns their JWT. */
export async function registerUser(ctx: TestContext, overrides: Partial<typeof validUser> = {}): Promise<string> {
  const res = await request(ctx.app)
    .post('/api/auth/register')
    .send({ ...validUser, ...overrides });
  return res.body.token as string;
}

/** Admins can't self-register, so insert one directly and log in through the API. */
export async function createAdminToken(ctx: TestContext): Promise<string> {
  const users = new SqliteUserRepository(ctx.db);
  const passwordHash = await new BcryptPasswordHasher(4).hash('AdminPass1');
  users.create({ name: 'Admin', email: 'admin@example.com', passwordHash, role: 'admin' });
  const res = await request(ctx.app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'AdminPass1' });
  return res.body.token as string;
}

export const bearer = (token: string): [string, string] => ['Authorization', `Bearer ${token}`];

export const camry: NewVehicle = { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28500, quantity: 5 };
export const mustang: NewVehicle = { make: 'Ford', model: 'Mustang', category: 'Coupe', price: 39900, quantity: 2 };
export const model3: NewVehicle = { make: 'Tesla', model: 'Model 3', category: 'Electric', price: 42990, quantity: 0 };

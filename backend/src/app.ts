import cors from 'cors';
import express, { Express } from 'express';
import { AppConfig } from './config';
import { AuthController } from './controllers/authController';
import { InventoryController } from './controllers/inventoryController';
import { VehicleController } from './controllers/vehicleController';
import { DB } from './db/database';
import { NotFoundError } from './errors';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { SqliteUserRepository } from './repositories/userRepository';
import { SqliteVehicleRepository } from './repositories/vehicleRepository';
import { createAuthRouter } from './routes/authRoutes';
import { createVehicleRouter } from './routes/vehicleRoutes';
import { AuthService } from './services/authService';
import { InventoryService } from './services/inventoryService';
import { BcryptPasswordHasher } from './services/passwordHasher';
import { JwtTokenService } from './services/tokenService';
import { VehicleService } from './services/vehicleService';

export interface AppDependencies {
  db: DB;
  config: AppConfig;
}

/**
 * Composition root: the only place where concrete classes are wired together.
 * Everything else receives its collaborators through constructors.
 */
export function createApp({ db, config }: AppDependencies): Express {
  const userRepository = new SqliteUserRepository(db);
  const vehicleRepository = new SqliteVehicleRepository(db);

  const tokens = new JwtTokenService(config.jwtSecret, config.jwtExpiresIn);
  const authService = new AuthService(userRepository, new BcryptPasswordHasher(config.bcryptRounds), tokens);
  const vehicleService = new VehicleService(vehicleRepository);
  const inventoryService = new InventoryService(vehicleRepository);

  const requireAuth = authenticate(tokens);

  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', createAuthRouter(new AuthController(authService), requireAuth));
  app.use(
    '/api/vehicles',
    createVehicleRouter(new VehicleController(vehicleService), new InventoryController(inventoryService), requireAuth),
  );

  app.use((_req, _res, next) => next(new NotFoundError('Route not found')));
  app.use(errorHandler);

  return app;
}

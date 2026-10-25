import { RequestHandler, Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { VehicleController } from '../controllers/vehicleController';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireRole } from '../middleware/auth';

export function createVehicleRouter(
  vehicles: VehicleController,
  inventory: InventoryController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const adminOnly = requireRole('admin');

  // Every vehicle endpoint requires a valid JWT.
  router.use(authenticate);

  router.get('/', asyncHandler(vehicles.list));
  // NOTE: must be registered before '/:id' or "search" would be parsed as an id.
  router.get('/search', asyncHandler(vehicles.search));
  router.get('/:id', asyncHandler(vehicles.getOne));

  router.post('/', adminOnly, asyncHandler(vehicles.create));
  router.put('/:id', adminOnly, asyncHandler(vehicles.update));
  router.delete('/:id', adminOnly, asyncHandler(vehicles.remove));

  router.post('/:id/purchase', asyncHandler(inventory.purchase));
  router.post('/:id/restock', adminOnly, asyncHandler(inventory.restock));

  return router;
}

import { RequestHandler, Router } from 'express';
import { AuthController } from '../controllers/authController';
import { asyncHandler } from '../middleware/asyncHandler';

export function createAuthRouter(controller: AuthController, authenticate: RequestHandler): Router {
  const router = Router();
  router.post('/register', asyncHandler(controller.register));
  router.post('/login', asyncHandler(controller.login));
  router.get('/me', authenticate, asyncHandler(controller.me));
  return router;
}

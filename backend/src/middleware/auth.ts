import { RequestHandler, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { TokenService } from '../services/tokenService';
import { AuthContext, Role } from '../types';

/** Verifies the `Authorization: Bearer <jwt>` header and stores the identity on `res.locals.auth`. */
export const authenticate =
  (tokens: TokenService): RequestHandler =>
  (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or malformed Authorization header'));
    }

    try {
      res.locals.auth = tokens.verify(header.slice('Bearer '.length).trim());
      return next();
    } catch (err) {
      return next(err);
    }
  };

/** Role-based access control; must run after `authenticate`. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (_req, res, next) => {
    const auth = getAuth(res);
    if (!auth) return next(new UnauthorizedError());
    if (!roles.includes(auth.role)) return next(new ForbiddenError('Administrator access is required'));
    return next();
  };

export const getAuth = (res: Response): AuthContext | undefined => res.locals.auth as AuthContext | undefined;

import { NextFunction, Request, RequestHandler, Response } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

/**
 * Forwards both thrown errors and rejected promises to Express' error pipeline
 * (Express 4 doesn't catch async rejections by itself).
 */
export const asyncHandler =
  (fn: Handler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };

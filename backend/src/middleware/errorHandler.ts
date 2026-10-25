import { ErrorRequestHandler } from 'express';
import { AppError } from '../errors';

/** Single place where errors become HTTP responses: { error: { code, message, details? } }. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  } else if ((err as { type?: string })?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON' } });
  } else {
    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
  }
};

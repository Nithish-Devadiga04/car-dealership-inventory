import { z } from 'zod';
import { ValidationError } from '../errors';

const text = (label: string, max = 60) =>
  z.string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

export const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Email is not valid').max(254),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).trim().min(1, 'Email is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const vehicleFields = {
  make: text('Make'),
  model: text('Model'),
  category: text('Category'),
  price: z
    .number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' })
    .nonnegative('Price cannot be negative')
    .max(10_000_000, 'Price is too large'),
  quantity: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .nonnegative('Quantity cannot be negative')
    .max(100_000, 'Quantity is too large'),
};

export const createVehicleSchema = z.object(vehicleFields);

export const updateVehicleSchema = z
  .object(vehicleFields)
  .partial()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

const optionalText = z.string().trim().min(1).max(60).optional();
const optionalPrice = z.coerce.number({ invalid_type_error: 'Price filters must be numbers' }).nonnegative().optional();

export const searchQuerySchema = z
  .object({
    make: optionalText,
    model: optionalText,
    category: optionalText,
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice cannot be greater than maxPrice',
    path: ['minPrice'],
  });

export const idParamSchema = z.coerce
  .number({ invalid_type_error: 'Vehicle id must be a number' })
  .int('Vehicle id must be a whole number')
  .positive('Vehicle id must be positive');

const quantityField = z
  .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(1000, 'Quantity must be at most 1000');

/** Purchases default to a single unit when no body is sent. */
export const purchaseBodySchema = z.object({ quantity: quantityField.default(1) });
export const restockBodySchema = z.object({ quantity: quantityField });

/** Parses `data` with `schema`, converting Zod failures into our ValidationError (HTTP 400). */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      'Validation failed',
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  return result.data;
}

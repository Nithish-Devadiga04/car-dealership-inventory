import { ValidationError } from '../../src/errors';
import {
  createVehicleSchema,
  idParamSchema,
  parseOrThrow,
  purchaseBodySchema,
  registerSchema,
  restockBodySchema,
  searchQuerySchema,
  updateVehicleSchema,
} from '../../src/validation/schemas';

describe('validation schemas', () => {
  describe('registerSchema', () => {
    const valid = { name: 'Ada', email: 'ADA@Example.com', password: 'Secret123' };

    it('accepts valid input and normalises the email', () => {
      expect(parseOrThrow(registerSchema, valid).email).toBe('ada@example.com');
    });

    it.each([
      ['short password', { ...valid, password: 'a1' }],
      ['password without number', { ...valid, password: 'abcdefgh' }],
      ['password without letter', { ...valid, password: '12345678' }],
      ['invalid email', { ...valid, email: 'not-an-email' }],
      ['missing name', { email: valid.email, password: valid.password }],
    ])('rejects %s', (_label, body) => {
      expect(() => parseOrThrow(registerSchema, body)).toThrow(ValidationError);
    });
  });

  describe('createVehicleSchema', () => {
    const valid = { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 100, quantity: 1 };

    it('accepts a valid vehicle and trims text', () => {
      expect(parseOrThrow(createVehicleSchema, { ...valid, make: '  Toyota ' }).make).toBe('Toyota');
    });

    it.each([
      ['negative price', { ...valid, price: -1 }],
      ['negative quantity', { ...valid, quantity: -1 }],
      ['fractional quantity', { ...valid, quantity: 1.5 }],
      ['price as string', { ...valid, price: '100' }],
      ['blank make', { ...valid, make: '   ' }],
      ['missing category', { make: 'a', model: 'b', price: 1, quantity: 1 }],
    ])('rejects %s', (_label, body) => {
      expect(() => parseOrThrow(createVehicleSchema, body)).toThrow(ValidationError);
    });
  });

  describe('updateVehicleSchema', () => {
    it('accepts a partial update', () => {
      expect(parseOrThrow(updateVehicleSchema, { price: 5 })).toEqual({ price: 5 });
    });
    it('rejects an empty update', () => {
      expect(() => parseOrThrow(updateVehicleSchema, {})).toThrow(ValidationError);
    });
  });

  describe('searchQuerySchema', () => {
    it('coerces price strings from the query string into numbers', () => {
      expect(parseOrThrow(searchQuerySchema, { minPrice: '100', maxPrice: '200' })).toEqual({ minPrice: 100, maxPrice: 200 });
    });
    it('rejects non-numeric prices', () => {
      expect(() => parseOrThrow(searchQuerySchema, { minPrice: 'abc' })).toThrow(ValidationError);
    });
    it('rejects an inverted price range', () => {
      expect(() => parseOrThrow(searchQuerySchema, { minPrice: '500', maxPrice: '100' })).toThrow(ValidationError);
    });
  });

  describe('id and quantity schemas', () => {
    it('parses numeric ids', () => expect(parseOrThrow(idParamSchema, '12')).toBe(12));
    it.each(['abc', '0', '-3', '1.5'])('rejects id %s', (id) => {
      expect(() => parseOrThrow(idParamSchema, id)).toThrow(ValidationError);
    });
    it('defaults purchase quantity to 1', () => expect(parseOrThrow(purchaseBodySchema, {})).toEqual({ quantity: 1 }));
    it('requires a restock quantity', () => {
      expect(() => parseOrThrow(restockBodySchema, {})).toThrow(ValidationError);
      expect(() => parseOrThrow(restockBodySchema, { quantity: 0 })).toThrow(ValidationError);
    });
  });
});
